import { expect, test } from "@playwright/test";

import { goHome } from "./utils";

test("adding a period shows it on the client profile", async ({ page }) => {
  await goHome(page);

  await page.getByRole("button", { name: "Dodaj klienta" }).first().click();
  await page.getByLabel("Imię").fill("Ola");
  await page.getByRole("button", { name: "Zapisz" }).click();

  await page.getByRole("link", { name: "+ Nowy okres" }).click();
  await page.getByRole("combobox", { name: "Typ" }).click();
  await page.getByRole("option", { name: "Redukcja" }).click();
  await page.getByLabel("Etykieta (opcjonalnie)").fill("Lato 2026");
  await page.getByRole("button", { name: "Zapisz" }).click();

  await expect(page.getByText("Redukcja — Lato 2026")).toBeVisible();
});
