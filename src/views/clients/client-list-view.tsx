import { Plus } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router";

import { useAppData } from "@/hooks/use-store";
import { FabButton } from "@maat-apps/ui/fab-button";
import { PageHeader } from "@maat-apps/ui/page-header";

export function ClientListView() {
  const navigate = useNavigate();
  const { clients } = useAppData();

  return (
    <div className="mx-auto min-h-dvh w-[min(100%,480px)] px-4 pt-27 pb-4">
      <PageHeader>
        <h1 className="font-heading text-xl font-semibold">Klienci</h1>
      </PageHeader>
      {clients.length === 0 ? (
        <p className="text-muted-foreground">Brak klientów.</p>
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
    </div>
  );
}
