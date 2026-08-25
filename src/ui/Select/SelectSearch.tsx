import { useCallback, useEffect, useRef } from "react";
import SearchIcon from "@/assets/icons/search.svg?react";
import styles from "./Select.module.scss";

/**
 * Filter box inside the dropdown.
 *
 * Radix's SelectContent runs its own typeahead and focus management, both of
 * which assume the only focusable things inside are options. Two defences are
 * needed, and both have to be native listeners because React's synthetic
 * events fire too late to stop Radix's:
 *
 *   1. Swallow key events so typing filters instead of jumping between options.
 *   2. Take focus back when Radix's item-mount effect steals it.
 */
export function SelectSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const attach = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (!node) return;

    const swallow = (event: Event) => event.stopPropagation();
    node.addEventListener("keydown", swallow);
    node.addEventListener("keyup", swallow);
    node.addEventListener("keypress", swallow);

    const reclaim = () => {
      requestAnimationFrame(() => {
        if (!node.isConnected || document.activeElement === node) return;
        node.focus();
      });
    };
    node.addEventListener("blur", reclaim);
  }, []);

  useEffect(() => {
    // After Radix has finished its own open-time focus work.
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={styles.searchRow}
      onKeyDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={styles.searchBox}>
        <SearchIcon />
        <input
          ref={attach}
          type="text"
          value={value}
          placeholder="Search..."
          aria-label="Filter options"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}
