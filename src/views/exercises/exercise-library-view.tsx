import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@maat-apps/ui/select";
import { Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { useAppData } from "@/hooks/use-store";
import { EmptyState } from "@maat-apps/ui/empty-state";
import { FabButton } from "@maat-apps/ui/fab-button";
import { PageHeader } from "@maat-apps/ui/page-header";

export function ExerciseLibraryView() {
  const navigate = useNavigate();
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
    <div className="mx-auto min-h-dvh w-[min(100%,480px)] px-4 pt-27 pb-4">
      <PageHeader>
        <h1 className="font-heading text-xl font-semibold">Ćwiczenia</h1>
      </PageHeader>

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
        exercises.length === 0 ? (
          <EmptyState
            title="Brak ćwiczeń"
            description="Dodaj pierwsze ćwiczenie, żeby zacząć budować bibliotekę."
            action={{
              label: (
                <>
                  <Plus /> Dodaj ćwiczenie
                </>
              ),
              onClick: () => navigate("/exercises/new"),
            }}
          />
        ) : (
          <p className="text-muted-foreground">Brak ćwiczeń w tej kategorii.</p>
        )
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
      <FabButton
        className="fixed right-[max(20px,calc((100vw-480px)/2+20px))] bottom-[calc(84px+env(safe-area-inset-bottom))] z-20"
        ariaLabel="Dodaj ćwiczenie"
        onClick={() => navigate("/exercises/new")}
      >
        <Plus className="size-6" />
      </FabButton>
    </div>
  );
}
