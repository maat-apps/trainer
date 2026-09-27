import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@maat-apps/ui/select";
import { CaretRight, Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { useAppData } from "@/hooks/use-store";
import { exerciseIcon } from "@/lib/exercise-icons";
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
        <section className="grid grid-cols-[minmax(0,1fr)] gap-2.5">
          {visibleExercises.map((exercise) => {
            const Icon = exerciseIcon(exercise.iconName);
            const category = categoryName(exercise.categoryId);
            return (
              <button
                key={exercise.id}
                type="button"
                className="bg-card text-card-foreground active:bg-muted [&>svg]:text-muted-foreground flex min-h-18 w-full items-center gap-3.5 rounded-lg border-0 py-3.5 pr-4 pl-4 text-left transition-colors"
                onClick={() => navigate(`/exercises/${exercise.id}/edit`)}
              >
                <Icon className="size-6 flex-none" aria-hidden="true" />
                <span className="grid min-w-0 flex-1 gap-1.5">
                  <strong className="font-heading overflow-hidden text-lg font-semibold text-ellipsis whitespace-nowrap">
                    {exercise.name}
                  </strong>
                  {(category || exercise.isUnilateral) && (
                    <span className="text-muted-foreground text-sm">
                      {[category, exercise.isUnilateral ? "jednostronne" : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </span>
                <CaretRight aria-hidden="true" />
              </button>
            );
          })}
        </section>
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
