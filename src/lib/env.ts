/**
 * Runtime configuration.
 *
 * The container serves `/public/config.js`, which assigns `window.__ENV__`
 * before the module bundle parses. In Kubernetes a per-environment ConfigMap is
 * mounted over that file, so one image serves dev and prod. Locally there is no
 * container, so we fall back to Vite's build-time env.
 */

declare global {
  interface Window {
    __ENV__?: { API_BASE_URL?: string };
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const runtime = window.__ENV__ ?? {};

export const env = {
  apiBaseUrl:
    runtime.API_BASE_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    "https://dev-api.afthr.com/api/v1/owner",
  isDev: import.meta.env.DEV,
  /**
   * Serve the owner self-service flow from an in-memory stand-in instead of the
   * network. Build-time only — it must never be switchable at runtime, so it is
   * read from Vite's env and not from window.__ENV__.
   */
  useMock: import.meta.env.VITE_USE_MOCK === "true",
} as const;
