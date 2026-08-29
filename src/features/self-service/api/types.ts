/**
 * Owner Self-Service API — the contract, in TypeScript.
 *
 * Transcribed from `swagger/docs.json` (Owner Panel API), `owner-self-service`
 * and `Reservation Platform` tags. When the spec is served, replace this file
 * with the generated output:
 *   openapi-typescript swagger/docs.json -o src/api/types.d.ts
 *
 * Two rules from the contract are load-bearing here:
 *   1. Every mutation returns the complete Claim. Replace your copy with it.
 *   2. A field is always present. Absent values are `null`, never a missing key,
 *      and lists are always lists.
 */

/* ── Claim ──────────────────────────────────────────────────────────────── */

/**
 * The seven statuses, exactly as `GET /admin/claims` documents its filter:
 * `verified|scanning|scan_failed|drafted|submitted|approved|live`.
 */
export type ClaimStatus =
  | "verified" // details on file, waiting to be confirmed
  | "scanning" // reading the website — poll
  | "scan_failed" // couldn't read it; see scanError
  | "drafted" // profile ready to review, photograph, connect
  | "submitted" // with an admin
  | "approved" // approved, being written
  | "live"; // in the directory

export type Claim = {
  claimId: string;
  /** Informational only — never render from this, render from `status`. */
  kind: "new" | "existing";
  status: ClaimStatus;
  place: Place;
  /** Null until status reaches "drafted". */
  profile: Profile | null;
  photos: Photo[];
  /** Booking platforms actually connected. Empty until one is. */
  reservation: ClaimReservation[];
  /** Authorised social accounts. Empty is the common case — linking is optional. */
  social: SocialConnection[];
  /** Non-null only while "scan_failed". */
  scanError: string | null;
  /** Why an admin sent it back. */
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
};

/* ── Place ──────────────────────────────────────────────────────────────── */

export type Place = {
  placeId: string;
  name: string;
  address: string;
  /** The only phone anywhere in the API. Profile has none. */
  phone: string | null;
  websiteUri: string | null;
  neighbourhood: string | null;
  location: { lat: number; lng: number } | null;
  /** Arrives only after verification — never in search results. */
  rating: number | null;
  reviewCount: number | null;
  googleMapsUri: string | null;
};

/**
 * A nullable field on the wire.
 *
 * The contract distinguishes "leave this alone" from "clear it", and a plain
 * `null` cannot say which. `{ set: false }` is unchanged; `{ set: true, value }`
 * writes; `{ set: true, value: "" }` clears. Use the `keep` / `write` helpers
 * rather than building these by hand.
 */
export type Nullable<T> = { set: boolean; value?: T };

export const keep = <T>(): Nullable<T> => ({ set: false });
export const write = (value: string | null): Nullable<string> => ({
  set: true,
  value: value ?? "",
});

/**
 * What `PATCH /claim/place` accepts.
 *
 * Note there is no `address`: the contract does not let the owner rewrite it,
 * because the address is Google's and the directory keys off it. The details
 * screen shows it read-only for that reason.
 */
export type PlacePatch = Partial<{
  name: string;
  phone: Nullable<string>;
  websiteUri: Nullable<string>;
  neighbourhood: Nullable<string>;
}>;

/* ── Profile ────────────────────────────────────────────────────────────── */

export type Profile = {
  /** max 120 */
  tagline: string | null;
  /** max 600 */
  description: string | null;
  cuisines: string[];
  /** max 3 */
  vibes: string[];
  /** max 4 — the UI's "Perfect for" */
  perfectFor: string[];
  /** max 3 — brunch, late night… */
  moments: string[];
  /** One value, not a list. */
  establishmentType: string | null;
  /** No phone here — see Place.phone. */
  email: string | null;
  /** Handles, without the @. Facebook can only be typed, never connected. */
  social: {
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
  };
  reservable: boolean;
  reservationUrl: string | null;
  /**
   * Free text lifted off the website — "we seem to book through OpenTable".
   * Not the same thing as `Claim.reservation`, which is a live integration.
   */
  reservationPlatforms: string[];
  menus: Menu[];
};

export type Menu = { title: string; files: MenuFile[] };

export type MenuFile = {
  title: string | null;
  link: string;
  /** "webpage", not "link". */
  type: "pdf" | "webpage" | "image";
};

export const PROFILE_LIMITS = {
  tagline: 120,
  description: 600,
  vibes: 3,
  perfectFor: 4,
  moments: 3,
} as const;

/* ── Photos ─────────────────────────────────────────────────────────────── */

export type Photo = {
  photoId: string;
  /** Display order — the first photo leads the listing. */
  position: number;
  /**
   * Safe to put straight into an <img src>. Unguessable rather than signed —
   * the uuid in the object name keeps an unpublished photo private.
   */
  url: string;
};

export const PHOTO_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  maxCount: 12,
  accept: ["image/jpeg", "image/png", "image/webp"],
} as const;

/** The design's "what to show" prompts. Guidance only — the API has no slots. */
export const PHOTO_PROMPTS = [
  "The room at its best",
  "Interior",
  "Signature dishes",
  "Drinks or bar",
  "Your team",
] as const;

/** How many upload tiles to draw when the owner has fewer photos than this. */
export const PHOTO_TARGET = 6;

/* ── Reservations (step 6) ──────────────────────────────────────────────── */

/**
 * A platform Afterhours can integrate with. From `GET /reservation-platforms`.
 *
 * `name` is the lowercase key — "gotable", not "GoTable". See `PLATFORM_LABEL`.
 */
export type ReservationPlatform = {
  id: string;
  name: string;
  iconUrl: string | null;
};

