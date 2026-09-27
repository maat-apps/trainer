import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Gear, Plus } from "@phosphor-icons/react";
import { startTransition, useState } from "react";
import { useNavigate } from "react-router";

import { SortableClientRow } from "@/components/sortable-client-row";
import { useDragSensors } from "@/hooks/use-drag-sensors";
import { useAppData } from "@/hooks/use-store";
import { reorderClients } from "@/lib/storage";
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
  const sensors = useDragSensors();

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const oldIndex = clients.findIndex((client) => client.id === active.id);
    const newIndex = clients.findIndex((client) => client.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderClients(arrayMove(clients, oldIndex, newIndex).map((c) => c.id));
  }

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={clients.map((client) => client.id)}
            strategy={verticalListSortingStrategy}
          >
            <section
              className="grid grid-cols-[minmax(0,1fr)] gap-2.5"
              aria-label="Klienci"
            >
              {clients.map((client) => (
                <SortableClientRow
                  key={client.id}
                  client={client}
                  onOpen={(clientId) =>
                    startTransition(() =>
                      navigate(`/clients/${encodeURIComponent(clientId)}`),
                    )
                  }
                />
              ))}
            </section>
          </SortableContext>
        </DndContext>
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
