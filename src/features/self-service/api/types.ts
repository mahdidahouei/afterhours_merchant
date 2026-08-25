/**
 * Owner Self-Service API — the contract, in TypeScript.
 *
 * Transcribed from `contracts/owner-api.v1.yaml`. When that spec is published,
 * replace this file with the generated output:
 *   openapi-typescript contracts/owner-api.v1.yaml -o src/api/types.d.ts
 *
 * Two rules from the contract are load-bearing here:
 *   1. Every mutation returns the complete Claim. Replace your copy with it.
 *   2. A field is always present. Absent values are `null`, never a missing key,
 *      and lists are always lists.
 */

/* ── Claim ──────────────────────────────────────────────────────────────── */

export type ClaimStatus =
  | "verified" // details on file, waiting to be confirmed
  | "scanning" // reading the website — poll
  | "scan_failed" // couldn't read it; see scanError
  | "drafted" // profile ready to review, edit, photograph
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

/** Omitted means unchanged; `null` means clear it. At least one key required. */
export type PlacePatch = Partial<{
  name: string;
  address: string;
  phone: string | null;
  websiteUri: string | null;
  neighbourhood: string | null;
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
  /** Handles, without the @. */
  social: {
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
  };
  reservable: boolean;
  reservationUrl: string | null;
  /** Free text lifted off the website. */
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
  url: string;
  width: number;
  height: number;
  uploadedAt: string;
};

export const PHOTO_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  maxCount: 12,
  accept: ["image/jpeg", "image/png", "image/webp"],
} as const;

/* ── Search, verification, session ──────────────────────────────────────── */

export type Claimability =
  | "available" // not in the directory — full flow, website gets scanned
  | "listed" // in the directory, unclaimed — same screens, no scan
  | "claimed"; // taken — dead end, point at support

export type PlaceCandidate = {
  placeId: string;
  name: string;
  address: string;
  /** "+31 •• ••• 1981" — null means we can't verify by text. */
  phoneMasked: string | null;
  claimability: Claimability;
};

export type Verification = {
  verificationId: string;
  phoneMasked: string;
  expiresAt: string;
  /** Earliest you may POST /verifications again. */
  resendAvailableAt: string;
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

/* ── Request bodies ─────────────────────────────────────────────────────── */

export type SendVerificationBody = {
  placeId: string;
  /**
   * Set when the owner picks "I use a different number". The contract documents
   * only `placeId`; the server checks any supplied number against the listing
   * and answers `no_phone_on_listing` when it doesn't match.
   */
  phone?: string;
};

export type CreateSessionBody = { verificationId: string; code: string };

export type ListingRequestBody = {
  name: string;
  city: string;
  contactEmail: string;
  note?: string;
};

/* ── Controls the design draws that the contract has no field for ───────── */

/**
 * PENDING_API — built, visible, and held in local state only.
 *
 * The design includes these; the contract's "Before you design" section says
 * each one does not exist in v1. They are kept so the screens match the
 * approved design and so wiring them later is a one-line change per field,
 * rather than rebuilding the control.
 *
 * Nothing here is sent to the server, and the UI says so where a user could
 * otherwise assume it was saved.
 */
export type PendingApi = {
  /** Menu files carry no language in v1. */
  menuFileLanguages: Record<string, "NL" | "EN" | "DE" | "FR">;
  /** Instagram / TikTok feed connection is explicitly not in v1. */
  feeds: { instagram: boolean; tiktok: boolean };
  /** `reservationPlatforms` is a flat list — there is no primary. */
  primaryPlatform: string | null;
};

export const EMPTY_PENDING_API: PendingApi = {
  menuFileLanguages: {},
  feeds: { instagram: false, tiktok: false },
  primaryPlatform: null,
};
