import { type ChangeEvent, useRef, useState } from "react";

import { applyBackup, downloadBackup, parseBackup } from "@/lib/backup";

export function SettingsView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const backup = parseBackup(text);
      applyBackup(backup);
      setImportMessage("Dane zaimportowane pomyślnie.");
    } catch (error) {
      setImportMessage(
        error instanceof Error ? error.message : "Nie udało się wczytać pliku.",
      );
    }
  };

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-xl">Ustawienia</h1>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Kopia zapasowa</h2>
        <p className="text-muted-foreground text-sm">
          Dane są przechowywane wyłącznie lokalnie na tym urządzeniu. Eksportuj
          je regularnie, aby móc je odzyskać po zmianie urządzenia lub
          wyczyszczeniu danych przeglądarki.
        </p>
        <button
          type="button"
          className="border-muted-foreground/40 rounded border p-2"
          onClick={() => downloadBackup()}
        >
          Eksportuj dane
        </button>
        <button
          type="button"
          className="border-muted-foreground/40 rounded border p-2"
          onClick={() => fileInputRef.current?.click()}
        >
          Importuj dane
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.json,text/plain,application/json"
          className="hidden"
          onChange={(event) => void handleImport(event)}
        />
        {importMessage && (
          <p role="status" className="text-sm">
            {importMessage}
          </p>
        )}
      </section>
    </main>
  );
}
