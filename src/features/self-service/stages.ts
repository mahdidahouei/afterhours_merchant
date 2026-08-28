import type { Claim, ClaimStatus } from "./api/types";
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
 * `drafted` covers three screens, so the page carries this alongside the status.
 *
 * This is the one place the contract leaves a gap: `status` has a single value
 * for the whole of the owner's editing work, so it cannot say which of build /
 * photos / bookings they were on. See `resumeStep` for how it is recovered.
 */
export type DraftedStep = "review" | "photos" | "bookings";

export const DRAFTED_ORDER: DraftedStep[] = ["review", "photos", "bookings"];

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
 * Where a returning owner picks up.
 *
 * Derived from what the claim actually holds, because the API has no field for
 * it: a connected platform means they reached bookings, a photo means they
 * reached photos, otherwise they were still building the profile. `furthest` is
 * the client's own note of the last step reached, which covers the case the
 * derivation cannot — arriving on a step and leaving without doing anything on
 * it. Whichever is further along wins, so a resume never goes backwards.
 */
export function resumeStep(claim: Claim, furthest?: DraftedStep | null): DraftedStep {
  const derived: DraftedStep =
    claim.reservation.length > 0 ? "bookings" : claim.photos.length > 0 ? "photos" : "review";

  if (!furthest) return derived;
  return DRAFTED_ORDER.indexOf(furthest) > DRAFTED_ORDER.indexOf(derived)
    ? furthest
    : derived;
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
