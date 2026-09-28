import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SNAPSHOT_KEY } from "@/lib/storage-keys";
import { resetIndexedDb } from "../reset-indexeddb";

// app-update.ts's existence flag and storage.ts's data both cache in
// module-level state, so each test needs fresh instances — otherwise one
// test's snapshot/client data would bleed into the next.
async function freshAppUpdate() {
  vi.resetModules();
  const storage = await import("@/lib/storage");
  await storage.whenLoaded();
  const appUpdate = await import("@/lib/app-update");
  await appUpdate.whenLoaded();
  const idbStore = await import("@/lib/idb-store");
  return { storage, appUpdate, idbStore };
}

const testClient = {
  id: "1",
  firstName: "Jan",
  lastName: null,
  goal: null,
  notes: null,
  createdAt: "2026-01-01",
  sessions: [],
  weightLogs: [],
  periods: [],
};

beforeEach(async () => {
  await resetIndexedDb();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("hasUpdateSnapshot / hasNoUpdateSnapshotOnServer", () => {
  it("is false when nothing is stored", async () => {
    const { appUpdate } = await freshAppUpdate();
    expect(appUpdate.hasUpdateSnapshot()).toBe(false);
  });

  it("is true once a snapshot exists", async () => {
    // resetModules before this seed write (not just inside freshAppUpdate()
    // below) — idb-store.ts caches its DB connection at module scope, and
    // reusing a connection opened before this test's beforeEach deleted the
    // database throws InvalidStateError.
    vi.resetModules();
    const { kvSet } = await import("@/lib/idb-store");
    await kvSet(SNAPSHOT_KEY, {});
    const { appUpdate } = await freshAppUpdate();
    expect(appUpdate.hasUpdateSnapshot()).toBe(true);
  });

  it("is false instead of throwing when the IndexedDB read itself rejects", async () => {
    vi.resetModules();
    const idbStore = await import("@/lib/idb-store");
    vi.spyOn(idbStore, "kvGet").mockRejectedValue(new Error("blocked"));
    const appUpdate = await import("@/lib/app-update");
    await appUpdate.whenLoaded();
    expect(appUpdate.hasUpdateSnapshot()).toBe(false);
  });

  it("the server snapshot is always false", async () => {
    const { appUpdate } = await freshAppUpdate();
    expect(appUpdate.hasNoUpdateSnapshotOnServer()).toBe(false);
  });
});

describe("subscribeToUpdateSnapshot", () => {
  it("stops notifying after unsubscribing", async () => {
    const { appUpdate } = await freshAppUpdate();
    const listener = vi.fn();
    const unsubscribe = appUpdate.subscribeToUpdateSnapshot(listener);
    unsubscribe();
    await appUpdate.saveUpdateSnapshot();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("saveUpdateSnapshot / readUpdateSnapshot", () => {
  it("saves the current data as a backup and notifies listeners", async () => {
    const { appUpdate, storage } = await freshAppUpdate();
    storage.saveClient(testClient);
    const listener = vi.fn();
    appUpdate.subscribeToUpdateSnapshot(listener);

    const backup = await appUpdate.saveUpdateSnapshot();

    expect(backup?.data.clients).toEqual([testClient]);
    expect(appUpdate.hasUpdateSnapshot()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("returns null instead of throwing when the write fails", async () => {
    const { appUpdate, idbStore } = await freshAppUpdate();
    vi.spyOn(idbStore, "kvSet").mockRejectedValue(new Error("blocked"));
    await expect(appUpdate.saveUpdateSnapshot()).resolves.toBeNull();
  });

  it("reads back what was saved", async () => {
    const { appUpdate, storage } = await freshAppUpdate();
    storage.saveClient(testClient);
    await appUpdate.saveUpdateSnapshot();
    const snapshot = await appUpdate.readUpdateSnapshot();
    expect(snapshot?.data.clients).toEqual([testClient]);
  });

  it("returns null when nothing is stored", async () => {
    const { appUpdate } = await freshAppUpdate();
    await expect(appUpdate.readUpdateSnapshot()).resolves.toBeNull();
  });

  it("returns null instead of throwing for a corrupted snapshot", async () => {
    // resetModules before this seed write (not just inside freshAppUpdate()
    // below) — idb-store.ts caches its DB connection at module scope, and
    // reusing a connection opened before this test's beforeEach deleted the
    // database throws InvalidStateError.
    vi.resetModules();
    const { kvSet } = await import("@/lib/idb-store");
    await kvSet(SNAPSHOT_KEY, "{not json");
    const { appUpdate } = await freshAppUpdate();
    await expect(appUpdate.readUpdateSnapshot()).resolves.toBeNull();
  });
});

describe("restoreUpdateSnapshot", () => {
  it("returns false when there is nothing to restore", async () => {
    const { appUpdate } = await freshAppUpdate();
    await expect(appUpdate.restoreUpdateSnapshot()).resolves.toBe(false);
  });

  it("restores the snapshot's data", async () => {
    const { appUpdate, storage } = await freshAppUpdate();
    storage.saveClient(testClient);
    await appUpdate.saveUpdateSnapshot();
    storage.saveClient({ ...testClient, id: "2", firstName: "Ewa" });

    await expect(appUpdate.restoreUpdateSnapshot()).resolves.toBe(true);
    expect(storage.getDataSnapshot().clients.map((c) => c.id)).toEqual(["1"]);
  });
});

describe("discardUpdateSnapshot", () => {
  it("removes the snapshot and notifies listeners", async () => {
    // resetModules before this seed write (not just inside freshAppUpdate()
    // below) — idb-store.ts caches its DB connection at module scope, and
    // reusing a connection opened before this test's beforeEach deleted the
    // database throws InvalidStateError.
    vi.resetModules();
    const { kvSet } = await import("@/lib/idb-store");
    await kvSet(SNAPSHOT_KEY, {});
    const { appUpdate } = await freshAppUpdate();
    const listener = vi.fn();
    appUpdate.subscribeToUpdateSnapshot(listener);

    await appUpdate.discardUpdateSnapshot();

    expect(appUpdate.hasUpdateSnapshot()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("updateApp", () => {
  it("saves a snapshot and reloads the page", async () => {
    const { appUpdate, storage } = await freshAppUpdate();
    storage.saveClient(testClient);
    // jsdom's window.location.reload isn't configurable, so it can't be
    // spied on directly — vi.stubGlobal replaces the whole object instead,
    // and (unlike a raw Object.defineProperty) restores it safely even when
    // the environment is reused across files (isolate: false).
    const reload = vi.fn();
    vi.stubGlobal("location", { reload });

    await appUpdate.updateApp();

    expect(appUpdate.hasUpdateSnapshot()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("updates a waiting service worker registration", async () => {
    const { appUpdate } = await freshAppUpdate();
    // jsdom has no ServiceWorkerContainer at all, so "serviceWorker" in
    // navigator is normally false and this branch is never exercised —
    // stub navigator wholesale rather than trying to patch a container that
    // doesn't exist.
    const update = vi.fn().mockResolvedValue(undefined);
    const postMessage = vi.fn();
    const getRegistration = vi.fn().mockResolvedValue({
      update,
      waiting: { postMessage },
    });
    vi.stubGlobal("navigator", { serviceWorker: { getRegistration } });
    vi.stubGlobal("location", { reload: vi.fn() });

    await appUpdate.updateApp();

    expect(update).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });

  it("still reloads if the service worker check throws", async () => {
    const { appUpdate } = await freshAppUpdate();
    vi.stubGlobal("navigator", {
      serviceWorker: {
        getRegistration: vi.fn().mockRejectedValue(new Error("nope")),
      },
    });
    const reload = vi.fn();
    vi.stubGlobal("location", { reload });

    await appUpdate.updateApp();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("clears every cache", async () => {
    const { appUpdate } = await freshAppUpdate();
    // jsdom has no Cache Storage API either, so "caches" in window is
    // normally false — same reasoning as the service worker case above.
    const deleteCache = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("caches", {
      keys: vi.fn().mockResolvedValue(["cache-a", "cache-b"]),
      delete: deleteCache,
    });
    vi.stubGlobal("location", { reload: vi.fn() });

    await appUpdate.updateApp();

    expect(deleteCache).toHaveBeenCalledWith("cache-a");
    expect(deleteCache).toHaveBeenCalledWith("cache-b");
    expect(deleteCache).toHaveBeenCalledTimes(2);
  });

  it("still reloads if clearing caches throws", async () => {
    const { appUpdate } = await freshAppUpdate();
    vi.stubGlobal("caches", {
      keys: vi.fn().mockRejectedValue(new Error("nope")),
    });
    const reload = vi.fn();
    vi.stubGlobal("location", { reload });

    await appUpdate.updateApp();

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
