import { Button } from "@maat-apps/ui/button";
import { Input } from "@maat-apps/ui/input";
import { type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Textarea } from "@/components/ui/textarea";
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
          <Input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          Nazwisko
          <Input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Cel
          <Input
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Notatki
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <Button type="submit" className="mt-2">
          Zapisz
        </Button>
      </form>
    </main>
  );
}
