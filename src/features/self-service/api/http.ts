import { api } from "@/lib/api";
import { ownerClient } from "./client";
import { normalizeClaim } from "./normalize";
import type {
  Claim,
  ClaimTicketBody,
  CreateSessionBody,
  ListingRequestBody,
  PlaceCandidate,
  PlacePatch,
  Profile,
  ReservationConnectBody,
  ReservationGuide,
  ReservationPlatform,
  SendVerificationBody,
  Session,
  SessionInfo,
  SocialConnectStart,
  SocialProvider,
  Taxonomy,
  TicketSubject,
  Verification,
} from "./types";

/**
 * Every endpoint the claim flow uses, exactly as the contract defines them.
 *
 * Public calls use the token-free client; everything under /claim and /session
 * uses the bearer client. Every claim mutation returns the complete Claim, so
 * callers replace their copy rather than merging.
 */
export type OwnerApi = {
  /* Public */
  searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceCandidate[]>;
  getTaxonomy(): Promise<Taxonomy>;
  requestListing(body: ListingRequestBody): Promise<void>;
  /** Idempotent — call again to resend. There is no resend endpoint. */
  sendVerification(body: SendVerificationBody): Promise<Verification>;
  createSession(body: CreateSessionBody): Promise<Session>;
  listReservationPlatforms(): Promise<ReservationPlatform[]>;
  getReservationGuide(platformId: string): Promise<ReservationGuide>;
  listTicketSubjects(): Promise<TicketSubject[]>;
  createClaimTicket(body: ClaimTicketBody): Promise<void>;

  /* Authenticated */
  getSessionInfo(): Promise<SessionInfo>;
  endSession(): Promise<void>;
  getClaim(): Promise<Claim>;
  patchPlace(patch: PlacePatch): Promise<Claim>;
  /** Read the website and draft a profile. `skipScan` fills it in by hand. */
  buildProfile(options?: { skipScan?: boolean }): Promise<Claim>;
  /** Replaces outright — always send the complete Profile. */
  saveProfile(profile: Profile): Promise<Claim>;
  addPhoto(file: File): Promise<Claim>;
  movePhoto(photoId: string, position: number): Promise<Claim>;
  removePhoto(photoId: string): Promise<Claim>;
  connectReservation(body: ReservationConnectBody): Promise<Claim>;
  disconnectReservation(platformId: string): Promise<Claim>;
  /** Hands back the provider's consent screen to send the owner to. */
  startSocialConnect(
    provider: SocialProvider,
    redirectTo: string,
  ): Promise<SocialConnectStart>;
  disconnectSocial(provider: SocialProvider): Promise<Claim>;
  submitClaim(): Promise<Claim>;
};

export const httpOwnerApi: OwnerApi = {
  async searchPlaces(query, signal) {
    const { data } = await api.get<PlaceCandidate[]>("/places", {
      params: { query },
      signal,
    });
    return data;
  },

  async getTaxonomy() {
    const { data } = await api.get<Taxonomy>("/taxonomy");
    return data;
  },

  async requestListing(body) {
    await api.post("/listing-requests", body);
  },

  async sendVerification(body) {
    const { data } = await api.post<Verification>("/verifications", body);
    return data;
  },

  async createSession(body) {
    const { data } = await api.post<Session>("/sessions", body);
    return { ...data, claim: normalizeClaim(data.claim) };
  },

  async listReservationPlatforms() {
    const { data } = await api.get<ReservationPlatform[]>("/reservation-platforms");
    return data;
  },

  async getReservationGuide(platformId) {
    const { data } = await api.get<ReservationGuide>(
      `/reservation-platforms/${platformId}/guide`,
    );
    return data;
  },

  async listTicketSubjects() {
    const { data } = await api.get<TicketSubject[]>("/ticket-subjects");
    return data;
  },

  async createClaimTicket(body) {
    await api.post("/claim-tickets", body);
  },

  async getSessionInfo() {
    const { data } = await ownerClient.get<SessionInfo>("/session");
    return data;
  },

  async endSession() {
    await ownerClient.delete("/session");
  },

  async getClaim() {
    const { data } = await ownerClient.get<Claim>("/claim");
    return normalizeClaim(data);
  },

  async patchPlace(patch) {
    const { data } = await ownerClient.patch<Claim>("/claim/place", patch);
    return normalizeClaim(data);
  },

  async buildProfile(options) {
    const { data } = await ownerClient.post<Claim>("/claim/profile", options ?? {});
    return normalizeClaim(data);
  },

  async saveProfile(profile) {
    const { data } = await ownerClient.put<Claim>("/claim/profile", profile);
    return normalizeClaim(data);
  },

  async addPhoto(file) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await ownerClient.post<Claim>("/claim/photos", form);
    return normalizeClaim(data);
  },

  async movePhoto(photoId, position) {
    const { data } = await ownerClient.patch<Claim>(`/claim/photos/${photoId}`, {
      position,
    });
    return normalizeClaim(data);
  },

  async removePhoto(photoId) {
    const { data } = await ownerClient.delete<Claim>(`/claim/photos/${photoId}`);
    return normalizeClaim(data);
  },

  async connectReservation(body) {
    const { data } = await ownerClient.post<Claim>("/claim/reservation", body);
    return normalizeClaim(data);
  },

  async disconnectReservation(platformId) {
    const { data } = await ownerClient.delete<Claim>(
      `/claim/reservation/${platformId}`,
    );
    return normalizeClaim(data);
  },

  async startSocialConnect(provider, redirectTo) {
    const { data } = await ownerClient.post<SocialConnectStart>(
      `/claim/social/${provider}/connect`,
      { redirectTo },
    );
    return data;
  },

  async disconnectSocial(provider) {
    const { data } = await ownerClient.delete<Claim>(`/claim/social/${provider}`);
    return normalizeClaim(data);
  },

  async submitClaim() {
    const { data } = await ownerClient.post<Claim>("/claim/submit");
    return normalizeClaim(data);
  },
};
