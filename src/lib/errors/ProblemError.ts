import { AppError, type ErrorKind } from "./AppError";

/**
 * The owner API's stable error codes (RFC 9457 `application/problem+json`).
 *
 * `code` is the contract's promise: safe to switch on. `detail` is prose and
 * will be reworded, so it is never matched against — only shown.
 */
export type ProblemCode =
  | "invalid_code"
  | "code_expired"
  | "too_many_attempts"
  | "place_already_claimed"
  | "no_phone_on_listing"
  | "session_expired"
  | "wrong_status"
  | "profile_incomplete"
  | "photo_too_large"
  | "unsupported_media_type"
  | "rate_limited"
  | "invalid_request"
  | "not_found";

export type ProblemBody = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  attemptsRemaining?: number;
  currentStatus?: string;
  expectedStatus?: string[];
  missingFields?: string[];
};

/** Wording shown to owners, keyed by code. `detail` wins when the server sends one. */
const MESSAGES: Record<ProblemCode, string> = {
  invalid_code: "That code isn't right. Check your messages and try again.",
  code_expired: "That code has expired.",
  too_many_attempts: "Too many attempts. Try again in a moment.",
  place_already_claimed: "This restaurant has already been claimed.",
  no_phone_on_listing: "There's no phone number on this listing, so we can't text a code.",
  session_expired: "Your session has expired. Verify your number again — your work is saved.",
  wrong_status: "This step has already moved on.",
  profile_incomplete: "A few required fields are still empty.",
  photo_too_large: "That photo is over 10 MB.",
  unsupported_media_type: "Photos must be JPEG, PNG or WebP.",
  rate_limited: "Too many requests. Give it a moment.",
  invalid_request: "Something went wrong. Please try again.",
  not_found: "We couldn't find that.",
};

/** Which AppError kind each code belongs to, so retry policy stays consistent. */
const KINDS: Record<ProblemCode, ErrorKind> = {
  invalid_code: "validation",
  code_expired: "validation",
  too_many_attempts: "validation",
  place_already_claimed: "validation",
  no_phone_on_listing: "validation",
  session_expired: "auth",
  wrong_status: "validation",
  profile_incomplete: "validation",
  photo_too_large: "validation",
  unsupported_media_type: "validation",
  rate_limited: "server",
  invalid_request: "validation",
  not_found: "notFound",
};

const CODES = new Set(Object.keys(MESSAGES));

const isProblemCode = (value: unknown): value is ProblemCode =>
  typeof value === "string" && CODES.has(value);

/**
 * An AppError that also carries the contract's structured fields.
 *
 * Extending AppError rather than sitting beside it means every existing
 * consumer — ErrorState, the query retry policy, reportError — keeps working
 * without knowing this type exists.
 */
export class ProblemError extends AppError {
  readonly code: ProblemCode;
  readonly attemptsRemaining?: number;
  readonly currentStatus?: string;
  readonly expectedStatus?: string[];
  readonly missingFields?: string[];
  /** Seconds, from the `Retry-After` header. */
  readonly retryAfter?: number;

  constructor(code: ProblemCode, body: ProblemBody, retryAfter?: number) {
    super(KINDS[code], body.detail?.trim() || MESSAGES[code], {
      status: body.status,
      cause: body,
    });
    this.name = "ProblemError";
    this.code = code;
    this.attemptsRemaining = body.attemptsRemaining;
    this.currentStatus = body.currentStatus;
    this.expectedStatus = body.expectedStatus;
    this.missingFields = body.missingFields;
    this.retryAfter = retryAfter;
  }
}

/**
 * Build a ProblemError from a response body, or return null when the body is
 * not a recognised problem document — in which case the caller falls back to
 * the generic `toAppError` path.
 */
export function parseProblem(data: unknown, retryAfterHeader?: unknown): ProblemError | null {
  if (data === null || typeof data !== "object") return null;

  const body = data as ProblemBody;
  if (!isProblemCode(body.code)) return null;

  const retryAfter = Number(retryAfterHeader);
  return new ProblemError(
    body.code,
    body,
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
  );
}

/** Narrow an unknown error to a specific contract code. */
export function isProblem(error: unknown, code?: ProblemCode): error is ProblemError {
  if (!(error instanceof ProblemError)) return false;
  return code === undefined || error.code === code;
}
