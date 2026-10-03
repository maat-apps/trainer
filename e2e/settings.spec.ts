import { expect, test } from "@playwright/test";

import { goHome } from "./utils";

test("importing a backup adds to the current data", async ({ page }) => {
  await goHome(page);
  await page.getByRole("button", { name: "Dodaj klienta" }).first().click();
  await page.getByLabel("Imię").fill("Ewa");
  await page.getByRole("button", { name: "Zapisz" }).click();

  await goHome(page);
  await page.getByRole("button", { name: "Ustawienia" }).click();

  const backup = {
    app: "trainer",
    version: 1,
    exportedAt: "2026-09-27T00:00:00.000Z",
    data: {
      categories: [],
      exercises: [],
      clients: [
        {
          id: "marek-1",
          firstName: "Marek",
          lastName: null,
          goal: null,
          notes: null,
          createdAt: "2026-09-27T00:00:00.000Z",
          sessions: [],
          weightLogs: [],
          periods: [],
        },
      ],
    },
  };

  await page.getByRole("button", { name: "Importuj" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "backup.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(JSON.stringify(backup)),
  });

  await expect(page.getByText("Dane zaimportowane pomyślnie.")).toBeVisible();

  // Close the settings drawer via the phone back gesture (Drawer pushes
  // its own history entry) and check the list underneath.
  await page.goBack();
  // The client row's own button (not its drag handle, "Przenieś Marek",
  // which also matches on a plain name search).
  await expect(
    page.locator('button[data-main="true"]', { hasText: "Marek" }),
  ).toBeVisible();
  await expect(
    page.locator('button[data-main="true"]', { hasText: "Ewa" }),
  ).toBeVisible();
});
