import { cn } from "@/lib/cn";

type Props = React.ComponentProps<"div"> & {
  /** Cream instead of white. */
  tone?: "white" | "cream";
};

/**
 * The rounded, softly shadowed panel used by What we do, How it works,
 * Use case, Pricing and Benefits. Four sections previously repeated the same
 * inline `style` block with the same two-layer shadow and backdrop blur.
 */
export function Card({ tone = "white", className, style, ...rest }: Props) {
  return (
    <div
      className={cn(
        "rounded-[37px] shadow-card [backdrop-filter:blur(12px)]",
        tone === "cream" ? "bg-color-secondary" : "bg-white",
        className,
      )}
      style={style}
      {...rest}
    />
  );
}
