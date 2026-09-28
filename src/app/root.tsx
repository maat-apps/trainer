import { MobileGate } from "@maat-apps/ui/mobile-gate";
import { useEffect } from "react";
import { useTranslation } from "../i18n/use-translation";
import { AppRouter } from "./router";

export function Root() {
  const { t } = useTranslation();

  // @maat-apps/ui's MobileGate doesn't register a service worker itself
  // (per-app setup, not part of the gate shape) — see routines' own
  // src/app/app.tsx for the pattern this mirrors.
  useEffect(() => {
    // sw.js is only built in production (see vite.config.ts); registering it
    // in dev would also fight Vite's own HMR with a caching service worker.
    // BASE_URL (not a hardcoded "/trainer/") so a PR preview built under
    // "/trainer/pr-<n>/" registers its own worker scoped to that subpath
    // instead of colliding with main's.
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .catch(() => undefined);
    }
    // Best-effort request that the browser not evict IndexedDB under storage
    // pressure — cheap insurance now that data lives there. Ignored outright
    // by browsers that don't support it.
    if ("storage" in navigator && "persist" in navigator.storage) {
      navigator.storage.persist().catch(() => undefined);
    }
  }, []);

  return (
    <MobileGate message={t("desktopNotSupported")}>
      <AppRouter />
    </MobileGate>
  );
}
