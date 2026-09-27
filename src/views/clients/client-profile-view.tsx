import { AppBar } from "@maat-apps/ui/app-bar";
import { Button } from "@maat-apps/ui/button";
import { Input } from "@maat-apps/ui/input";
import { PencilSimple } from "@phosphor-icons/react";
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
      <div className="mx-auto min-h-dvh w-[min(100%,480px)] px-4 pt-27 pb-4">
        <AppBar
          title="Klient"
          backLabel="Wstecz"
          onBack={() => navigate("/")}
        />
        <p className="text-muted-foreground">Nie znaleziono klienta.</p>
      </div>
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
    <div className="mx-auto min-h-dvh w-[min(100%,480px)] px-4 pt-27 pb-4">
      <AppBar
        title={`${client.firstName}${client.lastName ? ` ${client.lastName}` : ""}`}
        backLabel="Wstecz"
        onBack={() => navigate("/")}
        action={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Edytuj klienta"
            onClick={() => navigate(`/clients/${client.id}/edit`)}
          >
            <PencilSimple className="size-6" />
          </Button>
        }
      />
      <div className="mb-4 flex items-start justify-between">
        {client.goal ? (
          <p className="text-muted-foreground">{client.goal}</p>
        ) : (
          <span />
        )}
        <Button variant="link" className="text-sm" onClick={handleDelete}>
          Usuń klienta
        </Button>
      </div>

      <section className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-medium">Sesje treningowe</h2>
          <Link
            to={`/clients/${client.id}/sessions/new`}
            className="text-sm underline"
          >
            + Nowa sesja
          </Link>
        </div>
        {client.sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Brak zarejestrowanych sesji.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {client.sessions.map((session) => (
              <li key={session.id}>
                <Link
                  to={`/clients/${client.id}/sessions/${session.id}`}
                  className="underline"
                >
                  {session.date ?? "brak daty"} ({session.exercises.length}{" "}
                  ćwiczeń)
                </Link>
              </li>
            ))}
          </ul>
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
          <label className="sr-only" htmlFor="weight-input">
            Waga (kg)
          </label>
          <Input
            id="weight-input"
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="kg"
            className="w-24"
            value={weightInput}
            onChange={(event) => setWeightInput(event.target.value)}
          />
          <Button type="submit">Zapisz wagę</Button>
        </form>
      </section>

      <section>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-medium">Okresy</h2>
          <Link
            to={`/clients/${client.id}/periods/new`}
            className="text-sm underline"
          >
            + Nowy okres
          </Link>
        </div>
        {client.periods.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Brak zdefiniowanych okresów.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {client.periods.map((period) => (
              <li key={period.id}>
                <Link
                  to={`/clients/${client.id}/periods/${period.id}`}
                  className="underline"
                >
                  {period.type === "mass" ? "Masa" : "Redukcja"}
                  {period.label && ` — ${period.label}`}
                  {period.startDate &&
                    ` (${period.startDate}${period.endDate ? ` – ${period.endDate}` : ""})`}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
