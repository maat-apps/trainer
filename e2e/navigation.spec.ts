import { expect, test } from "@playwright/test";

import { goHome } from "./utils";

// "Wstecz" and saving a form step back through real history, so the
// browser's own Back (Android's back gesture) never lands on a screen the
// user already left.

test("saving a new client replaces the form, so Back returns to the list", async ({
  page,
}) => {
  await goHome(page);
  await page.getByRole("button", { name: "Dodaj klienta" }).first().click();
  await page.getByLabel("Imię").fill("Jan");
  await page.getByRole("button", { name: "Zapisz" }).click();
  await expect(page.getByRole("heading", { name: "Jan" })).toBeVisible();

  await page.goBack();

  await expect(page.getByRole("heading", { name: "Klienci" })).toBeVisible();
});

test("saving a period pops back to the profile, Wstecz back to the list", async ({
  page,
}) => {
  await goHome(page);
  await page.getByRole("button", { name: "Dodaj klienta" }).first().click();
  await page.getByLabel("Imię").fill("Ola");
  await page.getByRole("button", { name: "Zapisz" }).click();

  await page.getByRole("link", { name: "+ Nowy okres" }).click();
  await page.getByRole("combobox", { name: "Typ" }).click();
  await page.getByRole("option", { name: "Redukcja" }).click();
  await page.getByRole("button", { name: "Zapisz" }).click();
  await expect(page.getByRole("heading", { name: "Ola" })).toBeVisible();

  await page.getByRole("button", { name: "Wstecz" }).click();
  await expect(page.getByRole("heading", { name: "Klienci" })).toBeVisible();

  await page.goForward();
  await expect(page.getByRole("heading", { name: "Ola" })).toBeVisible();
});

test("Wstecz on a deep link goes to the parent screen", async ({ page }) => {
  await goHome(page);
  await page.getByRole("link", { name: "Ćwiczenia" }).click();
  await page.getByRole("button", { name: "Dodaj ćwiczenie" }).first().click();
  const formUrl = page.url();

  await page.goto(formUrl);
  await page.getByRole("button", { name: "Wstecz" }).click();

  await expect(page.getByRole("heading", { name: "Ćwiczenia" })).toBeVisible();
});
