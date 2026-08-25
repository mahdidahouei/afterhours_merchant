import { useCallback, useMemo, useRef, useState } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { motion } from "motion/react";
import {
  useController,
  type FieldPath,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/ui/Skeleton";
import { Spinner } from "@/ui/Spinner";
import ChevronDownIcon from "@/assets/icons/chevron-down.svg?react";
import { SelectOptions } from "./SelectOptions";
import { SelectSearch } from "./SelectSearch";
import type { SelectOption } from "./types";
import styles from "./Select.module.scss";

export type SelectSize = "responsive" | "big" | "square";

const SIZE_CLASS: Record<SelectSize, string> = {
  responsive: styles.responsive,
  big: styles.big,
  square: styles.square,
};

export type SelectProps<TValue extends string | number = string> = {
  options: SelectOption<TValue>[];
  value?: TValue | null;
  defaultValue?: TValue;
  onChange?: (value: TValue) => void;
  onBlur?: () => void;
  name?: string;
  placeholder?: string;
  size?: SelectSize;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Adds a filter box inside the dropdown. */
  isSearchable?: boolean;
  isLoading?: boolean;
  isLoaded?: boolean;
  errorMessage?: string;
  hideErrorMessage?: boolean;
  className?: string;
  containerClassName?: string;
};

/** Radix works in strings; callers work in their own value type. */
const keyOf = (value: string | number) => String(value);

export function Select<TValue extends string | number = string>({
  options,
  value,
  defaultValue,
  onChange,
  onBlur,
  name,
  placeholder = "select an option",
  size = "responsive",
  icon,
  disabled,
  isSearchable,
  isLoading,
  isLoaded = true,
  errorMessage,
  hideErrorMessage,
  className,
  containerClassName,
}: SelectProps<TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);

  const current = value ?? defaultValue ?? null;

  const visible = useMemo(() => {
    if (!isSearchable || !search.trim()) return options;
    const needle = search.toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, isSearchable, search]);

  const selected = useMemo(
    () => options.find((option) => option.value === current) ?? null,
    [options, current],
  );

  const selectedIndex = useMemo(
    () => (selected ? visible.findIndex((o) => o.value === selected.value) : -1),
    [visible, selected],
  );

  const handleValueChange = useCallback(
    (next: string) => {
      const option = options.find((o) => keyOf(o.value) === next);
      if (option) onChange?.(option.value);
    },
    [options, onChange],
  );

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearch("");
      onBlur?.();
    }
  };

  const isEmpty = selected === null;
  // Placeholder doubles as the field label: it sits centred like body text while
  // the field is untouched, then shrinks to a caption once there's a value.
  const placeholderAsCaption = !isEmpty || isOpen;
  const showPlaceholder = !(size === "square" && !isEmpty);
  const showError = Boolean(errorMessage) && !hideErrorMessage;

  return (
    <div className={containerClassName}>
      <div
        className={cn(
          styles.container,
          SIZE_CLASS[size],
          disabled && styles.disabled,
          "overflow-hidden",
        )}
      >
        <RadixSelect.Root
          name={name}
          disabled={disabled}
          // Empty string rather than undefined: passing undefined would make the
          // component uncontrolled until something is picked, and React warns
          // when it later flips to controlled.
          value={selected ? keyOf(selected.value) : ""}
          onValueChange={handleValueChange}
          onOpenChange={handleOpenChange}
        >
          <Skeleton isLoaded={isLoaded} className={styles.container}>
            <RadixSelect.Trigger
              ref={triggerRef}
              aria-label={placeholder}
              className={cn(
                styles.trigger,
                isOpen && styles.open,
                errorMessage && styles.invalid,
                className,
              )}
            >
              {icon}

              <span className={cn(styles.details, "truncate")}>
                {showPlaceholder && (
                  <span
                    className={cn(
                      styles.label,
                      "min-w-0 truncate transition-all duration-200 ease-in-out",
                      placeholderAsCaption
                        ? "translate-y-0 text-[10px] font-normal text-color-secondary-text"
                        : "translate-y-[11.5px] text-sm font-medium",
                    )}
                  >
                    {placeholder}
                  </span>
                )}

                <span className={cn(styles.selected, "truncate")}>
                  <span className={cn(styles.label, "min-w-0 truncate text-sm font-medium")}>
                    <span className="hidden">
                      <RadixSelect.Value />
                    </span>
                    {selected?.shortLabel ?? selected?.label}
                  </span>
                </span>
              </span>

              <RadixSelect.Icon className={styles.trailing}>
                {isLoading ? <Spinner small /> : <ChevronDownIcon />}
              </RadixSelect.Icon>
            </RadixSelect.Trigger>
          </Skeleton>

          <RadixSelect.Portal>
            <RadixSelect.Content
              position="popper"
              className={styles.portal}
              style={{ width: triggerRef.current?.clientWidth, minWidth: 155 }}
            >
              <motion.div
                className={styles.panel}
                style={{ originX: 0.85, originY: 0 }}
                initial={{ scale: 0, y: -16, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
              >
                {isSearchable && <SelectSearch value={search} onChange={setSearch} />}

                <SelectOptions
                  options={visible as SelectOption[]}
                  selectedIndex={selectedIndex}
                />
              </motion.div>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </RadixSelect.Root>
      </div>

      {showError && <p className={styles.errorMessage}>{errorMessage}</p>}
    </div>
  );
}

/* ── react-hook-form binding ────────────────────────────────────────────── */

export function ControlledSelect<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
  TValue extends string | number = string,
>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  ...rest
}: Omit<SelectProps<TValue>, "name" | "value" | "onChange" | "onBlur"> &
  UseControllerProps<TValues, TName>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules,
    defaultValue,
    shouldUnregister,
  });

  return (
    <Select<TValue>
      {...rest}
      name={field.name}
      value={field.value ?? null}
      onChange={field.onChange}
      onBlur={field.onBlur}
      errorMessage={fieldState.error?.message}
    />
  );
}
