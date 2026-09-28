import { describe, expect, it } from "vitest";

import {
  addSessionExercise,
  addSetToExercise,
  buildSet,
  EMPTY_SET_INPUT,
  removeSessionExercise,
  toISODateString,
} from "@/lib/session-draft";
import type { SessionExercise } from "@/types";

function exercises(...ids: string[]): SessionExercise[] {
  return ids.map((exerciseId, orderIndex) => ({
    exerciseId,
    orderIndex,
    sets: [],
  }));
}

describe("toISODateString", () => {
  it("formats a local date as YYYY-MM-DD with zero padding", () => {
    expect(toISODateString(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("buildSet", () => {
  it("parses filled inputs as numbers", () => {
    const set = buildSet(
      2,
      { weight: "42.5", reps: "8", duration: "30", side: "" },
      false,
    );

    expect(set).toEqual({
      setNumber: 2,
      weight: 42.5,
      reps: 8,
      durationSeconds: 30,
      side: null,
      rpe: null,
    });
  });

  it("turns empty inputs into null", () => {
    const set = buildSet(1, EMPTY_SET_INPUT, false);

    expect([set.weight, set.reps, set.durationSeconds]).toEqual([
      null,
      null,
      null,
    ]);
  });

  it("keeps the side only for a unilateral exercise", () => {
    const input = { ...EMPTY_SET_INPUT, side: "left" };

    expect(buildSet(1, input, true).side).toBe("left");
    expect(buildSet(1, input, false).side).toBeNull();
  });

  it("ignores an unknown side value", () => {
    expect(buildSet(1, { ...EMPTY_SET_INPUT, side: "up" }, true).side).toBe(
      null,
    );
  });
});

describe("addSessionExercise", () => {
  it("appends the exercise with the next orderIndex and no sets", () => {
    const result = addSessionExercise(exercises("a"), "b");

    expect(result.at(-1)).toEqual({ exerciseId: "b", orderIndex: 1, sets: [] });
  });

  it("ignores an empty or already-added id", () => {
    const list = exercises("a");

    expect(addSessionExercise(list, "")).toBe(list);
    expect(addSessionExercise(list, "a")).toBe(list);
  });
});

describe("removeSessionExercise", () => {
  it("removes the exercise and renumbers the rest", () => {
    const result = removeSessionExercise(exercises("a", "b", "c"), "a");

    expect(result.map((se) => [se.exerciseId, se.orderIndex])).toEqual([
      ["b", 0],
      ["c", 1],
    ]);
  });
});

describe("addSetToExercise", () => {
  it("appends a numbered set to the matching exercise only", () => {
    const input = { ...EMPTY_SET_INPUT, reps: "10" };
    const once = addSetToExercise(exercises("a", "b"), "a", input, false);

    const twice = addSetToExercise(once, "a", input, false);

    expect(twice[0].sets.map((set) => set.setNumber)).toEqual([1, 2]);
    expect(twice[0].sets[1].reps).toBe(10);
    expect(twice[1].sets).toEqual([]);
  });
});
