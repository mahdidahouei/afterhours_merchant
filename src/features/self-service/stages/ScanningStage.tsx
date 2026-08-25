import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Claim } from "../api/types";
import { StageHeading, StagePanel } from "../components/ClaimLayout";

/** Roughly how long a scan takes, used only to pace the client-side bar. */
const EXPECTED_SCAN_MS = 22_000;

/**
 * What we tell the owner we're doing, in order.
 *
 * The contract is explicit that `scanning` is one state with no sub-steps and
 * no activity feed — the server reports no progress at all. So this is honest
 * about being an estimate: it is a paced reassurance, not a report. The bar
 * eases toward 90% and waits there until the real status changes.
 */
const BEATS = [
  "Opening your site",
  "Reading your menus",
  "Looking for your story",
  "Finding your contact details",
  "Checking how guests book",
  "Putting it together",
];

type Props = { claim: Claim };

export function ScanningStage({ claim }: Props) {
  const progress = useClientProgress();
  const beat = BEATS[Math.min(Math.floor((progress / 90) * BEATS.length), BEATS.length - 1)];

  return (
    <StagePanel>
      <StageHeading title="Reading your website.">
        {claim.place.websiteUri ?? "Your website"}
      </StageHeading>

      {/*
        Live region so a screen reader hears the phase change without the
        progress bar chattering a number every frame.
      */}
      <p aria-live="polite" className="font-satoshi text-[15px] font-medium text-color-primary-text">
        {beat}…
      </p>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Reading your website"
        className="mt-4 h-2 overflow-hidden rounded-full bg-color-secondary/50"
      >
        <motion.div
          className="h-full rounded-full bg-color-primary"
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeOut", duration: 0.6 }}
        />
      </div>

      <ul className="mt-6 flex flex-col gap-2.5">
        {BEATS.map((label, index) => {
          const threshold = ((index + 1) / BEATS.length) * 90;
          const isDone = progress >= threshold;
          const isCurrent = !isDone && progress >= (index / BEATS.length) * 90;

          return (
            <li key={label} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={
                  "grid size-4 shrink-0 place-content-center rounded-full text-[9px] transition-colors " +
                  (isDone
                    ? "bg-color-primary text-white"
                    : isCurrent
                      ? "border-2 border-color-primary"
                      : "border border-color-border")
                }
              >
                {isDone ? "✓" : ""}
              </span>
              <span
                className={
                  "font-satoshi text-[13px] transition-colors " +
                  (isDone || isCurrent
                    ? "text-color-primary-text"
                    : "text-color-secondary-text")
                }
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 font-satoshi text-[12px] text-color-secondary-text">
        Usually takes 15–30 seconds. Feel free to stretch.
      </p>
    </StagePanel>
  );
}

/**
 * A bar that eases toward 90% and stops.
 *
 * It never reaches 100 on its own: the only thing that finishes this screen is
 * the claim's status changing, which the page is polling for. Anything else
 * would be the UI claiming to know something it doesn't.
 */
function useClientProgress(): number {
  const [progress, setProgress] = useState(6);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      // Asymptotic: fast at first, crawling as it approaches the ceiling.
      const eased = 90 * (1 - Math.exp(-elapsed / (EXPECTED_SCAN_MS / 2.5)));
      setProgress(Math.max(6, eased));
    }, 400);

    return () => clearInterval(timer);
  }, []);

  return progress;
}
