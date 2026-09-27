import { NavLink, Outlet } from "react-router";

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? "text-foreground" : "text-muted-foreground";

/** Top-level nav (Clients / Exercises / Settings) shared by every route. */
export function AppLayout() {
  return (
    <div className="min-h-dvh">
      <header className="border-muted-foreground/20 flex items-center gap-6 border-b p-4">
        <NavLink to="/" end className={navLinkClassName}>
          Klienci
        </NavLink>
        <NavLink to="/exercises" className={navLinkClassName}>
          Ćwiczenia
        </NavLink>
        <NavLink to="/settings" className={navLinkClassName}>
          Ustawienia
        </NavLink>
      </header>
      <Outlet />
    </div>
  );
}
