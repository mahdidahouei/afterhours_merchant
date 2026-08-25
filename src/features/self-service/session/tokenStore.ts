/**
 * Where the claim token lives.
 *
 * localStorage rather than sessionStorage because the contract's resume story
 * is "come back later and pick up where you left off" — that has to survive
 * closing the tab. The token is scoped to exactly one claim and expires
 * server-side; a stale one produces `session_expired`, which the app handles by
 * clearing it and sending the owner back to verification with their work intact.
 */

const KEY = "afterhours.claim.token";

type StoredToken = { token: string; expiresAt: string };

export function readToken(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredToken;
    if (!stored?.token) return null;

    // Don't bother sending a token we already know is dead.
    if (Date.parse(stored.expiresAt) <= Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }

    return stored.token;
  } catch {
    return null;
  }
}

export function writeToken(token: string, expiresAt: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ token, expiresAt } satisfies StoredToken));
  } catch {
    // Private-mode Safari and friends. The flow still works for this session.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}
