import { motion } from "motion/react";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";
import photo from "@/assets/landing/use-case/photo.webp";
import Guestplan from "@/assets/landing/use-case/guestplan.svg?react";
import SocialDeal from "@/assets/landing/use-case/social-deal.svg?react";
import Logo from "@/assets/brand/logo.svg?react";
import { Card } from "../components/Card";
import { Section } from "../components/Section";
import { SectionHeading } from "../components/SectionHeading";

export function UseCase() {
  const [ref, inView] = useInViewOnce<HTMLElement>(0.15);

  return (
    <Section ref={ref}>
      <SectionHeading inView={inView}>An example use case.</SectionHeading>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex flex-col gap-[34px] tb:flex-row tb:items-start"
      >
        <img
          src={photo}
          alt="A chef-led restaurant in Utrecht"
          className="h-[220px] w-full rounded-[37px] object-cover object-[center_10%] sm:h-[280px] tb:h-[578px] tb:w-[280px] tb:shrink-0 lg:w-[332px]"
        />

        {/* Fixed height at every breakpoint so the two halves split evenly. */}
        <Card className="relative flex h-[900px] flex-1 flex-col overflow-hidden rounded-[22px] sm:h-[960px] sm:rounded-[37px] tb:h-[578px]">
          {/* Cream backdrop with a shallow V, covering the top half. */}
          <svg
            viewBox="0 0 1000 500"
            preserveAspectRatio="none"
            aria-hidden
            className="absolute inset-x-0 top-0 w-full [height:calc(50%-16px)] tb:[height:calc(50%+4px)] lg:[height:calc(50%+24px)]"
          >
            <path
              d="M37,0 H963 Q1000,0 1000,37 V420 L508,498 Q500,500 492,498 L0,420 V37 Q0,0 37,0 Z"
              fill="#EDE5D8"
            />
          </svg>

          <div className="relative flex flex-1 flex-col items-center justify-center px-8 py-8 tb:translate-y-[4px] tb:px-[40px] lg:translate-y-0 lg:px-[60px] lg:py-0">
            <div className="flex items-center gap-[16px]">
              <Guestplan className="h-[21px] w-auto lg:h-[28px]" />
              <SocialDeal className="h-[23px] w-auto lg:h-[31px]" />
            </div>
            <p className="mt-3 text-center font-satoshi text-[13px] font-normal leading-[150%] text-[#262626] tb:text-[15px] lg:mt-[30px] lg:text-[16px]">
              Stephan runs a chef-led restaurant in Utrecht. He manages reservations
              through Guestplan and has tried discount platforms to fill quieter hours —
              but finds they attract the wrong diners and chip away at the brand identity
              he's spent years building.
            </p>
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center px-8 py-8 tb:px-[40px] lg:px-[60px] lg:py-0">
            <Logo className="h-[18px] w-auto lg:h-[24px]" />
            <p className="mt-3 text-center font-satoshi text-[13px] font-normal leading-[150%] text-[#262626] tb:text-[15px] lg:mt-[20px] lg:text-[16px]">
              Stephan connected his Guestplan account to Afterhours. His restaurant is now
              placed into intent-based collections — seen daily by thousands of
              high-intent diners. Bookings flow directly into Guestplan, resulting in
              incremental reservations with no extra work.
            </p>
            <div className="mt-3 whitespace-nowrap rounded-full bg-color-primary px-[14px] pb-[6px] pt-[2px] text-center lg:mt-[20px] lg:px-[24px] lg:pb-[8px] lg:pt-[4px]">
              <span className="font-satoshi text-[11px] font-bold text-white tb:text-[13px] lg:text-[16px]">
                5–10 incremental reservations per day
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    </Section>
  );
}
