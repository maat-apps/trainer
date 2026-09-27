import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetIndexedDb } from "../reset-indexeddb";

async function freshBackup() {
  vi.resetModules();
  const backup = await import("@/lib/backup");
  const storage = await import("@/lib/storage");
  return { backup, storage };
}

beforeEach(async () => {
  await resetIndexedDb();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("createBackup", () => {
  it("snapshots the current app data", async () => {
    const { backup, storage } = await freshBackup();
    storage.saveCategory({ id: "1", name: "Legs" });
    const snapshot = backup.createBackup();
    expect(snapshot.app).toBe("trainer");
    expect(snapshot.version).toBe(1);
    expect(snapshot.data.categories).toEqual([{ id: "1", name: "Legs" }]);
  });
});

describe("parseBackup", () => {
  it("throws BackupError for invalid JSON", async () => {
    const { backup } = await freshBackup();
    expect(() => backup.parseBackup("not json")).toThrow(backup.BackupError);
  });

  it("throws BackupError when the app field doesn't match", async () => {
    const { backup } = await freshBackup();
    expect(() =>
      backup.parseBackup(JSON.stringify({ app: "routines" })),
    ).toThrow(backup.BackupError);
  });

  it("parses a well-formed backup, dropping malformed nested entries", async () => {
    const { backup } = await freshBackup();
    const text = JSON.stringify({
      app: "trainer",
      version: 1,
      exportedAt: "2026-09-17T12:00:00.000Z",
      data: {
        categories: [{ id: "1", name: "Legs" }, { id: "2" }],
        exercises: [],
        clients: [],
      },
    });
    const result = backup.parseBackup(text);
    expect(result.exportedAt).toBe("2026-09-17T12:00:00.000Z");
    expect(result.data.categories).toEqual([{ id: "1", name: "Legs" }]);
  });

  it("defaults exportedAt when missing", async () => {
    const { backup } = await freshBackup();
    const result = backup.parseBackup(JSON.stringify({ app: "trainer" }));
    expect(typeof result.exportedAt).toBe("string");
    expect(result.data).toEqual({
      categories: [],
      exercises: [],
      clients: [],
    });
  });
});

describe("applyBackup", () => {
  it("replaces the current data with the backup's", async () => {
    const { backup, storage } = await freshBackup();
    storage.saveCategory({ id: "old", name: "Old" });
    backup.applyBackup({
      app: "trainer",
      version: 1,
      exportedAt: "2026-09-17T12:00:00.000Z",
      data: {
        categories: [{ id: "new", name: "New" }],
        exercises: [],
        clients: [],
      },
    });
    expect(storage.getDataSnapshot().categories).toEqual([
      { id: "new", name: "New" },
    ]);
  });
});

describe("downloadBackup", () => {
  // jsdom doesn't implement URL.createObjectURL/revokeObjectURL at all, so
  // calling downloadBackup unstubbed throws — spy on just those two methods
  // rather than replacing the whole URL global.
  function stubObjectUrl(url: string) {
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue(url);
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    return { createObjectURL, revokeObjectURL };
  }

  const backupValue = {
    app: "trainer" as const,
    version: 1,
    exportedAt: "2026-09-17T12:00:00.000Z",
    data: { categories: [], exercises: [], clients: [] },
  };

  it("creates a download link for the backup and clicks it", async () => {
    const { backup } = await freshBackup();
    const { createObjectURL } = stubObjectUrl("blob:mock-url");
    let capturedHref = "";
    let capturedDownload = "";
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      capturedHref = this.href;
      capturedDownload = this.download;
    });

    backup.downloadBackup(backupValue);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(capturedHref).toBe("blob:mock-url");
    expect(capturedDownload).toBe("trainer-backup-2026-09-17.txt");
  });

  it("revokes the object URL after a delay, not immediately", async () => {
    const { backup } = await freshBackup();
    vi.useFakeTimers();
    const { revokeObjectURL } = stubObjectUrl("blob:mock-url");
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    backup.downloadBackup(backupValue);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(10_000);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("defaults to a fresh createBackup() snapshot when none is given", async () => {
    const { backup, storage } = await freshBackup();
    storage.saveCategory({ id: "1", name: "Legs" });
    stubObjectUrl("blob:mock-url");
    let capturedHref = "";
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      capturedHref = this.href;
    });

    backup.downloadBackup();
    expect(capturedHref).toBe("blob:mock-url");
  });
});
