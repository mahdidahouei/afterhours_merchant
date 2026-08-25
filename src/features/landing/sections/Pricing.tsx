import { motion } from "motion/react";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";
import Chart from "@/assets/landing/pricing/chart.svg?react";
import { Card } from "../components/Card";
import { CrossMark } from "../components/Marks";

const QUIET_PERIODS = [
  "Early weekdays",
  "Late afternoons",
  "Gaps between peak services",
];

export function Pricing() {
  const [ref, inView] = useInViewOnce<HTMLElement>();

  return (
    <section ref={ref} className="flex flex-col items-center px-4 sm:px-6 tb:px-0">
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5 }}
        className="text-center font-lora text-[22px] font-medium text-[#262626] tb:text-[28px] lg:text-[32px]"
      >
        Intelligent pricing for quiet hours —{" "}
        {/* Satoshi, not the heading's Lora — the emphasis is set in the body face. */}
        <em className="font-satoshi font-bold italic text-color-primary">Coming next.</em>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="mt-[16px] text-center font-satoshi text-[16px] font-normal text-[#262626]"
      >
        a <span className="font-medium">partner-only</span> feature designed to improve
        off-peak utilization automatically.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mt-[16px] flex w-full flex-col gap-3 tb:mt-[30px] tb:flex-row tb:gap-[16px]"
      >
        <Card
          tone="cream"
          className="flex w-full shrink-0 flex-col p-6 pl-8 tb:w-[35%] tb:p-[36px]"
        >
          <h3 className="font-lora text-[22px] font-semibold text-[#262626] tb:text-[28px]">
            Unrealized revenue
          </h3>
          <p className="mt-[10px] font-satoshi text-[15px] font-normal leading-[150%] text-[#262626]">
            Across most restaurants, quieter hours run below capacity despite fixed
            operating costs. Afterhours is building a way to convert these moments into
            incremental demand — automatically, while maintaining brand values.
          </p>

          <p className="mt-[20px] font-lora text-[15px] font-semibold text-[#262626] tb:mt-[42px]">
            Common Patterns
          </p>
          <div className="mt-[12px] flex flex-col gap-[12px]">
            {QUIET_PERIODS.map((period) => (
              <div key={period} className="flex items-center gap-[10px]">
                <CrossMark className="size-6 shrink-0" />
                <span className="font-satoshi text-[15px] font-normal text-[#262626]">
                  {period}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-1 items-center justify-center">
          <div className="flex w-full flex-col items-center px-6 py-6 tb:px-[80px] tb:py-[64px] lg:px-[150px]">
            <Chart style={{ width: "100%", height: "auto", maxWidth: 450 }} />
            <p className="mt-[16px] text-center font-satoshi text-[11px] font-medium text-[#262626] tb:mt-[36px]">
              Time-of-day view
            </p>
          </div>
        </Card>
      </motion.div>
    </section>
  );
}
