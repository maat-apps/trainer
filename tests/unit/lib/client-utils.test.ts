import { describe, expect, it } from "vitest";

import { lastSessionDate } from "@/lib/client-utils";
import type { Client, Session } from "@/types";

function session(overrides: Partial<Session>): Session {
  return {
    id: "s1",
    date: null,
    importOrder: null,
    notes: null,
    exercises: [],
    ...overrides,
  };
}

function client(overrides: Partial<Client>): Client {
  return {
    id: "1",
    firstName: "Jan",
    lastName: null,
    goal: null,
    notes: null,
    createdAt: "2026-01-01",
    sessions: [],
    weightLogs: [],
    periods: [],
    ...overrides,
  };
}

describe("lastSessionDate", () => {
  it("returns null when there are no sessions", () => {
    expect(lastSessionDate(client({ sessions: [] }))).toBeNull();
  });

  it("returns null when every session is undated", () => {
    const sessions = [session({ date: null }), session({ date: null })];
    expect(lastSessionDate(client({ sessions }))).toBeNull();
  });

  it("returns the most recent date, ignoring undated sessions", () => {
    const sessions = [
      session({ date: "2026-01-10" }),
      session({ date: null }),
      session({ date: "2026-03-05" }),
      session({ date: "2026-02-20" }),
    ];
    expect(lastSessionDate(client({ sessions }))).toBe("2026-03-05");
  });
});
