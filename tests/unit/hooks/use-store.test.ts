import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetIndexedDb } from "../reset-indexeddb";

async function freshUseAppData() {
  vi.resetModules();
  const { useAppData } = await import("@/hooks/use-store");
  const storage = await import("@/lib/storage");
  return { useAppData, storage };
}

beforeEach(async () => {
  await resetIndexedDb();
});

describe("useAppData", () => {
  it("re-renders with the latest data after a write", async () => {
    const { useAppData, storage } = await freshUseAppData();
    const { result } = renderHook(() => useAppData());

    expect(result.current.categories).toEqual([]);

    act(() => {
      storage.saveCategory({ id: "1", name: "Legs" });
    });

    expect(result.current.categories).toEqual([{ id: "1", name: "Legs" }]);
  });
});

describe("useAppSettings / useSettingsReady", () => {
  it("reflects settings once loaded", async () => {
    vi.resetModules();
    const { useAppSettings, useSettingsReady } =
      await import("@/hooks/use-store");
    const settings = await import("@/lib/app-settings");
    const { result } = renderHook(() => ({
      settings: useAppSettings(),
      ready: useSettingsReady(),
    }));

    await act(() => settings.whenLoaded());

    expect(result.current.ready).toBe(true);
    expect(result.current.settings.lock).toBeNull();
  });
});
