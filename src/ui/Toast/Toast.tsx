import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

type Props = {
  title: string;
  description?: string;
  /** Null hides it. Changing the title re-triggers the timer. */
  isOpen: boolean;
  onDismiss: () => void;
  durationMs?: number;
};

/**
 * A brief, self-dismissing acknowledgement. Used for journey milestones —
 * "Ownership confirmed", "Profile saved".
 *
 * Announced politely rather than assertively: these confirm something the owner
 * just did, so they should not interrupt a screen reader mid-sentence.
 */
export function Toast({
  title,
  description,
  isOpen,
  onDismiss,
  durationMs = 4_000,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [isOpen, title, durationMs, onDismiss]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed inset-x-4 top-4 z-[120] mx-auto flex max-w-[380px] items-start gap-3 rounded-2xl bg-color-primary px-5 py-4 text-white shadow-[0_10px_40px_rgba(50,27,21,0.28)]"
        >
          <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-content-center rounded-full bg-white/20 text-[11px]">
            ✓
          </span>

          <span className="flex-1">
            <span className="block font-satoshi text-sm font-semibold">{title}</span>
            {description && (
              <span className="mt-0.5 block font-satoshi text-[13px] font-normal text-white/75">
                {description}
              </span>
            )}
          </span>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="-mr-1 shrink-0 text-lg leading-none text-white/60 transition-colors hover:text-white"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
