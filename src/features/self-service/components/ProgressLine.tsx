import { JOURNEY } from "../content/journey";

/** The hairline at the very top of the page. Decorative — the kicker has the text. */
export function ProgressLine({ activeIndex }: { activeIndex: number }) {
  const pct = ((activeIndex + 1) / JOURNEY.length) * 100;

  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-[200] h-[3px] bg-color-secondary/60">
      <div
        className="h-full rounded-r-full bg-color-primary transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
