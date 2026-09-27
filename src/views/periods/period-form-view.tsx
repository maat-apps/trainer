import { type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useAppData } from "@/hooks/use-store";
import { saveClient } from "@/lib/storage";
import type { Period } from "@/types";

export function PeriodFormView() {
  const { clientId, periodId } = useParams();
  const navigate = useNavigate();
  const { clients } = useAppData();
  const client = clients.find((item) => item.id === clientId);
  const existing = client?.periods.find((item) => item.id === periodId);

  const [type, setType] = useState<Period["type"]>(existing?.type ?? "mass");
  const [label, setLabel] = useState(existing?.label ?? "");
  const [startDate, setStartDate] = useState(existing?.startDate ?? "");
  const [endDate, setEndDate] = useState(existing?.endDate ?? "");

  if (!client) {
    return (
      <main className="mx-auto max-w-md p-4">
        <p className="text-muted-foreground">Nie znaleziono klienta.</p>
      </main>
    );
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const period: Period = {
      id: existing?.id ?? crypto.randomUUID(),
      type,
      label: label.trim() === "" ? null : label.trim(),
      startDate: startDate || null,
      endDate: endDate || null,
    };
    const periods = existing
      ? client.periods.map((item) => (item.id === period.id ? period : item))
      : [...client.periods, period];
    saveClient({ ...client, periods });
    navigate(`/clients/${client.id}`);
  };

  const handleDelete = () => {
    if (!existing) return;
    saveClient({
      ...client,
      periods: client.periods.filter((item) => item.id !== existing.id),
    });
    navigate(`/clients/${client.id}`);
  };

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-xl">
        {existing ? "Edytuj okres" : "Nowy okres"}
      </h1>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          Typ
          <select
            className="border-muted-foreground/40 rounded border bg-transparent p-2"
            value={type}
            onChange={(event) => setType(event.target.value as Period["type"])}
          >
            <option value="mass">Masa</option>
            <option value="cut">Redukcja</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Etykieta (opcjonalnie)
          <input
            className="border-muted-foreground/40 rounded border bg-transparent p-2"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Data rozpoczęcia
          <input
            type="date"
            className="border-muted-foreground/40 rounded border bg-transparent p-2"
            value={startDate ?? ""}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Data zakończenia
          <input
            type="date"
            className="border-muted-foreground/40 rounded border bg-transparent p-2"
            value={endDate ?? ""}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <div className="mt-2 flex gap-2">
          <button
            type="submit"
            className="border-muted-foreground/40 rounded border p-2"
          >
            Zapisz
          </button>
          {existing && (
            <button
              type="button"
              onClick={handleDelete}
              className="border-muted-foreground/40 rounded border p-2"
            >
              Usuń
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
