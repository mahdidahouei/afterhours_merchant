import { motion } from "motion/react";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";
import illustration from "@/assets/landing/what-we-do/illustration.webp";
import { Card } from "../components/Card";
import { Section } from "../components/Section";
import { SectionHeading } from "../components/SectionHeading";
import { CATEGORIES } from "../content/categories";

export function WhatWeDo() {
  const [ref, inView] = useInViewOnce<HTMLElement>();

  return (
    <Section ref={ref}>
      <SectionHeading inView={inView}>What we do.</SectionHeading>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <Card className="relative flex h-auto flex-col gap-3 overflow-hidden tb:gap-6 lg:h-[450px] lg:flex-row lg:gap-0">
          <div className="flex min-w-0 flex-1 flex-col justify-center px-6 pb-0 pt-6 tb:px-[40px] tb:py-[36px] lg:px-[50px] lg:py-0">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-lora text-[24px] font-medium leading-[1.2] text-[#262626] lg:text-[30px]"
            >
              From <span className="font-lora font-semibold italic">Intention</span> to
              Reservations, <br className="hidden lg:block" />a discovery layer designed
              to work for you.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-[10px] font-satoshi text-[14px] font-normal leading-[150%] text-[#262626] tb:mt-[18px]"
            >
              Afterhours is a discovery layer for high-intent diners to find restaurants.
              We <strong className="font-bold">carefully select</strong> restaurants and
              place them into intent-based collections for our community of diners to
              drive quality reservations directly into your existing reservation system.
            </motion.p>

            <motion.div
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              variants={{
                visible: { transition: { staggerChildren: 0.07, delayChildren: 0.4 } },
              }}
              className="mt-[12px] flex flex-wrap gap-3 tb:mt-[20px]"
            >
              {CATEGORIES.map(({ Icon, label }) => (
                <motion.div
                  key={label}
                  variants={{
                    hidden: { opacity: 0, scale: 0.85 },
                    visible: {
                      opacity: 1,
                      scale: 1,
                      transition: { duration: 0.35, ease: "easeOut" },
                    },
                  }}
                  className="flex items-center gap-[8px] rounded-full bg-color-secondary px-[18px] py-[10px] shadow-card [backdrop-filter:blur(12px)]"
                >
                  <Icon width={20} height={20} style={{ color: "#321B15" }} />
                  <span className="font-satoshi text-[12px] font-medium text-[#262626]">
                    {label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex w-full justify-center self-end px-6 tb:px-[40px] lg:w-[42%] lg:shrink-0 lg:justify-center lg:px-0"
          >
            <img
              src={illustration}
              alt="Diners browsing Afterhours collections"
              className="h-auto max-h-[220px] w-auto tb:max-h-[350px] lg:h-[408px] lg:max-h-none"
            />
          </motion.div>
        </Card>
      </motion.div>
    </Section>
  );
}
