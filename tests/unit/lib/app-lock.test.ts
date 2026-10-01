import {
  deriveKey,
  fromBase64Url,
  isEncryptedBlob,
} from "@maat-apps/core/crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DATA_KEY } from "@/lib/storage-keys";
import { resetIndexedDb } from "../reset-indexeddb";

// The lock's own behavior (enrol/verify/disable, PRF, the session state) is
// tested in @maat-apps/core/lock. These tests cover trainer's wiring: the
// enrolment lives in app-settings, the key derives from trainer's HKDF info,
// and rewrite/erase reach trainer's data and update snapshot.

const RAW_ID = new Uint8Array([1, 2, 3]).buffer;
const PRF_SECRET = new Uint8Array(32).fill(7).buffer;

function fakeCredential(
  extensionResults: AuthenticationExtensionsClientOutputs = {},
): PublicKeyCredential {
  return {
    rawId: RAW_ID,
    getClientExtensionResults: () => extensionResults,
  } as unknown as PublicKeyCredential;
}

function stubPrfDevice() {
  vi.stubGlobal("navigator", {
    credentials: {
      create: vi
        .fn()
        .mockResolvedValue(fakeCredential({ prf: { enabled: true } })),
      get: vi
        .fn()
        .mockResolvedValue(
          fakeCredential({ prf: { results: { first: PRF_SECRET } } }),
        ),
    },
  });
}

async function freshModules() {
  vi.resetModules();
  const settings = await import("@/lib/app-settings");
  await settings.whenLoaded();
  const storage = await import("@/lib/storage");
  await storage.whenLoaded();
  const { appLock, HKDF_INFO } = await import("@/lib/app-lock");
  const { kvGet } = await import("@/lib/idb-store");
  return { settings, storage, appLock, HKDF_INFO, kvGet };
}

beforeEach(async () => {
  await resetIndexedDb();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("appLock", () => {
  it("stores the enrolment in settings", async () => {
    vi.stubGlobal("navigator", {
      credentials: { create: vi.fn().mockResolvedValue(fakeCredential()) },
    });
    const { settings, appLock } = await freshModules();

    const enrolment = await appLock.enrol();

    expect(settings.getSettingsSnapshot().lock).toEqual(enrolment);
  });

  it("re-saves existing data encrypted with trainer's key on enrolment", async () => {
    stubPrfDevice();
    const { storage, appLock, HKDF_INFO, kvGet } = await freshModules();
    storage.saveCategory({ id: "1", name: "Legs" });

    const { prfSalt } = await appLock.enrol();

    const { decryptJson } = await import("@maat-apps/core/crypto");
    const key = await deriveKey(PRF_SECRET, fromBase64Url(prfSalt!), HKDF_INFO);
    await vi.waitFor(async () => {
      const stored = await kvGet(DATA_KEY);
      expect(isEncryptedBlob(stored)).toBe(true);
      const data = await decryptJson<{ categories: unknown[] }>(
        key,
        stored as Parameters<typeof decryptJson>[1],
      );
      expect(data.categories).toHaveLength(1);
    });
  });

  it("clears the enrolment and writes data back unencrypted on disable", async () => {
    stubPrfDevice();
    const { settings, storage, appLock, kvGet } = await freshModules();
    storage.saveCategory({ id: "1", name: "Legs" });
    await appLock.enrol();

    appLock.disable();

    expect(settings.getSettingsSnapshot().lock).toBeNull();
    await vi.waitFor(async () => {
      expect(isEncryptedBlob(await kvGet(DATA_KEY))).toBe(false);
    });
  });

  it("wipes data and the update snapshot on disableAndErase", async () => {
    const { settings, storage, appLock } = await freshModules();
    const appUpdate = await import("@/lib/app-update");
    storage.saveCategory({ id: "1", name: "Legs" });
    await appUpdate.saveUpdateSnapshot();

    await appLock.disableAndErase();

    expect(settings.getSettingsSnapshot().lock).toBeNull();
    expect(storage.getDataSnapshot()).toEqual(storage.EMPTY_DATA);
    expect(appUpdate.hasUpdateSnapshot()).toBe(false);
  });
});
