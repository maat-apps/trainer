import {
  BackupError,
  backupFileName as coreBackupFileName,
  downloadBackup as coreDownloadBackup,
  readBackupEnvelope,
  readBackupJson,
} from "@maat-apps/core/backup";

import { parseAppData } from "@/lib/schemas";
import { getDataSnapshot, replaceAllData } from "@/lib/storage";
import type { AppData } from "@/types";

// trainer's backup format on top of @maat-apps/core/backup, which handles
// the envelope checks, the backup file and the download. What's trainer's
// own: the data and the (Polish) messages.

export { BackupError };

export const BACKUP_VERSION = 1;

export type Backup = {
  app: "trainer";
  version: number;
  exportedAt: string;
  data: AppData;
};

const messages = {
  notJson: "Plik nie jest poprawnym JSON-em.",
  wrongApp: "Plik nie jest kopią zapasową aplikacji trainer.",
};

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
  return parseBackupValue(readBackupJson(text, messages));
}

/**
 * Same validation as `parseBackup`, for a value that's already an object —
 * e.g. one read back from IndexedDB rather than parsed from file text. Any
 * version is accepted: the data is parsed leniently either way.
 */
export function parseBackupValue(parsed: unknown): Backup {
  const envelope = readBackupEnvelope(parsed, { app: "trainer", messages });
  return {
    app: "trainer",
    version: BACKUP_VERSION,
    exportedAt: envelope.exportedAt,
    data: parseAppData(envelope.data),
  };
}

/** Overwrites the current data with the backup's. */
export function applyBackup(backup: Backup): void {
  replaceAllData(backup.data);
}

/** `trainer-backup-YYYY-MM-DD.txt` (plain text: see core's backupFileName). */
export function backupFileName(date = new Date()): string {
  return coreBackupFileName("trainer", date);
}

/** Hands the browser the backup file to save. */
export function downloadBackup(backup: Backup = createBackup()): void {
  coreDownloadBackup(backup);
}
