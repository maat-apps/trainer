import { DataSection } from "@/views/settings/settings-data-section";

export function SettingsPanel() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-2.5">
      <DataSection />
    </div>
  );
}
