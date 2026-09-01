import { ProblemError, type ProblemBody, type ProblemCode } from "@/lib/errors";
import { clearToken, readToken, writeToken } from "../session/tokenStore";
import { httpOwnerApi, type OwnerApi } from "./http";
import { CODE_LENGTH, platformLabel } from "./types";
import type {
  Claim,
  ClaimStatus,
  ClaimReservation,
  Nullable,
  PlaceCandidate,
  Photo,
  Place,
  Profile,
  SocialConnection,
  SocialProvider,
  Taxonomy,
  TicketSubject,
  Verification,
} from "./types";

/**
 * An in-memory stand-in for the owner API, faithful to the contract.
 *
 * It exists because the *claim* endpoints are not live yet and the flow is nine
 * screens deep — without it, nothing past the search box can be seen or
 * reviewed. It reproduces the parts that shape the UI: latency, the status
 * transitions, the scan that takes time and can fail, and the real error codes.
 *
 * It does **not** stand in for anything that already works. The booking
 * platforms and their guides are public endpoints serving real content today,
 * so those two calls are passed straight through to `httpOwnerApi`.
 *
 * Enabled by VITE_USE_MOCK. Delete this file and its two references when the
 * claim API ships.
 */

const LATENCY_MS = 420;
const SCAN_DURATION_MS = 9_000;
const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_AFTER_MS = 30 * 1000;

/** The code that always fails. Anything else is accepted. */
const WRONG_CODE = "0".repeat(CODE_LENGTH);

const wait = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

const fail = (code: ProblemCode, extra: ProblemBody = {}, retryAfter?: number): never => {
  throw new ProblemError(code, { status: extra.status ?? 400, ...extra }, retryAfter);
};

const iso = (offsetMs = 0) => new Date(Date.now() + offsetMs).toISOString();
const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

/** Apply a `Nullable<string>` patch field: unset leaves the value alone. */
const patched = (current: string | null, next?: Nullable<string>): string | null =>
  next?.set ? next.value?.trim() || null : current;

/* ── Seed data ──────────────────────────────────────────────────────────── */

const CANDIDATES: PlaceCandidate[] = [
  {
    placeId: "pl_oli_mazi",
    name: "Oli Mazi",
    address: "Oudegracht 195, 3511 NG Utrecht",
    phoneMasked: "+31 •• ••• 1981",
  },
  {
    placeId: "pl_gys",
    name: "Gys Utrecht",
    address: "Voorstraat 77, 3512 AK Utrecht",
    phoneMasked: "+31 •• ••• 4420",
  },
  {
    placeId: "pl_broei",
    name: "Broei",
    address: "Jaarbeursplein 6, 3521 AL Utrecht",
    phoneMasked: "+31 •• ••• 7788",
  },
  {
    placeId: "pl_nophone",
    name: "De Zagerij",
    address: "Vlampijpstraat 84, 3534 AR Utrecht",
    phoneMasked: null,
  },
];

/** Not in the contract — the mock's own note of which place is already taken. */
const ALREADY_CLAIMED = new Set(["pl_taken"]);
/** Places that are already in the directory: no scan, profile arrives filled. */
const ALREADY_LISTED = new Set(["pl_gys"]);

const TAXONOMY: Taxonomy = {
  cuisines: [
    "Greek", "Italian", "Japanese", "French", "Dutch", "Levantine", "Mexican",
    "Korean", "Vietnamese", "Spanish", "Indian", "Thai", "Turkish", "Peruvian",
  ],
  vibes: [
    "Intimate", "Lively", "Candlelit", "Minimal", "Cosy", "Refined", "Loud",
    "Green", "Industrial",
  ],
  perfectFor: [
    "Date night", "Friends", "Family", "Solo", "Business", "Celebration",
    "First date", "Long lunch",
  ],
  moments: ["Breakfast", "Brunch", "Lunch", "Dinner", "Late night", "Drinks"],
  establishmentTypes: [
    "Restaurant", "Bistro", "Wine bar", "Café", "Bakery", "Hotel dining",
    "Tea bar",
  ],
};

