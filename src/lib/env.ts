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
    __ENV__?: { API_BASE_URL?: string; MAPBOX_TOKEN?: string };
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const runtime = window.__ENV__ ?? {};

/**
 * `||`, not `??`, on every runtime value.
 *
 * `config.js` ships with empty strings as placeholders and a ConfigMap may
 * mount a partial one, and an empty string is not nullish — `??` would treat
 * `""` as a configured value and skip the build-time fallback entirely. That is
 * exactly how the Mapbox token silently resolved to nothing in development.
 */
export const env = {
  apiBaseUrl:
    runtime.API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://dev-api.afthr.com/api/v1/owner",
  /**
   * Mapbox public token for the details map.
   *
   * A `pk.` token is designed to ship in the client — scoped by URL
   * restrictions at Mapbox, not kept secret — so it goes through the same
   * runtime-config path as the API URL and an environment can swap it without
   * a rebuild. Empty means no map; the step falls back to the address.
   */
  mapboxToken: runtime.MAPBOX_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN || "",

  isDev: import.meta.env.DEV,
  /**
   * Serve the owner self-service flow from an in-memory stand-in instead of the
   * network. Build-time only — it must never be switchable at runtime, so it is
   * read from Vite's env and not from window.__ENV__.
   */
  useMock: import.meta.env.VITE_USE_MOCK === "true",
} as const;
