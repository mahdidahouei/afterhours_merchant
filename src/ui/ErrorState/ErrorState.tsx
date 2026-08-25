import { cn } from "@/lib/cn";
import { toAppError } from "@/lib/errors";
import { Button } from "@/ui/Button";
import InfoCircleIcon from "@/assets/icons/info-circle.svg?react";

type Props = {
  /** An AppError, a raw thrown value, or a ready-made sentence. */
  error?: unknown;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
};

/**
 * What a failed request looks like.
 *
 * The old flows had no equivalent: when the city list or the platform guide
 * failed, the screen simply stayed blank — and with a 30 second timeout that
 * meant half a minute of nothing before still nothing. Every fetch that can
 * block a step renders this instead.
 */
export function ErrorState({ error, message, onRetry, retryText = "Try again", className }: Props) {
  const appError = error === undefined ? undefined : toAppError(error);
  const text = message ?? appError?.message ?? "Something went wrong. Please try again.";

  // Don't invite a retry that cannot possibly work — a 404 or a rejected API key
  // returns the same result however many times it is sent.
  const canRetry = Boolean(onRetry) && (appError?.isRetryable ?? true);

  return (
    <div
      role="alert"
      className={cn("my-auto flex flex-col items-center gap-3 px-4 text-center", className)}
    >
      <InfoCircleIcon className="size-10 text-color-danger" />

      <p className="max-w-[420px] text-base font-medium leading-7 text-color-secondary-text">
        {text}
      </p>

      {canRetry && (
        <Button variant="secondary" size="small" onClick={onRetry} className="h-[48px] text-xs">
          {retryText}
        </Button>
      )}
    </div>
  );
}
