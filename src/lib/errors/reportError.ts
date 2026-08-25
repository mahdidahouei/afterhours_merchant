import { toAppError } from "./normalize";

/**
 * The single place errors are recorded.
 *
 * Today that means the console in development and a GA event in production.
 * When a real error tracker is added, it is wired here and nowhere else — no
 * call site needs to change.
 */
export function reportError(error: unknown, context?: Record<string, unknown>) {
  const appError = toAppError(error);

  if (import.meta.env.DEV) {
    console.error(`[${appError.kind}] ${appError.message}`, {
      status: appError.status,
      ...context,
      cause: appError.cause,
    });
    return;
  }

  // Never send the message body: it can echo user input back into analytics.
  window.gtag?.("event", "exception", {
    description: appError.kind,
    status: appError.status,
    fatal: false,
    ...context,
  });
}
