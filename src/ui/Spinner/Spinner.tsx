import { cn } from "@/lib/cn";
import styles from "./Spinner.module.scss";

type Props = {
  className?: string;
  /** 20px instead of 40px, with no margin — for use inside buttons and fields. */
  small?: boolean;
  /** Cream dots, for placing on a dark (primary) background. */
  light?: boolean;
};

/** Two-dot pulse. The app's only loading indicator. */
export function Spinner({ className, small, light }: Props) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(styles.spinner, small && styles.small, light && styles.light, className)}
    >
      <span className={cn(styles.bounce, styles.bounceLead)} />
      <span className={cn(styles.bounce, styles.bounceTrail)} />
    </div>
  );
}
