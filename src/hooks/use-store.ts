import { useSyncExternalStore } from "react";

import {
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  isSettingsReady,
  isSettingsReadyOnServer,
  subscribeToSettings,
  subscribeToSettingsReady,
  type AppSettings,
} from "@/lib/app-settings";
import {
  getDataSnapshot,
  getServerDataSnapshot,
  subscribe,
} from "@/lib/storage";
import type { AppData } from "@/types";

export function useAppData(): AppData {
  return useSyncExternalStore(
    subscribe,
    getDataSnapshot,
    getServerDataSnapshot,
  );
}

export function useAppSettings(): AppSettings {
  return useSyncExternalStore(
    subscribeToSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot,
  );
}

/** Whether settings have loaded — until then "no lock" can't be trusted. */
export function useSettingsReady(): boolean {
  return useSyncExternalStore(
    subscribeToSettingsReady,
    isSettingsReady,
    isSettingsReadyOnServer,
  );
}
