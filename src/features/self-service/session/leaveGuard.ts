import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Lets the screen that is on show veto or complete work before the page
 * navigates away from it.
 *
 * The journey rail can jump straight from step 6 to step 4, which means the
 * page changes screens without the screen's own Back button being involved. Two
 * stages hold edits in local state — the profile draft and the listing-facts
 * form — so without this, clicking the rail would silently discard whatever had
 * been typed, while the rail itself promises "everything saves as you go".
 *
 * A guard returns `true` when it is fine to leave (usually after saving) and
 * `false` when it is not, which leaves the owner where they are with the error
 * their failed save produced already on screen.
 */
export type LeaveGuard = () => Promise<boolean>;

export type LeaveGuardRef = MutableRefObject<LeaveGuard | null>;

/**
 * Register the current screen's guard.
 *
 * Deliberately re-registered after every render rather than on a dependency
 * list: the guard closes over the draft, and a stale closure would save the
 * values from the render it was created in.
 */
export function useLeaveGuard(ref: LeaveGuardRef, guard: LeaveGuard) {
  const latest = useRef(guard);
  latest.current = guard;

  useEffect(() => {
    ref.current = () => latest.current();
    return () => {
      ref.current = null;
    };
  }, [ref]);
}
