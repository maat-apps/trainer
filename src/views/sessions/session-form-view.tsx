import { type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useAppData } from "@/hooks/use-store";
import { saveClient, saveExercise } from "@/lib/storage";
import type { Set as ExerciseSet, Session, SessionExercise } from "@/types";

function emptySet(setNumber: number): ExerciseSet {
  return {
    setNumber,
    weight: null,
    reps: null,
    durationSeconds: null,
    side: null,
    rpe: null,
  };
}

export function SessionFormView() {
  const { clientId, sessionId } = useParams();
  const navigate = useNavigate();
  const { clients, exercises } = useAppData();
  const client = clients.find((item) => item.id === clientId);
  const existing = client?.sessions.find((item) => item.id === sessionId);

  const [date, setDate] = useState(existing?.date ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>(
    existing?.exercises ?? [],
  );
  const [pickerExerciseId, setPickerExerciseId] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");
  const [setInputs, setSetInputs] = useState<
    Record<
      string,
      { weight: string; reps: string; duration: string; side: string }
    >
  >({});

  if (!client) {
    return (
      <main className="mx-auto max-w-md p-4">
        <p className="text-muted-foreground">Nie znaleziono klienta.</p>
      </main>
    );
  }

  const usedExerciseIds = new Set(sessionExercises.map((se) => se.exerciseId));
  const availableExercises = exercises.filter(
    (exercise) => !usedExerciseIds.has(exercise.id),
  );

  function exerciseFor(exerciseId: string) {
    return exercises.find((exercise) => exercise.id === exerciseId);
  }

  function addExerciseToSession(exerciseId: string) {
    if (!exerciseId || usedExerciseIds.has(exerciseId)) return;
    setSessionExercises((current) => [
      ...current,
      { exerciseId, orderIndex: current.length, sets: [] },
    ]);
    setPickerExerciseId("");
  }

  function handleCreateAndAddExercise() {
    const trimmed = newExerciseName.trim();
    if (trimmed === "") return;
    const newExercise = {
      id: crypto.randomUUID(),
      name: trimmed,
      categoryId: null,
      isUnilateral: false,
    };
    saveExercise(newExercise);
    addExerciseToSession(newExercise.id);
    setNewExerciseName("");
  }

  function removeExerciseFromSession(exerciseId: string) {
    setSessionExercises((current) =>
      current
        .filter((se) => se.exerciseId !== exerciseId)
        .map((se, index) => ({ ...se, orderIndex: index })),
    );
  }

  function addSet(exerciseId: string) {
    const input = setInputs[exerciseId];
    const isUnilateral = exerciseFor(exerciseId)?.isUnilateral ?? false;
    setSessionExercises((current) =>
      current.map((se) => {
        if (se.exerciseId !== exerciseId) return se;
        const set = emptySet(se.sets.length + 1);
        set.weight = input?.weight ? Number(input.weight) : null;
        set.reps = input?.reps ? Number(input.reps) : null;
        set.durationSeconds = input?.duration ? Number(input.duration) : null;
        set.side = isUnilateral
          ? ((input?.side as "left" | "right" | undefined) ?? null)
          : null;
        return { ...se, sets: [...se.sets, set] };
      }),
    );
    setSetInputs((current) => ({
      ...current,
      [exerciseId]: { weight: "", reps: "", duration: "", side: "" },
    }));
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const session: Session = {
      id: existing?.id ?? crypto.randomUUID(),
      date: date || null,
      importOrder: existing?.importOrder ?? null,
      notes: notes || null,
      exercises: sessionExercises,
    };
    const sessions = existing
      ? client.sessions.map((item) => (item.id === session.id ? session : item))
      : [...client.sessions, session];
    saveClient({ ...client, sessions });
    navigate(`/clients/${client.id}`);
  };

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-xl">
        {existing ? "Edytuj sesję" : "Nowa sesja"}
      </h1>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          Data (opcjonalnie)
          <input
            type="date"
            className="border-muted-foreground/40 rounded border bg-transparent p-2"
            value={date ?? ""}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Notatki
          <textarea
            className="border-muted-foreground/40 rounded border bg-transparent p-2"
            value={notes ?? ""}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>

        <section className="flex flex-col gap-4">
          {sessionExercises.map((se) => {
            const exercise = exerciseFor(se.exerciseId);
            const input = setInputs[se.exerciseId] ?? {
              weight: "",
              reps: "",
              duration: "",
              side: "",
            };
            return (
              <div
                key={se.exerciseId}
                className="border-muted-foreground/40 rounded border p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-medium">
                    {exercise?.name ?? "Usunięte ćwiczenie"}
                  </h2>
                  <button
                    type="button"
                    className="text-sm underline"
                    onClick={() => removeExerciseFromSession(se.exerciseId)}
                  >
                    Usuń
                  </button>
                </div>

                {se.sets.length > 0 && (
                  <ul className="mb-2 flex flex-col gap-1 text-sm">
                    {se.sets.map((set) => (
                      <li key={set.setNumber}>
                        Seria {set.setNumber}:{" "}
                        {set.weight !== null && `${set.weight} kg `}
                        {set.reps !== null && `× ${set.reps} `}
                        {set.durationSeconds !== null &&
                          `${set.durationSeconds} s `}
                        {set.side &&
                          `(${set.side === "left" ? "lewa" : "prawa"})`}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap items-end gap-2">
                  <label className="flex flex-col text-xs">
                    Waga (kg)
                    <input
                      type="number"
                      step="0.5"
                      className="border-muted-foreground/40 w-20 rounded border bg-transparent p-1"
                      value={input.weight}
                      onChange={(event) =>
                        setSetInputs((current) => ({
                          ...current,
                          [se.exerciseId]: {
                            ...input,
                            weight: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                  <label className="flex flex-col text-xs">
                    Powtórzenia
                    <input
                      type="number"
                      className="border-muted-foreground/40 w-20 rounded border bg-transparent p-1"
                      value={input.reps}
                      onChange={(event) =>
                        setSetInputs((current) => ({
                          ...current,
                          [se.exerciseId]: {
                            ...input,
                            reps: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                  <label className="flex flex-col text-xs">
                    Czas (s)
                    <input
                      type="number"
                      className="border-muted-foreground/40 w-20 rounded border bg-transparent p-1"
                      value={input.duration}
                      onChange={(event) =>
                        setSetInputs((current) => ({
                          ...current,
                          [se.exerciseId]: {
                            ...input,
                            duration: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                  {exercise?.isUnilateral && (
                    <label className="flex flex-col text-xs">
                      Strona
                      <select
                        className="border-muted-foreground/40 rounded border bg-transparent p-1"
                        value={input.side}
                        onChange={(event) =>
                          setSetInputs((current) => ({
                            ...current,
                            [se.exerciseId]: {
                              ...input,
                              side: event.target.value,
                            },
                          }))
                        }
                      >
                        <option value="">—</option>
                        <option value="left">Lewa</option>
                        <option value="right">Prawa</option>
                      </select>
                    </label>
                  )}
                  <button
                    type="button"
                    className="border-muted-foreground/40 rounded border p-1 text-sm"
                    onClick={() => addSet(se.exerciseId)}
                  >
                    + Dodaj serię
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        <section className="border-muted-foreground/40 rounded border p-3">
          <h2 className="mb-2 font-medium">Dodaj ćwiczenie</h2>
          {availableExercises.length > 0 && (
            <div className="mb-2 flex gap-2">
              <select
                className="border-muted-foreground/40 flex-1 rounded border bg-transparent p-2"
                value={pickerExerciseId}
                onChange={(event) => setPickerExerciseId(event.target.value)}
              >
                <option value="">Wybierz ćwiczenie</option>
                {availableExercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="border-muted-foreground/40 rounded border p-2"
                onClick={() => addExerciseToSession(pickerExerciseId)}
              >
                Dodaj
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              className="border-muted-foreground/40 flex-1 rounded border bg-transparent p-2"
              placeholder="Nowe ćwiczenie"
              value={newExerciseName}
              onChange={(event) => setNewExerciseName(event.target.value)}
            />
            <button
              type="button"
              className="border-muted-foreground/40 rounded border p-2"
              onClick={handleCreateAndAddExercise}
            >
              Utwórz i dodaj
            </button>
          </div>
        </section>

        <button
          type="submit"
          className="border-muted-foreground/40 rounded border p-2"
        >
          Zapisz sesję
        </button>
      </form>
    </main>
  );
}
