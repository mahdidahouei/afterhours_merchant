import { createApiClient } from "@/lib/api";
import { isProblem } from "@/lib/errors";
import { clearToken, readToken } from "../session/tokenStore";

/**
 * The authenticated owner client.
 *
 * Same base URL and same error normalization as the public client, plus the
 * bearer token. Kept as a separate instance so a claim token can never ride
 * along on a landing, connect or contact request.
 */
export const ownerClient = createApiClient();

ownerClient.interceptors.request.use((config) => {
  const token = readToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * A dead token is worth forgetting immediately, so a reload doesn't replay the
 * same 401. The screen change is the caller's job — see useClaim.
 */
ownerClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isProblem(error, "session_expired")) clearToken();
    return Promise.reject(error);
  },
);
