import { useEffect, useState } from "react";

import { useAppSettings } from "@/hooks/use-store";
import { appLock } from "@/lib/app-lock";
import {
  SettingsRow,
  SettingsSection,
} from "@maat-apps/ui/settings-primitives";
import { Switch } from "@maat-apps/ui/switch";

export function SecuritySection() {
  const { lock } = useAppSettings();
  const [lockSupported, setLockSupported] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void appLock.isSupported().then((supported) => {
      if (active) setLockSupported(supported);
    });
    return () => {
      active = false;
    };
  }, []);

  async function toggleAppLock(enabled: boolean) {
    setLockError(null);
    if (!enabled) {
      appLock.disable();
      return;
    }
    try {
      await appLock.enrol();
    } catch {
      // Cancelling the platform prompt lands here too; leave the lock off.
      setLockError("Nie udało się włączyć blokady.");
    }
  }

  return (
    <SettingsSection title="Bezpieczeństwo">
      <SettingsRow
        title="Blokada aplikacji"
        description={
          lockSupported
            ? "Pytaj o odcisk palca przy otwieraniu."
            : "To urządzenie nie obsługuje odblokowania odciskiem palca."
        }
        action={
          <Switch
            checked={lock !== null}
            disabled={!lockSupported}
            aria-label="Blokada aplikacji"
            onCheckedChange={(checked) => void toggleAppLock(checked)}
          />
        }
      />
      {lockError && (
        <p role="alert" className="text-destructive px-1 text-xs">
          {lockError}
        </p>
      )}
      {lock !== null && (
        <p className="text-muted-foreground px-1 text-xs">
          {lock.encryptionSupported
            ? "Twoje dane są zaszyfrowane kluczem z odcisku palca. Jeśli odblokowanie przestanie działać, danych nie da się odzyskać — zrób kopię zapasową na wszelki wypadek."
            : "To tylko blokada wygody — nie szyfruje Twoich danych."}
        </p>
      )}
    </SettingsSection>
  );
}
