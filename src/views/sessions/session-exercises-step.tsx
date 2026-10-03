import { Button } from "@maat-apps/ui/button";
import { Input } from "@maat-apps/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@maat-apps/ui/select";
import { useState } from "react";

import type { Exercise, SessionExercise } from "@/types";

/** Step 2: pick the session's exercises from the library, or create one. */
export function SessionExercisesStep({
  sessionExercises,
  exercises,
  onAdd,
  onRemove,
  onCreate,
  onNext,
}: {
  sessionExercises: SessionExercise[];
  exercises: Exercise[];
  onAdd: (exerciseId: string) => void;
  onRemove: (exerciseId: string) => void;
  onCreate: (name: string) => void;
  onNext: () => void;
}) {
  const [pickerExerciseId, setPickerExerciseId] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");
  const usedIds = new Set(sessionExercises.map((se) => se.exerciseId));
  const availableExercises = exercises.filter(
    (exercise) => !usedIds.has(exercise.id),
  );

  function nameOf(exerciseId: string) {
    return (
      exercises.find((exercise) => exercise.id === exerciseId)?.name ??
      "Usunięte ćwiczenie"
    );
  }

  function addPicked() {
    if (!pickerExerciseId) return;
    onAdd(pickerExerciseId);
    setPickerExerciseId("");
  }

  function createAndAdd() {
    const name = newExerciseName.trim();
    if (name === "") return;
    onCreate(name);
    setNewExerciseName("");
  }

  return (
    <div className="flex flex-col gap-4">
      {sessionExercises.length > 0 && (
        <ul className="flex flex-col gap-2">
          {sessionExercises.map((se) => (
            <li
              key={se.exerciseId}
              className="border-muted-foreground/40 flex items-center justify-between rounded-lg border p-3"
            >
              {nameOf(se.exerciseId)}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-sm"
                onClick={() => onRemove(se.exerciseId)}
              >
                Usuń
              </Button>
            </li>
          ))}
        </ul>
      )}

      <section className="border-muted-foreground/40 rounded-lg border p-3">
        <h2 className="mb-2 font-medium">Dodaj ćwiczenie</h2>
        {availableExercises.length > 0 && (
          <div className="mb-2 flex gap-2">
            <Select
              value={pickerExerciseId}
              onValueChange={(value) => setPickerExerciseId(value ?? "")}
            >
              <SelectTrigger aria-label="Wybierz ćwiczenie" className="flex-1">
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
            <Button type="button" variant="outline" onClick={addPicked}>
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
          <Button type="button" variant="outline" onClick={createAndAdd}>
            Utwórz i dodaj
          </Button>
        </div>
      </section>

      <Button
        type="button"
        disabled={sessionExercises.length === 0}
        onClick={onNext}
      >
        Dalej
      </Button>
    </div>
  );
}
