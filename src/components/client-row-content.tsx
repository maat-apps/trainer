import { CaretRight } from "@phosphor-icons/react";

import { lastSessionDate } from "@/lib/client-utils";
import type { Client } from "@/types";

function formatLastSession(client: Client): string {
  const date = lastSessionDate(client);
  if (!date) return "Brak sesji";
  return `Ostatnia sesja: ${new Intl.DateTimeFormat("pl").format(new Date(date))}`;
}

/**
 * The name + last-session subtitle + chevron every client row (the plain
 * list before drag support, the draggable one in sortable-client-row.tsx)
 * shows — the caller owns the outer clickable/draggable wrapper. Mirrors
 * routines' routine-row-content.tsx, minus the progress ring (clients have
 * no step-completion concept).
 */
export function ClientRowContent({ client }: { client: Client }) {
  return (
    <>
      <span className="grid min-w-0 flex-1 gap-1.5">
        <strong className="font-heading overflow-hidden text-lg font-semibold text-ellipsis whitespace-nowrap">
          {client.firstName}
          {client.lastName ? ` ${client.lastName}` : ""}
        </strong>
        <span className="text-muted-foreground text-sm">
          {formatLastSession(client)}
        </span>
      </span>
      <CaretRight aria-hidden="true" />
    </>
  );
}
