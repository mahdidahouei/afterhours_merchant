import { useEffect, useRef } from "react";
import { Item, SelectItemText, Viewport } from "@radix-ui/react-select";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/cn";
import type { SelectOption } from "./types";
import styles from "./Select.module.scss";

const ROW_HEIGHT = 50;

type Props = {
  options: SelectOption[];
  /** Index within `options`, or -1. Drives scroll-into-view on open. */
  selectedIndex: number;
};

/**
 * Virtualized option list. The dial-code picker renders ~200 countries, so the
 * list is windowed rather than mounted whole.
 */
export function SelectOptions({ options, selectedIndex }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: options.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
  });

  // Depend on the primitive index, never on the option object: in a searchable
  // select the parent re-renders on every keystroke, and a new object identity
  // here would re-run scrollToIndex, refocus the row, and steal the caret out
  // of the search box.
  useEffect(() => {
    if (selectedIndex >= 0) {
      virtualizer.scrollToIndex(selectedIndex, { align: "auto" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  if (options.length === 0) {
    return (
      <Viewport className={styles.list}>
        <p className={styles.empty}>option not found</p>
      </Viewport>
    );
  }

  return (
    <Viewport ref={scrollRef} className={styles.list}>
      <div style={{ position: "relative", width: "100%", height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(({ index, key, size, start }) => {
          const option = options[index];
          return (
            <Item
              // Key by value, not by index: React then reuses the same Item
              // across filter changes, so Radix's mount-time focus effect
              // doesn't fire and pull focus off the search input.
              key={String(option.value)}
              value={String(option.value)}
              textValue={option.label}
              className={styles.item}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: size,
                transform: `translateY(${start}px)`,
              }}
              data-key={key}
            >
              <span
                className={cn(
                  styles.itemContent,
                  index === selectedIndex && styles.isSelected,
                )}
              >
                <span className={styles.label}>
                  <SelectItemText>{option.label}</SelectItemText>
                </span>
              </span>
            </Item>
          );
        })}
      </div>
    </Viewport>
  );
}
