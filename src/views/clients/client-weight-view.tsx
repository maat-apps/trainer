import { AppBar } from "@maat-apps/ui/app-bar";
import { Button } from "@maat-apps/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@maat-apps/ui/chart";
import {
  DateRangePickerInput,
  type DateRangeValue,
} from "@maat-apps/ui/date-picker";
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
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

const weightChartConfig: ChartConfig = {
  weight: { label: "Waga", color: "#ffffff" },
};

function formatTick(x: number): string {
  if (x < 0) return "";
  return new Date(x).toISOString().slice(0, 10);
}

function formatLabel(x: unknown): string {
  return typeof x === "number" ? formatTick(x) : "";
}

export function ClientWeightView() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients } = useAppData();
  const client = clients.find((item) => item.id === clientId);
  const chartRef = useRef<HTMLDivElement>(null);
  const backTo = clientId ? `/clients/${clientId}` : "/";

  const [dateRange, setDateRange] = useState<DateRangeValue | undefined>();
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  if (!client) {
    return (
      <div className="mx-auto min-h-dvh w-[min(100%,480px)] px-4 pt-27 pb-4">
        <AppBar
          title="Waga"
          backLabel="Wstecz"
          onBack={() => navigate(backTo)}
        />
        <p className="text-muted-foreground">Nie znaleziono klienta.</p>
      </div>
    );
  }

  const rawPoints = buildWeightSeries(client.weightLogs);
  const points = filterByDateRange(
    rawPoints,
    dateRange?.from?.toISOString() ?? null,
    dateRange?.to?.toISOString() ?? null,
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
    <div className="mx-auto min-h-dvh w-[min(100%,480px)] px-4 pt-27 pb-4">
      <AppBar title="Waga" backLabel="Wstecz" onBack={() => navigate(backTo)} />

      {rawPoints.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Brak zapisanych wag. Dodaj pierwszy pomiar na profilu klienta.
        </p>
      ) : (
        <>
          <div className="mb-4">
            <DateRangePickerInput
              label="Zakres dat"
              startLabel="Od"
              endLabel="Do"
              numberOfMonths={1}
              value={dateRange}
              onValueChange={setDateRange}
            />
          </div>

          <div ref={chartRef} className="bg-background h-64 w-full">
            <ChartContainer
              config={weightChartConfig}
              className="h-full w-full"
            >
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={formatTick}
                />
                <YAxis domain={["auto", "auto"]} />
                <ChartTooltip
                  content={<ChartTooltipContent labelFormatter={formatLabel} />}
                />
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
                  stroke="var(--color-weight)"
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
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
    </div>
  );
}
