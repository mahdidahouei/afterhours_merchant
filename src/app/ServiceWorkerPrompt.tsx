import { useRegisterSW } from "virtual:pwa-register/react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Update notice for the service worker.
 *
 * The worker is registered with `registerType: "prompt"`, so a new build waits
 * rather than activating under a live session. That matters here: the landing
 * page lazy-loads nine section chunks as you scroll, and swapping the manifest
 * mid-scroll can leave a section unable to fetch its (now-deleted) chunk.
 *
 * `updateServiceWorker(true)` activates the waiting worker and reloads.
 */
export function ServiceWorkerPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Catch builds shipped while a tab was left open overnight.
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-[420px] items-center gap-4 rounded-2xl bg-color-primary px-5 py-4 text-white shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
        >
          <p className="flex-1 font-satoshi text-sm font-medium">
            A new version of Afterhours is available.
          </p>

          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="shrink-0 rounded-full bg-white px-4 py-2 font-satoshi text-xs font-semibold text-color-primary transition-transform hover:scale-105"
          >
            Reload
          </button>

          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setNeedRefresh(false)}
            className="shrink-0 text-lg leading-none text-white/70 hover:text-white"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
