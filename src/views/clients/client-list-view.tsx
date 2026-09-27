import { Gear, Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { useAppData } from "@/hooks/use-store";
import { SettingsPanel } from "@/views/settings/settings-panel";
import { Button } from "@maat-apps/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@maat-apps/ui/drawer";
import { EmptyState } from "@maat-apps/ui/empty-state";
import { FabButton } from "@maat-apps/ui/fab-button";
import { PageHeader } from "@maat-apps/ui/page-header";

export function ClientListView() {
  const navigate = useNavigate();
  const { clients } = useAppData();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="mx-auto min-h-dvh w-[min(100%,480px)] px-4 pt-27 pb-4">
      <PageHeader>
        <h1 className="font-heading text-xl font-semibold">Klienci</h1>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Ustawienia"
          onClick={() => setSettingsOpen(true)}
        >
          <Gear className="size-6" />
        </Button>
      </PageHeader>
      {clients.length === 0 ? (
        <EmptyState
          title="Brak klientów"
          description="Dodaj pierwszego klienta, żeby zacząć śledzić jego postępy."
          action={{
            label: (
              <>
                <Plus /> Dodaj klienta
              </>
            ),
            onClick: () => navigate("/clients/new"),
          }}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {clients.map((client) => (
            <li key={client.id}>
              <Link to={`/clients/${client.id}`} className="underline">
                {client.firstName}
                {client.lastName ? ` ${client.lastName}` : ""}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <FabButton
        className="fixed right-[max(20px,calc((100vw-480px)/2+20px))] bottom-[calc(84px+env(safe-area-inset-bottom))] z-20"
        ariaLabel="Dodaj klienta"
        onClick={() => navigate("/clients/new")}
      >
        <Plus className="size-6" />
      </FabButton>
      <Drawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        showSwipeHandle
      >
        <DrawerContent className="bg-background [--drawer-bleed-background:var(--color-background)]">
          <DrawerHeader className="group-data-[swipe-axis=y]/drawer-popup:text-left">
            <DrawerTitle>Ustawienia</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <SettingsPanel />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
