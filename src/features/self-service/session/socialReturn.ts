import type { SocialProvider } from "../api/types";

/**
 * Remembers that we sent the browser to Instagram or TikTok, so the trip back
 * is recognised as a return rather than somebody starting again.
 *
 * Connecting leaves the site entirely: we hand the browser to the provider's
 * consent screen and the API's callback redirects to whatever `redirectTo` we
 * asked for. Every arrival at `/claim` otherwise drops the stored token and
 * opens on the search box — which, on the way back, would sign the owner out at
 * the exact moment the grant succeeded.
 *
 * This deliberately does **not** ride on `redirectTo`. Putting a marker in that
 * URL made it the one part of the request we were inventing, and the contract
 * only promises a redirect "to the configured redirect_to" — it never promises
 * our query string survives the round trip, and a server validating the URL
 * against a registered list would reject the decorated version. `redirectTo` is
 * now the bare page URL, and the marker lives here instead.
 *
 * `sessionStorage` is the right shelf for it: scoped to this tab and this
 * origin, it survives the trip out to the provider and back, and it cannot leak
 * into another tab that is claiming a different restaurant. It is not state
 * about the claim — the server owns all of that — only a note that this tab is
 * mid-handshake.
 */

const KEY = "afterhours.claim.social-pending";

/**
 * How long a pending mark stays meaningful.
 *
 * Long enough to log in and grant, short enough that an abandoned attempt does
 * not make a normal visit hours later look like a return.
 */
const WINDOW_MS = 15 * 60 * 1000;

type Pending = { provider: SocialProvider; at: number };

const isProvider = (value: unknown): value is SocialProvider =>
  value === "instagram" || value === "tiktok";

/** Where the provider should send the browser back to: this page, undecorated. */
export function socialReturnUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

/** Called immediately before navigating to the provider. */
export function markSocialPending(provider: SocialProvider) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ provider, at: Date.now() } satisfies Pending));
  } catch {
    // Private mode: the return is then treated as a fresh visit, which costs
    // the owner a re-verification but never breaks anything.
  }
}

/** The provider this arrival is returning from, if it is one. Pure. */
export function readSocialReturn(): SocialProvider | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;

    const pending = JSON.parse(raw) as Pending;
    if (!isProvider(pending?.provider)) return null;
    if (!Number.isFinite(pending.at) || Date.now() - pending.at > WINDOW_MS) return null;

    return pending.provider;
  } catch {
    return null;
  }
}

export function clearSocialReturn() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}
