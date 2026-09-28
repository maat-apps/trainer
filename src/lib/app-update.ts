import {
  createUpdateSnapshot,
  updateApp as updateAppWith,
} from "@maat-apps/core/update";

import {
  applyBackup,
  createBackup,
  parseBackupValue,
  type Backup,
} from "@/lib/backup";
import { keyValueStore } from "@/lib/idb-store";
import { SNAPSHOT_KEY } from "@/lib/storage-keys";

// Settings' "Zaktualizuj" and its pre-update snapshot (@maat-apps/core/update),
// with trainer's own backup format as the snapshot.

const snapshot = createUpdateSnapshot<Backup>({
  storage: keyValueStore,
  key: SNAPSHOT_KEY,
  backup: {
    create: createBackup,
    parse: parseBackupValue,
    apply: applyBackup,
  },
});

/** Test-only: resolves once the initial existence check has finished. */
export const whenLoaded = snapshot.whenLoaded;
export const subscribeToUpdateSnapshot = snapshot.subscribe;
/** Cheap existence check — doesn't read the stored backup. */
export const hasUpdateSnapshot = snapshot.has;
export const hasNoUpdateSnapshotOnServer = snapshot.hasOnServer;
export const saveUpdateSnapshot = snapshot.save;
export const readUpdateSnapshot = snapshot.read;
export const restoreUpdateSnapshot = snapshot.restore;
export const discardUpdateSnapshot = snapshot.discard;

/** Snapshot, activate the waiting worker, drop every cache, reload. */
export function updateApp(): Promise<void> {
  return updateAppWith(snapshot);
}
