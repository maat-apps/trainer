import { AppLockGate as SharedAppLockGate } from "@maat-apps/ui/app-lock-gate";
import { type ReactNode } from "react";

import { useAppSettings, useSettingsReady } from "@/hooks/use-store";
import { appLock } from "@/lib/app-lock";

const labels = {
  lockedTitle: "Trainer jest zablokowany",
  lockedDescription: "Odblokuj, aby zobaczyć swoich klientów.",
  unlock: "Odblokuj",
  unlockFailed: "Nie udało się. Spróbuj ponownie.",
  turnOffLock: "Wyłącz blokadę",
  eraseDataWarningTitle: "To usunie Twoje dane",
  eraseDataWarningDescription:
    "Twoje dane są zaszyfrowane i można je odczytać tylko działającym odblokowaniem odciskiem palca. Skoro nie jest teraz dostępne, wyłączenie blokady trwale je usunie — nie da się ich potem odzyskać.",
  eraseDataConfirm: "Usuń i kontynuuj",
  eraseDataCancel: "Anuluj",
};

/** @maat-apps/ui's lock screen, wired to trainer's lock and settings. */
export function AppLockGate({ children }: { children: ReactNode }) {
  const ready = useSettingsReady();
  const { lock } = useAppSettings();

  return (
    <SharedAppLockGate
      lock={appLock}
      enrolment={lock}
      ready={ready}
      labels={labels}
    >
      {children}
    </SharedAppLockGate>
  );
}
