import { type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useAppData } from "@/hooks/use-store";
import { saveClient } from "@/lib/storage";

function nullableTrim(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function ClientFormView() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients } = useAppData();
  const existing = clients.find((client) => client.id === clientId);

  const [firstName, setFirstName] = useState(existing?.firstName ?? "");
  const [lastName, setLastName] = useState(existing?.lastName ?? "");
  const [goal, setGoal] = useState(existing?.goal ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const id = existing?.id ?? crypto.randomUUID();
    saveClient({
      id,
      firstName: firstName.trim(),
      lastName: nullableTrim(lastName),
      goal: nullableTrim(goal),
      notes: nullableTrim(notes),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      sessions: existing?.sessions ?? [],
      weightLogs: existing?.weightLogs ?? [],
      periods: existing?.periods ?? [],
    });
    navigate(`/clients/${id}`);
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-xl">
        {existing ? "Edytuj klienta" : "Nowy klient"}
      </h1>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          Imię
          <input
            className="border-muted-foreground/40 rounded border bg-transparent p-2"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          Nazwisko
          <input
            className="border-muted-foreground/40 rounded border bg-transparent p-2"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Cel
          <input
            className="border-muted-foreground/40 rounded border bg-transparent p-2"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Notatki
          <textarea
            className="border-muted-foreground/40 rounded border bg-transparent p-2"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <button
          type="submit"
          className="border-muted-foreground/40 mt-2 rounded border p-2"
        >
          Zapisz
        </button>
      </form>
    </main>
  );
}
