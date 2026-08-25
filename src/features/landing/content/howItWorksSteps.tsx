import step1 from "@/assets/landing/how-it-works/step-1.webp";
import step2 from "@/assets/landing/how-it-works/step-2.webp";
import step3 from "@/assets/landing/how-it-works/step-3.webp";

export type HowItWorksStep = {
  heading: React.ReactNode;
  body: React.ReactNode;
  /** Optional standout claim under the body copy. */
  pill?: string;
  /**
   * Per-step type overrides. The three steps were authored at slightly
   * different sizes and spacings; these keep each one exactly as designed
   * rather than flattening them to a single rule.
   */
  headingClassName?: string;
  bodyClassName?: string;
  pillWrapperClassName?: string;
  image: string;
  imageAlt: string;
  /** Per-step image sizing — each visual has a different natural aspect. */
  imageClassName: string;
  /** Per-step wrapper alignment. */
  visualClassName: string;
};

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    heading: (
      <>
        ( your profile is already set up ) <br className="hidden 2lg:block" />
        simply connect your software.
      </>
    ),
    body: "We take care of your restaurant profile so you don't have to worry about profile creation or waste your time signing up. Just connect your software and reservations will start to flow in.",
    pill: "On average, it takes 2 minutes to connect.",
    headingClassName: "2lg:text-[30px]",
    bodyClassName: "lg:mt-[18px]",
    pillWrapperClassName: "mt-[24px]",
    image: step1,
    imageAlt: "Connect your software",
    imageClassName:
      "mb-[20px] h-auto max-h-[calc(100%-20px)] w-full max-w-[480px] object-contain lg:mb-0 lg:max-h-full",
    visualClassName: "items-center justify-center lg:pr-[30px]",
  },
  {
    heading: (
      <>
        Your restaurant is placed into <br className="hidden 2lg:block" />
        intent-based collections, everyday.
      </>
    ),
    body: (
      <>
        <strong className="font-bold">Why it matters: </strong>
        Being featured inside intent-based collections places your restaurant in a
        relevant decision context — not in a generic handle presentation and discovery —
        so no content, no updates, no ongoing work from you.
      </>
    ),
    headingClassName: "2lg:text-[31px]",
    bodyClassName: "lg:mt-[20px] lg:text-[16px]",
    image: step2,
    imageAlt: "Collections",
    imageClassName:
      "mb-[20px] h-auto max-h-[calc(100%-20px)] w-full max-w-[400px] object-contain lg:mb-0 lg:max-h-full",
    visualClassName: "items-center justify-center lg:pr-[30px]",
  },
  {
    heading: (
      <>
        You uplift revenue through <br className="hidden 2lg:block" />
        existing capacity &amp; software.
      </>
    ),
    body: "Booking from Afterhours are sent directly into your existing reservation software with a seamless integration — handled exactly as all other reservations, resulting in quiet but powerful incremental revenue tool through your existing reservation flow.",
    pill: "On average, partners receive 5–10 incremental reservations per day.",
    headingClassName: "2lg:text-[31px]",
    bodyClassName: "lg:mt-[20px]",
    pillWrapperClassName: "mt-[28px]",
    image: step3,
    imageAlt: "Reservations arriving in your existing software",
    imageClassName:
      "mb-[20px] max-h-[calc(100%-20px)] w-auto object-contain lg:mb-0 lg:h-[398px] lg:max-h-full",
    visualClassName: "items-center justify-center pr-0 lg:justify-end lg:pr-[50px]",
  },
];
