import { describe, expect, it } from "vitest";

import { mergeAppData } from "@/lib/merge-data";
import type { AppData, Client } from "@/types";

function client(overrides: Partial<Client> = {}): Client {
  return {
    id: "c1",
    firstName: "Marek",
    lastName: null,
    goal: null,
    notes: null,
    createdAt: "2026-10-01T00:00:00.000Z",
    sessions: [],
    weightLogs: [],
    periods: [],
    ...overrides,
  };
}

function session(id: string) {
  return { id, date: null, importOrder: null, notes: null, exercises: [] };
}

function data(overrides: Partial<AppData> = {}): AppData {
  return { categories: [], exercises: [], clients: [], ...overrides };
}

describe("mergeAppData", () => {
  it("adds the categories, exercises and clients the device lacks", () => {
    const merged = mergeAppData(
      data({ categories: [{ id: "a", name: "Mine" }] }),
      data({
        categories: [{ id: "b", name: "Theirs" }],
        exercises: [
          {
            id: "e1",
            name: "Squat",
            categoryId: "b",
            isUnilateral: false,
            iconName: null,
          },
        ],
        clients: [client()],
      }),
    );
    expect(merged.categories.map((item) => item.id)).toEqual(["a", "b"]);
    expect(merged.exercises.map((item) => item.id)).toEqual(["e1"]);
    expect(merged.clients.map((item) => item.id)).toEqual(["c1"]);
  });

  it("leaves an item the device already has exactly as it is", () => {
    const merged = mergeAppData(
      data({ categories: [{ id: "a", name: "Mine" }] }),
      data({ categories: [{ id: "a", name: "Theirs" }] }),
    );
    expect(merged.categories).toEqual([{ id: "a", name: "Mine" }]);
  });

  it("keeps everything the backup does not have", () => {
    const mine = data({ clients: [client()] });
    expect(mergeAppData(mine, data())).toEqual(mine);
  });

  it("adds a shared client's missing sessions, weight logs and periods", () => {
    const merged = mergeAppData(
      data({ clients: [client({ sessions: [session("s1")] })] }),
      data({
        clients: [
          client({
            goal: "Theirs",
            sessions: [session("s1"), session("s2")],
            weightLogs: [
              { id: "w1", weight: 80, date: null, importOrder: null },
            ],
            periods: [
              {
                id: "p1",
                type: "mass",
                label: null,
                startDate: null,
                endDate: null,
              },
            ],
          }),
        ],
      }),
    );
    const [merged1] = merged.clients;
    expect(merged1.goal).toBeNull();
    expect(merged1.sessions.map((item) => item.id)).toEqual(["s1", "s2"]);
    expect(merged1.weightLogs.map((item) => item.id)).toEqual(["w1"]);
    expect(merged1.periods.map((item) => item.id)).toEqual(["p1"]);
  });
});
