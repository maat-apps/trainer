import { describe, expect, it } from "vitest";

import {
  buildExerciseProgressSeries,
  filterByDateRange,
  loggedExerciseIds,
} from "@/lib/exercise-progress";
import type { Session } from "@/types";

function set(
  overrides: Partial<Session["exercises"][number]["sets"][number]> = {},
) {
  return {
    setNumber: 1,
    weight: null,
    reps: null,
    durationSeconds: null,
    side: null,
    rpe: null,
    ...overrides,
  };
}

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: "s1",
    date: null,
    importOrder: null,
    notes: null,
    exercises: [],
    ...overrides,
  };
}

describe("buildExerciseProgressSeries", () => {
  it("ignores sessions that don't log the requested exercise", () => {
    const sessions = [
      session({
        exercises: [{ exerciseId: "other", orderIndex: 0, sets: [set()] }],
      }),
    ];
    expect(buildExerciseProgressSeries(sessions, "squat", false)).toEqual([]);
  });

  it("picks the max weight as the session's value when weight is logged", () => {
    const sessions = [
      session({
        date: "2026-01-10",
        exercises: [
          {
            exerciseId: "squat",
            orderIndex: 0,
            sets: [set({ weight: 40 }), set({ weight: 60 })],
          },
        ],
      }),
    ];
    const [point] = buildExerciseProgressSeries(sessions, "squat", false);
    expect(point?.value).toBe(60);
  });

  it("falls back to reps, then duration, when no weight is logged", () => {
    const repsSession = session({
      id: "reps",
      date: "2026-01-01",
      exercises: [
        {
          exerciseId: "situp",
          orderIndex: 0,
          sets: [set({ reps: 12 }), set({ reps: 20 })],
        },
      ],
    });
    const durationSession = session({
      id: "duration",
      date: "2026-01-02",
      exercises: [
        {
          exerciseId: "plank",
          orderIndex: 0,
          sets: [set({ durationSeconds: 45 })],
        },
      ],
    });
    expect(
      buildExerciseProgressSeries([repsSession], "situp", false)[0]?.value,
    ).toBe(20);
    expect(
      buildExerciseProgressSeries([durationSession], "plank", false)[0]?.value,
    ).toBe(45);
  });

  it("returns a null value when a session logs no weight, reps, or duration", () => {
    const sessions = [
      session({
        date: "2026-01-01",
        exercises: [{ exerciseId: "squat", orderIndex: 0, sets: [set()] }],
      }),
    ];
    expect(
      buildExerciseProgressSeries(sessions, "squat", false)[0]?.value,
    ).toBeNull();
  });

  it("labels a session with neither date nor importOrder as '#?'", () => {
    const sessions = [
      session({
        exercises: [
          { exerciseId: "squat", orderIndex: 0, sets: [set({ weight: 10 })] },
        ],
      }),
    ];
    expect(
      buildExerciseProgressSeries(sessions, "squat", false)[0]?.label,
    ).toBe("#?");
  });

  it("sorts two dated sessions by date", () => {
    const later = session({
      id: "later",
      date: "2026-02-01",
      exercises: [
        { exerciseId: "squat", orderIndex: 0, sets: [set({ weight: 2 })] },
      ],
    });
    const earlier = session({
      id: "earlier",
      date: "2026-01-01",
      exercises: [
        { exerciseId: "squat", orderIndex: 0, sets: [set({ weight: 1 })] },
      ],
    });
    const points = buildExerciseProgressSeries(
      [later, earlier],
      "squat",
      false,
    );
    expect(points.map((p) => p.value)).toEqual([1, 2]);
  });

  it("splits unilateral sets into left/right series", () => {
    const sessions = [
      session({
        date: "2026-01-10",
        exercises: [
          {
            exerciseId: "split-squat",
            orderIndex: 0,
            sets: [
              set({ weight: 15, side: "left" }),
              set({ weight: 17, side: "right" }),
            ],
          },
        ],
      }),
    ];
    const [point] = buildExerciseProgressSeries(sessions, "split-squat", true);
    expect(point?.left).toBe(15);
    expect(point?.right).toBe(17);
    expect(point?.value).toBeNull();
  });

  it("sorts undated (historical) sessions before dated ones, undated by importOrder", () => {
    const dated = session({
      id: "dated",
      date: "2026-01-01",
      exercises: [
        { exerciseId: "squat", orderIndex: 0, sets: [set({ weight: 10 })] },
      ],
    });
    const undatedFirst = session({
      id: "u1",
      importOrder: 0,
      exercises: [
        { exerciseId: "squat", orderIndex: 0, sets: [set({ weight: 1 })] },
      ],
    });
    const undatedSecond = session({
      id: "u2",
      importOrder: 1,
      exercises: [
        { exerciseId: "squat", orderIndex: 0, sets: [set({ weight: 2 })] },
      ],
    });
    const points = buildExerciseProgressSeries(
      [dated, undatedSecond, undatedFirst],
      "squat",
      false,
    );
    expect(points.map((p) => p.value)).toEqual([1, 2, 10]);
    expect(points[0]?.x).toBeLessThan(points[1]!.x);
    expect(points[1]?.x).toBeLessThan(points[2]!.x);
  });
});

describe("loggedExerciseIds", () => {
  it("returns only exercises with at least one logged set", () => {
    const sessions = [
      session({
        exercises: [
          { exerciseId: "with-sets", orderIndex: 0, sets: [set()] },
          { exerciseId: "no-sets", orderIndex: 1, sets: [] },
        ],
      }),
    ];
    expect(loggedExerciseIds(sessions)).toEqual(["with-sets"]);
  });
});

describe("filterByDateRange", () => {
  const points = [
    {
      x: Date.parse("2026-01-01"),
      label: "a",
      left: null,
      right: null,
      value: 1,
    },
    {
      x: Date.parse("2026-02-01"),
      label: "b",
      left: null,
      right: null,
      value: 2,
    },
    {
      x: Date.parse("2026-03-01"),
      label: "c",
      left: null,
      right: null,
      value: 3,
    },
  ];

  it("returns all points when no range is set", () => {
    expect(filterByDateRange(points, null, null)).toEqual(points);
  });

  it("filters to the given range", () => {
    const filtered = filterByDateRange(points, "2026-01-15", "2026-02-15");
    expect(filtered.map((p) => p.value)).toEqual([2]);
  });
});
