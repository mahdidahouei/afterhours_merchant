import { motion } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * The white panel the wizard lives in: full-screen on mobile, a centred card
 * from `lg` up. It animates its own height so advancing a step glides rather
 * than snapping.
 */
export function WizardCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      layout="size"
      style={{ zIndex: 10, overflow: "hidden" }}
      className={cn(
        "flex h-screen w-screen flex-col bg-white",
        "shadow-[10px_30px_40px_0px_rgba(158,161,160,0.10)]",
        "lg:h-auto lg:max-h-[500px] lg:w-auto lg:min-w-[850px] lg:rounded-[20px]",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
