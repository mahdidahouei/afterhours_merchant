import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import type { Claim } from "../api/types";
import { StagePanel } from "../components/ClaimLayout";
import { ScanPreview } from "../components/ScanPreview";

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
  const beat =
    BEATS[Math.min(Math.floor((progress / 90) * BEATS.length), BEATS.length - 1)];

  return (
    <StagePanel className="text-center">
      {/* The design centres this step around the preview. */}
      <div className="mx-auto flex max-w-[560px] flex-col items-center">
        <ScanPreview className="mb-[18px]" />

        <h1 className="font-lora text-[24px] font-medium italic text-color-primary-text">
          Reading your website.
        </h1>

        {claim.place.websiteUri && (
          <p className="mt-1.5 rounded-lg bg-color-secondary/40 px-3 py-1 font-mono text-[13px] text-color-secondary-text">
            {claim.place.websiteUri}
          </p>
        )}

        {/*
        Live region so a screen reader hears the phase change without the
        progress bar chattering a number every frame.
      */}
        <p
          aria-live="polite"
          className="mt-3 min-h-[22px] animate-scan-pulse font-satoshi text-[14px] text-[color:var(--color-field-focus)] motion-reduce:animate-none"
        >
          {beat}…
        </p>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label="Reading your website"
          className="mt-[26px] h-1.5 w-full overflow-hidden rounded-full bg-color-secondary/70"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[color:var(--color-field-focus)] to-color-secondary-hover"
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.6 }}
          />
        </div>

        <p className="mt-2 font-satoshi text-[12px] text-color-secondary-text">
          {Math.round(progress)}% complete
        </p>

        <div className="mt-[22px] w-full rounded-[14px] border border-color-border bg-color-secondary/40 px-[18px] py-[15px] text-left">
          <p className="mb-[11px] font-satoshi text-[10px] font-bold uppercase tracking-[0.09em] text-[color:var(--color-field-focus)]">
            What we're finding
          </p>

          <ul className="flex flex-col gap-[7px]">
            {BEATS.map((label, index) => {
              const threshold = ((index + 1) / BEATS.length) * 90;
              const isDone = progress >= threshold;
              const isCurrent = !isDone && progress >= (index / BEATS.length) * 90;

              return (
                <li key={label} className="flex items-center gap-[9px]">
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 shrink-0 rounded-full transition-colors",
                      isDone
                        ? "bg-color-success"
                        : isCurrent
                          ? "bg-[color:var(--color-field-focus)]"
                          : "bg-color-border",
                    )}
                  />
                  <span
                    className={cn(
                      "font-satoshi text-[13px] transition-colors",
                      isDone
                        ? "text-color-success"
                        : isCurrent
                          ? "text-[color:var(--color-field-focus)]"
                          : "text-color-secondary-text",
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-4 font-satoshi text-[12px] text-color-disabled-text">
          Usually takes 15–30 seconds. Feel free to stretch.
        </p>
      </div>
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
