import { forwardRef } from "react";
import { Link as RouterLink, type To } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Spinner } from "@/ui/Spinner";
import { Ripple } from "./Ripple";
import styles from "./Button.module.scss";

export type ButtonVariant = "default" | "primary" | "secondary" | "outline-connect";
export type ButtonSize = "normal" | "small" | "responsive";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: styles.default,
  primary: styles.primary,
  secondary: styles.secondary,
  "outline-connect": styles.outlineConnect,
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  normal: styles.normal,
  small: styles.small,
  responsive: styles.responsive,
};

function shellClass(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(styles.base, SIZE_CLASS[size], VARIANT_CLASS[variant], className);
}

/** A spinner on a filled background needs the cream dots, not the dark ones. */
const spinnerIsLight = (variant: ButtonVariant, disabled?: boolean) =>
  Boolean(disabled) || variant === "primary" || variant === "secondary";

type Styling = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/* ── Button ─────────────────────────────────────────────────────────────── */

type ButtonProps = Styling &
  Omit<React.ComponentPropsWithoutRef<"button">, "className"> & {
    isLoading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "default", size = "normal", isLoading, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={shellClass(variant, size, className)}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading ? (
        <Spinner small light={spinnerIsLight(variant, rest.disabled)} />
      ) : (
        children
      )}
      <Ripple />
    </button>
  );
});

/* ── Link ───────────────────────────────────────────────────────────────── */

type LinkProps = Styling & {
  to: To;
  state?: unknown;
  style?: React.CSSProperties;
  "aria-label"?: string;
  children?: React.ReactNode;
};

/** A router link wearing the button's clothes. */
export function Link({
  to,
  state,
  style,
  variant = "default",
  size = "normal",
  className,
  children,
  ...rest
}: LinkProps) {
  return (
    <RouterLink
      to={to}
      state={state}
      style={style}
      className={shellClass(variant, size, className)}
      {...rest}
    >
      {children}
    </RouterLink>
  );
}

/* ── Icon-only ──────────────────────────────────────────────────────────── */

type IconButtonProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  "aria-label": string;
  children: React.ReactNode;
};

/** Square, transparent, shrink-wrapped around its icon. */
export function IconButton({
  onClick,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(styles.base, styles.icon, className)}
      style={{ padding: 8 }}
      {...rest}
    >
      {children}
      <Ripple />
    </button>
  );
}

/** IconButton that navigates instead of calling back. */
export function IconLink({
  to,
  className,
  children,
  ...rest
}: {
  to: To;
  className?: string;
  "aria-label": string;
  children: React.ReactNode;
}) {
  return (
    <RouterLink
      to={to}
      className={cn(styles.base, styles.icon, className)}
      style={{ padding: 8 }}
      {...rest}
    >
      {children}
    </RouterLink>
  );
}
