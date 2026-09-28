import { Button } from "@maat-apps/ui/button";
import { Input } from "@maat-apps/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@maat-apps/ui/select";

import type { SetInput } from "@/lib/session-draft";
import type { Exercise, SessionExercise } from "@/types";

function SetNumberField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: string;
  step?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col text-xs">
      {label}
      <Input
        type="number"
        step={step}
        className="w-20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

/** One exercise in step 3: its recorded sets and the inputs to add another. */
export function ExerciseSetsCard({
  sessionExercise,
  exercise,
  input,
  onInputChange,
  onAddSet,
}: {
  sessionExercise: SessionExercise;
  exercise: Exercise | undefined;
  input: SetInput;
  onInputChange: (field: keyof SetInput, value: string) => void;
  onAddSet: () => void;
}) {
  return (
    <div className="border-muted-foreground/40 rounded border p-3">
      <h2 className="mb-2 font-medium">
        {exercise?.name ?? "Usunięte ćwiczenie"}
      </h2>

      {sessionExercise.sets.length > 0 && (
        <ul className="mb-2 flex flex-col gap-1 text-sm">
          {sessionExercise.sets.map((set) => (
            <li key={set.setNumber}>
              Seria {set.setNumber}:{" "}
              {set.weight !== null && `${set.weight} kg `}
              {set.reps !== null && `× ${set.reps} `}
              {set.durationSeconds !== null && `${set.durationSeconds} s `}
              {set.side && `(${set.side === "left" ? "lewa" : "prawa"})`}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <SetNumberField
          label="Waga (kg)"
          step="0.5"
          value={input.weight}
          onChange={(value) => onInputChange("weight", value)}
        />
        <SetNumberField
          label="Powtórzenia"
          value={input.reps}
          onChange={(value) => onInputChange("reps", value)}
        />
        <SetNumberField
          label="Czas (s)"
          value={input.duration}
          onChange={(value) => onInputChange("duration", value)}
        />
        {exercise?.isUnilateral && (
          <div className="flex flex-col text-xs">
            <span>Strona</span>
            <Select
              value={input.side}
              onValueChange={(value) => onInputChange("side", value ?? "")}
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
        <Button type="button" variant="outline" size="sm" onClick={onAddSet}>
          + Dodaj serię
        </Button>
      </div>
    </div>
  );
}
