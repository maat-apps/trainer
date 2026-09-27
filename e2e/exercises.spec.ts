import { expect, test } from "@playwright/test";

import { goHome } from "./utils";

test("adding an exercise with a new category shows it in the library", async ({
  page,
}) => {
  await goHome(page);
  await page.getByRole("link", { name: "Ćwiczenia" }).click();
  await expect(page.getByText("Brak ćwiczeń.")).toBeVisible();

  await page.getByRole("link", { name: "+ Dodaj ćwiczenie" }).click();
  await page.getByLabel("Nazwa").fill("Przysiad");
  await page
    .getByLabel("Kategoria")
    .selectOption({ label: "+ Nowa kategoria" });
  await page.getByLabel("Nazwa nowej kategorii").fill("Nogi");
  await page.getByLabel("Ćwiczenie jednostronne").check();
  await page.getByRole("button", { name: "Zapisz" }).click();

  await expect(page.getByRole("link", { name: "Przysiad" })).toBeVisible();
  await expect(page.getByText("(Nogi)")).toBeVisible();
  await expect(page.getByText("jednostronne")).toBeVisible();
});
