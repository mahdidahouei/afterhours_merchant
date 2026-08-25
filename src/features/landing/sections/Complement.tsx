import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";
import puzzle from "@/assets/landing/complement/puzzle.webp";
import { CheckMark, CrossMark } from "../components/Marks";

const CLAIMS = [
  { Mark: CrossMark, text: "Not a reservation system", highlighted: false },
  { Mark: CrossMark, text: "Not a discount or deals platform", highlighted: false },
  { Mark: CheckMark, text: "A complimentary demand channel", highlighted: true },
];

export function Complement() {
  const [ref, inView] = useInViewOnce<HTMLElement>();

  return (
    <section
      ref={ref}
      className="relative flex h-auto w-full flex-col items-start justify-between gap-10 rounded-none px-6 tb:flex-row tb:items-center tb:gap-2 tb:px-0"
    >
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex w-full flex-col tb:min-w-0 tb:flex-1"
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-lora text-2xl font-medium leading-tight text-[#262626] lg:min-w-max lg:text-[32px]"
        >
          Designed to <em className="font-lora font-medium italic">complement</em>,{" "}
          <br className="hidden lg:block" />
          not to replace.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-5 max-w-[420px] font-satoshi text-[15px] font-normal leading-[150%] text-[#7D7D7D]"
        >
          Afterhours works alongside your reservation software. We operate as a
          complementary demand channel, routing diners into the systems you already
          use—without changing your workflow.
        </motion.p>

        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          className="mt-[44px] flex flex-col gap-4 tb:mt-[104px]"
        >
          {CLAIMS.map(({ Mark, text, highlighted }) => (
            <motion.p
              key={text}
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.5, ease: "easeOut" },
                },
              }}
              className={cn(
                "flex items-center gap-1.5 text-sm font-normal text-[#262626] lg:text-[18px]",
                highlighted &&
                  "-ml-3 w-fit rounded-full bg-color-primary px-2.5 py-2 pr-6 text-white lg:h-[52px] lg:pl-3 lg:pr-5",
              )}
            >
              <Mark /> {text}
            </motion.p>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex w-full items-center justify-center pt-8 tb:w-[55%] tb:shrink-0"
      >
        <img
          src={puzzle}
          alt="Afterhours slotting alongside your existing tools"
          className="w-full max-w-[440px] tb:max-w-none 2lg:w-[678px]"
        />
      </motion.div>
    </section>
  );
}
