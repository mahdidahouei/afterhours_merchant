import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isProblem } from "@/lib/errors";
import { ErrorState } from "@/ui/ErrorState";
import { Spinner } from "@/ui/Spinner";
import { Toast } from "@/ui/Toast";
import { isMockApi, ownerApi } from "./api";
import { claimKeys, useClaim } from "./api/queries";
import type {
  ClaimStatus,
  PendingApi,
  PlaceCandidate,
  Session,
  Verification,
} from "./api/types";
import { EMPTY_PENDING_API } from "./api/types";
import { ClaimLayout } from "./components/ClaimLayout";
import { DevStageSwitcher } from "./components/DevStageSwitcher";
import type { Language } from "./stages/Review/MenusSection";
import type { LeaveGuard } from "./session/leaveGuard";
import { clearToken, writeToken } from "./session/tokenStore";
import {
  draftedStepAt,
  FIRST_DRAFTED_STEP,
  journeyIndexOf,
  reachableSteps,
  stageForClaim,
  STAGE_LABEL,
  type AnonStage,
  type DraftedStep,
  type Stage,
} from "./stages";
import { BookingsStage } from "./stages/Bookings";
import { DetailsStage } from "./stages/DetailsStage";
import { FindStage } from "./stages/FindStage";
import { OtpStage } from "./stages/OtpStage";
import { PhotosStage } from "./stages/PhotosStage";
import { ReviewStage } from "./stages/Review";
import { ScanningStage } from "./stages/ScanningStage";
import { StatusStage } from "./stages/StatusStage";
import { VerifyOwnershipStage } from "./stages/VerifyOwnershipStage";

/** Milestones worth acknowledging, keyed by the status that produces them. */
const MILESTONES: Partial<Record<ClaimStatus, { title: string; description: string }>> = {
  drafted: {
    title: "Profile drafted",
    description: "Read it over and fix anything we got wrong.",
  },
  submitted: {
    title: "Sent for review",
    description: "We'll text you when your listing is live.",
  },
  live: { title: "You're live", description: "Guests can find you on Afterhours." },
};

/**
 * The claim flow.
 *
 * Two phases. Before a token exists the page owns the stage; after it, the
 * screen is a function of `claim.status` — which is the contract's central rule,
 * and the reason there is no stage state to get out of sync with the server.
 *
 * Every visit starts at the search box. A session is something you establish by
 * verifying, here, now — not something a previous visit left in this browser —
 * so any stored token is dropped on arrival. Where an owner lands afterwards is
 * decided entirely by the `status` on the claim that `POST /sessions` returns.
 *
 * `drafted` covers four screens and the contract has no field naming which, so a
 * returning owner lands on the first of them. Guessing from photo counts, or
 * remembering the answer in this browser, would both be the client inventing
 * something the server never said. When `Claim` grows a step field, seed
 * `draftedStep` from it and that limitation goes away.
 */
