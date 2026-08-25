import { motion } from "motion/react";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";
import { Section } from "../components/Section";
import { SectionHeading } from "../components/SectionHeading";
import { PARTNER_TYPES } from "../content/partnerTypes";

export function WhoWeWorkWith() {
  const [ref, inView] = useInViewOnce<HTMLElement>();

  return (
    <Section ref={ref}>
      <SectionHeading inView={inView}>Who we work with.</SectionHeading>

      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
        <div className="flex flex-col lg:max-w-[420px]">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-lora text-[24px] font-medium leading-[1.2] text-[#262626] tb:text-[30px]"
          >
            10,000+ Diners, Limited Restaurants.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-[18px] font-satoshi text-[14px] font-normal leading-[150%] text-[#262626]"
          >
            We focus on quality over volume. Afterhours introduces restaurants to diners
            who actively use the platform to decide where to eat. Each restaurant is one
            we'd confidently recommend — so diners know what to expect, and our
            restaurants get visibility that feels considered, not promotional.
          </motion.p>
        </div>

        <div className="flex w-full flex-1 lg:justify-end">
          <motion.div
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={{
              visible: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
            }}
            className="flex w-full flex-wrap gap-3 lg:max-w-[492px]"
          >
            {PARTNER_TYPES.map((tag) => (
              <motion.div
                key={tag}
                variants={{
                  hidden: { opacity: 0, scale: 0.88 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.35, ease: "easeOut" },
                  },
                }}
                className="rounded-full bg-color-secondary pb-[10px] pl-[20px] pr-[20px] pt-[8px] text-color-primary shadow-[0_0_4px_2px_rgba(0,0,0,0.25)]"
              >
                <span className="font-satoshi text-[14px] font-normal">{tag}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
