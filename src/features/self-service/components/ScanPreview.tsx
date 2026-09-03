import { cn } from "@/lib/cn";

/**
 * A small browser window with a line sweeping down it, shown while the scan
 * runs.
 *
 * It stands in for the owner's site being read: chrome at the top, skeleton
 * rows breathing underneath, and a scan line travelling the height of the page.
 * Purely decorative — the server reports no progress at all during `scanning`,
 * so nothing here is driven by anything real, which is exactly why it is
 * `aria-hidden` rather than dressed up as a status.
 *
 * The design's cream tints come from `color-secondary` at various opacities and
 * its scan line from `--color-field-focus`, rather than the raw hexes in the
 * mock — one palette, one place to change it.
 */

/** Left offset, width and the delay that staggers each skeleton row. */
const ROWS = [
  { width: "55%", height: "h-2.5", tone: "bg-color-secondary", delay: "0ms" },
  { width: "90%", height: "h-[7px]", tone: "bg-color-secondary/50", delay: "200ms" },
  { width: "80%", height: "h-[7px]", tone: "bg-color-secondary/50", delay: "350ms" },
] as const;

const CHIP_DELAYS = ["500ms", "650ms", "800ms"] as const;

export function ScanPreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative w-[240px] overflow-hidden rounded-[14px] border-[1.5px] border-color-border bg-white",
        "shadow-[0_2px_8px_rgba(50,27,21,0.06)]",
        className,
      )}
    >
      {/* Chrome: three dots and an address bar. */}
      <div className="flex items-center gap-[5px] border-b border-color-border bg-color-secondary/40 px-2.5 py-2">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="size-[7px] rounded-full bg-color-secondary" />
        ))}
        <span className="ml-1 h-3 flex-1 rounded-full border border-color-border bg-white" />
      </div>

      {/* The page being read. */}
      <div className="flex flex-col gap-[7px] px-3 pb-3.5 pt-3">
        {ROWS.map((row) => (
          <span
            key={row.delay}
            style={{ width: row.width, animationDelay: row.delay }}
            className={cn(
              "animate-scan-pulse rounded motion-reduce:animate-none",
              row.height,
              row.tone,
            )}
          />
        ))}

        <div className="mt-[3px] flex gap-1.5">
          {CHIP_DELAYS.map((delay) => (
            <span
              key={delay}
              style={{ animationDelay: delay }}
              className="h-[26px] w-11 animate-scan-pulse rounded-md bg-color-secondary/60 motion-reduce:animate-none"
            />
          ))}
        </div>

        <span
          style={{ width: "70%", animationDelay: "950ms" }}
          className="h-[7px] animate-scan-pulse rounded bg-color-secondary/50 motion-reduce:animate-none"
        />
      </div>

      {/*
        The scan line. `scan-sweep` animates `top`, so the gradient above the
        line and the line itself travel together as one band.
      */}
      <div className="pointer-events-none absolute inset-x-0 h-[34px] animate-scan-sweep motion-reduce:animate-none">
        <div className="to-[color:var(--color-field-focus)]/10 absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-transparent" />
        <div
          className="absolute inset-x-0 top-8 h-0.5"
          style={{
            background:
              "linear-gradient(90deg, rgb(var(--color-field-focus-rgb) / 0.15), var(--color-field-focus), rgb(var(--color-field-focus-rgb) / 0.15))",
          }}
        />
      </div>
    </div>
  );
}
