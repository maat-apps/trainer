import type { Session, Set } from "@/types";

export type ProgressPoint = {
  /** Chart x-value — a real timestamp for dated sessions, a synthetic
   * ordinal (always less than any real timestamp) for undated ones so
   * historical, undated sessions sort before dated ones on the axis. */
  x: number;
  label: string;
  left: number | null;
  right: number | null;
  /** Only set for a non-unilateral exercise — `left` carries the value
   * for a unilateral one instead, `right` staying null unless a
   * left/right pair was actually logged for that session. */
  value: number | null;
};

/**
 * One number per set: weight is the metric when present (a session's "top
 * set" for that exercise), falling back to reps (bodyweight work) and then
 * duration (timed holds) — whichever the exercise actually tracks. Picks
 * the highest logged value among the session's sets for that side.
 */
function bestValue(sets: Set[]): number | null {
  const weights = sets.map((set) => set.weight).filter((v) => v !== null);
  if (weights.length > 0) return Math.max(...weights);
  const reps = sets.map((set) => set.reps).filter((v) => v !== null);
  if (reps.length > 0) return Math.max(...reps);
  const durations = sets
    .map((set) => set.durationSeconds)
    .filter((v) => v !== null);
  if (durations.length > 0) return Math.max(...durations);
  return null;
}

function sessionLabel(session: Session): string {
  return session.date ?? `#${session.importOrder ?? "?"}`;
}

/**
 * Historical (undated) sessions sort before dated ones — the historical
 * import (trainer#4) always produces `date: null` with an incrementing
 * `importOrder`, representing data logged before the app was used day to
 * day; real dated sessions come from actual day-to-day use afterward.
 */
function compareSessions(a: Session, b: Session): number {
  if (a.date !== null && b.date !== null) {
    return a.date.localeCompare(b.date);
  }
  if (a.date === null && b.date === null) {
    return (a.importOrder ?? 0) - (b.importOrder ?? 0);
  }
  return a.date === null ? -1 : 1;
}

function sessionX(session: Session, undatedIndex: number): number {
  if (session.date !== null) return Date.parse(session.date);
  // Always sorts before any real date (a valid ISO date parses to a much
  // larger number than this).
  return -1_000_000 + undatedIndex;
}

/**
 * Builds chart-ready points for one exercise across a client's sessions.
 * For a unilateral exercise, `left`/`right` carry the two separate lines
 * (per trainer#6); otherwise the single series lives in `value` and
 * `left`/`right` stay null.
 */
export function buildExerciseProgressSeries(
  sessions: Session[],
  exerciseId: string,
  isUnilateral: boolean,
): ProgressPoint[] {
  const relevant = sessions
    .filter((session) =>
      session.exercises.some((se) => se.exerciseId === exerciseId),
    )
    .slice()
    .sort(compareSessions);

  let undatedIndex = 0;
  return relevant.map((session) => {
    const x =
      session.date !== null
        ? sessionX(session, 0)
        : sessionX(session, undatedIndex++);
    const sessionExercise = session.exercises.find(
      (se) => se.exerciseId === exerciseId,
    );
    const sets = sessionExercise?.sets ?? [];

    if (isUnilateral) {
      const leftSets = sets.filter((set) => set.side === "left");
      const rightSets = sets.filter((set) => set.side === "right");
      return {
        x,
        label: sessionLabel(session),
        left: bestValue(leftSets),
        right: bestValue(rightSets),
        value: null,
      };
    }

    return {
      x,
      label: sessionLabel(session),
      left: null,
      right: null,
      value: bestValue(sets),
    };
  });
}

/** Exercise ids this client has actually logged at least one set for. */
export function loggedExerciseIds(sessions: Session[]): string[] {
  const ids = new Set<string>();
  for (const session of sessions) {
    for (const sessionExercise of session.exercises) {
      if (sessionExercise.sets.length > 0) {
        ids.add(sessionExercise.exerciseId);
      }
    }
  }
  return [...ids];
}

/** Filters points whose x falls within [startX, endX], when both are set. */
export function filterByDateRange(
  points: ProgressPoint[],
  startDate: string | null,
  endDate: string | null,
): ProgressPoint[] {
  const startX = startDate ? Date.parse(startDate) : null;
  const endX = endDate ? Date.parse(endDate) : null;
  if (startX === null && endX === null) return points;
  return points.filter((point) => {
    if (startX !== null && point.x < startX) return false;
    if (endX !== null && point.x > endX) return false;
    return true;
  });
}
