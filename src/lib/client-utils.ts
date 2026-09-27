import type { Client } from "@/types";

/** The most recent session date for a client, or null if none are dated. */
export function lastSessionDate(client: Client): string | null {
  const dates = client.sessions
    .map((session) => session.date)
    .filter((date): date is string => date !== null);
  if (dates.length === 0) return null;
  return dates.reduce((latest, date) => (date > latest ? date : latest));
}
