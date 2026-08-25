import { useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";
import { useIsBelowDesktop } from "@/lib/hooks/useMediaQuery";
import { Card } from "../components/Card";
import { ScaledPill } from "../components/ScaledPill";
import { Section } from "../components/Section";
import { SectionHeading } from "../components/SectionHeading";
import { HOW_IT_WORKS_STEPS } from "../content/howItWorksSteps";
import { useStepScroll, type StepIndex } from "../hooks/useStepScroll";

const STEPS: StepIndex[] = [1, 2, 3];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inViewRef, inView] = useInViewOnce<HTMLElement>(0.1);
  const { step, setStep } = useStepScroll(sectionRef);

  const active = HOW_IT_WORKS_STEPS[step - 1];

  return (
    <Section
      ref={(node) => {
        sectionRef.current = node;
        inViewRef.current = node;
      }}
    >
      <SectionHeading inView={inView}>From discovery to revenue.</SectionHeading>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <Card className="relative flex h-[600px] flex-col overflow-hidden sm:h-[640px] tb:h-[640px] lg:h-[450px] lg:flex-row">
          <div className="flex shrink-0 flex-col gap-[18px] px-6 py-6 tb:gap-[32px] tb:px-[40px] tb:pb-[80px] tb:pt-[40px] lg:flex-1 lg:px-[50px] lg:py-[50px]">
            <StepTabs step={step} onChange={setStep} />

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col"
              >
                <h2
                  className={cn(
                    "font-lora text-[24px] font-normal leading-[1.2] text-[#262626] lg:text-[24px]",
                    active.headingClassName,
                  )}
                >
                  {active.heading}
                </h2>

                <p
                  className={cn(
                    "mt-[10px] font-satoshi text-[14px] font-normal leading-[150%] text-[#262626]",
                    active.bodyClassName,
                  )}
                >
                  {active.body}
                </p>

                {active.pill && (
                  <div className={active.pillWrapperClassName}>
                    <ScaledPill>{active.pill}</ScaledPill>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex min-h-0 flex-1 items-start justify-center px-6 lg:items-center lg:pl-[50px] lg:pr-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className={cn("flex h-full w-full", active.visualClassName)}
              >
                <img
                  src={active.image}
                  alt={active.imageAlt}
                  className={active.imageClassName}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </Section>
  );
}

/** Three tabs; the active one widens and fills to reveal its full label. */
function StepTabs({
  step,
  onChange,
}: {
  step: StepIndex;
  onChange: (step: StepIndex) => void;
}) {
  const isCompact = useIsBelowDesktop();

  return (
    <div className="flex gap-3">
      {STEPS.map((value) => {
        const isActive = value === step;
        return (
          <motion.button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-current={isActive}
            animate={{
              width: isActive ? (isCompact ? 113 : 168) : isCompact ? 44 : 64,
              backgroundColor: isActive ? "#EDE5D8" : "rgba(237, 229, 216, 0)",
            }}
            transition={{ duration: 0.3 }}
            className="h-11 cursor-pointer overflow-hidden rounded-full text-sm font-light text-color-primary lg:h-16 lg:text-[20px]"
          >
            <span className="flex h-full w-full items-center justify-center whitespace-nowrap text-center">
              {isActive ? `Step ${value}` : value}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
