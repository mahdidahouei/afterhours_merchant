import { DRAFTED_ORDER, type DraftedStep } from "../stages";

/**
 * The furthest sub-step of `drafted` this browser has reached, per claim.
 *
 * `Claim.status` collapses build / photos / bookings into one value, so the
 * server cannot say which of the three a returning owner was on. Most of that
 * is recoverable from the claim itself — photos exist, a platform is connected
 * — but not the case of reaching a step and leaving without doing anything on
 * it. This fills exactly that hole and nothing else; `resumeStep` treats it as
 * a hint and never lets it move someone backwards.
 *
 * Keyed by claimId so two restaurants claimed from the same browser don't
 * inherit each other's position, and deliberately not authoritative: losing it
 * costs a returning owner one click.
 *
 * Delete this file if `Claim` ever grows a `currentStep`.
 */

const KEY = "afterhours.claim.progress";

type Stored = { claimId: string; step: DraftedStep };

const isStep = (value: unknown): value is DraftedStep =>
  DRAFTED_ORDER.includes(value as DraftedStep);

export function readProgress(claimId: string): DraftedStep | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as Stored;
    if (stored?.claimId !== claimId || !isStep(stored.step)) return null;

    return stored.step;
  } catch {
    return null;
  }
}

/** Only ever moves forward — going back to edit doesn't rewind the bookmark. */
export function writeProgress(claimId: string, step: DraftedStep) {
  try {
    const current = readProgress(claimId);
    if (current && DRAFTED_ORDER.indexOf(current) >= DRAFTED_ORDER.indexOf(step)) return;

    localStorage.setItem(KEY, JSON.stringify({ claimId, step } satisfies Stored));
  } catch {
    // Private-mode Safari and friends. Resume falls back to the derivation.
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}
