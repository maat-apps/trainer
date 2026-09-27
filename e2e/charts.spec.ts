import { expect, test } from "@playwright/test";

import { goHome } from "./utils";

test("weight chart renders after logging a weight and shows a share button", async ({
  page,
}) => {
  await goHome(page);
  await page.getByRole("button", { name: "Dodaj klienta" }).first().click();
  await page.getByLabel("Imię").fill("Tomek");
  await page.getByRole("button", { name: "Zapisz" }).click();

  await page.getByLabel("Waga (kg)").fill("82");
  await page.getByRole("button", { name: "Zapisz wagę" }).click();

  await page.getByRole("link", { name: "Zobacz wykres wagi" }).click();
  await expect(page.locator("svg").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Eksportuj i udostępnij" }),
  ).toBeVisible();
});

test("progress chart renders for a logged exercise", async ({ page }) => {
  await goHome(page);
  await page.getByRole("button", { name: "Dodaj klienta" }).first().click();
  await page.getByLabel("Imię").fill("Kasia");
  await page.getByRole("button", { name: "Zapisz" }).click();

  await page.getByRole("link", { name: "+ Nowa sesja" }).click();
  await page.getByPlaceholder("Nowe ćwiczenie").fill("Martwy ciąg");
  await page.getByRole("button", { name: "Utwórz i dodaj" }).click();
  await page.getByLabel("Waga (kg)").fill("60");
  await page.getByRole("button", { name: "+ Dodaj serię" }).click();
  await page.getByRole("button", { name: "Zapisz sesję" }).click();

  await page.getByRole("link", { name: "Zobacz wykres postępów" }).click();
  await expect(page.getByRole("combobox", { name: "Ćwiczenie" })).toHaveText(
    /./,
  );
  await expect(page.locator("svg").first()).toBeVisible();
});
