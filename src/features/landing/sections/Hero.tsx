import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";
import threeDiners from "@/assets/landing/hero/three-diners.png";
import { ConnectButton } from "../components/ConnectButton";
import { HERO_VIDEOS, type HeroVideo } from "../content/heroVideos";

const CARD_WIDTH = 204;
const CARD_HEIGHT = 402;
const CARD_GAP = 14;
const TRACK_WIDTH = HERO_VIDEOS.length * (CARD_WIDTH + CARD_GAP);
const SCROLL_DURATION_S = 55;

export function Hero() {
  const [ref, inView] = useInViewOnce<HTMLElement>();

  // The splash image in index.html covers the white flash before hydration.
  // Once the hero is mounted there is something real to look at, so drop it.
  useEffect(() => {
    const timer = setTimeout(() => document.getElementById("splash-screen")?.remove(), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      ref={ref}
      className={cn(
        "relative -mt-32 flex min-h-[580px] flex-col overflow-hidden tb:-mt-20",
        "lg:flex-row lg:items-center lg:gap-4",
        // Break out of the layout gutter so the marquee reaches the viewport edge.
        "tb:-ml-[30px] tb:-mr-[30px] lg:ml-0 lg:-mr-12 3xl:-mr-36",
      )}
    >
      <div className="relative z-10 flex shrink-0 flex-col justify-center px-6 pb-12 pt-20 max-lg:items-center max-lg:text-center tb:pl-[54px] tb:pt-10 lg:w-[48%] lg:pb-0 lg:pl-0 lg:pt-0">
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-lora text-[22px] font-medium leading-[115%] text-[#262626] md:text-[27px] lg:text-[32px] 3xl:text-[40px]"
        >
          Receive Reservations from <br className="hidden lg:block" />
          <span className="font-satoshi font-light">10,000+</span> Gen Z &amp; Millennial
          diners, <br className="hidden lg:block" />
          without lifting a finger.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="mt-3 font-satoshi text-[14px] font-normal leading-relaxed text-[#7D7D7D] md:text-[16px] lg:text-[18px]"
        >
          No admin, we plug directly into your booking system.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
          className="mt-6"
        >
          <ConnectButton
            text="Start Getting Reservations"
            hideIcon
            className="h-[44px] w-auto rounded-full px-8 font-satoshi text-[13px] font-medium lg:h-[50px] lg:origin-left lg:text-[14px]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.6, delay: 0.38, ease: "easeOut" }}
          className="mt-[44px] flex flex-col gap-3 lg:mt-[68px]"
        >
          <p className="font-lora text-[13px] font-normal text-[#7D7D7D] md:text-[14px] lg:text-[15px]">
            Seamlessly integrated with{" "}
            <span className="font-lora font-semibold text-[#262626]">Guestplan</span>,{" "}
            <span className="font-lora font-semibold text-[#262626]">Formitable</span> &amp;{" "}
            <span className="font-lora font-semibold text-[#262626]">GoTable</span>.
          </p>

          <div className="inline-flex h-[44px] w-fit items-center gap-2 rounded-full border border-[#D0C8C0] px-3 max-lg:mx-auto lg:h-[50px] lg:gap-3 lg:px-4">
            <img src={threeDiners} alt="Utrecht diners" className="h-6 w-auto lg:h-8" />
            <p className="font-satoshi text-[11px] font-medium text-[#262626] tb:text-[13px] lg:text-[14px]">
              Limited partnerships available in Utrecht.
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.9, delay: 0.2 }}
        className="relative flex h-[280px] flex-1 items-center overflow-hidden lg:h-[402px]"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-20 bg-gradient-to-r from-white to-transparent lg:block" />

        {/* The track is rendered twice and translated by exactly one copy's
            width, so the loop point is invisible. */}
        <motion.div
          className="flex shrink-0 gap-[14px]"
          style={{ willChange: "transform" }}
          animate={{ x: [0, -TRACK_WIDTH] }}
          transition={{
            duration: SCROLL_DURATION_S,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
          }}
        >
          {[...HERO_VIDEOS, ...HERO_VIDEOS].map((video, index) => (
            <HeroVideoCard key={index} video={video} />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

/**
 * One clip in the marquee.
 *
 * Neither the poster nor the <video> exists until the card first scrolls into
 * range, so the browser never fetches 20 clips up front. Once mounted they stay
 * mounted — re-entering view is then instant, with no flash.
 */
function HeroVideoCard({ video }: { video: HeroVideo }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          videoRef.current?.play().catch(() => {});
        } else {
          videoRef.current?.pause();
        }
      },
      { rootMargin: "200px", threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // When the observer is what caused the mount, the <video> didn't exist yet.
  useEffect(() => {
    if (mounted) videoRef.current?.play().catch(() => {});
  }, [mounted]);

  return (
    <div
      ref={cardRef}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      className="relative shrink-0 overflow-hidden rounded-[20px] bg-[#E8E8E8]"
    >
      {mounted && (
        <>
          <img
            src={video.poster}
            alt=""
            decoding="async"
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
              isPlaying ? "opacity-0" : "opacity-100",
            )}
          />
          <video
            ref={videoRef}
            src={video.src}
            muted
            loop
            playsInline
            preload="metadata"
            onPlaying={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />

      <div
        className="absolute bottom-[46px] left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full py-2 pl-4 pr-7"
        style={{
          background: "rgba(20, 10, 5, 0.55)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}
      >
        <img src={video.icon} alt="" className="h-[16px] w-[16px] shrink-0" />
        <span className="font-satoshi text-[12px] font-medium text-white">{video.tag}</span>
      </div>
    </div>
  );
}
