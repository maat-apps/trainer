import { useParams } from "react-router";

// Chart rendering (recharts, left/right lines for unilateral exercises,
// date-range filter, export/share) is trainer#6 — this view only wires the
// route up so navigation from the client profile works end to end.
export function ClientProgressView() {
  const { clientId } = useParams();
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-2 text-xl">Postępy</h1>
      <p className="text-muted-foreground text-sm">
        Wykres postępów dla klienta {clientId} pojawi się tutaj (patrz #6).
      </p>
    </main>
  );
}
