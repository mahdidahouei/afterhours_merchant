import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";

type Props = {
  /** 1-based badge shown in the header. */
  index: number;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  /** Ticks the badge and tints the header. */
  isComplete?: boolean;
  /** Draws attention — used when submit reports missing fields in here. */
  hasError?: boolean;
  children: React.ReactNode;
};

/**
 * A numbered, collapsible section. The review screen is three of these.
 *
 * Content is unmounted while closed rather than hidden, so long forms don't sit
 * in the tab order or the accessibility tree behind a collapsed header.
 */
export function Accordion({
  index,
  title,
  isOpen,
  onToggle,
  isComplete,
  hasError,
  children,
}: Props) {
  const headingId = `accordion-${index}-heading`;
  const panelId = `accordion-${index}-panel`;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[18px] border bg-white transition-colors",
        hasError
          ? "border-color-danger"
          : isOpen
            ? "border-color-primary/30"
            : "border-color-border",
      )}
    >
      <h3 id={headingId}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className={cn(
            "flex w-full items-center gap-3 px-5 py-4 text-left transition-colors",
            isOpen ? "bg-color-secondary/40" : "bg-transparent hover:bg-color-secondary/20",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "grid size-6 shrink-0 place-content-center rounded-full text-xs font-semibold",
              isComplete
                ? "bg-color-primary text-white"
                : hasError
                  ? "bg-color-danger text-white"
                  : "bg-color-secondary text-color-primary",
            )}
          >
            {isComplete ? "✓" : index}
          </span>

          <span className="flex-1 font-satoshi text-[15px] font-semibold text-color-primary-text">
            {title}
          </span>

          <motion.span
            aria-hidden
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-color-secondary-text"
          >
            <svg viewBox="0 0 16 16" className="size-4">
              <path
                d="M3 6l5 5 5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headingId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-color-border px-5 py-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
