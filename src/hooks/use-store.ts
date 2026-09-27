import { useSyncExternalStore } from "react";

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
