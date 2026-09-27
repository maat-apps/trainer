import { Button } from "@maat-apps/ui/button";
import { Input } from "@maat-apps/ui/input";
import { useRef, useState } from "react";
import { useParams } from "react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAppData } from "@/hooks/use-store";
import { shareOrDownloadChart } from "@/lib/chart-export";
import {
  buildPeriodBands,
  buildWeightSeries,
  filterByDateRange,
} from "@/lib/weight-chart";

function formatTick(x: number): string {
  if (x < 0) return "";
  return new Date(x).toISOString().slice(0, 10);
}

function formatLabel(x: unknown): string {
  return typeof x === "number" ? formatTick(x) : "";
}

export function ClientWeightView() {
  const { clientId } = useParams();
  const { clients } = useAppData();
  const client = clients.find((item) => item.id === clientId);
  const chartRef = useRef<HTMLDivElement>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  if (!client) {
    return (
      <main className="mx-auto max-w-md p-4">
        <p className="text-muted-foreground">Nie znaleziono klienta.</p>
      </main>
    );
  }

  const rawPoints = buildWeightSeries(client.weightLogs);
  const points = filterByDateRange(
    rawPoints,
    startDate || null,
    endDate || null,
  );
  const bands = buildPeriodBands(client.periods);

  const handleShare = async () => {
    if (!chartRef.current) return;
    const result = await shareOrDownloadChart(
      chartRef.current,
      `waga-${client.firstName}.png`,
    );
    setShareStatus(
      result === "shared"
        ? "Udostępniono."
        : result === "downloaded"
          ? "Pobrano obraz."
          : null,
    );
  };

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-xl">Waga</h1>

      {rawPoints.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Brak zapisanych wag. Dodaj pierwszy pomiar na profilu klienta.
        </p>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Od
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Do
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>

          <div ref={chartRef} className="bg-background h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={formatTick}
                />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip labelFormatter={formatLabel} />
                {bands.map((band) => (
                  <ReferenceArea
                    key={band.id}
                    x1={band.x1}
                    x2={band.x2}
                    fill={band.type === "mass" ? "#4ade80" : "#f87171"}
                    fillOpacity={0.15}
                    ifOverflow="extendDomain"
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Waga"
                  stroke="#ffffff"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => void handleShare()}
          >
            Eksportuj i udostępnij
          </Button>
          {shareStatus && (
            <p role="status" className="mt-2 text-sm">
              {shareStatus}
            </p>
          )}
        </>
      )}
    </main>
  );
}
