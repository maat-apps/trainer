import { parseLockEnrolment, type LockEnrolment } from "@maat-apps/core/lock";
import { createPersistedStore } from "@maat-apps/core/persisted";

import { keyValueStore } from "@/lib/idb-store";
import { SETTINGS_KEY } from "@/lib/storage-keys";

// A tiny persisted settings store (@maat-apps/core/persisted), separate from
// storage.ts's AppData (client/session data) — this holds the app lock's
// enrolment and browser/install state, none of it part of a backup, same
// split routines' settings.ts makes.
export type AppSettings = {
  /** The app lock's enrolment (@maat-apps/core/lock), `null` when off. */
  lock: LockEnrolment | null;
  installed: boolean;
};

const settingsStore = createPersistedStore<AppSettings>({
  storage: keyValueStore,
  key: SETTINGS_KEY,
  defaults: { lock: null, installed: false },
  parse: (stored) => {
    const value = stored as Record<string, unknown>;
    return {
      lock: parseLockEnrolment(value.lock),
      installed: value.installed === true,
    };
  },
});

/** Test-only: resolves once the initial background read has finished. */
export const whenLoaded = settingsStore.whenLoaded;
export const subscribeToSettings = settingsStore.subscribe;
export const getSettingsSnapshot = settingsStore.getSnapshot;
export const getServerSettingsSnapshot = settingsStore.getServerSnapshot;
// The lock gate must not treat "not loaded yet" as "no lock enrolled", or a
// locked device would flash its data on every cold start.
export const subscribeToSettingsReady = settingsStore.subscribeReady;
export const isSettingsReady = settingsStore.isReady;

export function isSettingsReadyOnServer(): boolean {
  return false;
}

export function setLockEnrolment(lock: LockEnrolment | null): void {
  settingsStore.set({ lock });
}

/** Chrome stops re-offering the install prompt once it considers the app
 * installed, even from a plain browser tab that never sees `standalone`
 * become true again — this is the only record of that fact surviving here. */
export function markInstalled(): void {
  if (getSettingsSnapshot().installed) return;
  settingsStore.set({ installed: true });
}
