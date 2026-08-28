/**
 * The six journey steps shown in the rail. These are the owner's mental model
 * of the flow — deliberately coarser than the nine screens and seven statuses
 * underneath them.
 */
export type JourneyStepId =
  | "find"
  | "verify"
  | "details"
  | "review"
  | "photos"
  | "bookings";

export type JourneyStep = {
  id: JourneyStepId;
  /** Rail heading. */
  title: string;
  /** Rail subtitle. */
  hint: string;
  /** Compact label for the mobile stepper. */
  short: string;
};

export const JOURNEY: JourneyStep[] = [
  { id: "find", title: "Find your restaurant", hint: "Search the directory", short: "Find" },
  { id: "verify", title: "Verify ownership", hint: "Confirm by text message", short: "Verify" },
  { id: "details", title: "Check your details", hint: "Name, address, website", short: "Details" },
  { id: "review", title: "Build your profile", hint: "Story, contact & menus", short: "Review" },
  { id: "photos", title: "Add your photos", hint: "Interior, atmosphere & food", short: "Photos" },
  { id: "bookings", title: "Connect bookings", hint: "Realtime availability", short: "Bookings" },
];

export const RAIL_FOOTNOTE =
  "Everything saves as you go — leave any time and pick up where you left off.";
