import { type ChangeEvent, useRef, useState } from "react";

import { applyBackup, downloadBackup, parseBackup } from "@/lib/backup";
import { Button } from "@maat-apps/ui/button";
import {
  SettingsRow,
  SettingsSection,
} from "@maat-apps/ui/settings-primitives";

export function DataSection() {
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
    <SettingsSection title="Kopia zapasowa">
      <SettingsRow
        title="Eksportuj dane"
        description="Dane są przechowywane wyłącznie lokalnie na tym urządzeniu. Eksportuj je regularnie, aby móc je odzyskać po zmianie urządzenia lub wyczyszczeniu danych przeglądarki."
        action={
          <Button
            variant="outline"
            className="min-h-10.5 px-4"
            onClick={() => downloadBackup()}
          >
            Eksportuj
          </Button>
        }
      />
      <SettingsRow
        title="Importuj dane"
        description="Zastąp obecne dane z pliku kopii zapasowej."
        action={
          <Button
            variant="outline"
            className="min-h-10.5 px-4"
            onClick={() => fileInputRef.current?.click()}
          >
            Importuj
          </Button>
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.json,text/plain,application/json"
        className="hidden"
        aria-label="Importuj dane"
        onChange={(event) => void handleImport(event)}
      />
      {importMessage && (
        <p role="status" className="text-muted-foreground px-1 text-sm">
          {importMessage}
        </p>
      )}
    </SettingsSection>
  );
}
