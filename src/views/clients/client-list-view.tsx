import { Link } from "react-router";

import { useAppData } from "@/hooks/use-store";
import { PageHeader } from "@maat-apps/ui/page-header";

export function ClientListView() {
  const { clients } = useAppData();

  return (
    <div className="mx-auto min-h-dvh w-[min(100%,480px)] px-4 pt-27 pb-4">
      <PageHeader>
        <h1 className="font-heading text-xl font-semibold">Klienci</h1>
        <Link to="/clients/new" className="underline">
          + Dodaj klienta
        </Link>
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
    </div>
  );
}
