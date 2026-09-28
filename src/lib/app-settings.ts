import { createPersistedStore } from "@maat-apps/core/persisted";

import { keyValueStore } from "@/lib/idb-store";
import { SETTINGS_KEY } from "@/lib/storage-keys";

// A tiny persisted-flags store (@maat-apps/core/persisted), separate from
// storage.ts's AppData (client/session data) — this holds browser/install
// state that isn't part of a backup, same split routines' settings.ts makes.
export type AppSettings = {
  installed: boolean;
};

const settingsStore = createPersistedStore<AppSettings>({
  storage: keyValueStore,
  key: SETTINGS_KEY,
  defaults: { installed: false },
  parse: (stored) => {
    const installed = (stored as Partial<AppSettings>).installed;
    if (typeof installed !== "boolean") throw new Error("Invalid settings");
    return { installed };
  },
});

/** Test-only: resolves once the initial background read has finished. */
export const whenLoaded = settingsStore.whenLoaded;
export const subscribeToSettings = settingsStore.subscribe;
export const getSettingsSnapshot = settingsStore.getSnapshot;
export const getServerSettingsSnapshot = settingsStore.getServerSnapshot;

/** Chrome stops re-offering the install prompt once it considers the app
 * installed, even from a plain browser tab that never sees `standalone`
 * become true again — this is the only record of that fact surviving here. */
export function markInstalled(): void {
  if (getSettingsSnapshot().installed) return;
  settingsStore.set({ installed: true });
}
