import { cn } from "@/lib/cn";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Visually hide the label but keep it for screen readers. */
  hideLabel?: boolean;
  disabled?: boolean;
  className?: string;
};

/** A labelled on/off control. Uses a real checkbox so it is keyboard-native. */
export function Switch({
  checked,
  onChange,
  label,
  hideLabel,
  disabled,
  className,
}: Props) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-3",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span
        aria-hidden
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
          "peer-focus-visible:outline-[color:var(--color-field-focus)]",
          checked ? "bg-color-primary" : "bg-[#D9D9D9]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </span>

      <span
        className={cn(
          "font-satoshi text-sm font-medium text-color-primary-text",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </span>
    </label>
  );
}
