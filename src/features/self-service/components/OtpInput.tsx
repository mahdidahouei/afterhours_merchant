import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { CODE_LENGTH } from "../api/types";

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Fired when the last box is filled, so the owner needn't press a button. */
  onComplete?: (value: string) => void;
  /** Defaults to the contract's code length; boxes are drawn from this. */
  length?: number;
  hasError?: boolean;
  disabled?: boolean;
};

/**
 * A fixed-length numeric code, one box per digit.
 *
 * The boxes are separate inputs because that is what the design shows and what
 * password managers expect, but they behave as one field: typing advances,
 * backspace retreats, arrows move, and a pasted code fills the row from
 * wherever it lands. `inputMode="numeric"` plus `autocomplete="one-time-code"`
 * is what makes iOS offer the code straight from the SMS.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = CODE_LENGTH,
  hasError,
  disabled,
}: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.padEnd(length, " ").slice(0, length).split("");

  useEffect(() => {
    if (value.length === length) onComplete?.(value);
    // Fire once per completed code, not on every keystroke that keeps it full.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, length]);

  const focus = (index: number) => refs.current[Math.max(0, Math.min(index, length - 1))]?.focus();

  const setDigit = (index: number, digit: string) => {
    const next = value.padEnd(length, " ").split("");
    next[index] = digit;
    onChange(next.join("").replace(/\s/g, " ").trimEnd().replace(/\s/g, ""));
  };

  const handleChange = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;

    // Typing over a filled box, or a paste landing mid-row, both fill forward.
    const chars = typed.split("");
    const next = value.padEnd(length, " ").split("");
    chars.forEach((char, offset) => {
      if (index + offset < length) next[index + offset] = char;
    });

    onChange(next.join("").replace(/\s+$/, ""));
    focus(index + chars.length);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]?.trim()) {
        setDigit(index, " ");
      } else {
        setDigit(index - 1, " ");
        focus(index - 1);
      }
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focus(index - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focus(index + 1);
    }
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          value={digit.trim()}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          className={cn(
            "size-11 rounded-[12px] border-2 text-center font-satoshi text-[19px] font-semibold",
            "text-color-primary-text transition-colors outline-none",
            "xs:size-12 sm:size-[52px] sm:text-[21px]",
            hasError
              ? "border-color-danger"
              : digit.trim()
                ? "border-color-primary"
                : "border-color-border focus:border-[color:var(--color-field-focus)]",
            disabled && "opacity-50",
          )}
        />
      ))}
    </div>
  );
}