const PLACES: Record<string, Place> = {
  pl_oli_mazi: {
    placeId: "pl_oli_mazi",
    name: "Oli Mazi",
    address: "Oudegracht 195, 3511 NG Utrecht",
    phone: "+31 30 123 1981",
    websiteUri: "https://olimazi.nl",
    neighbourhood: "Oudegracht",
    location: { lat: 52.0894, lng: 5.1214 },
    rating: 4.8,
    reviewCount: 629,
    googleMapsUri: "https://maps.google.com/?cid=1",
  },
  pl_gys: {
    placeId: "pl_gys",
    name: "Gys Utrecht",
    address: "Voorstraat 77, 3512 AK Utrecht",
    phone: "+31 30 123 4420",
    websiteUri: "https://gys.nl",
    neighbourhood: "Binnenstad",
    location: { lat: 52.0947, lng: 5.1218 },
    rating: 4.6,
    reviewCount: 412,
    googleMapsUri: "https://maps.google.com/?cid=2",
  },
  pl_broei: {
    placeId: "pl_broei",
    name: "Broei",
    address: "Jaarbeursplein 6, 3521 AL Utrecht",
    phone: "+31 30 123 7788",
    websiteUri: "https://broeiutrecht.nl",
    neighbourhood: "Jaarbeurs",
    location: { lat: 52.0886, lng: 5.1093 },
    rating: 4.5,
    reviewCount: 288,
    googleMapsUri: "https://maps.google.com/?cid=3",
  },
  pl_nophone: {
    placeId: "pl_nophone",
    name: "De Zagerij",
    address: "Vlampijpstraat 84, 3534 AR Utrecht",
    phone: null,
    websiteUri: null,
    neighbourhood: "Pijlsweerd",
    location: null,
    rating: 4.3,
    reviewCount: 96,
    googleMapsUri: null,
  },
};

/** What the website scan "finds". */
const SCANNED_PROFILE: Profile = {
  tagline: "Greek plates, Utrecht canal, open fire.",
  description:
    "We cook the food we grew up with — charcoal, lemon, oregano — and serve it on a canal in the middle of Utrecht. Everything is meant for the middle of the table. The wine list leans Greek and natural, the room is small and warm, and the fire is lit every evening from six.",
  cuisines: ["Greek", "Levantine"],
  vibes: ["Intimate", "Candlelit"],
  perfectFor: ["Date night", "Friends"],
  moments: ["Dinner", "Drinks"],
  establishmentType: "Restaurant",
  email: "hello@olimazi.nl",
  social: { instagram: "oli.mazi.utrecht", facebook: null, tiktok: null },
  reservable: true,
  reservationUrl: "https://olimazi.nl/reserveren",
  reservationPlatforms: ["Formitable"],
  menus: [
    {
      title: "Dinner",
      files: [{ title: "Dinner menu", link: "https://olimazi.nl/menu.pdf", type: "pdf" }],
    },
    {
      title: "Drinks",
      files: [{ title: "Wine list", link: "https://olimazi.nl/wine", type: "webpage" }],
    },
  ],
};

const TICKET_SUBJECTS: TicketSubject[] = [
  { id: "ts_no_access", name: "I can't access the number on the listing" },
  { id: "ts_wrong_number", name: "The number on the listing is wrong" },
  { id: "ts_not_listed", name: "My restaurant isn't listed" },
  { id: "ts_other", name: "Something else" },
];

/* ── Mutable state ──────────────────────────────────────────────────────── */

type Pending = {
  verificationId: string;
  placeId: string;
  phoneMasked: string;
  expiresAt: number;
  resendAvailableAt: number;
  attemptsRemaining: number;
};

let pending: Pending | null = null;
let claim: Claim | null = null;
let scanStartedAt = 0;
/** Set from the Details screen's "simulate a failed read" switch. */
let scanShouldFail = false;

/**
 * The mock's own storage, so a reload behaves like the real thing.
 *
 * Without this the claim lives in a module variable and dies with the page,
 * while the token in localStorage survives — so every reload looked like an
 * expired session and dumped the owner back at the search box. That made the
 * contract's headline promise, "leave any time and pick up where you left off",
 * the one thing the mock could not demonstrate.
 *
 * Blob URLs from uploaded photos don't survive a reload, so they are dropped on
 * the way back in rather than restored as broken images.
 */
