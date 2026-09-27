import { Barbell, Users } from "@phosphor-icons/react";
import { NavLink, Outlet } from "react-router";

const navItems = [
  { to: "/", end: true, label: "Klienci", Icon: Users },
  { to: "/exercises", end: false, label: "Ćwiczenia", Icon: Barbell },
] as const;

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
    isActive ? "text-foreground" : "text-muted-foreground"
  }`;

/**
 * App-wide bottom navigation (Klienci / Ćwiczenia), fixed to the viewport
 * bottom — every route renders through this shell via the nested
 * <Outlet/>. Settings isn't a nav destination — it's a drawer opened from
 * the client list's header, matching routines. `pb-16` on the content
 * wrapper below reserves the same height as the fixed bar (h-16) so it
 * never covers the last bit of scrolled content.
 */
export function AppLayout() {
  return (
    <div className="min-h-dvh">
      <div className="pb-16">
        <Outlet />
      </div>
      <nav className="border-muted-foreground/20 bg-background fixed inset-x-0 bottom-0 z-10 flex h-16 items-stretch justify-around border-t">
        {navItems.map(({ to, end, label, Icon }) => (
          <NavLink key={to} to={to} end={end} className={linkClassName}>
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
