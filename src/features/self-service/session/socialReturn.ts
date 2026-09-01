import type { SocialProvider } from "../api/types";

/**
 * The marker that tells `/claim` an arrival is a provider bouncing back, not
 * somebody starting again.
 *
 * Connecting Instagram or TikTok leaves the site entirely: we hand the browser
 * to the provider's consent screen and its callback redirects to whatever
 * `redirectTo` we asked for. Every visit to `/claim` otherwise drops the stored
 * token and opens on the search box — which, on the way back from a provider,
 * would sign the owner out at the exact moment the grant succeeded, leaving the
 * connection recorded on the server and them at the start of the flow.
 *
 * So the return URL carries this, and only this arrival keeps the session. It
 * also names the provider, so the photos step can say whether the account it
 * sent them off to link is actually linked now.
 *
 * It is stripped from the address bar as soon as it has been read: a reload
 * afterwards is a normal visit and must behave like one.
 */

const PARAM = "social";

const isProvider = (value: string | null): value is SocialProvider =>
  value === "instagram" || value === "tiktok";

/** Where the provider should send the browser back to. */
export function socialReturnUrl(provider: SocialProvider): string {
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, provider);
  return url.toString();
}

/** The provider this arrival is returning from, if it is one. Pure. */
export function readSocialReturn(): SocialProvider | null {
  try {
    const value = new URLSearchParams(window.location.search).get(PARAM);
    return isProvider(value) ? value : null;
  } catch {
    return null;
  }
}

/** Drop the marker without adding a history entry. */
export function clearSocialReturn() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(PARAM)) return;

    url.searchParams.delete(PARAM);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* nothing to do */
  }
}
