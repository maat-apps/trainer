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
import { type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/hooks/use-store";
import { saveClient, saveExercise } from "@/lib/storage";
import type { Set as ExerciseSet, Session, SessionExercise } from "@/types";

const STEP_TITLES = ["Data", "Ćwiczenia", "Serie i notatki"] as const;
const LAST_STEP = STEP_TITLES.length;

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
  const backTo = clientId ? `/clients/${clientId}` : "/";

  const [step, setStep] = useState(1);
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

  const title = existing ? "Edytuj sesję" : "Nowa sesja";

  function handleBack() {
    if (step > 1) {
      setStep((current) => current - 1);
    } else {
      navigate(backTo);
    }
  }

  if (!client) {
    return (
      <div className="mx-auto min-h-dvh w-[min(100%,480px)] px-4 pt-27 pb-4">
        <AppBar
          title={title}
          backLabel="Wstecz"
          onBack={() => navigate(backTo)}
        />
        <p className="text-muted-foreground">Nie znaleziono klienta.</p>
      </div>
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
      iconName: null,
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
    <div className="mx-auto min-h-dvh w-[min(100%,480px)] px-4 pt-27 pb-4">
      <AppBar title={title} backLabel="Wstecz" onBack={handleBack} />
      <p className="text-muted-foreground mb-4 text-sm">
        Krok {step} z {LAST_STEP}: {STEP_TITLES[step - 1]}
      </p>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            Data (opcjonalnie)
            <Input
              type="date"
              value={date ?? ""}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <Button type="button" onClick={() => setStep(2)}>
            Dalej
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          {sessionExercises.length > 0 && (
            <ul className="flex flex-col gap-2">
              {sessionExercises.map((se) => (
                <li
                  key={se.exerciseId}
                  className="border-muted-foreground/40 flex items-center justify-between rounded border p-3"
                >
                  {exerciseFor(se.exerciseId)?.name ?? "Usunięte ćwiczenie"}
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={() => removeExerciseFromSession(se.exerciseId)}
                  >
                    Usuń
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <section className="border-muted-foreground/40 rounded border p-3">
            <h2 className="mb-2 font-medium">Dodaj ćwiczenie</h2>
            {availableExercises.length > 0 && (
              <div className="mb-2 flex gap-2">
                <Select
                  value={pickerExerciseId}
                  onValueChange={(value) => setPickerExerciseId(value ?? "")}
                >
                  <SelectTrigger
                    aria-label="Wybierz ćwiczenie"
                    className="flex-1"
                  >
                    <SelectValue placeholder="Wybierz ćwiczenie" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableExercises.map((exercise) => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addExerciseToSession(pickerExerciseId)}
                >
                  Dodaj
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                className="flex-1"
                placeholder="Nowe ćwiczenie"
                value={newExerciseName}
                onChange={(event) => setNewExerciseName(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCreateAndAddExercise}
              >
                Utwórz i dodaj
              </Button>
            </div>
          </section>

          <Button
            type="button"
            disabled={sessionExercises.length === 0}
            onClick={() => setStep(3)}
          >
            Dalej
          </Button>
        </div>
      )}

      {step === 3 && (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1">
            Notatki
            <Textarea
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
                  <h2 className="mb-2 font-medium">
                    {exercise?.name ?? "Usunięte ćwiczenie"}
                  </h2>

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
                      <Input
                        type="number"
                        step="0.5"
                        className="w-20"
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
                      <Input
                        type="number"
                        className="w-20"
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
                      <Input
                        type="number"
                        className="w-20"
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
                      <div className="flex flex-col text-xs">
                        <span>Strona</span>
                        <Select
                          value={input.side}
                          onValueChange={(value) =>
                            setSetInputs((current) => ({
                              ...current,
                              [se.exerciseId]: {
                                ...input,
                                side: value ?? "",
                              },
                            }))
                          }
                        >
                          <SelectTrigger aria-label="Strona" className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">—</SelectItem>
                            <SelectItem value="left">Lewa</SelectItem>
                            <SelectItem value="right">Prawa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSet(se.exerciseId)}
                    >
                      + Dodaj serię
                    </Button>
                  </div>
                </div>
              );
            })}
          </section>

          <Button type="submit">Zapisz sesję</Button>
        </form>
      )}
    </div>
  );
}
