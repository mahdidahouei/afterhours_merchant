import { useEffect, useMemo, useState } from "react";
import type { Claim, Profile } from "../../api/types";
import { PROFILE_LIMITS } from "../../api/types";

/** A profile with nothing in it — what a skipped scan starts from. */
export const emptyProfile = (): Profile => ({
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

/** Empty strings become null on the wire — the contract has no empty strings. */
export const trimmed = (value: string): string | null => value.trim() || null;

/**
 * The editable copy of the profile.
 *
 * `PUT /claim/profile` replaces outright, so the draft is always a complete
 * Profile and every save posts all of it — even when the owner touched one
 * accordion. Keeping one whole object here rather than per-section state is
 * what makes that safe.
 */
export function useProfileDraft(claim: Claim) {
  const [draft, setDraft] = useState<Profile>(() => claim.profile ?? emptyProfile());

  // The server is the source of truth: adopt whatever a mutation handed back,
  // but only when it is genuinely a different profile object.
  useEffect(() => {
    if (claim.profile) setDraft(claim.profile);
  }, [claim.profile]);

  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const updateSocial = (key: keyof Profile["social"], value: string) =>
    setDraft((prev) => ({
      ...prev,
      social: { ...prev.social, [key]: trimmed(value) },
    }));

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(claim.profile ?? emptyProfile()),
    [draft, claim.profile],
  );

  return { draft, setDraft, update, updateSocial, isDirty };
}

/**
 * How complete the profile reads, as a percentage.
 *
 * Not a server concept — purely a nudge toward a listing that looks finished.
 * Photos count because a listing without one is the weakest thing we can
 * publish.
 */
export function profileStrength(profile: Profile, photoCount: number): number {
  const checks: boolean[] = [
    Boolean(profile.description?.trim()),
    profile.cuisines.length > 0,
    profile.vibes.length > 0,
    profile.perfectFor.length > 0,
    Boolean(profile.establishmentType),
    Boolean(profile.email?.trim()),
    Boolean(profile.social.instagram?.trim()),
    profile.reservable ? Boolean(profile.reservationUrl?.trim()) : true,
    profile.menus.length > 0,
    photoCount >= 3,
  ];

  const met = checks.filter(Boolean).length;
  return Math.round((met / checks.length) * 100);
}

/** Which accordion a `missingFields` path from `profile_incomplete` belongs to. */
export function sectionOfField(path: string): 0 | 1 | 2 {
  const head = path.split(".")[0];
  if (["email", "social", "reservable", "reservationUrl", "reservationPlatforms"].includes(head)) {
    return 1;
  }
  if (head === "menus") return 2;
  return 0;
}

export { PROFILE_LIMITS };
