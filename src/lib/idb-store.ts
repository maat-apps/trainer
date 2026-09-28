import { createKeyValueStore } from "@maat-apps/core/storage";

// The key-value store every storage module builds on (@maat-apps/core's
// IndexedDB wrapper). No localStorage migration (unlike routines') — this app
// never had a localStorage-based storage layer to migrate from.

const store = createKeyValueStore({ name: "trainer" });

export const kvGet = store.get;
export const kvSet = store.set;
export const kvDelete = store.delete;

export { store as keyValueStore };
