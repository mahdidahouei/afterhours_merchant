import { forwardRef, useId } from "react";
import {
  useController,
  type FieldPath,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/ui/Skeleton";
import styles from "./TextField.module.scss";

export type TextFieldSize = "default" | "responsive";

export type TextFieldProps = Omit<React.ComponentPropsWithoutRef<"input">, "size"> & {
  size?: TextFieldSize;
  /** Doubles as the floating label — the two are never different. */
  placeholder: string;
  /**
   * Grey text shown inside an empty field, with the label pinned up above it.
   *
   * Only for a field whose label and placeholder genuinely say different things
   * — "TikTok · optional" over "Not found — add if you have one". Without it the
   * label *is* the placeholder, which is the normal case and stays the default.
   */
  hint?: string;
  /** Leading icon; also shifts the text inset. */
  icon?: React.ReactNode;
  /** Trailing adornment, e.g. a spinner while a search is in flight. */
  trailing?: React.ReactNode;
  errorMessage?: string;
  /** Mark invalid but don't reserve a line for the message. */
  hideErrorMessage?: boolean;
  isLoaded?: boolean;
  containerClassName?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    size = "default",
    placeholder,
    hint,
    icon,
    trailing,
    errorMessage,
    hideErrorMessage,
    isLoaded = true,
    className,
    containerClassName,
    disabled,
    ...inputProps
  },
  ref,
) {
  const id = useId();
  const showError = Boolean(errorMessage) && !hideErrorMessage;

  return (
    <Skeleton
      isLoaded={isLoaded}
      className={cn(size === "responsive" && "w-auto", containerClassName)}
    >
      <div
        className={cn(
          styles.field,
          size === "responsive" && styles.responsive,
          hint && styles.hasHint,
          !icon && styles.noIcon,
          disabled && styles.disabled,
          containerClassName,
        )}
      >
        <input
          {...inputProps}
          ref={ref}
          id={id}
          disabled={disabled}
          // The float is driven by `:placeholder-shown`, so the input always
          // carries one; a hint just makes it the visible text as well.
          placeholder={hint ?? placeholder}
          aria-invalid={Boolean(errorMessage) || undefined}
          className={cn(errorMessage && styles.invalid, className)}
          style={{ paddingRight: trailing ? "3rem" : "2rem" }}
        />

        <label htmlFor={id} className={styles.label}>
          {placeholder}
        </label>

        {icon && <span className={styles.icon}>{icon}</span>}
        {trailing && <span className={styles.trailing}>{trailing}</span>}
      </div>

      {showError && <p className={styles.error}>{errorMessage}</p>}
    </Skeleton>
  );
});

/* ── react-hook-form binding ────────────────────────────────────────────── */

type ControlledProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> = Omit<TextFieldProps, "name" | "value" | "onChange" | "onBlur"> &
  UseControllerProps<TValues, TName>;

export function ControlledTextField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  ...rest
}: ControlledProps<TValues, TName>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules,
    defaultValue,
    shouldUnregister,
  });

  return (
    <TextField
      {...rest}
      name={field.name}
      ref={field.ref}
      value={field.value ?? ""}
      onChange={field.onChange}
      onBlur={field.onBlur}
      errorMessage={fieldState.error?.message}
    />
  );
}
