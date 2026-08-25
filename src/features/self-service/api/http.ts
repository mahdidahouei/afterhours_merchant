import { api } from "@/lib/api";
import { ownerClient } from "./client";
import type {
  Claim,
  CreateSessionBody,
  ListingRequestBody,
  PlaceCandidate,
  PlacePatch,
  Profile,
  SendVerificationBody,
  Session,
  SessionInfo,
  Taxonomy,
  Verification,
} from "./types";

/**
 * The fifteen endpoints, exactly as the contract defines them.
 *
 * Public calls use the token-free client; everything under /claim and /session
 * uses the bearer client. Every mutation returns the complete Claim, so callers
 * replace their copy rather than merging.
 */
export type OwnerApi = {
  /* Public */
  searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceCandidate[]>;
  getTaxonomy(): Promise<Taxonomy>;
  requestListing(body: ListingRequestBody): Promise<void>;
  /** Idempotent — call again to resend. There is no resend endpoint. */
  sendVerification(body: SendVerificationBody): Promise<Verification>;
  createSession(body: CreateSessionBody): Promise<Session>;

  /* Authenticated */
  getSessionInfo(): Promise<SessionInfo>;
  endSession(): Promise<void>;
  getClaim(): Promise<Claim>;
  patchPlace(patch: PlacePatch): Promise<Claim>;
  /** Build my profile. `skipScan` fills it in by hand instead. */
  buildProfile(options?: { skipScan?: boolean }): Promise<Claim>;
  /** Replaces outright — always send the complete Profile. */
  saveProfile(profile: Profile): Promise<Claim>;
  addPhoto(file: File): Promise<Claim>;
  movePhoto(photoId: string, position: number): Promise<Claim>;
  removePhoto(photoId: string): Promise<Claim>;
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
    return data;
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
    return data;
  },

  async patchPlace(patch) {
    const { data } = await ownerClient.patch<Claim>("/claim/place", patch);
    return data;
  },

  async buildProfile(options) {
    const { data } = await ownerClient.post<Claim>("/claim/profile", options ?? {});
    return data;
  },

  async saveProfile(profile) {
    const { data } = await ownerClient.put<Claim>("/claim/profile", profile);
    return data;
  },

  async addPhoto(file) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await ownerClient.post<Claim>("/claim/photos", form);
    return data;
  },

  async movePhoto(photoId, position) {
    const { data } = await ownerClient.patch<Claim>(`/claim/photos/${photoId}`, { position });
    return data;
  },

  async removePhoto(photoId) {
    const { data } = await ownerClient.delete<Claim>(`/claim/photos/${photoId}`);
    return data;
  },

  async submitClaim() {
    const { data } = await ownerClient.post<Claim>("/claim/submit");
    return data;
  },
};
