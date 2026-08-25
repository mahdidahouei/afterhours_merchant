import { forwardRef, useEffect, useState } from "react";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { Spinner } from "@/ui/Spinner";
import { TextField } from "@/ui/TextField";
import SearchIcon from "@/assets/icons/search.svg?react";

/**
 * How long typing must pause before the query is published.
 *
 * Carried over from the old implementation unchanged so search behaves exactly
 * as it does today. It is long for a filter that runs against an in-memory list
 * — 150ms would feel far better. Change here to change it everywhere.
 */
export const SEARCH_DEBOUNCE_MS = 1200;

type Props = {
  /** Current committed query, so the caller owns the value. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  size?: "default" | "responsive";
  className?: string;
};

/**
 * Debounced text input. Shows a spinner while the typed text and the committed
 * query disagree, which is the only honest signal that something is pending.
 */
export const SearchField = forwardRef<HTMLInputElement, Props>(function SearchField(
  { value, onChange, placeholder = "Search", icon = <SearchIcon />, size = "default", className },
  ref,
) {
  const [draft, setDraft] = useState(value);
  const committed = useDebouncedValue(draft, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    onChange(committed);
    // The caller's setter is not guaranteed stable; only the value should retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committed]);

  const isPending = draft !== committed;

  return (
    <TextField
      ref={ref}
      size={size}
      icon={icon}
      placeholder={placeholder}
      value={draft}
      containerClassName={className}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        // Enter commits immediately rather than waiting out the debounce.
        if (event.key === "Enter") onChange(event.currentTarget.value);
      }}
      trailing={isPending ? <Spinner small /> : undefined}
    />
  );
});
