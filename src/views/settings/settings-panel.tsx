import { useState } from "react";

import { AppSection } from "@/views/settings/settings-app-section";
import { DataSection } from "@/views/settings/settings-data-section";

export function SettingsPanel() {
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-2.5">
      <DataSection />
      <AppSection onStatus={setStatus} />
      <p aria-live="polite" className="text-muted-foreground px-1 text-sm">
        {status}
      </p>
    </div>
  );
}
