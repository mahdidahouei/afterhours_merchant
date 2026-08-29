import { cn } from "@/lib/cn";
import { JOURNEY } from "../content/journey";

type Props = {
  activeIndex: number;
  label: string;
  /** Indexes the owner may click to. Empty means the dots are decorative. */
  reachable?: number[];
  onNavigate?: (index: number) => void;
};

/**
 * The mobile stand-in for the rail: which step we're on, and a six-dot position
 * indicator. Shown below `lg`, where the rail is hidden.
 *
 * The dots carry the rail's back-navigation too, which is why the row is 44px
 * tall and each dot is padded to an 18px pitch rather than the 12px it would
 * take on its own. The padding cannot go much further: the dots sit edge to
 * edge, so anything wider is taken from the neighbour, and a tap landing past
 * a dot's own centre would navigate to the wrong step.
 */
export function StepKicker({ activeIndex, label, reachable = [], onNavigate }: Props) {
  return (
    <div className="lg:hidden">
      <p className="font-satoshi text-[12px] font-medium text-color-secondary-text">
        Step {activeIndex + 1} of {JOURNEY.length} · {label}
      </p>

      <ol className="mt-1 flex items-center" aria-label="Progress">
        {JOURNEY.map((step, index) => {
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;
          const canGo = Boolean(onNavigate) && reachable.includes(index) && !isActive;

          const dot = (
            <span
              className={cn(
                "block h-1.5 rounded-full transition-all duration-300",
                isActive ? "w-7 bg-color-primary" : "w-1.5",
                isDone && "bg-color-primary/45",
                !isDone && !isActive && "bg-[#D9D9D9]",
              )}
            />
          );

          return (
            <li key={step.id} aria-current={isActive ? "step" : undefined}>
              {canGo ? (
                <button
                  type="button"
                  onClick={() => onNavigate?.(index)}
                  className="flex h-11 items-center px-1.5"
                >
                  {dot}
                  <span className="sr-only">
                    {index < activeIndex ? "Go back to" : "Go to"} {step.title}
                  </span>
                </button>
              ) : (
                <span className="flex h-11 items-center px-1.5">
                  {dot}
                  <span className="sr-only">{step.short}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
