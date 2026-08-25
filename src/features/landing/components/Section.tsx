import { forwardRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Standard landing section shell: the horizontal gutters every section shares.
 * Sections that break out of the gutters (Hero, Community marquee) don't use it.
 */
export const Section = forwardRef<HTMLElement, React.ComponentProps<"section">>(
  function Section({ className, children, ...rest }, ref) {
    return (
      <section
        ref={ref}
        className={cn("flex flex-col gap-[24px] px-4 sm:px-6 tb:px-0", className)}
        {...rest}
      >
        {children}
      </section>
    );
  },
);
