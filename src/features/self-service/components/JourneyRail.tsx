import { cn } from "@/lib/cn";
import { JOURNEY, RAIL_FOOTNOTE } from "../content/journey";

type Props = {
  /** Index into JOURNEY of the step being worked on. */
  activeIndex: number;
};

/**
 * The desktop journey rail.
 *
 * Hidden below `lg`, where StepKicker carries the same information in the space
 * a phone actually has. It is a static list, not navigation — an owner cannot
 * jump to step 4 before finishing step 2, so nothing here is clickable.
 */
export function JourneyRail({ activeIndex }: Props) {
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

            return (
              <li key={step.id} className="flex gap-3.5">
                {/* Marker column: bullet plus the connector to the next step. */}
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-7 shrink-0 place-content-center rounded-full text-xs font-semibold transition-colors",
                      isDone && "bg-color-primary text-white",
                      isActive && "bg-color-secondary text-color-primary ring-2 ring-color-primary/25",
                      !isDone && !isActive && "border border-color-border text-color-secondary-text",
                    )}
                  >
                    {isDone ? "✓" : index + 1}
                  </span>

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
                  <p
                    className={cn(
                      "font-satoshi text-sm font-semibold transition-colors",
                      isActive || isDone
                        ? "text-color-primary-text"
                        : "text-color-secondary-text",
                    )}
                  >
                    {step.title}
                    {isActive && <span className="sr-only"> (current step)</span>}
                  </p>
                  <p className="mt-0.5 font-satoshi text-[13px] font-normal text-color-secondary-text">
                    {step.hint}
                  </p>
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
