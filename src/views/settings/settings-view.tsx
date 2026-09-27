// Export/import (the only persistence-adjacent thing Settings needs, now
// that Drive integration is closed — see trainer#3/#9) isn't built yet;
// this stub only wires the "Ustawienia" nav item to a real route.
export function SettingsView() {
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-2 text-xl">Ustawienia</h1>
      <p className="text-muted-foreground text-sm">
        Eksport i import danych pojawi się tutaj (patrz #9).
      </p>
    </main>
  );
}
