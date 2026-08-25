/**
 * Every failure this app can show a user, reduced to one of eight kinds.
 *
 * The point of a closed set is that UI code branches on a value it can
 * exhaustively handle, instead of sniffing at `error.response?.status` at each
 * call site — which is how the old code ended up with four different spellings
 * of "something went wrong" and one path that threw `undefined`.
 */
export type ErrorKind =
  | "offline" // the device has no connection
  | "network" // the request never reached the server
  | "timeout" // the server never answered in time
  | "notFound" // 404
  | "validation" // 4xx the user can fix by changing their input
  | "auth" // 401 / 403
  | "server" // 5xx
  | "unknown";

/** Whether retrying the identical request could plausibly succeed. */
const RETRYABLE: Record<ErrorKind, boolean> = {
  offline: true,
  network: true,
  timeout: true,
  notFound: false,
  validation: false,
  auth: false,
  server: true,
  unknown: true,
};

export class AppError extends Error {
  readonly kind: ErrorKind;
  /** HTTP status, when the failure came from a response. */
  readonly status?: number;
  /** Whatever was originally thrown, kept for logging — never shown to users. */
  readonly cause?: unknown;

  constructor(kind: ErrorKind, message: string, options?: { status?: number; cause?: unknown }) {
    super(message);
    this.name = "AppError";
    this.kind = kind;
    this.status = options?.status;
    this.cause = options?.cause;
  }

  get isRetryable() {
    return RETRYABLE[this.kind];
  }
}

/** Messages users see. One per kind, so wording stays consistent everywhere. */
export const MESSAGES: Record<ErrorKind, string> = {
  offline: "You appear to be offline. Reconnect and try again.",
  network: "We couldn't reach Afterhours. Please check your connection and try again.",
  timeout: "That took too long. Please try again.",
  notFound: "We couldn't find what you were looking for.",
  validation: "Please check the details you entered and try again.",
  auth: "You don't have access to do that.",
  server: "Afterhours is having trouble right now. Please try again shortly.",
  unknown: "Something went wrong. Please try again.",
};

export function kindFromStatus(status: number): ErrorKind {
  if (status === 404) return "notFound";
  if (status === 401 || status === 403) return "auth";
  if (status >= 500) return "server";
  if (status >= 400) return "validation";
  return "unknown";
}
