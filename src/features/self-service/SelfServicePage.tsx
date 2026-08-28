import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isProblem } from "@/lib/errors";
import { ErrorState } from "@/ui/ErrorState";
import { Spinner } from "@/ui/Spinner";
import { Toast } from "@/ui/Toast";
import { isMockApi, ownerApi } from "./api";
import { claimKeys, useClaim } from "./api/queries";
import type {
  Claim,
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
import { clearProgress, readProgress, writeProgress } from "./session/progressStore";
import { clearToken, readToken, writeToken } from "./session/tokenStore";
import {
  journeyIndexOf,
  resumeStep,
  stageForStatus,
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
 * The one exception is `drafted`, which covers build, photos and bookings. The
 * API has no field distinguishing them, so `draftedStep` lives here and is
 * seeded once per claim by `resumeStep`.
 */
export default function SelfServicePage() {
  const queryClient = useQueryClient();

  /* Phase A — before a claim exists. */
  const [anonStage, setAnonStage] = useState<AnonStage>("search");
  const [candidate, setCandidate] = useState<PlaceCandidate | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [otpTarget, setOtpTarget] = useState("");

  /* Phase B — which of the three `drafted` screens is showing. */
  const [draftedStep, setDraftedStep] = useState<DraftedStep>("review");

  /** Controls the design draws that have no endpoint yet. */
  const [pendingApi, setPendingApi] = useState<PendingApi>(EMPTY_PENDING_API);

  const [hasToken, setHasToken] = useState(() => Boolean(readToken()));
  const claim = useClaim();

  /** Which claim `useResume` has already positioned. See the hook. */
  const resumedFor = useRef<string | null>(null);
  /** Set when something else has already chosen the step for the next claim. */
  const skipResume = useRef(false);

  /** Dev-only: seed the mock into a status and render that screen. */
  const jumpToScreen = useCallback(
    (step: DraftedStep | undefined, seeded: boolean) => {
      // Seeding mints a fresh claimId, which would otherwise look to `useResume`
      // like a new claim to position — and it would derive its own step and
      // overwrite the one just asked for. The switcher wins.
      resumedFor.current = null;
      skipResume.current = Boolean(step);
      if (step) setDraftedStep(step);
      if (!seeded) {
        setCandidate(null);
        setVerification(null);
        setAnonStage("search");
        clearProgress();
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

  useResume(claim.data, setDraftedStep, resumedFor, skipResume);

  const status = claim.data?.status;
  const stage: Stage = hasToken && status ? stageForStatus(status, draftedStep) : anonStage;

  /* Remember how far they got, so leaving mid-flow returns them here. */
  useEffect(() => {
    if (claim.data?.status === "drafted") {
      writeProgress(claim.data.claimId, draftedStep);
    }
  }, [claim.data?.status, claim.data?.claimId, draftedStep]);

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
    clearProgress();
    queryClient.removeQueries({ queryKey: claimKeys.claim });
    setHasToken(false);
    setCandidate(null);
    setVerification(null);
    setAnonStage("search");
    setDraftedStep("review");
    setPendingApi(EMPTY_PENDING_API);
  }, [queryClient]);

  const activeIndex = journeyIndexOf(stage);

  return (
    <ClaimLayout activeIndex={activeIndex} stageLabel={STAGE_LABEL[stage]}>
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
          {stage === "details" && <DetailsStage claim={claim.data} />}

          {stage === "scanning" && <ScanningStage claim={claim.data} />}

          {stage === "review" && (
            <ReviewStage
              claim={claim.data}
              onContinue={() => setDraftedStep("photos")}
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

          {stage === "bookings" && (
            <BookingsStage claim={claim.data} onBack={() => setDraftedStep("photos")} />
          )}

          {(stage === "submitted" || stage === "approved" || stage === "live") && (
            <StatusStage claim={claim.data} onRestart={() => void restart()} />
          )}
        </>
      )}
    </ClaimLayout>
  );
}

/**
 * Put a returning owner back where they stopped.
 *
 * Runs once per claim, on the first `drafted` payload this page sees. After
 * that the owner's own Back and Continue own the position — re-deriving on
 * every poll would yank them forward the moment a photo finished uploading.
 */
function useResume(
  claim: Claim | undefined,
  setDraftedStep: (step: DraftedStep) => void,
  resumedFor: React.MutableRefObject<string | null>,
  skipResume: React.MutableRefObject<boolean>,
) {
  useEffect(() => {
    if (!claim || claim.status !== "drafted") return;
    if (resumedFor.current === claim.claimId) return;

    resumedFor.current = claim.claimId;

    if (skipResume.current) {
      skipResume.current = false;
      return;
    }

    setDraftedStep(resumeStep(claim, readProgress(claim.claimId)));
  }, [claim, setDraftedStep, resumedFor, skipResume]);
}

/**
 * Show a milestone toast the first time a status is reached.
 *
 * Keyed on status rather than on a mutation succeeding, so a resumed session
 * doesn't replay congratulations for work done yesterday.
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

    // A resumed session arrives mid-flow; that is not a milestone.
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
