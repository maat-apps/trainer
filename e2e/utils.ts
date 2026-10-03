// Reusable Playwright test helpers — plain functions specs call directly,
// not test.extend() fixtures (hence "utils.ts", not "fixtures.ts" — see
// maat-core/STRUCTURE.md's Testing section for why that naming matters).
import { expect, type Page } from "@playwright/test";

export async function goHome(page: Page) {
  await page.goto("");
}

/**
 * Resolves once the app-lock enrolment has reached IndexedDB. Settings
 * persist in the background, so a reload right after enrolling can lose
 * it and the app comes back unlocked.
 */
export async function waitForStoredLock(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<boolean>((resolve) => {
            const request = indexedDB.open("trainer");
            request.onerror = () => resolve(false);
            request.onsuccess = () => {
              const read = request.result
                .transaction("kv")
                .objectStore("kv")
                .get("trainer-settings");
              read.onerror = () => resolve(false);
              read.onsuccess = () =>
                resolve(
                  Boolean(
                    (read.result as { lock?: unknown } | undefined)?.lock,
                  ),
                );
            };
          }),
      ),
    )
    .toBe(true);
}

/**
 * Resolves once a client with this first name has reached IndexedDB. Data
 * persists in the background, so a reload right after saving can lose it.
 */
export async function waitForStoredClient(page: Page, firstName: string) {
  await expect
    .poll(() =>
      page.evaluate(
        (name) =>
          new Promise<boolean>((resolve) => {
            const request = indexedDB.open("trainer");
            request.onerror = () => resolve(false);
            request.onsuccess = () => {
              const read = request.result
                .transaction("kv")
                .objectStore("kv")
                .get("trainer-data");
              read.onerror = () => resolve(false);
              read.onsuccess = () =>
                resolve(
                  (
                    (read.result as { clients?: { firstName: string }[] })
                      ?.clients ?? []
                  ).some((client) => client.firstName === name),
                );
            };
          }),
        firstName,
      ),
    )
    .toBe(true);
}
