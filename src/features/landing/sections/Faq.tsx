import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";
import ChevronDown from "@/assets/icons/chevron-down.svg?react";
import { FAQS, FAQ_PREVIEW_COUNT, type FaqEntry } from "../content/faq";

export function Faq() {
  const [ref, inView] = useInViewOnce<HTMLElement>();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const preview = FAQS.slice(0, FAQ_PREVIEW_COUNT);
  const rest = FAQS.slice(FAQ_PREVIEW_COUNT);

  const toggle = (index: number) =>
    setOpenIndex((current) => (current === index ? null : index));

  return (
    <section ref={ref} className="flex flex-col gap-10 max-tb:px-6">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6 }}
        className="text-center text-2xl font-normal text-[#262626] md:text-[32px] 3xl:text-4xl"
      >
        Do you have questions?
      </motion.h2>

      <motion.div
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="mx-auto flex w-full max-w-2xl flex-col gap-3"
      >
        {preview.map((faq, index) => (
          <motion.div
            key={faq.question}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, ease: "easeOut" },
              },
            }}
          >
            <FaqItem
              faq={faq}
              isOpen={openIndex === index}
              onToggle={() => toggle(index)}
            />
          </motion.div>
        ))}

        <AnimatePresence initial={false}>
          {showAll && (
            <motion.div
              key="rest"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex flex-col gap-3 overflow-hidden"
            >
              {rest.map((faq, offset) => {
                const index = offset + FAQ_PREVIEW_COUNT;
                return (
                  <FaqItem
                    key={faq.question}
                    faq={faq}
                    isOpen={openIndex === index}
                    onToggle={() => toggle(index)}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {rest.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="mt-2 flex items-center justify-center gap-2 text-sm font-medium text-color-primary 3xl:text-base"
          >
            {showAll ? "Show less" : "Show more"}
            <motion.span
              animate={{ rotate: showAll ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="flex"
            >
              <ChevronDown />
            </motion.span>
          </button>
        )}
      </motion.div>
    </section>
  );
}

function FaqItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FaqEntry;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      animate={{ backgroundColor: isOpen ? "#EDE5D8" : "rgba(255,255,255,0.6)" }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={cn(
        "overflow-hidden rounded-2xl border border-[#D6C9BB]",
        isOpen && "border-[rgba(50,27,21,0.3)]",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-sm font-medium text-[#262626] 3xl:text-base">
          {faq.question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0 text-2xl leading-none text-color-primary"
        >
          +
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <p className="whitespace-pre-line px-6 pb-5 text-sm font-light leading-[160%] text-[#7D7D7D] 3xl:text-base">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
