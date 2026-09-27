import { useRef, useState } from "react";
import { useParams } from "react-router";
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
  const { clients, exercises } = useAppData();
  const client = clients.find((item) => item.id === clientId);
  const chartRef = useRef<HTMLDivElement>(null);

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
      <main className="mx-auto max-w-md p-4">
        <p className="text-muted-foreground">Nie znaleziono klienta.</p>
      </main>
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
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-xl">Postępy</h1>

      {availableExercises.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Ten klient nie ma jeszcze zarejestrowanych ćwiczeń.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Ćwiczenie
              <select
                className="border-muted-foreground/40 rounded border bg-transparent p-2"
                value={exerciseId}
                onChange={(event) => setExerciseId(event.target.value)}
              >
                {availableExercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-sm">
                Od
                <input
                  type="date"
                  className="border-muted-foreground/40 rounded border bg-transparent p-2"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-sm">
                Do
                <input
                  type="date"
                  className="border-muted-foreground/40 rounded border bg-transparent p-2"
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

          <button
            type="button"
            className="border-muted-foreground/40 mt-4 rounded border p-2"
            onClick={() => void handleShare()}
          >
            Eksportuj i udostępnij
          </button>
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