export default function SelfServicePage() {
  const queryClient = useQueryClient();

  /* Phase A — before a claim exists. */
  const [anonStage, setAnonStage] = useState<AnonStage>("search");
  const [candidate, setCandidate] = useState<PlaceCandidate | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [otpTarget, setOtpTarget] = useState("");

  /* Phase B — which of the four `drafted` screens is showing. Session-only: the
     rail and the Back buttons move it, and nothing persists it. */
  const [draftedStep, setDraftedStep] = useState<DraftedStep>(FIRST_DRAFTED_STEP);

  /** Controls the design draws that have no endpoint yet. */
  const [pendingApi, setPendingApi] = useState<PendingApi>(EMPTY_PENDING_API);

  /**
   * Whether a session was established *in this visit*.
   *
   * The initialiser drops any token a previous visit left behind, and it does so
   * here rather than in an effect because `useClaim` reads the token during
   * render — an effect would run one render too late and let an authenticated
   * request escape for a session we are about to discard.
   */
  const [hasToken, setHasToken] = useState(() => {
    clearToken();
    return false;
  });

  const claim = useClaim();

  /**
   * Set when an owner whose claim is already terminal has dealt with bookings —
   * connected one, or said they'd do it later. Until then they see step 6
   * rather than a waiting screen. See `stageForClaim`.
   */
  const [bookingsSettled, setBookingsSettled] = useState(false);

  /** The current screen's chance to save before the rail navigates away. */
  const leaveGuard = useRef<LeaveGuard | null>(null);

  /* The query client outlives a route change, so drop the previous claim too. */
  useEffect(() => {
    queryClient.removeQueries({ queryKey: claimKeys.claim });
  }, [queryClient]);

  /** Dev-only: seed the mock into a status and render that screen. */
  const jumpToScreen = useCallback(
    (step: DraftedStep | undefined, seeded: boolean) => {
      if (step) setDraftedStep(step);
      if (!seeded) {
        setCandidate(null);
        setVerification(null);
        setAnonStage("search");
      }
      setHasToken(seeded);
      void claim.refetch();
    },
    // `claim` is a stable query object; depending on it would rebuild this
    // callback on every poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* A dead token drops us back to verification with the work intact. */
  useEffect(() => {
    if (isProblem(claim.error, "session_expired")) {
      clearToken();
      setHasToken(false);
      setAnonStage(candidate ? "verifyOwnership" : "search");
    }
  }, [claim.error, candidate]);

  const status = claim.data?.status;
  const stage: Stage =
    hasToken && claim.data
      ? stageForClaim(claim.data, draftedStep, bookingsSettled)
      : anonStage;

  const milestone = useMilestone(status);

  const onVerified = useCallback(
    (session: Session) => {
      writeToken(session.token, session.expiresAt);
      queryClient.setQueryData(claimKeys.claim, session.claim);
      setHasToken(true);
    },
    [queryClient],
  );

  const restart = useCallback(async () => {
    await ownerApi.endSession().catch(() => null);
    clearToken();
    queryClient.removeQueries({ queryKey: claimKeys.claim });
    setHasToken(false);
    setCandidate(null);
    setVerification(null);
    setAnonStage("search");
    setDraftedStep(FIRST_DRAFTED_STEP);
    setBookingsSettled(false);
    setPendingApi(EMPTY_PENDING_API);
  }, [queryClient]);

  const activeIndex = journeyIndexOf(stage);

  /** Move to another step of the drafted phase, saving the current one first. */
  const goToStep = useCallback(async (index: number) => {
    const step = draftedStepAt(index);
    if (!step) return;

    // The screen being left may be holding unsaved edits. If saving them fails,
    // stay put — the error is already on screen where it happened.
    if (leaveGuard.current && !(await leaveGuard.current())) return;

    setDraftedStep(step);
  }, []);

  return (
    <ClaimLayout
      activeIndex={activeIndex}
      stageLabel={STAGE_LABEL[stage]}
      reachable={reachableSteps(status)}
      onNavigate={(index) => void goToStep(index)}
    >
      {isMockApi && <DevStageSwitcher onJump={jumpToScreen} />}

      <Toast
        isOpen={milestone.isOpen}
        title={milestone.content?.title ?? ""}
        description={milestone.content?.description}
        onDismiss={milestone.dismiss}
      />

      {/* Rehydrating a stored session before we know which screen to show. */}
      {hasToken && claim.isLoading && (
        <div className="flex min-h-[320px] items-center justify-center">
          <Spinner />
        </div>
      )}

      {hasToken && claim.isError && !isProblem(claim.error, "session_expired") && (
        <ErrorState error={claim.error} onRetry={() => void claim.refetch()} />
      )}

      {stage === "search" && (
        <FindStage
          onSelect={(selected) => {
            setCandidate(selected);
            setAnonStage("verifyOwnership");
          }}
        />
      )}

      {stage === "verifyOwnership" && candidate && (
        <VerifyOwnershipStage
          candidate={candidate}
          onBack={() => setAnonStage("search")}
          onSent={(sent, target) => {
            setVerification(sent);
            setOtpTarget(target);
            setAnonStage("otp");
          }}
        />
      )}

      {stage === "otp" && candidate && verification && (
        <OtpStage
          candidate={candidate}
          verification={verification}
          target={otpTarget}
          onBack={() => setAnonStage("verifyOwnership")}
          onVerified={onVerified}
          onResent={setVerification}
        />
      )}

      {claim.data && (
        <>
          {stage === "details" && (
            <DetailsStage
              claim={claim.data}
              // Only once a profile exists: before that, this screen's job is to
              // start the scan, and there is nowhere to go back to.
              onDone={
                claim.data.status === "drafted"
                  ? () => setDraftedStep("review")
                  : undefined
              }
              leaveGuard={leaveGuard}
            />
          )}

          {stage === "scanning" && <ScanningStage claim={claim.data} />}

          {stage === "review" && (
            <ReviewStage
              claim={claim.data}
              onBack={() => setDraftedStep("details")}
              onContinue={() => setDraftedStep("photos")}
              leaveGuard={leaveGuard}
              languages={pendingApi.menuFileLanguages}
              onLanguageChange={(key, language) =>
                setPendingApi((prev) => ({
                  ...prev,
                  menuFileLanguages: { ...prev.menuFileLanguages, [key]: language },
                }))
              }
              primaryPlatform={pendingApi.primaryPlatform}
              onPrimaryPlatformChange={(value) =>
                setPendingApi((prev) => ({ ...prev, primaryPlatform: value }))
              }
            />
          )}

          {stage === "photos" && (
            <PhotosStage
              claim={claim.data}
              onBack={() => setDraftedStep("review")}
              onContinue={() => setDraftedStep("bookings")}
            />
          )}

          {stage === "bookings" &&
            (claim.data.status === "drafted" ? (
              <BookingsStage
                claim={claim.data}
                onBack={() => setDraftedStep("photos")}
              />
            ) : (
              // Terminal claim: there is no step behind this one to go back to,
              // and nothing left to submit.
              <BookingsStage
                claim={claim.data}
                mode="connect-only"
                onSettled={() => setBookingsSettled(true)}
              />
            ))}

          {(stage === "submitted" || stage === "approved" || stage === "live") && (
            <StatusStage
              claim={claim.data}
              onRestart={() => void restart()}
              // Only reachable after they skipped it; the offer stays open.
              onConnectBookings={
                claim.data.reservation.length === 0
                  ? () => setBookingsSettled(false)
                  : undefined
              }
            />
          )}
        </>
      )}
    </ClaimLayout>
  );
}

/**
 * Show a milestone toast the first time a status is reached.
 *
 * Keyed on status rather than on a mutation succeeding, so an owner returning to
 * a claim already past that point doesn't replay congratulations for work done
 * yesterday.
 */
function useMilestone(status: ClaimStatus | undefined) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<{ title: string; description: string } | null>(
    null,
  );
  const seen = useRef<Set<ClaimStatus>>(new Set());
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!status) return;

    // A session that reopens mid-flow arrives already past these; not a milestone.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      seen.current.add(status);
      return;
    }

    if (seen.current.has(status)) return;
    seen.current.add(status);

    const next = MILESTONES[status];
    if (!next) return;

    setContent(next);
    setIsOpen(true);
  }, [status]);

  return { isOpen, content, dismiss: useCallback(() => setIsOpen(false), []) };
}

export type { Language };
