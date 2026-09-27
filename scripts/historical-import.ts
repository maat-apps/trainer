// Parses the free-text workout notes format described in trainer#4 into
// Exercise/Session objects matching src/lib/schemas.ts's shapes. Kept
// entirely inside scripts/ (its own tsconfig.scripts.json project, run
// directly with `node`, no bundler) rather than importing those types from
// src/ — a composite `tsc -b` project can't reach across into another
// project's files without a project reference, and this one-off importer
// isn't part of the running app anyway. The shapes below are deliberately
// duplicated from schemas.ts, not re-exported from it; the output still
// gets validated for real by src/lib/backup.ts's parseBackup on import, so
// a shape drift here would surface immediately as dropped data rather than
// silently succeeding.

export type Set = {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  durationSeconds: number | null;
  side: "left" | "right" | null;
  rpe: number | null;
};

export type Exercise = {
  id: string;
  name: string;
  categoryId: string | null;
  isUnilateral: boolean;
};

export type Session = {
  id: string;
  date: string | null;
  importOrder: number | null;
  notes: string | null;
  exercises: { exerciseId: string; orderIndex: number; sets: Set[] }[];
};

// Each block (an exercise name header followed by result lines) becomes one
// Exercise; each line within a block becomes one Session logging that
// exercise, with importOrder incrementing within the block (not globally)
// and date always null — the trainer fills in real dates later through the
// app.

const UNILATERAL_EXERCISE_NAME = "Split squat";
const REPS_ONLY_EXERCISE_NAMES = new Set([
  "Wznosy nóg",
  "Wznosy nóg (wersja z podeszwą)",
]);
const PLANK_EXERCISE_NAME = "Plank";

type PartialSet = Omit<Set, "setNumber">;

function parseWeightToken(token: string): number | null {
  if (token === "" || token === "?") return null;
  const value = Number(token.replace(/kg$/i, ""));
  return Number.isFinite(value) ? value : null;
}

/**
 * A "8/6"-style pair for a unilateral exercise: both legs' reps for one
 * set, smaller number = right leg, larger = left leg (equal is arbitrary).
 * Either side missing/unknown drops the whole position rather than
 * guessing which leg the remaining number belongs to.
 */
function parseUnilateralPair(
  token: string,
  weight: number | null,
): PartialSet[] {
  const [aRaw, bRaw] = token.split("/");
  const a = aRaw && aRaw !== "?" ? Number(aRaw) : null;
  const b = bRaw && bRaw !== "?" ? Number(bRaw) : null;
  if (a === null || b === null || !Number.isFinite(a) || !Number.isFinite(b)) {
    return [];
  }
  const rightReps = Math.min(a, b);
  const leftReps = Math.max(a, b);
  return [
    {
      weight,
      reps: rightReps,
      durationSeconds: null,
      side: "right",
      rpe: null,
    },
    { weight, reps: leftReps, durationSeconds: null, side: "left", rpe: null },
  ];
}

/** A single rep count, or "?" meaning that one set's value is unknown and
 * dropped without dropping the rest of the line. */
function parseRepToken(token: string, weight: number | null): PartialSet[] {
  if (token === "" || token === "?") return [];
  const reps = Number(token);
  if (!Number.isFinite(reps)) return [];
  return [{ weight, reps, durationSeconds: null, side: null, rpe: null }];
}

/**
 * "weight x reps x reps..." notation, possibly several space-separated
 * weight groups on one line (one session, multiple weights) and, for
 * split squat, "/"-paired reps per set.
 */
function parseWeightedLine(
  line: string,
  isUnilateral: boolean,
): PartialSet[][] {
  // "55x10x9x3 i 3" — an informal "and 3" continuation of the same group.
  const normalized = line.replace(/\s+i\s+/g, "x");
  const groups = normalized.split(/\s+/).filter(Boolean);
  const positions: PartialSet[][] = [];
  for (const group of groups) {
    const [weightToken, ...repTokens] = group.split("x");
    const weight = parseWeightToken(weightToken ?? "");
    for (const token of repTokens) {
      positions.push(
        isUnilateral && token.includes("/")
          ? parseUnilateralPair(token, weight)
          : parseRepToken(token, weight),
      );
    }
  }
  return positions;
}

