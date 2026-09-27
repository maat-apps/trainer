import { Link } from "react-router";

import { useAppData } from "@/hooks/use-store";

export function ClientListView() {
  const { clients } = useAppData();

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl">Klienci</h1>
        <Link to="/clients/new" className="underline">
          + Dodaj klienta
        </Link>
      </div>
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
    </main>
  );
}
