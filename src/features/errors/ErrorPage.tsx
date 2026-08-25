import { useEffect } from "react";
import { Link } from "react-router-dom";
import { reportError, toAppError } from "@/lib/errors";
import { Button } from "@/ui/Button";
import Logo from "@/assets/brand/logo-mark.svg?react";

type Props = {
  error?: unknown;
  /** Where the failure was caught, for the error report. */
  source?: string;
};

/**
 * Whole-screen failure. Purely presentational — callers supply the error, so
 * this works identically as a router `errorElement` and as an ErrorBoundary
 * fallback.
 *
 * The most common cause in production is a lazy chunk that no longer exists
 * because a deploy landed while the tab was open. Reloading re-fetches
 * index.html and picks up the new manifest, which is why it leads.
 */
export default function ErrorPage({ error, source = "boundary" }: Props) {
  useEffect(() => {
    if (error !== undefined) reportError(error, { source });
  }, [error, source]);

  const isOffline = error !== undefined && toAppError(error).kind === "offline";

  return (
    <div className="flex min-h-screen flex-col bg-color-secondary px-6 py-8 tb:px-12">
      <header>
        <Link to="/" aria-label="Afterhours home">
          <Logo />
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <h1 className="font-lora text-2xl font-bold text-color-primary tb:text-[32px]">
          Something went wrong
        </h1>

        <p className="max-w-[440px] text-base font-medium text-color-secondary-text">
          {isOffline
            ? "You appear to be offline. Reconnect, then reload this page."
            : "We hit an unexpected problem. Reloading usually clears it."}
        </p>

        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
            className="w-[220px]"
          >
            Reload
          </Button>
          <Link
            to="/"
            className="text-sm font-medium text-color-primary underline underline-offset-4"
          >
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
