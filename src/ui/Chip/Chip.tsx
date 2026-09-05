import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  /** Renders the × affordance. */
  onRemove?: () => void;
  /** Cream fill instead of outline — used for chosen values. */
  selected?: boolean;
  className?: string;
};

/** A tag. Removable when `onRemove` is given. */
export function Chip({ children, onRemove, selected = true, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5",
        "font-satoshi text-[13px] font-medium",
        selected
          ? "bg-color-secondary text-color-primary"
          : "border border-color-border text-color-primary-text",
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${typeof children === "string" ? children : "item"}`}
          className="-mr-1 grid size-4 place-content-center rounded-full text-color-primary/70 transition-colors hover:text-color-primary"
        >
          <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
            <path
              d="M1 1l10 10M11 1L1 11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

/**
 * The dashed "Add" affordance that opens a picker.
 *
 * Forwards its ref because a popover has to position itself against this button
 * and nothing else: the chips it sits among wrap, so the row's own box is the
 * top of the *first* line, which can be several lines above.
 */
export const AddChip = forwardRef<
  HTMLButtonElement,
  { onClick: () => void; label?: string; disabled?: boolean }
>(function AddChip({ onClick, label = "Add", disabled }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-color-border",
        "px-3 py-1.5 font-satoshi text-[13px] font-medium text-color-secondary-text",
        "transition-colors hover:border-color-primary hover:text-color-primary",
        "disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      <span aria-hidden className="text-base leading-none">+</span>
      {label}
    </button>
  );
});
