import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetIndexedDb } from "../reset-indexeddb";

// storage.ts caches state in a module-level singleton, so each test needs a
// fresh module instance to control what it reads/writes.
async function freshStorage() {
  vi.resetModules();
  return import("@/lib/storage");
}

beforeEach(async () => {
  await resetIndexedDb();
});

describe("categories", () => {
  it("saves a new category and updates an existing one", async () => {
    const storage = await freshStorage();
    storage.saveCategory({ id: "1", name: "Legs" });
    storage.saveCategory({ id: "1", name: "Lower body" });
    expect(storage.getDataSnapshot().categories).toEqual([
      { id: "1", name: "Lower body" },
    ]);
  });

  it("deletes a category", async () => {
    const storage = await freshStorage();
    storage.saveCategory({ id: "1", name: "Legs" });
    storage.deleteCategory("1");
    expect(storage.getDataSnapshot().categories).toEqual([]);
  });

  it("clears the category from exercises that referenced it, without deleting them", async () => {
    const storage = await freshStorage();
    storage.saveCategory({ id: "1", name: "Legs" });
    storage.saveExercise({
      id: "e1",
      name: "Squat",
      categoryId: "1",
      isUnilateral: false,
    });
    storage.deleteCategory("1");
    expect(storage.getDataSnapshot().exercises).toEqual([
      { id: "e1", name: "Squat", categoryId: null, isUnilateral: false },
    ]);
  });

  it("leaves exercises in other categories untouched", async () => {
    const storage = await freshStorage();
    storage.saveCategory({ id: "1", name: "Legs" });
    storage.saveCategory({ id: "2", name: "Arms" });
    storage.saveExercise({
      id: "e2",
      name: "Curl",
      categoryId: "2",
      isUnilateral: false,
    });
    storage.deleteCategory("1");
    expect(storage.getDataSnapshot().exercises).toEqual([
      { id: "e2", name: "Curl", categoryId: "2", isUnilateral: false },
    ]);
  });
});

describe("exercises", () => {
  it("saves and deletes an exercise", async () => {
    const storage = await freshStorage();
    storage.saveExercise({
      id: "1",
      name: "Squat",
      categoryId: null,
      isUnilateral: false,
    });
    expect(storage.getDataSnapshot().exercises).toHaveLength(1);
    storage.deleteExercise("1");
    expect(storage.getDataSnapshot().exercises).toEqual([]);
  });

  it("updates an existing exercise instead of duplicating it", async () => {
    const storage = await freshStorage();
    storage.saveExercise({
      id: "1",
      name: "Squat",
      categoryId: null,
      isUnilateral: false,
    });
    storage.saveExercise({
      id: "1",
      name: "Back squat",
      categoryId: "legs",
      isUnilateral: false,
    });
    expect(storage.getDataSnapshot().exercises).toEqual([
      { id: "1", name: "Back squat", categoryId: "legs", isUnilateral: false },
    ]);
  });
});

