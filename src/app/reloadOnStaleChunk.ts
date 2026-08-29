/**
 * Recover a tab that was open across a deploy.
 *
 * Every route and every landing section is a lazy `import()`, and the files they
 * fetch carry a content hash. After a deploy those exact filenames are gone —
 * removed from the server, and dropped from the precache when the new worker
 * activates. A tab still running the old build asks for one, gets nothing, and
 * the section blanks.
 *
 * This is not caused by auto-updating the worker; a deploy removes the hashed
 * files whether or not a worker is involved. Auto-update simply makes it worth
 * handling, because now the fix is always one reload away: the new build is
 * already installed, so reloading lands on a working app rather than the same
 * broken one.
 *
 * Vite fires `vite:preloadError` when a dynamic import fails, which is a far
 * better signal than string-matching error messages.
 *
 * The reload happens at most once per tab per minute. A chunk that fails for any
 * other reason — offline, a proxy eating it — must not put the page in a reload
 * loop, so the second failure is left to the error boundaries, which say
 * something useful instead of thrashing.
 */

const KEY = "afterhours.chunk-reload";
const COOLDOWN_MS = 60 * 1000;

function recentlyReloaded(): boolean {
  try {
    const at = Number(sessionStorage.getItem(KEY));
    return Number.isFinite(at) && Date.now() - at < COOLDOWN_MS;
  } catch {
    // Private mode: assume we have, so a failure can never loop.
    return true;
  }
}

function markReloaded() {
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* nothing to do */
  }
}

export function reloadOnStaleChunk() {
  window.addEventListener("vite:preloadError", (event) => {
    if (recentlyReloaded()) return;

    // Stop Vite rethrowing: we are handling it by reloading.
    event.preventDefault();
    markReloaded();
    window.location.reload();
  });
}
