// @vitest-environment node
//
// jsdom (every other test file's environment) can never produce a real "no
// window", so storage.ts's typeof window === "undefined" guard is exercised
// here instead, under Vitest's per-file Node environment override.
import { describe, expect, it } from "vitest";

describe("storage.ts SSR guard", () => {
  it("returns the empty document when window is undefined", async () => {
    const { getDataSnapshot } = await import("@/lib/storage");
    expect(getDataSnapshot()).toEqual({
      categories: [],
      exercises: [],
      clients: [],
    });
  });

  it("resolves whenLoaded without starting a load", async () => {
    const { whenLoaded } = await import("@/lib/storage");
    await expect(whenLoaded()).resolves.toBeUndefined();
  });
});
