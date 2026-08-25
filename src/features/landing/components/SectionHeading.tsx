import { motion } from "motion/react";

/**
 * The small centred caption that titles most sections ("What we do.",
 * "Who we work with.", …). Five sections repeated this markup verbatim.
 */
export function SectionHeading({ children, inView }: { children: React.ReactNode; inView: boolean }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.5 }}
      className="text-center font-satoshi text-[24px] font-normal text-[#262626]"
    >
      {children}
    </motion.p>
  );
}
