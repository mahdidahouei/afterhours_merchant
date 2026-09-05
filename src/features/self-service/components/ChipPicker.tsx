import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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
  /** Omit for unlimited. Reaching it disables the unpicked options in the list. */
  max?: number;
  /** Radio behaviour — establishment type is one value, not a list. */
  single?: boolean;
  /** Shown under the chips when nothing is picked. */
  emptyHint?: string;
};

/** How short the gap below the trigger has to get before the list flips above. */
const MIN_LIST_HEIGHT = 180;

/** Room left around the list so it never touches the edge of the window. */
const VIEWPORT_MARGIN = 16;

/** The breath between the Add button and the list, whichever side it opens. */
const GAP = 8;

/** The search block's own height, which comes out of the list's budget. */
const SEARCH_HEIGHT = 69;

/** A list longer than this gets a filter box. */
const SEARCHABLE_FROM = 8;

/** Where the popover sits, in viewport coordinates. */
type Anchor = {
  left: number;
  width: number;
  /** One of the two is set; the other is undefined. */
  top?: number;
  bottom?: number;
  /** Opened upwards, because there was no room below. */
  isAbove: boolean;
  listMaxHeight: number;
};

/**
 * A row of chosen chips plus an "Add" affordance that opens a checklist.
 *
 * Every taxonomy field on the review screen is one of these — cuisines, vibe,
 * perfect for, establishment type. `single` collapses it to a radio,
 * which is what the contract requires for establishment type.
 *
 * The list is rendered into `document.body` rather than beside the trigger. It
 * has to be: the accordion this lives in clips its content twice over — once on
 * the animating panel and once on the card itself, both `overflow-hidden` — so
 * an absolutely positioned popover was cut off at the card's edge. For the
 * lower pickers the whole list landed outside, which read as the Add button
 * being dead rather than as a list that had opened out of sight.
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
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const hasSearch = options.length > SEARCHABLE_FROM;

  /**
   * Measure the trigger and decide where the list goes.
   *
   * Below it by default, above when the gap underneath has run out and there is
   * more room overhead — and in either case the list is capped to what actually
   * fits, so it scrolls rather than running off the window.
   *
   * Vertically this measures the Add button itself, so the same `GAP` reads as
   * the same distance whichever way the list opens. Nothing around it will do:
   * the container starts at the picker's label, and the chips wrap, so the row's
   * box is the top of its *first* line while the button is usually on the last.
   * Horizontally it is still the container, so the list lines up with the column
   * rather than with the button.
   */
  const place = useCallback(() => {
    const element = containerRef.current;
    const add = addRef.current;
    if (!element || !add) return;

    const box = element.getBoundingClientRect();
    const trigger = add.getBoundingClientRect();
    const below = window.innerHeight - trigger.bottom - GAP - VIEWPORT_MARGIN;
    const above = trigger.top - GAP - VIEWPORT_MARGIN;
    const goesAbove = below < MIN_LIST_HEIGHT && above > below;
    const room = goesAbove ? above : below;

    setAnchor({
      left: box.left,
      width: Math.min(Math.max(box.width, 240), 340),
      top: goesAbove ? undefined : trigger.bottom + GAP,
      bottom: goesAbove ? window.innerHeight - trigger.top + GAP : undefined,
      isAbove: goesAbove,
      // The search box, when there is one, eats into the same budget.
      listMaxHeight: Math.max(Math.min(room - (hasSearch ? SEARCH_HEIGHT : 0), 240), 120),
    });
  }, [hasSearch]);

  // Measured before paint so the list never shows up in the wrong place first.
  useLayoutEffect(() => {
    if (isOpen) place();
  }, [isOpen, place]);

  // A fixed popover doesn't travel with the page, so it is re-placed instead.
  // Capture phase: the scroll may be any container between here and the window.
  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [isOpen, place]);

  const limit = single ? 1 : max;
  const isFull = limit !== undefined && value.length >= limit;

  // Dismiss on outside click and on Escape — this is a popover, not a dialog.
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      // The list is portalled, so "inside" is two elements, not one.
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
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

  /*
   * TextField rather than SearchField: this filters a list already in memory,
   * so the debounce SearchField adds would be latency for nothing.
   */
  const search = (
    <div
      className={cn(
        "border-color-border p-2.5",
        anchor?.isAbove ? "border-t" : "border-b",
      )}
    >
      <TextField
        size="responsive"
        autoFocus
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder={`Search ${label.toLowerCase()}`}
      />
    </div>
  );

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

        {/*
          Always enabled, including at the cap. Disabling it there meant the
          only way to swap one choice for another was to remove a chip first and
          then reopen the list — and a dead button reads as broken, not as full.
          The cap is still enforced where it belongs: inside the list, on the
          options that aren't already picked.
        */}
        <AddChip ref={addRef} onClick={() => setIsOpen((open) => !open)} />
      </div>

      {value.length === 0 && emptyHint && (
        <p className="mt-2 font-satoshi text-[12px] text-color-secondary-text">
          {emptyHint}
        </p>
      )}

      {createPortal(
        <AnimatePresence>
          {isOpen && anchor && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: anchor.isAbove ? 6 : -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: anchor.isAbove ? 6 : -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              role="dialog"
              aria-label={label}
              style={{
                position: "fixed",
                left: anchor.left,
                width: anchor.width,
                top: anchor.top,
                bottom: anchor.bottom,
              }}
              className="z-[120] overflow-hidden rounded-[16px] border border-color-border bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
            >
              {/*
                The search box hugs whichever edge the Add button is on: top of
                the panel when the list drops down, bottom when it flips up. It
                is the thing the owner reaches for first, so it stays next to
                the button they just pressed rather than a list-height away.
              */}
              {hasSearch && !anchor.isAbove && search}

              <ul
                style={{ maxHeight: anchor.listMaxHeight }}
                className="scrollbar-thin overflow-y-auto p-1.5"
              >
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

              {hasSearch && anchor.isAbove && search}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