/** Leg raise variants: a leading "X" is a label, not a value; the rest is
 * plain rep counts with no weight. */
function parseRepsOnlyLine(line: string): PartialSet[][] {
  const stripped = line.replace(/^X/, "");
  const groups = stripped.split(/\s+/).filter(Boolean);
  const positions: PartialSet[][] = [];
  for (const group of groups) {
    for (const token of group.split("x")) {
      positions.push(parseRepToken(token, null));
    }
  }
  return positions;
}

/** Plank: leading "X" label ignored, "min" converts to 60s, and a stray
 * "s" typo (for the "x" separator) is fixed before splitting into sets. */
function parsePlankLine(line: string): PartialSet[][] {
  let normalized = line.replace(/^X/, "");
  normalized = normalized.replace(
    /(\d+(?:\.\d+)?)min/g,
    (_match, minutes: string) => String(Number(minutes) * 60),
  );
  normalized = normalized.replace(/s$/, "").replaceAll("s", "x");

  const groups = normalized.split(/\s+/).filter(Boolean);
  const positions: PartialSet[][] = [];
  for (const group of groups) {
    for (const token of group.split("x").filter(Boolean)) {
      if (token === "?") {
        positions.push([]);
        continue;
      }
      const durationSeconds = Number(token);
      positions.push(
        Number.isFinite(durationSeconds)
          ? [
              {
                weight: null,
                reps: null,
                durationSeconds,
                side: null,
                rpe: null,
              },
            ]
          : [],
      );
    }
  }
  return positions;
}

function parsePositions(exerciseName: string, line: string): PartialSet[][] {
  if (exerciseName === PLANK_EXERCISE_NAME) return parsePlankLine(line);
  if (REPS_ONLY_EXERCISE_NAMES.has(exerciseName))
    return parseRepsOnlyLine(line);
  return parseWeightedLine(line, exerciseName === UNILATERAL_EXERCISE_NAME);
}

/** One shared setNumber per position (both legs of a unilateral pair count
 * as the same set), skipping positions dropped entirely (e.g. a "?"). */
function assignSetNumbers(positions: PartialSet[][]): Set[] {
  const sets: Set[] = [];
  let setNumber = 1;
  for (const position of positions) {
    if (position.length === 0) continue;
    for (const partial of position) {
      sets.push({ setNumber, ...partial });
    }
    setNumber++;
  }
  return sets;
}

function splitBlocks(rawText: string): string[] {
  return rawText
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export type ParsedHistoricalData = {
  exercises: Exercise[];
  /** Sessions across every parsed exercise — each logs exactly one
   * exercise, so they can be appended directly to a client's session list. */
  sessions: Session[];
};

/**
 * Parses the raw free-text notes format into Exercise/Session data ready to
 * attach to a Client. Pure function — no filesystem access — so the CLI
 * wrapper (scripts/import-historical-data.ts) stays a thin shell around it.
 */
export function parseHistoricalNotes(
  rawText: string,
  createId: () => string = () => crypto.randomUUID(),
): ParsedHistoricalData {
  const exercises: Exercise[] = [];
  const sessions: Session[] = [];

  for (const block of splitBlocks(rawText)) {
    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const [name, ...resultLines] = lines;
    if (!name) continue;

    const exercise: Exercise = {
      id: createId(),
      name,
      categoryId: null,
      isUnilateral: name === UNILATERAL_EXERCISE_NAME,
    };
    exercises.push(exercise);

    resultLines.forEach((line, importOrder) => {
      const sets = assignSetNumbers(parsePositions(name, line));
      sessions.push({
        id: createId(),
        date: null,
        importOrder,
        notes: null,
        exercises: [{ exerciseId: exercise.id, orderIndex: 0, sets }],
      });
    });
  }

  return { exercises, sessions };
}
