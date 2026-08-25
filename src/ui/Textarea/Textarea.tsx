import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Edit2 } from "iconsax-reactjs";
import {
  useController,
  type FieldPath,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/ui/Skeleton";
import InfoCircleIcon from "@/assets/icons/info-circle.svg?react";
import styles from "./Textarea.module.scss";

export type TextareaSize = "normal" | "full-width";

const POP = {
  variants: { hidden: { scale: 0 }, show: { scale: 1 } },
  initial: "hidden",
  animate: "show",
  exit: "hidden",
  transition: { type: "spring" as const, duration: 0.7 },
};

export type TextareaProps = Omit<
  React.ComponentPropsWithoutRef<"textarea">,
  "size"
> & {
  size?: TextareaSize;
  maxLength?: number;
  hasError?: boolean;
  isLoaded?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      size = "normal",
      maxLength = 400,
      hasError,
      isLoaded = true,
      className,
      onKeyUp,
      ...rest
    },
    ref,
  ) {
    const id = useId();
    const containerRef = useRef<HTMLLabelElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [length, setLength] = useState(0);

    // Leaving the box commits the edit, same as pressing "confirm".
    useEffect(() => {
      if (!isEditing) return;

      const onPointerDown = (event: MouseEvent) => {
        if (containerRef.current?.contains(event.target as Node)) return;
        setIsEditing(false);
        textareaRef.current?.blur();
      };

      document.addEventListener("mousedown", onPointerDown);
      return () => document.removeEventListener("mousedown", onPointerDown);
    }, [isEditing]);

    const stopEditing = (event: React.MouseEvent) => {
      event.preventDefault();
      setIsEditing(false);
      textareaRef.current?.blur();
    };

    return (
      <Skeleton isLoaded={isLoaded} className="rounded-[18px]">
        <label
          ref={containerRef}
          htmlFor={id}
          onFocus={() => setIsEditing(true)}
          className={cn(
            styles.container,
            size === "full-width" ? styles.fullWidth : styles.normal,
            isEditing && styles.editing,
            hasError && styles.invalid,
            className,
          )}
        >
          <textarea
            {...rest}
            id={id}
            maxLength={maxLength}
            ref={(node) => {
              textareaRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            onKeyUp={(event) => {
              setLength(event.currentTarget.value.length);
              onKeyUp?.(event);
            }}
          />

          <AnimatePresence>
            {!isEditing && (
              <motion.div {...POP} className={styles.adornment}>
                {hasError ? (
                  <InfoCircleIcon />
                ) : (
                  <button
                    type="button"
                    aria-label="Edit message"
                    className="grid size-4 place-content-center"
                    onClick={(event) => {
                      event.preventDefault();
                      setIsEditing(true);
                      textareaRef.current?.focus();
                    }}
                  >
                    <Edit2 size={16} variant="Outline" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className={styles.controls}>
            <p>{maxLength - length} letters remaining</p>
            <AnimatePresence>
              {isEditing && (
                <motion.button {...POP} type="button" onClick={stopEditing}>
                  confirm
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </label>
      </Skeleton>
    );
  },
);

/* ── react-hook-form binding ────────────────────────────────────────────── */

export function ControlledTextarea<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  ...rest
}: Omit<TextareaProps, "name" | "value" | "onChange" | "onBlur"> &
  UseControllerProps<TValues, TName>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules,
    defaultValue,
    shouldUnregister,
  });

  return (
    <Textarea
      {...rest}
      name={field.name}
      ref={field.ref}
      value={field.value ?? ""}
      onChange={field.onChange}
      onBlur={field.onBlur}
      hasError={Boolean(fieldState.error)}
    />
  );
}
