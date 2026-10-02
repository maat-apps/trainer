import { AppBar } from "@maat-apps/ui/app-bar";
import { Button } from "@maat-apps/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@maat-apps/ui/chart";
import {
  DateRangePickerInput,
  type DateRangeValue,
} from "@maat-apps/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@maat-apps/ui/select";
import { useSmartBack } from "@maat-apps/ui/smart-back";
import { useRef, useState } from "react";
import { useParams } from "react-router";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { useAppData } from "@/hooks/use-store";
import { shareOrDownloadChart } from "@/lib/chart-export";
import {
  buildExerciseProgressSeries,
  filterByDateRange,
  loggedExerciseIds,
} from "@/lib/exercise-progress";

function formatTick(x: number): string {
  if (x < 0) return "";
  return new Date(x).toISOString().slice(0, 10);
}

function formatLabel(x: unknown): string {
  return typeof x === "number" ? formatTick(x) : "";
}

export function ClientProgressView() {
  const { clientId } = useParams();
  const { clients, exercises } = useAppData();
  const client = clients.find((item) => item.id === clientId);
  const chartRef = useRef<HTMLDivElement>(null);
  const back = useSmartBack(clientId ? `/clients/${clientId}` : "/");

  const loggedIds = client ? loggedExerciseIds(client.sessions) : [];
  const availableExercises = exercises.filter((exercise) =>
    loggedIds.includes(exercise.id),
  );
  const [exerciseId, setExerciseId] = useState(availableExercises[0]?.id ?? "");
  const [dateRange, setDateRange] = useState<DateRangeValue | undefined>();
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  if (!client) {
    return (
      <div className="mx-auto min-h-dvh w-[min(100%,480px)] px-4 pt-27 pb-4">
        <AppBar title="Postępy" backLabel="Wstecz" onBack={back} />
        <p className="text-muted-foreground">Nie znaleziono klienta.</p>
      </div>
    );
  }

  const selectedExercise = exercises.find((item) => item.id === exerciseId);
  const rawPoints = exerciseId
    ? buildExerciseProgressSeries(
        client.sessions,
        exerciseId,
        selectedExercise?.isUnilateral ?? false,
      )
    : [];
  const points = filterByDateRange(
    rawPoints,
    dateRange?.from?.toISOString() ?? null,
    dateRange?.to?.toISOString() ?? null,
  );

  const chartConfig: ChartConfig = selectedExercise?.isUnilateral
    ? {
        left: { label: "Lewa", color: "#60a5fa" },
        right: { label: "Prawa", color: "#f87171" },
      }
    : { value: { label: selectedExercise?.name ?? "", color: "#ffffff" } };

  const handleShare = async () => {
    if (!chartRef.current) return;
    const result = await shareOrDownloadChart(
      chartRef.current,
      `postepy-${client.firstName}-${selectedExercise?.name ?? ""}.png`,
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
      <AppBar title="Postępy" backLabel="Wstecz" onBack={back} />

      {availableExercises.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Ten klient nie ma jeszcze zarejestrowanych ćwiczeń.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-sm">
              <span>Ćwiczenie</span>
              <Select
                value={exerciseId}
                onValueChange={(value) => setExerciseId(value ?? "")}
              >
                <SelectTrigger aria-label="Ćwiczenie">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableExercises.map((exercise) => (
                    <SelectItem key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={formatTick}
                />
                <YAxis />
                <ChartTooltip
                  content={<ChartTooltipContent labelFormatter={formatLabel} />}
                />
                {selectedExercise?.isUnilateral ? (
                  <>
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="left"
                      name="Lewa"
                      stroke="var(--color-left)"
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="right"
                      name="Prawa"
                      stroke="var(--color-right)"
                      connectNulls
                    />
                  </>
                ) : (
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={selectedExercise?.name}
                    stroke="var(--color-value)"
                    connectNulls
                  />
                )}
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
