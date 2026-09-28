import type { Set as ExerciseSet, SessionExercise } from "@/types";

// The session form's editing logic, kept pure so it's unit-testable: the
// form view only holds the state and wires these to its inputs.

/** What the "add a set" inputs hold for one exercise — raw input strings. */
export type SetInput = {
  weight: string;
  reps: string;
  duration: string;
  side: string;
};

export const EMPTY_SET_INPUT: SetInput = {
  weight: "",
  reps: "",
  duration: "",
  side: "",
};

/** `YYYY-MM-DD` in local time — the format sessions store dates in. */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toNumberOrNull(value: string): number | null {
  return value ? Number(value) : null;
}

function toSide(value: string, isUnilateral: boolean): ExerciseSet["side"] {
  if (!isUnilateral) return null;
  return value === "left" || value === "right" ? value : null;
}

export function buildSet(
  setNumber: number,
  input: SetInput,
  isUnilateral: boolean,
): ExerciseSet {
  return {
    setNumber,
    weight: toNumberOrNull(input.weight),
    reps: toNumberOrNull(input.reps),
    durationSeconds: toNumberOrNull(input.duration),
    side: toSide(input.side, isUnilateral),
    rpe: null,
  };
}

/** Appends an exercise with no sets; a no-op for an empty or duplicate id. */
export function addSessionExercise(
  exercises: SessionExercise[],
  exerciseId: string,
): SessionExercise[] {
  if (!exerciseId || exercises.some((se) => se.exerciseId === exerciseId)) {
    return exercises;
  }
  return [...exercises, { exerciseId, orderIndex: exercises.length, sets: [] }];
}

/** Removes an exercise and renumbers `orderIndex` to match position. */
export function removeSessionExercise(
  exercises: SessionExercise[],
  exerciseId: string,
): SessionExercise[] {
  return exercises
    .filter((se) => se.exerciseId !== exerciseId)
    .map((se, index) => ({ ...se, orderIndex: index }));
}

/** Appends the next-numbered set, built from `input`, to one exercise. */
export function addSetToExercise(
  exercises: SessionExercise[],
  exerciseId: string,
  input: SetInput,
  isUnilateral: boolean,
): SessionExercise[] {
  return exercises.map((se) =>
    se.exerciseId === exerciseId
      ? {
          ...se,
          sets: [...se.sets, buildSet(se.sets.length + 1, input, isUnilateral)],
        }
      : se,
  );
}
