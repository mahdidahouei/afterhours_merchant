import { cn } from "@/lib/cn";

type Props = {
  label: string;
  /** Small pill on the label row — the design uses it for "Builds your profile". */
  badge?: string;
  /** Rendered instead of an input when the contract can't accept a change. */
  readOnly?: boolean;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  inputMode?: "text" | "tel" | "url";
  autoComplete?: string;
  /** Sits under the field, in the design's smaller grey. */
  hint?: React.ReactNode;
  className?: string;
};

/**
 * The boxed, top-labelled field the details step is built from.
 *
 * Distinct from `ui/TextField`, which floats its label into the border and is
 * what the landing, connect and contact forms use. This design puts the label
 * inside the box above the value, and the two shapes don't reconcile — so this
 * stays local to the feature rather than bending the shared primitive into
 * doing both.
 */
export function DetailField({
  label,
  badge,
  readOnly,
  value,
  onChange,
  placeholder,
  inputMode = "text",
  autoComplete,
  hint,
  className,
}: Props) {
  return (
    <div className={className}>
      <div
        className={cn(
          "rounded-[16px] border border-color-border px-4 py-3 transition-colors",
          readOnly
            ? "bg-color-background-3"
            : "bg-white focus-within:border-[color:var(--color-field-focus)]",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-satoshi text-[11px] font-semibold uppercase tracking-[0.12em] text-color-secondary-text">
            {label}
          </span>
          {badge && (
            <span className="shrink-0 rounded-full bg-color-secondary px-2.5 py-0.5 font-satoshi text-[11px] font-medium text-color-primary">
              {badge}
            </span>
          )}
        </div>

        {readOnly ? (
          <p className="mt-1 font-satoshi text-[15px] text-color-primary-text">
            {value || "—"}
          </p>
        ) : (
          <input
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            placeholder={placeholder}
            inputMode={inputMode}
            autoComplete={autoComplete}
            aria-label={label}
            className="mt-1 w-full border-0 bg-transparent p-0 font-satoshi text-[15px] text-color-primary-text outline-none placeholder:text-color-disabled-text"
          />
        )}
      </div>

      {hint && (
        <p className="mt-1.5 pl-1 font-satoshi text-[12px] leading-[150%] text-color-secondary-text">
          {hint}
        </p>
      )}
    </div>
  );
}
