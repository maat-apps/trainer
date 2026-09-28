import { AppBar } from "@maat-apps/ui/app-bar";
import { Button } from "@maat-apps/ui/button";
import { DatePickerInput } from "@maat-apps/ui/date-picker";
import { type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useAppData } from "@/hooks/use-store";
import {
  addSessionExercise,
  addSetToExercise,
  EMPTY_SET_INPUT,
  removeSessionExercise,
  type SetInput,
  toISODateString,
} from "@/lib/session-draft";
import { saveClient, saveExercise } from "@/lib/storage";
import type { Session, SessionExercise } from "@/types";
import { ExerciseSetsCard } from "@/views/sessions/exercise-sets-card";
import { SessionExercisesStep } from "@/views/sessions/session-exercises-step";
import { Textarea } from "@maat-apps/ui/textarea";

const STEP_TITLES = ["Data", "Ćwiczenia", "Serie i notatki"] as const;
const LAST_STEP = STEP_TITLES.length;

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
  // Kept here, not in each card, so half-typed inputs survive going back a step.
  const [setInputs, setSetInputs] = useState<Record<string, SetInput>>({});

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

  function exerciseFor(exerciseId: string) {
    return exercises.find((exercise) => exercise.id === exerciseId);
  }

  function addExercise(exerciseId: string) {
    setSessionExercises((current) => addSessionExercise(current, exerciseId));
  }

  function createAndAddExercise(name: string) {
    const newExercise = {
      id: crypto.randomUUID(),
      name,
      categoryId: null,
      isUnilateral: false,
      iconName: null,
    };
    saveExercise(newExercise);
    addExercise(newExercise.id);
  }

  function removeExercise(exerciseId: string) {
    setSessionExercises((current) =>
      removeSessionExercise(current, exerciseId),
    );
  }

  function updateSetInput(
    exerciseId: string,
    field: keyof SetInput,
    value: string,
  ) {
    setSetInputs((current) => ({
      ...current,
      [exerciseId]: {
        ...(current[exerciseId] ?? EMPTY_SET_INPUT),
        [field]: value,
      },
    }));
  }

  function addSet(exerciseId: string) {
    const input = setInputs[exerciseId] ?? EMPTY_SET_INPUT;
    const isUnilateral = exerciseFor(exerciseId)?.isUnilateral ?? false;
    setSessionExercises((current) =>
      addSetToExercise(current, exerciseId, input, isUnilateral),
    );
    setSetInputs((current) => ({ ...current, [exerciseId]: EMPTY_SET_INPUT }));
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
          <DatePickerInput
            label="Data (opcjonalnie)"
            value={date ? new Date(`${date}T00:00:00`) : undefined}
            onValueChange={(nextDate) =>
              setDate(nextDate ? toISODateString(nextDate) : "")
            }
          />
          <Button type="button" onClick={() => setStep(2)}>
            Dalej
          </Button>
        </div>
      )}

      {step === 2 && (
        <SessionExercisesStep
          sessionExercises={sessionExercises}
          exercises={exercises}
          onAdd={addExercise}
          onRemove={removeExercise}
          onCreate={createAndAddExercise}
          onNext={() => setStep(3)}
        />
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
            {sessionExercises.map((se) => (
              <ExerciseSetsCard
                key={se.exerciseId}
                sessionExercise={se}
                exercise={exerciseFor(se.exerciseId)}
                input={setInputs[se.exerciseId] ?? EMPTY_SET_INPUT}
                onInputChange={(field, value) =>
                  updateSetInput(se.exerciseId, field, value)
                }
                onAddSet={() => addSet(se.exerciseId)}
              />
            ))}
          </section>

          <Button type="submit">Zapisz sesję</Button>
        </form>
      )}
    </div>
  );
}
