import { expect, test } from "@playwright/test";

import { goHome } from "./utils";

test("client list renders with an empty state and nav links", async ({
  page,
}) => {
  await goHome(page);
  await expect(page.getByRole("heading", { name: "Klienci" })).toBeVisible();
  await expect(page.getByText("Brak klientów.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ćwiczenia" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ustawienia" })).toBeVisible();
});

test("adding a client navigates to their profile", async ({ page }) => {
  await goHome(page);
  await page.getByRole("button", { name: "Dodaj klienta" }).click();
  await page.getByLabel("Imię").fill("Jan");
  await page.getByRole("button", { name: "Zapisz" }).click();
  await expect(page.getByRole("heading", { name: "Jan" })).toBeVisible();
});
