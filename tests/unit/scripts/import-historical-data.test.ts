import { describe, expect, it } from "vitest";

import { buildBackup } from "../../../scripts/import-historical-data";

// A sanity/regression check on the actual embedded raw notes (trainer#4),
// cross-checking aggregate counts against the raw input by eye — the exact
// per-rule parsing behavior is covered by tests/unit/lib/historical-import.
describe("buildBackup", () => {
  it("parses the embedded historical notes into the expected client shape", () => {
    const backup = buildBackup("Jan", "Kowalski");
    expect(backup.app).toBe("trainer");
    expect(backup.data.clients).toHaveLength(1);

    const [client] = backup.data.clients;
    expect(client).toMatchObject({ firstName: "Jan", lastName: "Kowalski" });

    // One exercise per block in the raw notes.
    expect(backup.data.exercises.map((e) => e.name)).toEqual([
      "Split squat",
      "Drążek wyciąg",
      "Leg curl",
      "Klata",
      "Trapbar deadlift",
      "Wiosło machina",
      "Ohp",
      "Wznosy nóg",
      "Wznosy nóg (wersja z podeszwą)",
      "Plank",
    ]);

    // One session per result line in the raw notes.
    const sessionCountsByExerciseName = new Map<string, number>();
    for (const session of client?.sessions ?? []) {
      const exerciseId = session.exercises[0]?.exerciseId;
      const exercise = backup.data.exercises.find((e) => e.id === exerciseId);
      if (!exercise) continue;
      sessionCountsByExerciseName.set(
        exercise.name,
        (sessionCountsByExerciseName.get(exercise.name) ?? 0) + 1,
      );
    }
    expect(Object.fromEntries(sessionCountsByExerciseName)).toEqual({
      "Split squat": 5,
      "Drążek wyciąg": 10,
      "Leg curl": 14,
      Klata: 6,
      "Trapbar deadlift": 6,
      "Wiosło machina": 4,
      Ohp: 5,
      "Wznosy nóg": 3,
      "Wznosy nóg (wersja z podeszwą)": 2,
      Plank: 3,
    });

    // Split squat is the only unilateral exercise.
    expect(
      backup.data.exercises.map((e) => [e.name, e.isUnilateral]),
    ).toContainEqual(["Split squat", true]);
    expect(
      backup.data.exercises
        .filter((e) => e.name !== "Split squat")
        .every((e) => !e.isUnilateral),
    ).toBe(true);

    // Every session is dated null with a per-exercise-block importOrder.
    expect(client?.sessions.every((s) => s.date === null)).toBe(true);
  });
});
