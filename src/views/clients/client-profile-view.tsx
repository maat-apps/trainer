import { type FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { useAppData } from "@/hooks/use-store";
import { deleteClient, saveClient } from "@/lib/storage";

export function ClientProfileView() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients } = useAppData();
  const client = clients.find((item) => item.id === clientId);
  const [weightInput, setWeightInput] = useState("");

  if (!client) {
    return (
      <main className="mx-auto max-w-md p-4">
        <p className="text-muted-foreground">Nie znaleziono klienta.</p>
      </main>
    );
  }

  const handleDelete = () => {
    deleteClient(client.id);
    navigate("/");
  };

  const handleLogWeight = (event: FormEvent) => {
    event.preventDefault();
    const weight = Number(weightInput);
    if (!Number.isFinite(weight) || weight <= 0) return;
    saveClient({
      ...client,
      weightLogs: [
        ...client.weightLogs,
        {
          id: crypto.randomUUID(),
          weight,
          date: new Date().toISOString().slice(0, 10),
          importOrder: null,
        },
      ],
    });
    setWeightInput("");
  };

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl">
            {client.firstName}
            {client.lastName ? ` ${client.lastName}` : ""}
          </h1>
          {client.goal && (
            <p className="text-muted-foreground">{client.goal}</p>
          )}
        </div>
        <div className="flex gap-3 text-sm">
          <Link to={`/clients/${client.id}/edit`} className="underline">
            Edytuj
          </Link>
          <button onClick={handleDelete} className="underline">
            Usuń
          </button>
        </div>
      </div>

      <section className="mb-4">
        <h2 className="mb-1 font-medium">Sesje treningowe</h2>
        {client.sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Brak zarejestrowanych sesji.
          </p>
        ) : (
          <p className="text-sm">{client.sessions.length} sesji</p>
        )}
      </section>

      <section className="mb-4">
        <h2 className="mb-1 font-medium">Postępy</h2>
        <Link to={`/clients/${client.id}/progress`} className="underline">
          Zobacz wykres postępów
        </Link>
      </section>

      <section className="mb-4">
        <h2 className="mb-1 font-medium">Waga</h2>
        <Link
          to={`/clients/${client.id}/weight`}
          className="mb-2 block underline"
        >
          Zobacz wykres wagi
        </Link>
        <form className="flex gap-2" onSubmit={handleLogWeight}>
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="kg"
            className="border-muted-foreground/40 w-24 rounded border bg-transparent p-2"
            value={weightInput}
            onChange={(event) => setWeightInput(event.target.value)}
          />
          <button
            type="submit"
            className="border-muted-foreground/40 rounded border p-2"
          >
            Zapisz wagę
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-1 font-medium">Okresy</h2>
        {client.periods.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Brak zdefiniowanych okresów.
          </p>
        ) : (
          <p className="text-sm">{client.periods.length} okresów</p>
        )}
      </section>
    </main>
  );
}
