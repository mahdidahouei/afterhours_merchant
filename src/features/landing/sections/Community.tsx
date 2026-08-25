import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";
import threeDiners from "@/assets/landing/hero/three-diners.png";
import { COMMUNITY_PHOTOS } from "../content/communityPhotos";
import { ROUTES } from "../content/links";

const CARD_WIDTH = 156;
const CARD_HEIGHT = 226;
const CARD_GAP = 12;
const TRACK_WIDTH = COMMUNITY_PHOTOS.length * (CARD_WIDTH + CARD_GAP);
const SCROLL_DURATION_S = 55;

export function Community() {
  const [ref, inView] = useInViewOnce<HTMLElement>();
  const navigate = useNavigate();

  return (
    <section ref={ref} className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center px-4 sm:px-6 tb:px-0"
      >
        <div className="flex items-center gap-[8px] rounded-full border border-[#D0C8C0] pb-[8px] pl-[12px] pr-[14px] pt-[8px]">
          <img src={threeDiners} alt="" className="h-8 w-auto" />
          <span className="font-satoshi text-[14px] font-medium text-[#262626]">
            Live with 150+ selected restaurants
          </span>
        </div>

        <h2 className="mt-[28px] text-center font-lora text-[22px] font-medium leading-[1.2] text-[#262626] sm:text-[26px] tb:text-[32px]">
          Connect your restaurant to Utrecht's <br className="hidden tb:block" />
          <em className="font-satoshi italic">intent-based</em> community of diners.
        </h2>

        <p className="mt-[16px] text-center font-satoshi text-[18px] font-normal text-[#262626]">
          <strong className="font-bold">Limited collection</strong> placement available in
          Utrecht.
        </p>
      </motion.div>

      {/* Breaks out of the layout gutter so the strip runs edge to edge. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mt-[28px] w-full overflow-hidden tb:-mx-[30px] tb:w-[calc(100%+60px)] lg:-mx-12 lg:w-[calc(100%+96px)] 3xl:-mx-36 3xl:w-[calc(100%+288px)]"
      >
        <div className="flex">
          <motion.div
            className="flex shrink-0"
            style={{ gap: CARD_GAP, willChange: "transform" }}
            animate={{ x: [0, -TRACK_WIDTH] }}
            transition={{
              duration: SCROLL_DURATION_S,
              ease: "linear",
              repeat: Infinity,
              repeatType: "loop",
            }}
          >
            {[...COMMUNITY_PHOTOS, ...COMMUNITY_PHOTOS].map((photo, index) => (
              <div
                key={index}
                style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
                className="shrink-0 overflow-hidden rounded-[20px]"
              >
                <img
                  src={photo}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-[28px] flex flex-col items-center gap-[16px]"
      >
        <button
          type="button"
          onClick={() => navigate(ROUTES.connect)}
          className="rounded-full bg-[#F7DF89] px-[40px] py-[14px] font-satoshi text-[16px] font-medium text-color-primary transition-all hover:scale-105"
        >
          Start Getting Reservations
        </button>

        <p className="font-lora text-[14px] font-normal text-[#7D7D7D]">
          Works seamlessly with{" "}
          <span className="font-lora font-semibold text-[#262626]">Guestplan</span>,{" "}
          <span className="font-lora font-semibold text-[#262626]">Formitable</span> &amp;{" "}
          <span className="font-lora font-semibold text-[#262626]">GoTable</span>.
        </p>
      </motion.div>
    </section>
  );
}
