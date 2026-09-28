import { useState, useSyncExternalStore } from "react";

import { useInstallPrompt } from "@/hooks/use-install-prompt";
import {
  discardUpdateSnapshot,
  hasNoUpdateSnapshotOnServer,
  hasUpdateSnapshot,
  restoreUpdateSnapshot,
  subscribeToUpdateSnapshot,
  updateApp,
} from "@/lib/app-update";
import { Button } from "@maat-apps/ui/button";
import { ConfirmDrawer } from "@maat-apps/ui/confirm-drawer";
import {
  SettingsRow,
  SettingsSection,
} from "@maat-apps/ui/settings-primitives";

export function AppSection({
  onStatus,
}: {
  onStatus: (message: string | null) => void;
}) {
  const install = useInstallPrompt();
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);
  const hasSnapshot = useSyncExternalStore(
    subscribeToUpdateSnapshot,
    hasUpdateSnapshot,
    hasNoUpdateSnapshotOnServer,
  );

  return (
    <>
      <SettingsSection title="Aplikacja">
        <SettingsRow
          title="Zainstaluj aplikację"
          description={
            install.state === "installed"
              ? "Już zainstalowana."
              : install.state === "available"
                ? "Dodaj Trainer do ekranu głównego."
                : "Użyj menu przeglądarki i wybierz „Dodaj do ekranu głównego”."
          }
          action={
            <Button
              variant="outline"
              className="min-h-10.5 px-4"
              disabled={install.state !== "available"}
              onClick={() => void install.install()}
            >
              Zainstaluj
            </Button>
          }
        />
        <SettingsRow
          title="Zaktualizuj aplikację"
          description="Pobierz najnowszą wersję i przeładuj."
          action={
            <Button
              variant="outline"
              className="min-h-10.5 px-4"
              disabled={updating}
              onClick={() => setConfirmUpdate(true)}
            >
              {updating ? "Aktualizowanie…" : "Aktualizuj"}
            </Button>
          }
        />
        {hasSnapshot && (
          <SettingsRow
            title="Przywróć ostatnią kopię"
            description="Przywróć dane zapisane przed ostatnią aktualizacją."
            action={
              <Button
                variant="outline"
                className="min-h-10.5 px-4"
                onClick={() => {
                  void (async () => {
                    if (await restoreUpdateSnapshot()) {
                      onStatus("Dane przywrócone.");
                      await discardUpdateSnapshot();
                    }
                  })();
                }}
              >
                Przywróć
              </Button>
            }
          />
        )}
      </SettingsSection>
      <ConfirmDrawer
        open={confirmUpdate}
        onOpenChange={setConfirmUpdate}
        title="Zaktualizować teraz?"
        description="Aplikacja przeładuje się. Najpierw zapiszemy kopię zapasową danych."
        cancelLabel="Anuluj"
        confirmLabel="Aktualizuj"
        onConfirm={() => {
          setConfirmUpdate(false);
          setUpdating(true);
          void updateApp();
        }}
      />
    </>
  );
}
