import * as v from "valibot";

// --- Schemas -----------------------------------------------------------------
// The single source of truth for both runtime validation and the TS types in
// src/types.ts (via v.InferOutput) — a field added or renamed here is enforced
// everywhere at once, so the type and the validator can't silently drift apart.

export const CategorySchema = v.object({
  id: v.string(),
  name: v.string(),
});

export const ExerciseSchema = v.object({
  id: v.string(),
  name: v.string(),
  categoryId: v.nullable(v.string()),
  isUnilateral: v.fallback(v.boolean(), false),
});

const SetSchema = v.object({
  setNumber: v.number(),
  weight: v.nullable(v.number()),
  reps: v.nullable(v.number()),
  durationSeconds: v.nullable(v.number()),
  side: v.nullable(v.picklist(["left", "right"])),
  rpe: v.nullable(v.number()),
});

// A session-exercise's own fields, kept separate from its `sets` array so one
// malformed set doesn't take the rest of an otherwise-valid session down with
// it — see parseClients below, which validates every nested array on its own.
const SessionExerciseFieldsSchema = v.object({
  exerciseId: v.string(),
  orderIndex: v.number(),
});

const SessionExerciseSchema = v.object({
  ...SessionExerciseFieldsSchema.entries,
  sets: v.array(SetSchema),
});

const SessionFieldsSchema = v.object({
  id: v.string(),
  date: v.nullable(v.string()),
  importOrder: v.nullable(v.number()),
  notes: v.nullable(v.string()),
});

const SessionSchema = v.object({
  ...SessionFieldsSchema.entries,
  exercises: v.array(SessionExerciseSchema),
});

export const WeightLogSchema = v.object({
  id: v.string(),
  weight: v.number(),
  date: v.nullable(v.string()),
  importOrder: v.nullable(v.number()),
});

export const PeriodSchema = v.object({
  id: v.string(),
  type: v.picklist(["mass", "cut"]),
  label: v.nullable(v.string()),
  startDate: v.nullable(v.string()),
  endDate: v.nullable(v.string()),
});

const ClientFieldsSchema = v.object({
  id: v.string(),
  firstName: v.string(),
  lastName: v.nullable(v.string()),
  goal: v.nullable(v.string()),
  notes: v.nullable(v.string()),
  createdAt: v.string(),
});

const ClientSchema = v.object({
  ...ClientFieldsSchema.entries,
  sessions: v.array(SessionSchema),
  weightLogs: v.array(WeightLogSchema),
  periods: v.array(PeriodSchema),
});

export const AppDataSchema = v.object({
  categories: v.array(CategorySchema),
  exercises: v.array(ExerciseSchema),
  clients: v.array(ClientSchema),
});

export type Category = v.InferOutput<typeof CategorySchema>;
export type Exercise = v.InferOutput<typeof ExerciseSchema>;
export type Set = v.InferOutput<typeof SetSchema>;
export type SessionExercise = v.InferOutput<typeof SessionExerciseSchema>;
export type Session = v.InferOutput<typeof SessionSchema>;
export type WeightLog = v.InferOutput<typeof WeightLogSchema>;
export type Period = v.InferOutput<typeof PeriodSchema>;
export type Client = v.InferOutput<typeof ClientSchema>;
export type AppData = v.InferOutput<typeof AppDataSchema>;

// --- Lenient parsing -----------------------------------------------------------
// Applied to whatever's actually in IndexedDB (and, later, a user-supplied
// backup import — see trainer#9): anything unrecognised is dropped rather than
// trusted, since a malformed entry (a future write bug, external tampering via
// devtools, or a hand-edited backup file) shouldn't crash a screen that assumes
// well-shaped data. Each array entry — client, session, set, and so on — is
// validated on its own, so one bad one doesn't take the rest of an otherwise-
// valid stored blob down with it: v.array() fails the whole container on a
// single bad element, which is more than this posture wants.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEach<T>(
  schema: v.GenericSchema<unknown, T>,
  items: unknown[],
): T[] {
  return items
    .map((item) => v.safeParse(schema, item))
    .filter((result) => result.success)
    .map((result) => result.output);
}

export function parseCategories(value: unknown): Category[] {
  if (!Array.isArray(value)) return [];
  return parseEach(CategorySchema, value);
}

export function parseExercises(value: unknown): Exercise[] {
  if (!Array.isArray(value)) return [];
  return parseEach(ExerciseSchema, value);
}

function parseSets(value: unknown): Set[] {
  if (!Array.isArray(value)) return [];
  return parseEach(SetSchema, value);
}

function parseSessionExercises(value: unknown): SessionExercise[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const fields = v.safeParse(SessionExerciseFieldsSchema, item);
    if (!fields.success) return [];
    return [{ ...fields.output, sets: parseSets(item.sets) }];
  });
}

function parseSessions(value: unknown): Session[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const fields = v.safeParse(SessionFieldsSchema, item);
    if (!fields.success) return [];
    return [
      { ...fields.output, exercises: parseSessionExercises(item.exercises) },
    ];
  });
}

function parseWeightLogs(value: unknown): WeightLog[] {
  if (!Array.isArray(value)) return [];
  return parseEach(WeightLogSchema, value);
}

function parsePeriods(value: unknown): Period[] {
  if (!Array.isArray(value)) return [];
  return parseEach(PeriodSchema, value);
}

export function parseClients(value: unknown): Client[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const fields = v.safeParse(ClientFieldsSchema, item);
    if (!fields.success) return [];
    return [
      {
        ...fields.output,
        sessions: parseSessions(item.sessions),
        weightLogs: parseWeightLogs(item.weightLogs),
        periods: parsePeriods(item.periods),
      },
    ];
  });
}

export function parseAppData(value: unknown): AppData {
  if (!isRecord(value)) {
    return { categories: [], exercises: [], clients: [] };
  }
  return {
    categories: parseCategories(value.categories),
    exercises: parseExercises(value.exercises),
    clients: parseClients(value.clients),
  };
}
