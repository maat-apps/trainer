import { kvGet, kvSet } from "@/lib/idb-store";
import { parseAppData } from "@/lib/schemas";
import { DATA_KEY } from "@/lib/storage-keys";
import type { AppData, Category, Client, Exercise } from "@/types";

const emptyData: AppData = { categories: [], exercises: [], clients: [] };

// --- Central store -------------------------------------------------------------
// An in-memory copy of `AppData` is the real source of truth once loaded;
// IndexedDB is a write-through backing store — read once in the background at
// startup, written to in the background on every mutation. Every read below
// only ever touches the in-memory copy, so the whole module stays synchronous
// from a caller's point of view even though the storage engine underneath it
// isn't. Screens react to mutations made elsewhere (e.g. adding a client on
// one screen should update a list rendered on another) via the tiny pub/sub
// below, which `useSyncExternalStore`-based hooks in src/hooks/ subscribe to.
const listeners = new Set<() => void>();
const serverData: AppData = emptyData;

let snapshot: AppData = serverData;
let snapshotStale = true;

let dbData: AppData = emptyData;
let loaded: Promise<void> | null = null;

async function loadData(): Promise<void> {
  try {
    const stored = await kvGet<unknown>(DATA_KEY);
    if (stored) {
      dbData = parseAppData(stored);
    }
  } catch {
    // Keep emptyData — same fallback as a corrupt/missing stored blob.
  } finally {
    emitChange();
  }
}

function ensureLoaded(): void {
  if (loaded) return;
  loaded = loadData();
}

/**
 * Resolves once the initial background read from IndexedDB has finished.
 * Real screens never need this (they just re-render on the `emitChange()`
 * this fires) — it exists so tests can await readiness deterministically
 * instead of polling.
 */
export function whenLoaded(): Promise<void> {
  ensureLoaded();
  return loaded ?? Promise.resolve();
}

export function emitChange(): void {
  snapshotStale = true;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDataSnapshot(): AppData {
  if (snapshotStale) {
    snapshot = readData();
    snapshotStale = false;
  }
  return snapshot;
}

export function getServerDataSnapshot(): AppData {
  return serverData;
}

function readData(): AppData {
  if (typeof window === "undefined") {
    return emptyData;
  }
  ensureLoaded();
  return dbData;
}

function writeData(data: AppData): void {
  dbData = data;
  void persist(data);
  emitChange();
}

async function persist(data: AppData): Promise<void> {
  try {
    await kvSet(DATA_KEY, data);
  } catch {
    // Best-effort — the in-memory copy (and this tab) already reflects it.
  }
}

/** Replaces everything — used by backup import (trainer#9) and a future "reset all data". */
export function replaceAllData(data: AppData): void {
  writeData(data);
}

// --- Categories ----------------------------------------------------------------

export function saveCategory(category: Category): void {
  const data = readData();
  const categories = [...data.categories];
  const existingIndex = categories.findIndex((item) => item.id === category.id);
  if (existingIndex === -1) {
    categories.push(category);
  } else {
    categories[existingIndex] = category;
  }
  writeData({ ...data, categories });
}

/**
 * Deletes a category and clears it from any exercise that referenced it —
 * `categoryId` is already nullable for exactly this reason (see trainer#2),
 * so this avoids leaving a dangling reference rather than blocking the
 * delete or cascading it to the exercises themselves.
 */
export function deleteCategory(categoryId: string): void {
  const data = readData();
  writeData({
    ...data,
    categories: data.categories.filter((item) => item.id !== categoryId),
    exercises: data.exercises.map((exercise) =>
      exercise.categoryId === categoryId
        ? { ...exercise, categoryId: null }
        : exercise,
    ),
  });
}

// --- Exercises -------------------------------------------------------------------

export function saveExercise(exercise: Exercise): void {
  const data = readData();
  const exercises = [...data.exercises];
  const existingIndex = exercises.findIndex((item) => item.id === exercise.id);
  if (existingIndex === -1) {
    exercises.push(exercise);
  } else {
    exercises[existingIndex] = exercise;
  }
  writeData({ ...data, exercises });
}

export function deleteExercise(exerciseId: string): void {
  const data = readData();
  writeData({
    ...data,
    exercises: data.exercises.filter((item) => item.id !== exerciseId),
  });
}

// --- Clients ---------------------------------------------------------------------
// Sessions/weight logs/periods are nested inside a Client (see src/types.ts), so
// adding one is: read the client, update the nested array, save the whole
// client back — trainer#5/#10/#12's screens build on saveClient rather than
// each inventing their own nested-array mutation helper.

export function saveClient(client: Client): void {
  const data = readData();
  const clients = [...data.clients];
  const existingIndex = clients.findIndex((item) => item.id === client.id);
  if (existingIndex === -1) {
    clients.push(client);
  } else {
    clients[existingIndex] = client;
  }
  writeData({ ...data, clients });
}

export function deleteClient(clientId: string): void {
  const data = readData();
  writeData({
    ...data,
    clients: data.clients.filter((item) => item.id !== clientId),
  });
}

export function reorderClients(orderedIds: string[]): void {
  const data = readData();
  const byId = new Map(data.clients.map((client) => [client.id, client]));
  const reordered: Client[] = [];

  for (const id of orderedIds) {
    const client = byId.get(id);
    if (client) {
      reordered.push(client);
      byId.delete(id);
    }
  }
  // Preserve any clients not present in orderedIds (defensive) in their
  // original relative order.
  for (const client of data.clients) {
    if (byId.has(client.id)) {
      reordered.push(client);
    }
  }

  writeData({ ...data, clients: reordered });
}
