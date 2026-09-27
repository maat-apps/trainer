import * as v from "valibot";

import { parseAppData } from "@/lib/schemas";
import { getDataSnapshot, replaceAllData } from "@/lib/storage";
import type { AppData } from "@/types";

export const BACKUP_VERSION = 1;

export type Backup = {
  app: "trainer";
  version: number;
  exportedAt: string;
  data: AppData;
};

export class BackupError extends Error {}

/** Snapshots everything worth keeping, ready to be serialised to a file. */
export function createBackup(): Backup {
  return {
    app: "trainer",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: getDataSnapshot(),
  };
}

/**
 * Validates a backup file. Import runs on a user-supplied file, so anything
 * unrecognised is dropped rather than trusted — the same per-item leniency
 * schemas.ts's parse* functions already give the normal IndexedDB read.
 */
export function parseBackup(text: string): Backup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError("Plik nie jest poprawnym JSON-em.");
  }
  return parseBackupValue(parsed);
}

/**
 * Same validation as `parseBackup`, for a value that's already an object —
 * e.g. one read back from IndexedDB rather than parsed from file text.
 */
export function parseBackupValue(parsed: unknown): Backup {
  if (!v.safeParse(v.object({ app: v.literal("trainer") }), parsed).success) {
    throw new BackupError("Plik nie jest kopią zapasową aplikacji trainer.");
  }
  const exportedAt = v.safeParse(v.object({ exportedAt: v.string() }), parsed);
  const dataField = v.safeParse(v.object({ data: v.unknown() }), parsed);

  return {
    app: "trainer",
    version: BACKUP_VERSION,
    exportedAt: exportedAt.success
      ? exportedAt.output.exportedAt
      : new Date().toISOString(),
    data: parseAppData(dataField.success ? dataField.output.data : undefined),
  };
}

/** Overwrites the current data with the backup's. */
export function applyBackup(backup: Backup): void {
  replaceAllData(backup.data);
}

/**
 * `.txt`/`text/plain`, not `.json`/`application/json` — Chromium's Web
 * Share API file allow-list doesn't include JSON (`canShare` just silently
 * returns `false` for it), so sharing needs plain text, and download uses
 * the same format rather than splitting the two into different file types.
 * `parseBackup` only ever reads the text content, never the filename/
 * extension, so this doesn't affect import.
 */
export function backupFileName(date = new Date()): string {
  return `trainer-backup-${date.toISOString().slice(0, 10)}.txt`;
}

function backupFile(backup: Backup): File {
  return new File(
    [JSON.stringify(backup, null, 2)],
    backupFileName(new Date(backup.exportedAt)),
    { type: "text/plain" },
  );
}

/** Hands the browser a JSON file (named/typed as plain text) to save. */
export function downloadBackup(backup: Backup = createBackup()): void {
  const url = URL.createObjectURL(backupFile(backup));
  const link = document.createElement("a");

  link.href = url;
  link.download = backupFileName(new Date(backup.exportedAt));
  document.body.append(link);
  link.click();
  link.remove();
  // Revoking straight away can cancel the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
