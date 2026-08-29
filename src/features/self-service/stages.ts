import type { ClaimStatus } from "./api/types";
import type { JourneyStepId } from "./content/journey";
import { JOURNEY } from "./content/journey";

/**
 * Which screen is on show.
 *
 * The first three happen before a claim exists, so they are local wizard state.
 * Everything after is a function of `claim.status` — the contract is emphatic
 * that nothing else may decide, not `kind` and not which call just returned.
 */
export type Stage =
  | "search"
  | "verifyOwnership"
  | "otp"
  | "details"
  | "scanning"
  | "review"
  | "photos"
  | "bookings"
  | "submitted"
  | "approved"
  | "live";

/** The pre-token stages, which the page owns rather than the server. */
export type AnonStage = Extract<Stage, "search" | "verifyOwnership" | "otp">;

/**
 * Which screen `drafted` is showing.
 *
 * This is the one place the contract leaves a gap: `status` has a single value
 * for the whole of the owner's editing work, so it cannot say which screen they
 * were on. The gap is not filled in by the client — see `FIRST_DRAFTED_STEP`.
 *
 * `details` is in here as well as being what `verified` maps to. The listing
 * facts stay editable after the profile is drafted — `PATCH /claim/place`
 * accepts them throughout — so the owner can come back and fix a phone number
 * without losing the profile they have written.
 */
export type DraftedStep = "details" | "review" | "photos" | "bookings";

export const DRAFTED_ORDER: DraftedStep[] = [
  "details",
  "review",
  "photos",
  "bookings",
];

/**
 * Where `drafted` starts.
 *
 * `status` is the only thing the API says about progress, and it has one value
 * for all four editing screens — so a returning owner lands here, whichever of
 * them they were last on. Deriving it from photo counts, or remembering it in
 * this browser, would be the client inventing a fact the server never stated.
 *
 * When `Claim` grows a step field this becomes a fallback for claims that
 * predate it, and `SelfServicePage` seeds `draftedStep` from the response.
 */
export const FIRST_DRAFTED_STEP: DraftedStep = "review";

export function stageForStatus(status: ClaimStatus, draftedStep: DraftedStep): Stage {
  switch (status) {
    // scan_failed shows the details screen again, with the error on it.
    case "verified":
    case "scan_failed":
      return "details";
    case "scanning":
      return "scanning";
    case "drafted":
      return draftedStep;
    case "submitted":
      return "submitted";
    case "approved":
      return "approved";
    case "live":
      return "live";
  }
}

/**
 * The steps an owner may click back to from where they are now, as indexes into
 * `JOURNEY`.
 *
 * Only while `drafted`. Before that there is nothing behind them worth editing —
 * search and the one-time code have no state to correct — and from `submitted`
 * on the claim is with an admin and out of their hands.
 */
export function reachableSteps(status: ClaimStatus | undefined): number[] {
  if (status !== "drafted") return [];
  return DRAFTED_ORDER.map((step) => journeyIndexOf(step as Stage));
}

/** The `drafted` screen a journey index refers to, if it is one of them. */
export function draftedStepAt(index: number): DraftedStep | null {
  return DRAFTED_ORDER.find((step) => journeyIndexOf(step as Stage) === index) ?? null;
}

const STEP_OF_STAGE: Record<Stage, JourneyStepId> = {
  search: "find",
  verifyOwnership: "verify",
  otp: "verify",
  details: "details",
  scanning: "details",
  review: "review",
  photos: "photos",
  bookings: "bookings",
  submitted: "bookings",
  approved: "bookings",
  live: "bookings",
};

export const journeyStepOf = (stage: Stage): JourneyStepId => STEP_OF_STAGE[stage];

export const journeyIndexOf = (stage: Stage): number =>
  JOURNEY.findIndex((step) => step.id === journeyStepOf(stage));

/** Everything from `submitted` on is out of the owner's hands. */
export const isTerminal = (stage: Stage) =>
  stage === "submitted" || stage === "approved" || stage === "live";

/** Rail/header label for the current screen. */
export const STAGE_LABEL: Record<Stage, string> = {
  search: "Find your restaurant",
  verifyOwnership: "Verify ownership",
  otp: "Enter your code",
  details: "Check your details",
  scanning: "Building your profile",
  review: "Build your profile",
  photos: "Add your photos",
  bookings: "Connect your bookings",
  submitted: "With our team",
  approved: "Almost there",
  live: "You're live",
};