/**
 * Brand casing and running order for the platforms we integrate with.
 *
 * The API's `name` is a lowercase key, and its ordering is not a product
 * decision, so both are supplied here — exactly as the connect widget has
 * always done. This is a display lookup, not the list: membership comes from
 * `GET /reservation-platforms`, so a fourth platform appears (at the end, under
 * its raw name) rather than silently vanishing.
 */
export const PLATFORM_LABEL: Record<string, string> = {
  formitable: "Formitable",
  guestplan: "Guestplan",
  gotable: "GoTable",
};

export const PLATFORM_ORDER = ["formitable", "guestplan", "gotable"];

/** The platform's brand name, or whatever the API called it. */
export const platformLabel = (name: string) => PLATFORM_LABEL[name] ?? name;

/**
 * One page of a platform's connection guide.
 *
 * `step` is not reliable — Formitable's second step is numbered 0 — so the UI
 * orders by array position and never renders the number.
 */
export type GuideStep = {
  step: number;
  title: string;
  /** Markdown. Real guides carry links and bold, so they must be rendered. */
  body: string[];
  /**
   * What this step asks the owner for, if anything.
   *
   * The wire sends an empty **array** for "nothing needed", not null and not an
   * absent key — and `[]` is truthy, so this must go through `needOf()` rather
   * than being tested directly.
   */
  need?: GuideNeed | GuideNeed[] | null;
  /** A short screen recording of the same steps. */
  video: string | null;
};

export type GuideField = "account_id" | "apikey";

export type GuideNeed = {
  /** Which credential `POST /claim/reservation` wants this in. */
  field: GuideField;
  placeholder?: string;
};

/** `need: []` means nothing is asked for. Normalise it away at the boundary. */
export const needOf = (step: GuideStep): GuideNeed | null => {
  const need = step.need;
  if (!need || Array.isArray(need)) return null;
  return need.field ? need : null;
};

/** Which key on `POST /claim/reservation` a guide field maps to. */
export const CREDENTIAL_KEY = {
  account_id: "integrationId",
  apikey: "apiKey",
} as const satisfies Record<GuideField, keyof ReservationConnectBody>;

export type ReservationGuide = {
  name: string;
  iconUrl: string | null;
  steps: GuideStep[];
};

/** A platform the owner has actually connected. Lives on `Claim.reservation`. */
export type ClaimReservation = {
  platformId: string;
  platformName: string;
  platformIcon: string | null;
  /** Echoed back so the owner can check what they entered. */
  integrationId: string | null;
};

export type ReservationConnectBody = {
  platformId: string;
  integrationId?: string;
  /** Some platforms are keyless and hand one back instead. */
  apiKey?: string;
};

/* ── Social connections ─────────────────────────────────────────────────── */

/** Facebook cannot be connected, only typed — see `Profile.social`. */
export type SocialProvider = "instagram" | "tiktok";

export type SocialConnection = {
  provider: SocialProvider;
  /** What to show the owner so they recognise the account. */
  handle: string | null;
  connectedAt: string;
  /**
   * The provider withdrew the grant, so the connection needs redoing. The row
   * is kept so this can be said out loud rather than the account silently
   * disappearing.
   */
  revoked: boolean;
};

export type SocialConnectStart = { authorizeUrl: string; state: string };

/* ── Search, verification, session ──────────────────────────────────────── */

export type PlaceCandidate = {
  placeId: string;
  name: string;
  address: string;
  /** "+31 •• ••• 1981" — null means we have no number to text, so no claim. */
  phoneMasked: string | null;
};

export type Verification = {
  verificationId: string;
  phoneMasked: string;
  expiresAt: string;
  /** Earliest you may POST /verifications again. Keep resend disabled until then. */
  resendAvailableAt: string;
  /** Advisory — the OTP service doesn't report the real remaining count. */
  attemptsRemaining: number;
};

export type Session = { token: string; expiresAt: string; claim: Claim };

export type SessionInfo = { claimId: string; phoneMasked: string; expiresAt: string };

export type Taxonomy = {
  cuisines: string[];
  vibes: string[];
  perfectFor: string[];
  moments: string[];
  establishmentTypes: string[];
};

/* ── Support tickets ────────────────────────────────────────────────────── */

/** From `GET /ticket-subjects`. */
export type TicketSubject = { id: string; name: string };

/** `POST /claim-tickets` — the "I can't get that text" escape hatch. */
export type ClaimTicketBody = {
  subjectId: string;
  fullName: string;
  contactEmail: string;
  contactNumber: string;
  restaurantName: string;
  restaurantAddress: string;
  content: string;
};

/* ── Request bodies ─────────────────────────────────────────────────────── */

/** Only the place. There is no way to redirect the code to another number. */
export type SendVerificationBody = { placeId: string };

export type CreateSessionBody = { verificationId: string; code: string };

export type ListingRequestBody = {
  name: string;
  city: string;
  email: string;
  note?: string;
};

/* ── Controls the design draws that the contract has no field for ───────── */

/**
 * PENDING_API — built, visible, and held in local state only.
 *
 * Everything else the design showed has since landed: IG/TikTok are real OAuth
 * (`POST /claim/social/{provider}/connect`) and bookings are a real integration
 * (`POST /claim/reservation`). What remains has no field anywhere in the spec.
 *
 * Nothing here is sent to the server, and the UI says so where a user could
 * otherwise assume it was saved.
 */
export type PendingApi = {
  /** `ClaimMenuFile` carries title/link/type — no language. */
  menuFileLanguages: Record<string, "NL" | "EN" | "DE" | "FR">;
  /** `reservationPlatforms` is a flat list of strings — there is no primary. */
  primaryPlatform: string | null;
};

export const EMPTY_PENDING_API: PendingApi = {
  menuFileLanguages: {},
  primaryPlatform: null,
};
