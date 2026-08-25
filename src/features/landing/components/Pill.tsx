import { forwardRef } from "react";
import { cn } from "@/lib/cn";

/** Dark rounded label used for the standout claims inside How it works. */
export const Pill = forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
  function Pill({ className, children, ...rest }, ref) {
    return (
      <span
        ref={ref}
        className={cn(
          "w-fit whitespace-nowrap rounded-full bg-color-primary px-[20px] pb-[8px] pt-[4px] text-center",
          "font-satoshi text-[12px] font-medium text-white",
          className,
        )}
        {...rest}
      >
        {children}
      </span>
    );
  },
);
