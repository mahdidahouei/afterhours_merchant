/**
 * The connect wizard's step machine.
 *
 * Steps are: pick a restaurant, pick a platform, then one screen per guide step
 * (however many the API returns for that platform), then success.
 *
 * The old implementation expressed "go back" as a partial lookup table that fell
 * through to string arithmetic for any guide step past the first. Stating the
 * rule directly is both shorter and total.
 */

export type Step =
  | "restaurants"
  | "platform"
  | "success"
  | `guide-${number}`;

export const guideStep = (index: number): Step => `guide-${index}`;

export const isGuideStep = (step: Step) => step.startsWith("guide-");

/** 1-based position within the platform's guide, or 0 if not a guide step. */
export const guideIndex = (step: Step) =>
  isGuideStep(step) ? Number(step.slice("guide-".length)) : 0;

/**
 * Where "back" leads. `"exit"` means leave the wizard entirely — the browser's
 * history takes over, returning the user to wherever they came from.
 */
export function previousStep(step: Step): Step | "exit" {
  if (step === "restaurants" || step === "success") return "exit";
  if (step === "platform") return "restaurants";

  const index = guideIndex(step);
  return index > 1 ? guideStep(index - 1) : "platform";
}

/**
 * Total steps in the progress dots. Before a platform is chosen the guide
 * length is unknown, so two is assumed — matching what the dots showed before.
 */
export const totalSteps = (guideLength: number | undefined) =>
  2 + (guideLength || 2);
