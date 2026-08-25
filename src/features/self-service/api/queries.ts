import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isProblem } from "@/lib/errors";
import { readToken } from "../session/tokenStore";
import { ownerApi } from ".";
import type { Claim, ClaimStatus, PlacePatch, Profile } from "./types";

export const claimKeys = {
  claim: ["owner", "claim"] as const,
  taxonomy: ["owner", "taxonomy"] as const,
  places: (query: string) => ["owner", "places", query] as const,
};

/**
 * How often to re-read the claim, by status.
 *
 * The scan finishes in seconds, so it is watched closely. Review and approval
 * are done by a person and can take hours — polled slowly so the screen still
 * moves on by itself, without hammering the API while a tab sits open all day.
 * Everything else is driven by the owner's own writes and needs no polling.
 */
const POLL_MS: Partial<Record<ClaimStatus, number>> = {
  scanning: 2_000,
  submitted: 10_000,
  approved: 10_000,
};

/* ── Reads ──────────────────────────────────────────────────────────────── */

export function usePlaceSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: claimKeys.places(trimmed),
    queryFn: ({ signal }) => ownerApi.searchPlaces(trimmed, signal),
    enabled: trimmed.length >= 2,
    // A search result set is worth keeping while the owner tabs around the
    // verify screen and comes back.
    staleTime: 60_000,
  });
}

/** Option lists behind every chip picker. Fetched once and kept. */
export function useTaxonomy() {
  return useQuery({
    queryKey: claimKeys.taxonomy,
    queryFn: () => ownerApi.getTaxonomy(),
    staleTime: Infinity,
  });
}

/**
 * The claim. This is the app's single source of truth once a token exists —
 * every screen after verification renders from `claim.status`.
 *
 * Polls itself while scanning, because that transition happens server-side with
 * nothing to subscribe to.
 */
export function useClaim() {
  const hasToken = Boolean(readToken());

  return useQuery({
    queryKey: claimKeys.claim,
    queryFn: () => ownerApi.getClaim(),
    enabled: hasToken,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return (status && POLL_MS[status]) ?? false;
    },
    // Keep polling while the owner is on another tab watching for the scan.
    refetchIntervalInBackground: true,
    // A dead token is terminal; retrying just replays the 401.
    retry: (failureCount, error) =>
      !isProblem(error, "session_expired") && failureCount < 1,
  });
}

/* ── Writes ─────────────────────────────────────────────────────────────── */

/**
 * Every mutation answers with the complete claim, so the cache is replaced
 * rather than invalidated. That is the contract's whole point: nothing to
 * merge, nothing to refetch, and no window where the screen disagrees with
 * the server.
 */
function useClaimMutation<TArgs>(mutationFn: (args: TArgs) => Promise<Claim>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (claim) => queryClient.setQueryData(claimKeys.claim, claim),
  });
}

export const usePatchPlace = () =>
  useClaimMutation((patch: PlacePatch) => ownerApi.patchPlace(patch));

export const useBuildProfile = () =>
  useClaimMutation((options: { skipScan?: boolean } | void) =>
    ownerApi.buildProfile(options ?? undefined),
  );

export const useSaveProfile = () =>
  useClaimMutation((profile: Profile) => ownerApi.saveProfile(profile));

export const useAddPhoto = () => useClaimMutation((file: File) => ownerApi.addPhoto(file));

export const useMovePhoto = () =>
  useClaimMutation(({ photoId, position }: { photoId: string; position: number }) =>
    ownerApi.movePhoto(photoId, position),
  );

export const useRemovePhoto = () =>
  useClaimMutation((photoId: string) => ownerApi.removePhoto(photoId));

export const useSubmitClaim = () =>
  useClaimMutation((_: void) => ownerApi.submitClaim());

/* ── Verification ───────────────────────────────────────────────────────── */

export function useSendVerification() {
  return useMutation({
    mutationFn: (body: { placeId: string; phone?: string }) =>
      ownerApi.sendVerification(body),
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { verificationId: string; code: string }) =>
      ownerApi.createSession(body),
    onSuccess: (session) => {
      // The session response already carries the claim — seed the cache with it
      // so the next screen renders without a round trip.
      queryClient.setQueryData(claimKeys.claim, session.claim);
    },
  });
}

export function useRequestListing() {
  return useMutation({
    mutationFn: (body: {
      name: string;
      city: string;
      contactEmail: string;
      note?: string;
    }) => ownerApi.requestListing(body),
  });
}
