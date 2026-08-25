/**
 * The circled ✕ / ✓ marks used by Complement and Pricing.
 *
 * These were the only two exports actually used out of a 627-line icon module
 * in the old project; the other ten were dead.
 */

export function CrossMark({ className }: { className?: string }) {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      aria-hidden
      className={className ?? "max-lg:size-6"}
    >
      <circle cx="14.7855" cy="14.7855" r="14.7855" fill="#262626" />
      <path d="M20.5641 9.64355L9.63574 20.5719" stroke="white" strokeWidth="2.57576" />
      <path d="M9.63412 9.64355L20.5625 20.5719" stroke="white" strokeWidth="2.57576" />
    </svg>
  );
}

export function CheckMark({ className }: { className?: string }) {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      aria-hidden
      className={className ?? "max-lg:size-6"}
    >
      <circle cx="14.7855" cy="14.7855" r="14.7855" fill="#EDE5D8" />
      <path
        d="M22.5362 10.3857L13.6032 19.3188L7.72559 14.1759"
        stroke="#321B15"
        strokeWidth="2.57576"
        strokeLinecap="round"
      />
    </svg>
  );
}
