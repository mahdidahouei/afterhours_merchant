import axios from "axios";
import { AppError, MESSAGES, kindFromStatus, type ErrorKind } from "./AppError";
import { parseProblem } from "./ProblemError";

/**
 * Normalize anything thrown into an AppError.
 *
 * Safe to call on values that are already AppErrors, on Axios errors, on plain
 * Errors, and on `undefined` — which the old service layer really did throw
 * whenever a request failed before reaching the server.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new AppError("timeout", MESSAGES.timeout, { cause: error });
    }

    if (!error.response) {
      const kind: ErrorKind = navigator.onLine ? "network" : "offline";
      return new AppError(kind, MESSAGES[kind], { cause: error });
    }

    // The owner API answers with RFC 9457 problem documents carrying a stable
    // `code`. Those become ProblemError (a subclass), so callers that care can
    // switch on the code while everything else still sees an AppError.
    const problem = parseProblem(error.response.data, error.response.headers?.["retry-after"]);
    if (problem) return problem;

    const status = error.response.status;
    const kind = kindFromStatus(status);

    // Prefer the server's own wording when it bothered to send some — it is the
    // only source that can say *which* field or key was wrong.
    const body = error.response.data as { message?: string } | undefined;
    const message =
      typeof body?.message === "string" && body.message.trim()
        ? body.message
        : MESSAGES[kind];

    return new AppError(kind, message, { status, cause: error });
  }

  if (error instanceof Error) {
    return new AppError("unknown", error.message || MESSAGES.unknown, { cause: error });
  }

  return new AppError("unknown", MESSAGES.unknown, { cause: error });
}

/** Shorthand for the common case: give me something I can render. */
export const errorMessage = (error: unknown): string => toAppError(error).message;
