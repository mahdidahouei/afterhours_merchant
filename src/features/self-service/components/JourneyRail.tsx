import { cn } from "@/lib/cn";
import { JOURNEY, RAIL_FOOTNOTE } from "../content/journey";

type Props = {
  /** Index into JOURNEY of the step being worked on. */
  activeIndex: number;
  /** Indexes the owner may click to. Empty means the rail is read-only. */
  reachable?: number[];
  onNavigate?: (index: number) => void;
};

/**
 * The desktop journey rail.
 *
 * Hidden below `lg`, where StepKicker carries the same information in the space
 * a phone actually has.
 *
 * Once a profile exists the rail is also the way back: the four editing steps
 * become buttons, so correcting a phone number from the bookings screen is one
 * click rather than three Backs. Steps the owner cannot return to stay as plain
 * text rather than dead-looking buttons — there is nothing to edit in a search
 * box or a one-time code, and after submission the claim is with an admin.
 */
export function JourneyRail({ activeIndex, reachable = [], onNavigate }: Props) {
  return (
    <aside className="hidden w-[280px] shrink-0 lg:block">
      <div className="sticky top-[92px]">
        <p className="font-satoshi text-[11px] font-semibold uppercase tracking-[0.14em] text-color-secondary-text">
          Your journey
        </p>

        <ol className="mt-5 flex flex-col">
          {JOURNEY.map((step, index) => {
            const isDone = index < activeIndex;
            const isActive = index === activeIndex;
            const canGo = Boolean(onNavigate) && reachable.includes(index) && !isActive;

            const marker = (
              <span
                aria-hidden
                className={cn(
                  "grid size-7 shrink-0 place-content-center rounded-full text-xs font-semibold transition-colors",
                  isDone && "bg-color-primary text-white",
                  isActive &&
                    "bg-color-secondary text-color-primary ring-2 ring-color-primary/25",
                  !isDone && !isActive && "border border-color-border text-color-secondary-text",
                )}
              >
                {isDone ? "✓" : index + 1}
              </span>
            );

            const label = (
              <>
                <p
                  className={cn(
                    "font-satoshi text-sm font-semibold transition-colors",
                    isActive || isDone
                      ? "text-color-primary-text"
                      : "text-color-secondary-text",
                    canGo && "group-hover:text-color-primary",
                  )}
                >
                  {step.title}
                  {isActive && <span className="sr-only"> (current step)</span>}
                </p>
                <p className="mt-0.5 font-satoshi text-[13px] font-normal text-color-secondary-text">
                  {/* Only say "go back" when it actually is back. A step ahead
                      is one they've already been through and can return to, so
                      it keeps its own subtitle. */}
                  {canGo && index < activeIndex ? "Go back and edit" : step.hint}
                </p>
              </>
            );

            return (
              <li key={step.id} className="flex gap-3.5">
                {/* Marker column: bullet plus the connector to the next step. */}
                <div className="flex flex-col items-center">
                  {marker}

                  {index < JOURNEY.length - 1 && (
                    <span
                      aria-hidden
                      className={cn(
                        "my-1 w-px flex-1 transition-colors",
                        isDone ? "bg-color-primary/40" : "bg-color-border",
                      )}
                    />
                  )}
                </div>

                <div className={cn("pb-7", index === JOURNEY.length - 1 && "pb-0")}>
                  {canGo ? (
                    <button
                      type="button"
                      onClick={() => onNavigate?.(index)}
                      className="group -m-1 rounded-[10px] p-1 text-left transition-colors hover:bg-color-secondary/40"
                    >
                      {label}
                    </button>
                  ) : (
                    label
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-2 max-w-[240px] font-satoshi text-[12px] leading-[150%] text-color-secondary-text">
          {RAIL_FOOTNOTE}
        </p>
      </div>
    </aside>
  );
}
