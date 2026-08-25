/** Every off-site destination the landing page links to, in one place. */
export const EXTERNAL_LINKS = {
  appStore: "https://apps.apple.com/us/app/afterhours-the-foodies-app/id6444783956",
  playStore: "https://play.google.com/store/apps/details?id=com.afthr.afterhoursbooking",
  instagram: "https://www.instagram.com/afterhours.app/",
  linkedin: "https://www.linkedin.com/company/afterhoursbookings/",
} as const;

/** In-app routes referenced from more than one section. */
export const ROUTES = {
  connect: "/connect",
  claim: "/claim",
  contact: "/contact-us",
  terms: "/terms-and-conditions",
  privacy: "/privacy-policy",
} as const;
