import { expect, test } from "@playwright/test";

import { goHome } from "./utils";

test("logging a session with a set shows it on the client profile", async ({
  page,
}) => {
  await goHome(page);

  // Create a client.
  await page.getByRole("button", { name: "Dodaj klienta" }).first().click();
  await page.getByLabel("Imię").fill("Anna");
  await page.getByRole("button", { name: "Zapisz" }).click();

  // Log a new session with an inline-created exercise and one set.
  await page.getByRole("link", { name: "+ Nowa sesja" }).click();
  await page.getByPlaceholder("Nowe ćwiczenie").fill("Wykrok");
  await page.getByRole("button", { name: "Utwórz i dodaj" }).click();
  await expect(page.getByRole("heading", { name: "Wykrok" })).toBeVisible();

  await page.getByLabel("Waga (kg)").fill("40");
  await page.getByLabel("Powtórzenia").fill("10");
  await page.getByRole("button", { name: "+ Dodaj serię" }).click();
  await expect(page.getByText("Seria 1: 40 kg × 10")).toBeVisible();

  await page.getByRole("button", { name: "Zapisz sesję" }).click();
  await expect(page.getByText("ćwiczeń")).toBeVisible();
});
