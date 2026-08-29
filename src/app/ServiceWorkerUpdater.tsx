import { useRegisterSW } from "virtual:pwa-register/react";

/** How often an open tab asks whether a newer build has shipped. */
const UPDATE_CHECK_MS = 60 * 60 * 1000;

/**
 * Registers the service worker. Renders nothing, and deliberately so.
 *
 * There is no "a new version is available" bar any more. The worker is built
 * with `skipWaiting`, so a new build installs, activates and claims open tabs
 * by itself; the next load is the new one, with nothing to press and no way to
 * be left on a months-old build.
 *
 * `useRegisterSW` is still what registers it — `injectRegister: null` means
 * nothing else does — and `needRefresh` is intentionally ignored: with
 * `skipWaiting` there is never a waiting worker for it to report.
 *
 * The hourly check is the part that earns its keep. Without it a pinned tab
 * only discovers a new build when it reloads, and the whole point here is that
 * the reload should already have the new build waiting for it.
 */
export function ServiceWorkerUpdater() {
  useRegisterSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => void registration.update(), UPDATE_CHECK_MS);
    },
  });

  return null;
}
