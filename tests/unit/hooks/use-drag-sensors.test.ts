import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useDragSensors } from "@/hooks/use-drag-sensors";

describe("useDragSensors", () => {
  it("returns pointer, touch, and keyboard sensors", () => {
    const { result } = renderHook(() => useDragSensors());
    expect(result.current).toHaveLength(3);
  });
});
