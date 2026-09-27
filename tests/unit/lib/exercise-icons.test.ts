import { describe, expect, it } from "vitest";

import { Barbell, Fire } from "@phosphor-icons/react";

import { EXERCISE_ICONS, exerciseIcon } from "@/lib/exercise-icons";

describe("exerciseIcon", () => {
  it("falls back to Barbell for null", () => {
    expect(exerciseIcon(null)).toBe(Barbell);
  });

  it("falls back to Barbell for an unrecognised name", () => {
    expect(exerciseIcon("NotARealIcon")).toBe(Barbell);
  });

  it("resolves a recognised icon name", () => {
    expect(exerciseIcon("Fire")).toBe(Fire);
  });

  it("resolves every icon in the curated list to a distinct component", () => {
    const resolved = EXERCISE_ICONS.map((name) => exerciseIcon(name));
    expect(new Set(resolved).size).toBe(EXERCISE_ICONS.length);
  });
});
