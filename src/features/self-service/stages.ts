import type { ClaimStatus } from "./api/types";
import type { JourneyStepId } from "./content/journey";
import { JOURNEY } from "./content/journey";

/**
 * Which screen is on show.
 *
 * The first three happen before a claim exists, so they are local wizard state.
 * Everything after is a pure function of `claim.status` — the contract is
 * emphatic that nothing else may decide, not `kind` and not which call just
 * returned.
 */
export type Stage =
  | "search"
  | "verifyOwnership"
  | "otp"
  | "details"
  | "scanning"
  | "review"
  | "photos"
  | "submitted"
  | "approved"
  | "live";

/** The pre-token stages, which the page owns rather than the server. */
export type AnonStage = Extract<Stage, "search" | "verifyOwnership" | "otp">;

/** `drafted` covers two screens; this picks between them. */
export type DraftedStep = "review" | "photos";

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

const STEP_OF_STAGE: Record<Stage, JourneyStepId> = {
  search: "find",
  verifyOwnership: "verify",
  otp: "verify",
  details: "details",
  scanning: "details",
  review: "review",
  photos: "photos",
  submitted: "photos",
  approved: "photos",
  live: "photos",
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
  scanning: "Reading your website",
  review: "Build your profile",
  photos: "Add your photos",
  submitted: "With our team",
  approved: "Almost there",
  live: "You're live",
};
