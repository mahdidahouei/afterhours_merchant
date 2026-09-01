import type { Claim, Photo, Profile } from "./types";

/**
 * Make a claim safe to render, whatever the wire actually sent.
 *
 * The contract's rule is "a field is always present; absent values are null and
 * lists are always lists", and the whole app leans on it — `claim.photos.length`
 * and `claim.reservation.length` are read unguarded on four screens, so a single
 * `null` where an empty array was promised is a white screen rather than a
 * missing row.
 *
 * That rule held for the mock because the mock and these types were written
 * together. Against a real server it is an assumption, and this is the one place
 * it costs nothing to stop assuming. Every response that carries a Claim goes
 * through here.
 *
 * This is not a place to reshape or rename anything — if a field is genuinely
 * different from the contract, fix the contract and the types. All this does is
 * hold the "always a list" promise for lists, and the "always present" promise
 * for the nested objects inside a profile.
 */
export function normalizeClaim(claim: Claim): Claim {
  return {
    ...claim,
    photos: asArray<Photo>(claim.photos)
      // Position drives display order and the "leads the listing" badge.
      .slice()
      .sort((a, b) => a.position - b.position),
    reservation: asArray(claim.reservation),
    social: asArray(claim.social),
    profile: claim.profile ? normalizeProfile(claim.profile) : null,
  };
}

function normalizeProfile(profile: Profile): Profile {
  return {
    ...profile,
    cuisines: asArray(profile.cuisines),
    vibes: asArray(profile.vibes),
    perfectFor: asArray(profile.perfectFor),
    moments: asArray(profile.moments),
    reservationPlatforms: asArray(profile.reservationPlatforms),
    menus: asArray(profile.menus).map((menu) => ({
      ...menu,
      files: asArray(menu.files),
    })),
    // The chip pickers and the contact fields read straight through this.
    social: {
      instagram: profile.social?.instagram ?? null,
      facebook: profile.social?.facebook ?? null,
      tiktok: profile.social?.tiktok ?? null,
    },
  };
}

const asArray = <T>(value: T[] | null | undefined): T[] =>
  Array.isArray(value) ? value : [];
