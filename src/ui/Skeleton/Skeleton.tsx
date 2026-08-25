import { cn } from "@/lib/cn";

type Props = {
  /** When false, renders the shimmer instead of `children`. */
  isLoaded?: boolean;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Placeholder shimmer. Replaces @nextui-org/skeleton, which cost four packages
 * and a Tailwind plugin to do exactly this.
 *
 * Wrapping is deliberate: `isLoaded={false}` keeps the child mounted but hidden,
 * so the box never changes size when real content arrives.
 */
export function Skeleton({ isLoaded = true, className, children }: Props) {
  if (isLoaded) return <>{children}</>;

  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-[10px] bg-[var(--color-skeleton)]",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.6s_infinite]",
        "after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent",
        className,
      )}
    >
      <div className="invisible">{children}</div>
    </div>
  );
}
