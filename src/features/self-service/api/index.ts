import { env } from "@/lib/env";
import { httpOwnerApi, type OwnerApi } from "./http";
import { mockOwnerApi, setMockScanFailure } from "./mock";

/**
 * One seam between the real API and the stand-in.
 *
 * `VITE_USE_MOCK` picks. Everything above this line — hooks, stages, components
 * — is written against `OwnerApi` and cannot tell the difference. When the
 * backend ships, turn the flag off; when it is stable, delete mock.ts and this
 * conditional.
 */
export const ownerApi: OwnerApi = env.useMock ? mockOwnerApi : httpOwnerApi;

export const isMockApi = env.useMock;

/** Only meaningful against the mock — the Details screen's failure switch. */
export const simulateScanFailure = env.useMock ? setMockScanFailure : () => {};

export type { OwnerApi };
