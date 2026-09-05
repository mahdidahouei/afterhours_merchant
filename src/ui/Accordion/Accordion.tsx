import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * The panel's timing, taken from the design.
 *
 * `grid-template-rows 480ms cubic-bezier(0.3, 0, 0, 1)` in the mock — one
 * transition, so opening and shutting are the same length and the same curve,
 * and the content does not fade. The mock animates a grid row from `0fr` to
 * `1fr` with the content always mounted; animating height to `auto` over an
 * unmounted panel looks identical and keeps a closed section out of the tab
 * order.
 */
const PANEL_DURATION = 0.48;
const PANEL_EASE = [0.3, 0, 0, 1] as const;

type Props = {
  /** 1-based badge shown in the header. */
  index: number;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  /**
   * Fired when the collapse animation has finished and the panel is gone.
   *
   * Lets a caller sequence one accordion closing into another opening without
   * hard-coding this component's duration.
   */
  onCollapsed?: () => void;
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
  onCollapsed,
  isComplete,
  hasError,
  children,
}: Props) {
  const headingId = `accordion-${index}-heading`;
  const panelId = `accordion-${index}-panel`;

  /**
   * Whether the panel is on screen at all — open, or still animating shut.
   *
   * The header's own rounding follows this rather than `isOpen`: flipping it the
   * instant a collapse starts would round the header's bottom corners back over
   * a panel that is still there, which is precisely the seam this squares off.
   */
  const [hasPanel, setHasPanel] = useState(isOpen);
  useEffect(() => {
    if (isOpen) setHasPanel(true);
  }, [isOpen]);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[18px] border bg-white transition-colors duration-200",
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
            "flex w-full items-center gap-3 px-5 py-4 text-left transition-colors duration-150",
            // Buttons carry a radius globally, which on an open section left the
            // tinted header curving away from the square border beside it.
            "rounded-[18px]",
            hasPanel
              ? "rounded-b-none bg-color-secondary/40"
              : "bg-transparent hover:bg-color-secondary/20",
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

      <AnimatePresence
        initial={false}
        onExitComplete={() => {
          setHasPanel(false);
          onCollapsed?.();
        }}
      >
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headingId}
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: PANEL_DURATION, ease: PANEL_EASE }}
            className="overflow-hidden"
          >
            <div className="border-t border-color-border px-5 py-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
