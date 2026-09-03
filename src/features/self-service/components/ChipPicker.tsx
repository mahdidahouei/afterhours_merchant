import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { TextField } from "@/ui/TextField";
import { AddChip, Chip } from "@/ui/Chip";

type Props = {
  label: string;
  /** Everything on offer, from the taxonomy. */
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  /** Omit for unlimited. Reaching it disables the unpicked options. */
  max?: number;
  /** Radio behaviour — establishment type is one value, not a list. */
  single?: boolean;
  /** Shown under the chips when nothing is picked. */
  emptyHint?: string;
};

/**
 * A row of chosen chips plus an "Add" affordance that opens a checklist.
 *
 * Every taxonomy field on the review screen is one of these — cuisines, vibe,
 * perfect for, moments, establishment type. `single` collapses it to a radio,
 * which is what the contract requires for establishment type.
 */
export function ChipPicker({
  label,
  options,
  value,
  onChange,
  max,
  single,
  emptyHint,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const limit = single ? 1 : max;
  const isFull = limit !== undefined && value.length >= limit;

  // Dismiss on outside click and on Escape — this is a popover, not a dialog.
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.toLowerCase().includes(needle));
  }, [options, filter]);

  const toggle = (option: string) => {
    if (single) {
      onChange(value[0] === option ? [] : [option]);
      setIsOpen(false);
      return;
    }

    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
      return;
    }
    if (isFull) return;
    onChange([...value, option]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-satoshi text-[13px] font-medium text-color-primary-text">
          {label}
        </span>
        {limit !== undefined && (
          <span className="font-satoshi text-[12px] text-color-secondary-text">
            {value.length}/{limit}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {value.map((item) => (
          <Chip key={item} onRemove={() => onChange(value.filter((v) => v !== item))}>
            {item}
          </Chip>
        ))}

        <AddChip onClick={() => setIsOpen((open) => !open)} disabled={isFull && !single} />
      </div>

      {value.length === 0 && emptyHint && (
        <p className="mt-2 font-satoshi text-[12px] text-color-secondary-text">{emptyHint}</p>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            role="dialog"
            aria-label={label}
            className="absolute left-0 top-full z-30 mt-2 w-full max-w-[340px] overflow-hidden rounded-[16px] border border-color-border bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
          >
            {options.length > 8 && (
              <div className="border-b border-color-border p-2.5">
                {/* TextField rather than SearchField: this filters a list
                    already in memory, so the debounce SearchField adds would be
                    latency for nothing. */}
                <TextField
                  size="responsive"
                  autoFocus
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder={`Search ${label.toLowerCase()}`}
                />
              </div>
            )}

            <ul className="max-h-[240px] overflow-y-auto p-1.5 scrollbar-thin">
              {visible.map((option) => {
                const isChosen = value.includes(option);
                const isBlocked = !isChosen && isFull && !single;

                return (
                  <li key={option}>
                    <button
                      type="button"
                      onClick={() => toggle(option)}
                      disabled={isBlocked}
                      aria-pressed={isChosen}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left font-satoshi text-sm transition-colors",
                        isChosen
                          ? "bg-color-secondary text-color-primary"
                          : "text-color-primary-text hover:bg-color-background",
                        isBlocked && "pointer-events-none opacity-35",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-4 shrink-0 place-content-center border transition-colors",
                          single ? "rounded-full" : "rounded-[5px]",
                          isChosen
                            ? "border-color-primary bg-color-primary text-white"
                            : "border-color-border",
                        )}
                      >
                        {isChosen && (
                          <svg viewBox="0 0 12 12" className="size-2.5">
                            <path
                              d="M2 6.5l2.5 2.5L10 3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      {option}
                    </button>
                  </li>
                );
              })}

              {visible.length === 0 && (
                <li className="px-3 py-4 text-center font-satoshi text-sm text-color-secondary-text">
                  Nothing matches.
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
