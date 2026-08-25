import { motion } from "motion/react";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";
import { Card } from "../components/Card";
import { BENEFITS } from "../content/benefits";

export function Benefits() {
  const [ref, inView] = useInViewOnce<HTMLElement>();

  return (
    <section ref={ref} className="px-4 sm:px-6 tb:px-0">
      <Card
        tone="cream"
        className="px-6 py-[36px] [backdrop-filter:none] lg:px-[80px] lg:py-[64px]"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <h2 className="text-center font-lora text-[22px] font-normal text-[#262626] tb:text-[30px]">
            Designed to be <strong className="font-lora font-bold">simple</strong> and
            risk-free.
          </h2>
          <p className="mt-[12px] text-center font-satoshi text-[14px] font-normal text-[#262626]">
            Afterhours operates on four core principles.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={{
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
          }}
          className="mt-[30px] grid grid-cols-2 gap-x-6 gap-y-8 lg:mt-[50px] lg:grid-cols-4 lg:gap-6"
        >
          {BENEFITS.map(({ icon, title, description }) => (
            <motion.div
              key={title}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, ease: "easeOut" },
                },
              }}
              className="flex flex-col items-center"
            >
              <img
                src={icon}
                alt=""
                className="h-[96px] w-[96px] object-contain"
              />
              <h3 className="mt-[16px] text-center font-satoshi text-[16px] font-bold text-[#262626] lg:mt-[48px]">
                {title}
              </h3>
              <p className="mt-[10px] text-center font-satoshi text-[15px] font-normal text-[#262626]">
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Card>
    </section>
  );
}
