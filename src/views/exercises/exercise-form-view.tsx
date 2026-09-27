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

import { useAppData } from "@/hooks/use-store";
import { deleteExercise, saveCategory, saveExercise } from "@/lib/storage";

const NEW_CATEGORY_VALUE = "__new__";

export function ExerciseFormView() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { categories, exercises } = useAppData();
  const existing = exercises.find((exercise) => exercise.id === exerciseId);

  const [name, setName] = useState(existing?.name ?? "");
  const [categoryId, setCategoryId] = useState<string>(
    existing?.categoryId ?? "",
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isUnilateral, setIsUnilateral] = useState(
    existing?.isUnilateral ?? false,
  );

  function handleCategoryChange(value: string | null) {
    const resolved = value ?? "";
    setCategoryId(resolved);
    if (resolved !== NEW_CATEGORY_VALUE) {
      setNewCategoryName("");
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    let resolvedCategoryId: string | null = categoryId || null;
    if (categoryId === NEW_CATEGORY_VALUE) {
      const trimmed = newCategoryName.trim();
      if (trimmed === "") return;
      resolvedCategoryId = crypto.randomUUID();
      saveCategory({ id: resolvedCategoryId, name: trimmed });
    }

    saveExercise({
      id: existing?.id ?? crypto.randomUUID(),
      name: name.trim(),
      categoryId: resolvedCategoryId,
      isUnilateral,
    });
    navigate("/exercises");
  }

  function handleDelete() {
    if (!existing) return;
    deleteExercise(existing.id);
    navigate("/exercises");
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-xl">
        {existing ? "Edytuj ćwiczenie" : "Nowe ćwiczenie"}
      </h1>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          Nazwa
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        <div className="flex flex-col gap-1">
          <span>Kategoria</span>
          <Select value={categoryId} onValueChange={handleCategoryChange}>
            <SelectTrigger aria-label="Kategoria">
              <SelectValue placeholder="Bez kategorii" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Bez kategorii</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
              <SelectItem value={NEW_CATEGORY_VALUE}>
                + Nowa kategoria
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {categoryId === NEW_CATEGORY_VALUE && (
          <label className="flex flex-col gap-1">
            Nazwa nowej kategorii
            <Input
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              required
            />
          </label>
        )}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isUnilateral}
            onChange={(event) => setIsUnilateral(event.target.checked)}
          />
          Ćwiczenie jednostronne
        </label>

        <div className="mt-2 flex gap-2">
          <Button type="submit">Zapisz</Button>
          {existing && (
            <Button type="button" variant="outline" onClick={handleDelete}>
              Usuń
            </Button>
          )}
        </div>
      </form>
    </main>
  );
}
