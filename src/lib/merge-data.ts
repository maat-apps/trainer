import type { AppData, Client } from "@/types";

/** `current` plus the `incoming` items whose id it lacks; the rest stay as is. */
function addMissing<T extends { id: string }>(
  current: T[],
  incoming: T[],
): T[] {
  const knownIds = new Set(current.map((item) => item.id));
  const added = incoming.filter((item) => {
    if (knownIds.has(item.id)) return false;
    knownIds.add(item.id);
    return true;
  });
  return [...current, ...added];
}

function mergeClient(current: Client, incoming: Client): Client {
  return {
    ...current,
    sessions: addMissing(current.sessions, incoming.sessions),
    weightLogs: addMissing(current.weightLogs, incoming.weightLogs),
    periods: addMissing(current.periods, incoming.periods),
  };
}

function mergeClients(current: Client[], incoming: Client[]): Client[] {
  const incomingById = new Map(incoming.map((client) => [client.id, client]));
  const merged = current.map((client) => {
    const other = incomingById.get(client.id);
    return other ? mergeClient(client, other) : client;
  });
  return addMissing(merged, incoming);
}

/**
 * `current` plus whatever `incoming` has that it lacks, matched by id: whole
 * categories, exercises and clients, and for a client both have, the sessions,
 * weight logs and periods missing from the device's copy. Anything already
 * there stays exactly as it is — none of it carries an edit time to say which
 * copy is newer, so the device's wins. A merge never deletes.
 */
export function mergeAppData(current: AppData, incoming: AppData): AppData {
  return {
    categories: addMissing(current.categories, incoming.categories),
    exercises: addMissing(current.exercises, incoming.exercises),
    clients: mergeClients(current.clients, incoming.clients),
  };
}