describe("clients", () => {
  it("saves and deletes a client", async () => {
    const storage = await freshStorage();
    storage.saveClient({
      id: "1",
      firstName: "Jan",
      lastName: null,
      goal: null,
      notes: null,
      createdAt: "2026-01-01",
      sessions: [],
      weightLogs: [],
      periods: [],
    });
    expect(storage.getDataSnapshot().clients).toHaveLength(1);
    storage.deleteClient("1");
    expect(storage.getDataSnapshot().clients).toEqual([]);
  });

  it("updates an existing client instead of duplicating it", async () => {
    const storage = await freshStorage();
    const base = {
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
    storage.saveClient(base);
    storage.saveClient({ ...base, firstName: "Janusz" });
    expect(storage.getDataSnapshot().clients).toEqual([
      { ...base, firstName: "Janusz" },
    ]);
  });

  it("reorders clients to match the given id order", async () => {
    const storage = await freshStorage();
    const client = (id: string) => ({
      id,
      firstName: id,
      lastName: null,
      goal: null,
      notes: null,
      createdAt: "2026-01-01",
      sessions: [],
      weightLogs: [],
      periods: [],
    });
    storage.saveClient(client("1"));
    storage.saveClient(client("2"));
    storage.saveClient(client("3"));

    storage.reorderClients(["3", "1", "2"]);

    expect(storage.getDataSnapshot().clients.map((c) => c.id)).toEqual([
      "3",
      "1",
      "2",
    ]);
  });

  it("keeps clients not present in the given order, in their original relative order", async () => {
    const storage = await freshStorage();
    const client = (id: string) => ({
      id,
      firstName: id,
      lastName: null,
      goal: null,
      notes: null,
      createdAt: "2026-01-01",
      sessions: [],
      weightLogs: [],
      periods: [],
    });
    storage.saveClient(client("1"));
    storage.saveClient(client("2"));

    storage.reorderClients(["2"]);

    expect(storage.getDataSnapshot().clients.map((c) => c.id)).toEqual([
      "2",
      "1",
    ]);
  });

  it("ignores ids that don't match any client", async () => {
    const storage = await freshStorage();
    const client = (id: string) => ({
      id,
      firstName: id,
      lastName: null,
      goal: null,
      notes: null,
      createdAt: "2026-01-01",
      sessions: [],
      weightLogs: [],
      periods: [],
    });
    storage.saveClient(client("1"));
    storage.saveClient(client("2"));

    storage.reorderClients(["missing", "2", "1"]);

    expect(storage.getDataSnapshot().clients.map((c) => c.id)).toEqual([
      "2",
      "1",
    ]);
  });
});

describe("replaceAllData", () => {
  it("replaces the whole document", async () => {
    const storage = await freshStorage();
    storage.saveCategory({ id: "1", name: "Legs" });
    storage.replaceAllData({ categories: [], exercises: [], clients: [] });
    expect(storage.getDataSnapshot()).toEqual({
      categories: [],
      exercises: [],
      clients: [],
    });
  });
});

describe("subscribe / emitChange", () => {
  it("notifies subscribers on a write and stops after unsubscribing", async () => {
    const storage = await freshStorage();
    const listener = vi.fn();
    const unsubscribe = storage.subscribe(listener);

    storage.saveCategory({ id: "1", name: "Legs" });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    storage.saveCategory({ id: "2", name: "Back" });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("persistence", () => {
  it("persists a write to IndexedDB and reloads it in a fresh module instance", async () => {
    const first = await freshStorage();
    first.saveCategory({ id: "1", name: "Legs" });

    const second = await freshStorage();
    await second.whenLoaded();
    expect(second.getDataSnapshot().categories).toEqual([
      { id: "1", name: "Legs" },
    ]);
  });

  it("getServerDataSnapshot always returns the empty document", async () => {
    const storage = await freshStorage();
    storage.saveCategory({ id: "1", name: "Legs" });
    expect(storage.getServerDataSnapshot()).toEqual({
      categories: [],
      exercises: [],
      clients: [],
    });
  });
});

describe("encryption", () => {
  const encryptedEnrolment = {
    credentialId: "c1",
    userId: "u1",
    createdAt: "now",
    encryptionSupported: true,
    prfSalt: "c2FsdA",
  };

  async function testKey() {
    const { deriveKey, randomBytes } = await import("@maat-apps/core/crypto");
    return deriveKey(randomBytes(32), randomBytes(16), "test-data-v1");
  }

  async function seedEncrypted(key: CryptoKey) {
    const { encryptJson } = await import("@maat-apps/core/crypto");
    const { kvSet } = await import("@/lib/idb-store");
    const { DATA_KEY } = await import("@/lib/storage-keys");
    await kvSet(
      DATA_KEY,
      await encryptJson(key, {
        categories: [{ id: "1", name: "Secret" }],
        exercises: [],
        clients: [],
      }),
    );
  }

  it("persists writes encrypted while a key is set", async () => {
    const storage = await freshStorage();
    const { encryptionKey } = await import("@/lib/encryption-key");
    const { isEncryptedBlob } = await import("@maat-apps/core/crypto");
    const { kvGet } = await import("@/lib/idb-store");
    const { DATA_KEY } = await import("@/lib/storage-keys");
    encryptionKey.set(await testKey());

    storage.saveCategory({ id: "1", name: "Legs" });

    await vi.waitFor(async () => {
      expect(isEncryptedBlob(await kvGet(DATA_KEY))).toBe(true);
    });
  });

  it("holds the load until the key is set when the lock encrypts", async () => {
    vi.resetModules();
    const settings = await import("@/lib/app-settings");
    await settings.whenLoaded();
    settings.setLockEnrolment(encryptedEnrolment);
    const key = await testKey();
    await seedEncrypted(key);

    const storage = await import("@/lib/storage");
    void storage.whenLoaded();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(storage.getDataSnapshot().categories).toEqual([]);

    const { encryptionKey } = await import("@/lib/encryption-key");
    encryptionKey.set(key);
    await storage.whenLoaded();
    expect(storage.getDataSnapshot().categories).toEqual([
      { id: "1", name: "Secret" },
    ]);
  });

  it("decrypts when the key was set before the first load", async () => {
    vi.resetModules();
    const settings = await import("@/lib/app-settings");
    await settings.whenLoaded();
    settings.setLockEnrolment(encryptedEnrolment);
    const key = await testKey();
    await seedEncrypted(key);
    const { encryptionKey } = await import("@/lib/encryption-key");
    encryptionKey.set(key);

    const storage = await import("@/lib/storage");
    await storage.whenLoaded();

    expect(storage.getDataSnapshot().categories).toHaveLength(1);
  });
});
