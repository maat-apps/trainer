import { describe, expect, it } from "vitest";

import {
  parseAppData,
  parseCategories,
  parseClients,
  parseExercises,
} from "@/lib/schemas";

describe("parseCategories", () => {
  it("returns an empty array for non-array input", () => {
    expect(parseCategories(null)).toEqual([]);
    expect(parseCategories({})).toEqual([]);
  });

  it("keeps well-formed categories and drops malformed ones", () => {
    const result = parseCategories([
      { id: "1", name: "Legs" },
      { id: "2" }, // missing name
      { id: "3", name: "Back" },
    ]);
    expect(result).toEqual([
      { id: "1", name: "Legs" },
      { id: "3", name: "Back" },
    ]);
  });
});

describe("parseExercises", () => {
  it("returns an empty array for non-array input", () => {
    expect(parseExercises(null)).toEqual([]);
  });

  it("defaults isUnilateral to false when missing", () => {
    const [exercise] = parseExercises([
      { id: "1", name: "Squat", categoryId: null },
    ]);
    expect(exercise).toEqual({
      id: "1",
      name: "Squat",
      categoryId: null,
      isUnilateral: false,
      iconName: null,
    });
  });

  it("keeps an explicit iconName value", () => {
    const [exercise] = parseExercises([
      { id: "1", name: "Squat", categoryId: null, iconName: "Barbell" },
    ]);
    expect(exercise?.iconName).toBe("Barbell");
  });

  it("keeps an explicit isUnilateral value", () => {
    const [exercise] = parseExercises([
      { id: "1", name: "Split squat", categoryId: "legs", isUnilateral: true },
    ]);
    expect(exercise?.isUnilateral).toBe(true);
  });

  it("drops an exercise with a malformed field", () => {
    expect(parseExercises([{ id: "1", name: 42, categoryId: null }])).toEqual(
      [],
    );
  });
});

describe("parseClients", () => {
  it("returns an empty array for non-array input", () => {
    expect(parseClients(undefined)).toEqual([]);
  });

  it("drops a client missing required fields", () => {
    expect(parseClients([{ id: "1" }])).toEqual([]);
  });

  it("drops a non-object entry in the clients array", () => {
    expect(parseClients(["not a client"])).toEqual([]);
  });

  it("drops a non-object entry within a client's sessions/exercises", () => {
    const [client] = parseClients([
      {
        id: "1",
        firstName: "Jan",
        lastName: null,
        goal: null,
        notes: null,
        createdAt: "2026-01-01",
        sessions: [
          "not a session",
          {
            id: "s1",
            date: null,
            importOrder: 0,
            notes: null,
            exercises: ["not an exercise"],
          },
        ],
      },
    ]);
    expect(client?.sessions).toEqual([
      { id: "s1", date: null, importOrder: 0, notes: null, exercises: [] },
    ]);
  });

  it("treats a session's non-array exercises as none", () => {
    const [client] = parseClients([
      {
        id: "1",
        firstName: "Jan",
        lastName: null,
        goal: null,
        notes: null,
        createdAt: "2026-01-01",
        sessions: [
          {
            id: "s1",
            date: null,
            importOrder: 0,
            notes: null,
            exercises: "not an array",
          },
        ],
      },
    ]);
    expect(client?.sessions[0]?.exercises).toEqual([]);
  });

  it("defaults missing nested collections to empty arrays", () => {
    const [client] = parseClients([
      {
        id: "1",
        firstName: "Jan",
        lastName: null,
        goal: null,
        notes: null,
        createdAt: "2026-01-01",
      },
    ]);
    expect(client).toMatchObject({
      id: "1",
      firstName: "Jan",
      sessions: [],
      weightLogs: [],
      periods: [],
    });
  });

  it("keeps a well-formed session and drops a malformed set within it", () => {
    const [client] = parseClients([
      {
        id: "1",
        firstName: "Jan",
        lastName: null,
        goal: null,
        notes: null,
        createdAt: "2026-01-01",
        sessions: [
          {
            id: "s1",
            date: null,
            importOrder: 0,
            notes: null,
            exercises: [
              {
                exerciseId: "e1",
                orderIndex: 0,
                sets: [
                  {
                    setNumber: 1,
                    weight: 50,
                    reps: 10,
                    durationSeconds: null,
                    side: null,
                    rpe: null,
                  },
                  { setNumber: 2, weight: "oops" },
                ],
              },
            ],
          },
        ],
      },
    ]);
    expect(client?.sessions[0]?.exercises[0]?.sets).toEqual([
      {
        setNumber: 1,
        weight: 50,
        reps: 10,
        durationSeconds: null,
        side: null,
        rpe: null,
      },
    ]);
  });

  it("drops a malformed session and a malformed session-exercise", () => {
    const [client] = parseClients([
      {
        id: "1",
        firstName: "Jan",
        lastName: null,
        goal: null,
        notes: null,
        createdAt: "2026-01-01",
        sessions: [
          { notes: "missing id and date" },
          {
            id: "s1",
            date: null,
            importOrder: 0,
            notes: null,
            exercises: [
              { orderIndex: 0 },
              { exerciseId: "e1", orderIndex: 0, sets: "not an array" },
            ],
          },
        ],
      },
    ]);
    expect(client?.sessions).toEqual([
      {
        id: "s1",
        date: null,
        importOrder: 0,
        notes: null,
        exercises: [{ exerciseId: "e1", orderIndex: 0, sets: [] }],
      },
    ]);
  });

  it("keeps a well-formed weight log and drops a malformed one", () => {
    const [client] = parseClients([
      {
        id: "1",
        firstName: "Jan",
        lastName: null,
        goal: null,
        notes: null,
        createdAt: "2026-01-01",
        weightLogs: [
          { id: "w1", weight: 80.5, date: null, importOrder: 0 },
          { id: "w2", weight: "eighty" },
        ],
      },
    ]);
    expect(client?.weightLogs).toEqual([
      { id: "w1", weight: 80.5, date: null, importOrder: 0 },
    ]);
  });

  it("drops a malformed period while keeping a well-formed one", () => {
    const [client] = parseClients([
      {
        id: "1",
        firstName: "Jan",
        lastName: null,
        goal: null,
        notes: null,
        createdAt: "2026-01-01",
        periods: [
          {
            id: "p1",
            type: "mass",
            label: null,
            startDate: null,
            endDate: null,
          },
          { id: "p2", type: "bulk" },
        ],
      },
    ]);
    expect(client?.periods).toEqual([
      { id: "p1", type: "mass", label: null, startDate: null, endDate: null },
    ]);
  });
});

describe("parseAppData", () => {
  it("returns empty collections for non-object input", () => {
    expect(parseAppData(null)).toEqual({
      categories: [],
      exercises: [],
      clients: [],
    });
  });

  it("parses each top-level collection independently", () => {
    const result = parseAppData({
      categories: [{ id: "1", name: "Legs" }],
      exercises: [{ id: "1", name: "Squat", categoryId: null }],
      clients: [],
    });
    expect(result.categories).toHaveLength(1);
    expect(result.exercises).toHaveLength(1);
    expect(result.clients).toEqual([]);
  });
});
