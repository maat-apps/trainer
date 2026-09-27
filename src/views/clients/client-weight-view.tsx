import { useParams } from "react-router";

import { useAppData } from "@/hooks/use-store";

// The actual chart (colored mass/cut period bands, recharts) is trainer#6 —
// this view lists the logged weights so the route is useful before that
// lands, and wires navigation up end to end.
export function ClientWeightView() {
  const { clientId } = useParams();
  const { clients } = useAppData();
  const client = clients.find((item) => item.id === clientId);

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-2 text-xl">Waga</h1>
      {!client || client.weightLogs.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Brak zapisanych wag. Wykres pojawi się tutaj (patrz #6).
        </p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {client.weightLogs.map((log) => (
            <li key={log.id}>
              {log.date ?? "brak daty"}: {log.weight} kg
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
