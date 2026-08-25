import { ProblemError, type ProblemBody, type ProblemCode } from "@/lib/errors";
import { clearToken, readToken, writeToken } from "../session/tokenStore";
import type { OwnerApi } from "./http";
import type {
  Claim,
  ClaimStatus,
  PlaceCandidate,
  Photo,
  Place,
  Profile,
  Taxonomy,
  Verification,
} from "./types";

/**
 * An in-memory stand-in for the owner API, faithful to the contract.
 *
 * It exists because the backend is not live yet and the flow is eight screens
 * deep — without it, nothing past the search box can be seen or reviewed. It
 * reproduces the parts that shape the UI: latency, the status transitions, the
 * scan that takes time and can fail, and the real error codes.
 *
 * Enabled by VITE_USE_MOCK. Delete this file and its two references when the
 * real API ships.
 */

const LATENCY_MS = 420;
const SCAN_DURATION_MS = 9_000;
const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_AFTER_MS = 30 * 1000;

/** The code that always works, and the one that always fails. */
const WRONG_CODE = "000000";

const wait = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

const fail = (code: ProblemCode, extra: ProblemBody = {}, retryAfter?: number): never => {
  throw new ProblemError(code, { status: extra.status ?? 400, ...extra }, retryAfter);
};

const iso = (offsetMs = 0) => new Date(Date.now() + offsetMs).toISOString();
const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

/* ── Seed data ──────────────────────────────────────────────────────────── */

const CANDIDATES: PlaceCandidate[] = [
  {
    placeId: "pl_oli_mazi",
    name: "Oli Mazi",
    address: "Oudegracht 195, 3511 NG Utrecht",
    phoneMasked: "+31 •• ••• 1981",
    claimability: "available",
  },
  {
    placeId: "pl_gys",
    name: "Gys Utrecht",
    address: "Voorstraat 77, 3512 AK Utrecht",
    phoneMasked: "+31 •• ••• 4420",
    claimability: "listed",
  },
  {
    placeId: "pl_broei",
    name: "Broei",
    address: "Jaarbeursplein 6, 3521 AL Utrecht",
    phoneMasked: "+31 •• ••• 7788",
    claimability: "available",
  },
  {
    placeId: "pl_taken",
    name: "Café Olivier",
    address: "Achter Clarenburg 6a, 3511 JJ Utrecht",
    phoneMasked: "+31 •• ••• 3301",
    claimability: "claimed",
  },
  {
    placeId: "pl_nophone",
    name: "De Zagerij",
    address: "Vlampijpstraat 84, 3534 AR Utrecht",
    phoneMasked: null,
    claimability: "available",
  },
];

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
      files: [
        { title: "Dinner menu", link: "https://olimazi.nl/menu.pdf", type: "pdf" },
      ],
    },
    {
      title: "Drinks",
      files: [
        { title: "Wine list", link: "https://olimazi.nl/wine", type: "webpage" },
      ],
    },
  ],
};

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

export function setMockScanFailure(shouldFail: boolean) {
  scanShouldFail = shouldFail;
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
    kind: CANDIDATES.find((c) => c.placeId === placeId)?.claimability === "listed"
      ? "existing"
      : "new",
    status: "verified",
    place: { ...place },
    profile: null,
    photos: [],
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

const snapshot = (): Claim => structuredClone(claim!);

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

  async sendVerification({ placeId, phone }) {
    await wait();

    const candidate = CANDIDATES.find((c) => c.placeId === placeId);
    if (!candidate) return fail("not_found", { status: 404 });
    if (candidate.claimability === "claimed") {
      return fail("place_already_claimed", { status: 409 });
    }
    if (!candidate.phoneMasked) {
      return fail("no_phone_on_listing", { status: 409 });
    }
    // A custom number has to match the listing. "1981" is Oli Mazi's.
    if (phone && !phone.replace(/\D/g, "").endsWith("1981")) {
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

    // Verifying the same number again resumes the same claim.
    if (!claim || claim.place.placeId !== pending.placeId) {
      claim = makeClaim(pending.placeId);
      if (claim.kind === "existing") {
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
    if (!readToken() || !claim) return fail("session_expired", { status: 401 });
    return {
      claimId: claim.claimId,
      phoneMasked: "+31 •• ••• 1981",
      expiresAt: iso(24 * 60 * 60 * 1000),
    };
  },

  async endSession() {
    await wait(160);
    clearToken();
  },

  async getClaim() {
    await wait(160);
    requireClaim();
    return snapshot();
  },

  async patchPlace(patch) {
    await wait();
    const current = requireClaim("verified", "scan_failed", "drafted");
    current.place = { ...current.place, ...patch };
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

    const url = URL.createObjectURL(file);
    const { width, height } = await readImageSize(url);
    await wait(700);

    const photo: Photo = {
      photoId: id("pho"),
      position: current.photos.length,
      url,
      width,
      height,
      uploadedAt: iso(),
    };
    current.photos.push(photo);
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

function readImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 1200, height: 800 });
    img.src = url;
  });
}
