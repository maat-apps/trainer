import { describe, expect, it } from "vitest";

import { parseHistoricalNotes } from "../../../scripts/historical-import.ts";

function ids() {
  let n = 0;
  return () => `id-${n++}`;
}

function firstSets(rawText: string) {
  const { sessions } = parseHistoricalNotes(rawText, ids());
  return sessions.map((session) => session.exercises[0]?.sets ?? []);
}

describe("parseHistoricalNotes", () => {
  it("creates one exercise per block and one session per result line", () => {
    const { exercises, sessions } = parseHistoricalNotes(
      "Klata\n40x8x8x7\n45x8x8",
      ids(),
    );
    expect(exercises).toHaveLength(1);
    expect(exercises[0]).toMatchObject({
      name: "Klata",
      categoryId: null,
      isUnilateral: false,
    });
    expect(sessions).toHaveLength(2);
    expect(sessions[0]).toMatchObject({ date: null, importOrder: 0 });
    expect(sessions[1]).toMatchObject({ date: null, importOrder: 1 });
    expect(sessions[0]?.exercises).toEqual([
      { exerciseId: exercises[0]?.id, orderIndex: 0, sets: expect.any(Array) },
    ]);
  });

  it("parses 'weight x reps x reps' as one weight with sets per number", () => {
    const [sets] = firstSets("Klata\n40x8x8x7");
    expect(sets).toEqual([
      {
        setNumber: 1,
        weight: 40,
        reps: 8,
        durationSeconds: null,
        side: null,
        rpe: null,
      },
      {
        setNumber: 2,
        weight: 40,
        reps: 8,
        durationSeconds: null,
        side: null,
        rpe: null,
      },
      {
        setNumber: 3,
        weight: 40,
        reps: 7,
        durationSeconds: null,
        side: null,
        rpe: null,
      },
    ]);
  });

  it("parses multiple space-separated weight groups as one session", () => {
    const [sets] = firstSets("Klata\n40x10 45x10 50x8");
    expect(sets?.map((s) => [s.weight, s.reps])).toEqual([
      [40, 10],
      [45, 10],
      [50, 8],
    ]);
  });

  it("treats the informal 'i N' continuation as another set of the same weight", () => {
    const [sets] = firstSets("Klata\n55x10x9x3 i 3");
    expect(sets?.map((s) => s.reps)).toEqual([10, 9, 3, 3]);
    expect(sets?.every((s) => s.weight === 55)).toBe(true);
  });

  it("drops a single '?' value without dropping the rest of the line", () => {
    const [sets] = firstSets("Wiosło machina\n40kgx8x?");
    expect(sets).toEqual([
      {
        setNumber: 1,
        weight: 40,
        reps: 8,
        durationSeconds: null,
        side: null,
        rpe: null,
      },
    ]);
  });

  it("strips a 'kg' suffix from the weight", () => {
    const [sets] = firstSets("Trapbar deadlift\n30kgx8");
    expect(sets?.[0]?.weight).toBe(30);
  });

  it("marks split squat as unilateral", () => {
    const { exercises } = parseHistoricalNotes("Split squat\n15x8/8", ids());
    expect(exercises[0]?.isUnilateral).toBe(true);
  });

  it("splits a split-squat pair into right (smaller) and left (larger) sets", () => {
    const [sets] = firstSets("Split squat\n15x8/6");
    expect(sets).toEqual([
      {
        setNumber: 1,
        weight: 15,
        reps: 6,
        durationSeconds: null,
        side: "right",
        rpe: null,
      },
      {
        setNumber: 1,
        weight: 15,
        reps: 8,
        durationSeconds: null,
        side: "left",
        rpe: null,
      },
    ]);
  });

  it("assigns left and right arbitrarily but consistently when reps are equal", () => {
    const [sets] = firstSets("Split squat\n17.5x3/3");
    expect(sets?.map((s) => s.reps)).toEqual([3, 3]);
    expect(sets?.map((s) => s.side)).toEqual(["right", "left"]);
  });

  it("drops an incomplete split-squat pair (no second number) rather than guessing a side", () => {
    const [sets] = firstSets("Split squat\n15x4/4x");
    expect(sets).toEqual([
      {
        setNumber: 1,
        weight: 15,
        reps: 4,
        durationSeconds: null,
        side: "right",
        rpe: null,
      },
      {
        setNumber: 1,
        weight: 15,
        reps: 4,
        durationSeconds: null,
        side: "left",
        rpe: null,
      },
    ]);
  });

  it("parses leg-raise lines: leading X is a label, no weight, sets separated by x", () => {
    const [sets] = firstSets("Wznosy nóg\nX15x15x10");
    expect(sets).toEqual([
      {
        setNumber: 1,
        weight: null,
        reps: 15,
        durationSeconds: null,
        side: null,
        rpe: null,
      },
      {
        setNumber: 2,
        weight: null,
        reps: 15,
        durationSeconds: null,
        side: null,
        rpe: null,
      },
      {
        setNumber: 3,
        weight: null,
        reps: 10,
        durationSeconds: null,
        side: null,
        rpe: null,
      },
    ]);
  });

  it("parses a single leg-raise value", () => {
    const [sets] = firstSets("Wznosy nóg\nX20");
    expect(sets).toEqual([
      {
        setNumber: 1,
        weight: null,
        reps: 20,
        durationSeconds: null,
        side: null,
        rpe: null,
      },
    ]);
  });

  it("parses the insole variant the same way", () => {
    const [sets] = firstSets("Wznosy nóg (wersja z podeszwą)\nX10x9");
    expect(sets?.map((s) => s.reps)).toEqual([10, 9]);
  });

  it("converts plank 'min' notation to seconds", () => {
    const [sets] = firstSets("Plank\n1minx38");
    expect(sets?.map((s) => s.durationSeconds)).toEqual([60, 38]);
    expect(sets?.every((s) => s.weight === null && s.reps === null)).toBe(true);
  });

  it("fixes a stray 's' typo (for the 'x' separator) in plank lines", () => {
    const [sets] = firstSets("Plank\n48s38x49s");
    expect(sets?.map((s) => s.durationSeconds)).toEqual([48, 38, 49]);
  });

  it("parses a plain plank line with no typo", () => {
    const [sets] = firstSets("Plank\n42x38");
    expect(sets?.map((s) => s.durationSeconds)).toEqual([42, 38]);
  });

  it("drops a '?' value in a plank line", () => {
    const [sets] = firstSets("Plank\n40x?x30");
    expect(sets?.map((s) => s.durationSeconds)).toEqual([40, 30]);
  });

  it("resets importOrder per exercise block, not globally", () => {
    const { sessions } = parseHistoricalNotes(
      "Klata\n40x8\n\nOhp\n25x8",
      ids(),
    );
    expect(sessions.map((s) => s.importOrder)).toEqual([0, 0]);
  });

  it("ignores blank lines and blocks", () => {
    const { exercises, sessions } = parseHistoricalNotes(
      "\n\nKlata\n40x8\n\n\n\nOhp\n25x8\n\n",
      ids(),
    );
    expect(exercises.map((e) => e.name)).toEqual(["Klata", "Ohp"]);
    expect(sessions).toHaveLength(2);
  });
});
