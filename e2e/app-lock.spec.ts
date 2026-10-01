import { expect, test } from "@playwright/test";

import { goHome } from "./utils";

const LOCKED_TITLE = "Trainer jest zablokowany";

test.describe("app lock", () => {
  test("enrolling turns the lock on and unlocking with the same authenticator works", async ({
    page,
  }) => {
    // Playwright's native virtual WebAuthn authenticator, installed before
    // navigation so the app's real create()/get() calls succeed against it.
    await page.context().credentials.install();
    await goHome(page);

    await page.getByRole("button", { name: "Ustawienia" }).click();
    const lockSwitch = page.getByRole("switch", { name: "Blokada aplikacji" });
    await expect(lockSwitch).toBeEnabled();
    await lockSwitch.click();
    await expect(lockSwitch).toBeChecked();

    // Enrolling counts as unlocked, but that's per-session memory — a
    // reload shows the lock screen.
    await page.reload();
    await expect(
      page.getByRole("heading", { name: LOCKED_TITLE }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Odblokuj" }).click();
    await expect(page.getByRole("heading", { name: LOCKED_TITLE })).toHaveCount(
      0,
    );
  });

  test("the escape hatch turns the lock off when no authenticator is available", async ({
    page,
  }) => {
    // Force "no platform authenticator" regardless of the host machine, and
    // seed an enrolled gate-only lock. Store/key names are duplicated by
    // hand: an init script can't import from src/.
    await page.addInitScript(() => {
      window.PublicKeyCredential = window.PublicKeyCredential ?? ({} as never);
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
        () => Promise.resolve(false);
      const request = indexedDB.open("trainer", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("kv")) {
          request.result.createObjectStore("kv");
        }
      };
      request.onsuccess = () => {
        const transaction = request.result.transaction("kv", "readwrite");
        transaction.objectStore("kv").put(
          {
            installed: false,
            lock: {
              credentialId: "fake",
              userId: "fake-user",
              createdAt: new Date().toISOString(),
              encryptionSupported: false,
            },
          },
          "trainer-settings",
        );
      };
    });
    await goHome(page);

    await expect(
      page.getByRole("heading", { name: LOCKED_TITLE }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Wyłącz blokadę" }).click();
    await expect(page.getByRole("heading", { name: "Klienci" })).toBeVisible();
  });
});
