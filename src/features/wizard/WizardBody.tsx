import { motion } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * Scrollable body between the wizard header and the mobile action bar.
 * `layout="position"` keeps content from jumping while the card resizes.
 */
export function WizardBody({
  className,
  contentClassName,
  children,
}: {
  /** Outer padding wrapper. */
  className?: string;
  /** Inner column. */
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex min-h-0 flex-col px-5 max-tb:flex-1 tb:px-7 tb:pb-9 tb:pt-6 lg:h-full lg:justify-between 2lg:px-[50px]",
        className,
      )}
    >
      <div className={cn("flex h-full min-h-0 w-full flex-col items-center gap-6", contentClassName)}>
        {children}
      </div>
    </motion.div>
  );
}
