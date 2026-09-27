import { Button } from "@maat-apps/ui/button";
import { Input } from "@maat-apps/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@maat-apps/ui/select";
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
        <div className="flex flex-col gap-1">
          <span>Typ</span>
          <Select
            value={type}
            onValueChange={(value) => setType(value as Period["type"])}
          >
            <SelectTrigger aria-label="Typ">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mass">Masa</SelectItem>
              <SelectItem value="cut">Redukcja</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex flex-col gap-1">
          Etykieta (opcjonalnie)
          <Input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Data rozpoczęcia
          <Input
            type="date"
            value={startDate ?? ""}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Data zakończenia
          <Input
            type="date"
            value={endDate ?? ""}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <div className="mt-2 flex gap-2">
          <Button type="submit">Zapisz</Button>
          {existing && (
            <Button type="button" variant="outline" onClick={handleDelete}>
              Usuń
            </Button>
          )}
        </div>
      </form>
    </main>
  );
}
