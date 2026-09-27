import { expect, test } from "@playwright/test";

import { goHome } from "./utils";

test("importing a backup replaces the current data", async ({ page }) => {
  await goHome(page);
  await page.getByRole("link", { name: "+ Dodaj klienta" }).click();
  await page.getByLabel("Imię").fill("Ewa");
  await page.getByRole("button", { name: "Zapisz" }).click();

  await page.getByRole("link", { name: "Ustawienia" }).click();

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

  await page.getByRole("button", { name: "Importuj dane" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "backup.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(JSON.stringify(backup)),
  });

  await expect(page.getByText("Dane zaimportowane pomyślnie.")).toBeVisible();

  await page.getByRole("link", { name: "Klienci" }).click();
  await expect(page.getByRole("link", { name: "Marek" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ewa" })).not.toBeVisible();
});
