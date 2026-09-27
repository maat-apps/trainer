import { AppBar } from "@maat-apps/ui/app-bar";
import { Button } from "@maat-apps/ui/button";
import { Input } from "@maat-apps/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@maat-apps/ui/select";
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  const navigate = useNavigate();
  const { clients, exercises } = useAppData();
  const client = clients.find((item) => item.id === clientId);
  const chartRef = useRef<HTMLDivElement>(null);
  const backTo = clientId ? `/clients/${clientId}` : "/";

  const loggedIds = client ? loggedExerciseIds(client.sessions) : [];
  const availableExercises = exercises.filter((exercise) =>
    loggedIds.includes(exercise.id),
  );
  const [exerciseId, setExerciseId] = useState(availableExercises[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  if (!client) {
    return (
      <div className="mx-auto min-h-dvh w-[min(100%,480px)] px-4 pt-27 pb-4">
        <AppBar
          title="Postępy"
          backLabel="Wstecz"
          onBack={() => navigate(backTo)}
        />
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
    startDate || null,
    endDate || null,
  );

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
      <AppBar
        title="Postępy"
        backLabel="Wstecz"
        onBack={() => navigate(backTo)}
      />

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
            <div className="flex gap-2">
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
                <YAxis />
                <Tooltip labelFormatter={formatLabel} />
                {selectedExercise?.isUnilateral ? (
                  <>
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="left"
                      name="Lewa"
                      stroke="#60a5fa"
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="right"
                      name="Prawa"
                      stroke="#f87171"
                      connectNulls
                    />
                  </>
                ) : (
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={selectedExercise?.name}
                    stroke="#ffffff"
                    connectNulls
                  />
                )}
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
    </div>
  );
}
