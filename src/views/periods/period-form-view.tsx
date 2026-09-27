import { AppBar } from "@maat-apps/ui/app-bar";
import { Button } from "@maat-apps/ui/button";
import { DatePickerInput } from "@maat-apps/ui/date-picker";
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

function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODateString(value: string): Date | undefined {
  return value ? new Date(`${value}T00:00:00`) : undefined;
}

export function PeriodFormView() {
  const { clientId, periodId } = useParams();
  const navigate = useNavigate();
  const { clients } = useAppData();
  const client = clients.find((item) => item.id === clientId);
  const existing = client?.periods.find((item) => item.id === periodId);
  const backTo = clientId ? `/clients/${clientId}` : "/";

  const [type, setType] = useState<Period["type"]>(existing?.type ?? "mass");
  const [label, setLabel] = useState(existing?.label ?? "");
  const [startDate, setStartDate] = useState(existing?.startDate ?? "");
  const [endDate, setEndDate] = useState(existing?.endDate ?? "");

  if (!client) {
    return (
      <div className="mx-auto min-h-dvh w-[min(100%,480px)] px-4 pt-27 pb-4">
        <AppBar
          title={existing ? "Edytuj okres" : "Nowy okres"}
          backLabel="Wstecz"
          onBack={() => navigate(backTo)}
        />
        <p className="text-muted-foreground">Nie znaleziono klienta.</p>
      </div>
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
    <div className="mx-auto min-h-dvh w-[min(100%,480px)] px-4 pt-27 pb-4">
      <AppBar
        title={existing ? "Edytuj okres" : "Nowy okres"}
        backLabel="Wstecz"
        onBack={() => navigate(backTo)}
      />
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
        <DatePickerInput
          label="Data rozpoczęcia"
          value={parseISODateString(startDate)}
          onValueChange={(nextDate) =>
            setStartDate(nextDate ? toISODateString(nextDate) : "")
          }
        />
        <DatePickerInput
          label="Data zakończenia"
          value={parseISODateString(endDate)}
          onValueChange={(nextDate) =>
            setEndDate(nextDate ? toISODateString(nextDate) : "")
          }
        />
        <div className="mt-2 flex gap-2">
          <Button type="submit">Zapisz</Button>
          {existing && (
            <Button type="button" variant="outline" onClick={handleDelete}>
              Usuń
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
