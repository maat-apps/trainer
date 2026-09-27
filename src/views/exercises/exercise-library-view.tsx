import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@maat-apps/ui/select";
import { useState } from "react";
import { Link } from "react-router";

import { useAppData } from "@/hooks/use-store";

export function ExerciseLibraryView() {
  const { categories, exercises } = useAppData();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const visibleExercises =
    categoryFilter === "all"
      ? exercises
      : categoryFilter === "none"
        ? exercises.filter((exercise) => exercise.categoryId === null)
        : exercises.filter(
            (exercise) => exercise.categoryId === categoryFilter,
          );

  function categoryName(categoryId: string | null): string | null {
    if (categoryId === null) return null;
    return (
      categories.find((category) => category.id === categoryId)?.name ?? null
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl">Ćwiczenia</h1>
        <Link to="/exercises/new" className="underline">
          + Dodaj ćwiczenie
        </Link>
      </div>

      {categories.length > 0 && (
        <div className="mb-4 flex flex-col gap-1 text-sm">
          <span>Filtruj wg kategorii</span>
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value ?? "all")}
          >
            <SelectTrigger aria-label="Filtruj wg kategorii">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="none">Bez kategorii</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {visibleExercises.length === 0 ? (
        <p className="text-muted-foreground">Brak ćwiczeń.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibleExercises.map((exercise) => (
            <li key={exercise.id}>
              <Link to={`/exercises/${exercise.id}/edit`} className="underline">
                {exercise.name}
              </Link>
              {categoryName(exercise.categoryId) && (
                <span className="text-muted-foreground text-sm">
                  {" "}
                  ({categoryName(exercise.categoryId)})
                </span>
              )}
              {exercise.isUnilateral && (
                <span className="text-muted-foreground text-sm">
                  {" "}
                  · jednostronne
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
