import { createAppLock } from "@maat-apps/core/lock";

import { getSettingsSnapshot, setLockEnrolment } from "@/lib/app-settings";
import { discardUpdateSnapshot } from "@/lib/app-update";
import { encryptionKey } from "@/lib/encryption-key";
import { EMPTY_DATA, getDataSnapshot, replaceAllData } from "@/lib/storage";

// NEVER change this: it's part of how trainer-data is encrypted, so a
// different value makes every already-encrypted record undecryptable.
export const HKDF_INFO = "trainer-data-v1";

// trainer's app lock (@maat-apps/core/lock): a WebAuthn gate that encrypts
// trainer-data when the authenticator supports PRF, a UI gate otherwise.
export const appLock = createAppLock({
  name: "Trainer",
  keyInfo: HKDF_INFO,
  keyHolder: encryptionKey,
  enrolment: {
    get: () => getSettingsSnapshot().lock,
    set: setLockEnrolment,
  },
  data: {
    rewrite: () => replaceAllData(getDataSnapshot()),
    erase: async () => {
      replaceAllData(EMPTY_DATA);
      await discardUpdateSnapshot();
    },
  },
});
