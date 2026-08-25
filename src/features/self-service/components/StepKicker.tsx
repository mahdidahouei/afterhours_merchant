import { cn } from "@/lib/cn";
import { JOURNEY } from "../content/journey";

type Props = {
  activeIndex: number;
  label: string;
};

/**
 * The mobile stand-in for the rail: which step we're on, and a five-dot
 * position indicator. Shown below `lg`, where the rail is hidden.
 */
export function StepKicker({ activeIndex, label }: Props) {
  return (
    <div className="lg:hidden">
      <p className="font-satoshi text-[12px] font-medium text-color-secondary-text">
        Step {activeIndex + 1} of {JOURNEY.length} · {label}
      </p>

      <ol className="mt-3 flex items-center gap-1.5" aria-label="Progress">
        {JOURNEY.map((step, index) => {
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;

          return (
            <li
              key={step.id}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                isActive ? "w-7 bg-color-primary" : "w-1.5",
                isDone && "bg-color-primary/45",
                !isDone && !isActive && "bg-[#D9D9D9]",
              )}
            >
              <span className="sr-only">{step.short}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