const STORE_KEY = "afterhours.mock.claim";

function persist() {
  try {
    if (claim) localStorage.setItem(STORE_KEY, JSON.stringify(claim));
    else localStorage.removeItem(STORE_KEY);
  } catch {
    /* private mode — the mock just goes back to being per-tab */
  }
}

function restore(): Claim | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as Claim;
    if (!stored?.claimId) return null;

    stored.photos = stored.photos.filter((photo) => !photo.url.startsWith("blob:"));
    stored.photos.forEach((photo, index) => (photo.position = index));
    return stored;
  } catch {
    return null;
  }
}

/**
 * Load the stored claim on first use, not at import.
 *
 * A top-level `claim = restore()` is a module side effect, which stops Rollup
 * dropping this file from a production build even when `VITE_USE_MOCK` is
 * false — the seed data gets tree-shaken but the storage helpers ship, and run
 * a localStorage read on every page load. Deferring it keeps the whole module
 * droppable.
 */
let isLoaded = false;

function ensureLoaded() {
  if (isLoaded) return;
  isLoaded = true;
  claim = restore();
}

export function setMockScanFailure(shouldFail: boolean) {
  scanShouldFail = shouldFail;
}

/** Solid-colour placeholders, so seeded screens have photos without any fetch. */
const SEEDED_PHOTOS: Photo[] = ["#8A6535", "#321B15", "#6B6357", "#B09050"].map(
  (colour, index) => ({
    photoId: `pho_seed_${index}`,
    position: index,
    url:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="800" height="1000" fill="${colour}"/></svg>`,
      ),
  }),
);

/**
 * A connected platform for the seeded "already linked" screen.
 *
 * Read from the live platform list rather than written down here, so the id
 * matches what the picker fetches and the row shows as connected instead of as
 * an orphan. Falls back to no connection if the list can't be reached.
 */
async function seededReservation(): Promise<ClaimReservation[]> {
  try {
    const [platform] = await httpOwnerApi.listReservationPlatforms();
    if (!platform) return [];
    return [
      {
        platformId: platform.id,
        platformName: platform.name,
        platformIcon: platform.iconUrl,
        integrationId: "50783",
      },
    ];
  } catch {
    return [];
  }
}

/**
 * Drop the mock straight into a given status, for looking at a screen without
 * walking the nine steps that normally lead to it.
 *
 * `photos` and `reservation` are separate switches because within `drafted` they
 * are what decides which of the three sub-screens a resumed session lands on —
 * so the switcher has to be able to set them independently of the status.
 *
 * Only reachable from the dev-only stage switcher, and only when the mock is
 * the active implementation.
 */
export async function seedMockClaim(
  status: ClaimStatus,
  options?: { reviewNote?: string; photos?: boolean; reservation?: boolean },
) {
  ensureLoaded();
  claim = makeClaim("pl_oli_mazi");
  claim.status = status;

  // A profile exists from `drafted` onward — before that the contract says null.
  const hasProfile = ["drafted", "submitted", "approved", "live"].includes(status);
  claim.profile = hasProfile ? structuredClone(SCANNED_PROFILE) : null;

  claim.scanError =
    status === "scan_failed"
      ? "The site didn't respond. It may be down, or blocking automated visitors."
      : null;

  claim.reviewNote = options?.reviewNote ?? null;

  // Submitted and later have been all the way through, so give them the lot.
  const isPast = ["submitted", "approved", "live"].includes(status);

  claim.photos =
    options?.photos ?? isPast
      ? SEEDED_PHOTOS.map((photo, index) => ({ ...photo, position: index }))
      : [];

  claim.reservation = (options?.reservation ?? isPast) ? await seededReservation() : [];

  scanStartedAt = Date.now();
  writeToken(id("tok"), iso(24 * 60 * 60 * 1000));
  persist();
}

const emptyProfile = (): Profile => ({
  tagline: null,
  description: null,
  cuisines: [],
  vibes: [],
  perfectFor: [],
  moments: [],
  establishmentType: null,
  email: null,
  social: { instagram: null, facebook: null, tiktok: null },
  reservable: false,
  reservationUrl: null,
  reservationPlatforms: [],
  menus: [],
});

function makeClaim(placeId: string): Claim {
  const place = PLACES[placeId] ?? PLACES.pl_oli_mazi;
  return {
    claimId: id("clm"),
    kind: ALREADY_LISTED.has(placeId) ? "existing" : "new",
    status: "verified",
    place: { ...place },
    profile: null,
    photos: [],
    reservation: [],
    social: [],
    scanError: null,
    reviewNote: null,
    createdAt: iso(),
    updatedAt: iso(),
  };
}

/** Advance the scan clock. The mock has no server, so time passes on read. */
function settleScan() {
  if (!claim || claim.status !== "scanning") return;
  if (Date.now() - scanStartedAt < SCAN_DURATION_MS) return;

  if (scanShouldFail) {
    claim.status = "scan_failed";
    claim.scanError =
      "The site didn't respond. It may be down, or blocking automated visitors.";
  } else {
    claim.status = "drafted";
    claim.profile = structuredClone(SCANNED_PROFILE);
    claim.scanError = null;
  }
  claim.updatedAt = iso();
}

function requireClaim(...legal: ClaimStatus[]): Claim {
  ensureLoaded();

  if (!readToken() || !claim) {
    return fail("session_expired", { status: 401 });
  }

  settleScan();

  if (legal.length && !legal.includes(claim.status)) {
    return fail("wrong_status", {
      status: 409,
      currentStatus: claim.status,
      expectedStatus: legal,
    });
  }

  return claim;
}

/** Take the claim to the caller, and to storage on the way past. */
const snapshot = (): Claim => {
  persist();
  return structuredClone(claim!);
};

/* ── The implementation ─────────────────────────────────────────────────── */

export const mockOwnerApi: OwnerApi = {
  async searchPlaces(query) {
    await wait(520);
    const q = query.trim().toLowerCase();
    if (!q) return [];
    if (q.includes("xyzzy")) return [];
    return CANDIDATES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q),
    );
  },

  async getTaxonomy() {
    await wait(200);
    return structuredClone(TAXONOMY);
  },

  async requestListing() {
    await wait();
  },

  /*
   * The booking platforms and their guides are NOT mocked.
   *
   * `GET /reservation-platforms` and its `/guide` are public, live today, and
   * already power the connect widget — the platforms, their icons, the markdown
   * instructions and the screen recordings are all real. Inventing stand-ins
   * would mean reviewing step 6 against content that does not exist.
   *
   * Only the claim-scoped writes below are mocked, because the owner API is the
   * part that isn't live yet.
   */
  listReservationPlatforms: httpOwnerApi.listReservationPlatforms,
  getReservationGuide: httpOwnerApi.getReservationGuide,

  async listTicketSubjects() {
    await wait(200);
    return structuredClone(TICKET_SUBJECTS);
  },

  async createClaimTicket() {
    await wait(600);
  },

  async sendVerification({ placeId }) {
    await wait();

    const candidate = CANDIDATES.find((c) => c.placeId === placeId);
    if (!candidate) return fail("not_found", { status: 404 });
    if (ALREADY_CLAIMED.has(placeId)) {
      return fail("place_already_claimed", { status: 409 });
    }
    if (!candidate.phoneMasked) {
      return fail("no_phone_on_listing", { status: 409 });
    }

    // Idempotent: calling again refreshes the window, same verification.
    pending = {
      verificationId: pending?.placeId === placeId ? pending.verificationId : id("ver"),
      placeId,
      phoneMasked: candidate.phoneMasked,
      expiresAt: Date.now() + CODE_TTL_MS,
      resendAvailableAt: Date.now() + RESEND_AFTER_MS,
      attemptsRemaining: 5,
    };

    return {
      verificationId: pending.verificationId,
      phoneMasked: pending.phoneMasked,
      expiresAt: new Date(pending.expiresAt).toISOString(),
      resendAvailableAt: new Date(pending.resendAvailableAt).toISOString(),
      attemptsRemaining: pending.attemptsRemaining,
    } satisfies Verification;
  },

  async createSession({ verificationId, code }) {
    await wait();
    ensureLoaded();

    if (!pending || pending.verificationId !== verificationId) {
      return fail("not_found", { status: 404 });
    }
    if (Date.now() > pending.expiresAt) {
      return fail("code_expired", { status: 410 });
    }
    if (code === WRONG_CODE) {
      pending.attemptsRemaining -= 1;
      if (pending.attemptsRemaining <= 0) {
        return fail("too_many_attempts", { status: 429 }, 60);
      }
      return fail("invalid_code", {
        status: 422,
        attemptsRemaining: pending.attemptsRemaining,
      });
    }

    // Verifying the same number again resumes the same claim — which is what
    // makes "leave and come back" testable against the mock.
    if (!claim || claim.place.placeId !== pending.placeId) {
      claim = makeClaim(pending.placeId);
      if (claim.kind === "existing") {
        claim.status = "drafted";
        claim.profile = structuredClone(SCANNED_PROFILE);
      }
    }

    const token = id("tok");
    const expiresAt = iso(24 * 60 * 60 * 1000);
    writeToken(token, expiresAt);
    pending = null;

    return { token, expiresAt, claim: snapshot() };
  },

  async getSessionInfo() {
    await wait(160);
    ensureLoaded();
    if (!readToken() || !claim) return fail("session_expired", { status: 401 });
    return {
      claimId: claim.claimId,
      phoneMasked: "+31 •• ••• 1981",
      expiresAt: iso(24 * 60 * 60 * 1000),
    };
  },

  async endSession() {
    await wait(160);
    ensureLoaded();
    clearToken();
    claim = null;
    persist();
  },

  async getClaim() {
    await wait(160);
    requireClaim();
    return snapshot();
  },

  async patchPlace(patch) {
    await wait();
    const current = requireClaim("verified", "scan_failed", "drafted");

    current.place = {
      ...current.place,
      name: patch.name?.trim() || current.place.name,
      phone: patched(current.place.phone, patch.phone),
      websiteUri: patched(current.place.websiteUri, patch.websiteUri),
      neighbourhood: patched(current.place.neighbourhood, patch.neighbourhood),
    };
    current.updatedAt = iso();
    return snapshot();
  },

  async buildProfile(options) {
    await wait();
    const current = requireClaim("verified", "scan_failed");

    // Already listed, no website, or "fill it in by hand" — straight to drafted.
    if (options?.skipScan || current.kind === "existing" || !current.place.websiteUri) {
      current.status = "drafted";
      current.profile = current.profile ?? emptyProfile();
      current.scanError = null;
    } else {
      current.status = "scanning";
      current.scanError = null;
      scanStartedAt = Date.now();
    }

    current.updatedAt = iso();
    return snapshot();
  },

  async saveProfile(profile) {
    await wait();
    const current = requireClaim("drafted");
    current.profile = structuredClone(profile); // PUT replaces outright
    current.updatedAt = iso();
    return snapshot();
  },

  async addPhoto(file) {
    const current = requireClaim("drafted");
    if (current.photos.length >= 12) {
      return fail("invalid_request", { status: 400, detail: "That's the twelfth photo." });
    }

    await wait(700);

    current.photos.push({
      photoId: id("pho"),
      position: current.photos.length,
      url: URL.createObjectURL(file),
    });
    current.updatedAt = iso();
    return snapshot();
  },

  async movePhoto(photoId, position) {
    await wait(160);
    const current = requireClaim("drafted");

    const from = current.photos.findIndex((p) => p.photoId === photoId);
    if (from === -1) return fail("not_found", { status: 404 });

    const [moved] = current.photos.splice(from, 1);
    current.photos.splice(Math.min(position, current.photos.length), 0, moved);
    current.photos.forEach((p, index) => (p.position = index));
    current.updatedAt = iso();
    return snapshot();
  },

  async removePhoto(photoId) {
    await wait();
    const current = requireClaim("drafted");
    current.photos = current.photos.filter((p) => p.photoId !== photoId);
    current.photos.forEach((p, index) => (p.position = index));
    current.updatedAt = iso();
    return snapshot();
  },

  async connectReservation({ platformId, integrationId, apiKey }) {
    // Deliberately not restricted to `drafted`. Connecting a booking system is
    // not part of what an admin reviews, and a restaurant already in the
    // directory arrives with the claim terminal and nothing connected — that
    // owner is exactly who this endpoint is for.
    const current = requireClaim("drafted", "submitted", "approved", "live");

    // The platform is looked up in the live list rather than a local table, so
    // the name and icon stored on the claim are the real ones.
    const platform = (await httpOwnerApi.listReservationPlatforms()).find(
      (p) => p.id === platformId,
    );
    if (!platform) return fail("not_found", { status: 404 });

    await wait(1_600);

    // "0" is the mock's rejected credential, so the failure path is reachable.
    if (integrationId?.trim() === "0" || apiKey?.trim() === "0") {
      return fail("invalid_request", {
        status: 400,
        detail: `${platformLabel(platform.name)} didn't accept those details. Check them and try again.`,
      });
    }

    current.reservation = [
      ...current.reservation.filter((r) => r.platformId !== platformId),
      {
        platformId,
        platformName: platform.name,
        platformIcon: platform.iconUrl,
        integrationId: integrationId?.trim() || apiKey?.trim() || null,
      },
    ];
    current.updatedAt = iso();
    return snapshot();
  },

  async disconnectReservation(platformId) {
    await wait();
    const current = requireClaim("drafted", "submitted", "approved", "live");
    current.reservation = current.reservation.filter((r) => r.platformId !== platformId);
    current.updatedAt = iso();
    return snapshot();
  },

  async startSocialConnect(provider, redirectTo) {
    await wait();
    requireClaim("drafted");

    // No provider to bounce off, so the mock hands back a URL that comes
    // straight back with the connection already made. Same shape, same flow.
    const state = id("st");
    connectOnReturn(provider);
    return { authorizeUrl: redirectTo, state };
  },

  async disconnectSocial(provider) {
    await wait();
    const current = requireClaim("drafted");
    current.social = current.social.filter((s) => s.provider !== provider);
    current.updatedAt = iso();
    return snapshot();
  },

  async submitClaim() {
    await wait(700);
    const current = requireClaim("drafted");

    const profile = current.profile;
    const missing: string[] = [];
    if (!profile?.tagline?.trim()) missing.push("tagline");
    if (!profile?.description?.trim()) missing.push("description");
    if (!profile?.cuisines.length) missing.push("cuisines");
    if (!current.photos.length) missing.push("photos");
    if (missing.length) {
      return fail("profile_incomplete", { status: 422, missingFields: missing });
    }

    current.status = "submitted";
    current.updatedAt = iso();

    // Walk on to approved and live so the later screens are reachable.
    window.setTimeout(() => {
      if (claim?.status === "submitted") {
        claim.status = "approved";
        claim.updatedAt = iso();
      }
    }, 12_000);
    window.setTimeout(() => {
      if (claim?.status === "approved") {
        claim.status = "live";
        claim.updatedAt = iso();
      }
    }, 22_000);

    return snapshot();
  },
};

const HANDLES: Record<SocialProvider, string> = {
  instagram: "oli.mazi.utrecht",
  tiktok: "olimazi",
};

/** Record the account as linked, as a real provider callback would have. */
function connectOnReturn(provider: SocialProvider) {
  if (!claim) return;
  claim.social = [
    ...claim.social.filter((s) => s.provider !== provider),
    {
      provider,
      handle: HANDLES[provider],
      connectedAt: iso(),
      revoked: false,
    } satisfies SocialConnection,
  ];
  claim.updatedAt = iso();
  // The browser navigates away immediately after this, so an unpersisted
  // connection would not survive the trip — the owner would come back to a card
  // still reading "Not connected".
  persist();
}
