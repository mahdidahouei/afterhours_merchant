import axios, { type AxiosInstance } from "axios";
import { env } from "./env";
import { toAppError } from "./errors";

/**
 * A hung upstream — a reservation platform that never answers — must not leave
 * a wizard stuck on a spinner with no way out.
 */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Build an HTTP client that normalizes failures at the boundary.
 *
 * Because the interceptor runs here, every `catch` and every React Query
 * `error` in the app is already an AppError (or a ProblemError, which is one).
 * No component has to know what Axios is, and there is no path by which
 * `undefined` gets thrown.
 */
export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: env.apiBaseUrl,
    timeout: REQUEST_TIMEOUT_MS,
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(toAppError(error)),
  );

  return client;
}

/**
 * The public client: no bearer token, no refresh interceptor.
 *
 * That is deliberate and load-bearing. The landing, connect and contact flows
 * are all unauthenticated, and a token left behind by some other Afterhours
 * surface must never be able to derail them. Self-service builds its own
 * authenticated instance rather than adding a header here.
 */
export const api = createApiClient();
