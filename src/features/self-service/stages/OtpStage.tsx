import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "iconsax-reactjs";
import { errorMessage, isProblem, ProblemError } from "@/lib/errors";
import { Button } from "@/ui/Button";
import { useCreateSession, useSendVerification } from "../api/queries";
import { CODE_LENGTH } from "../api/types";
import type { PlaceCandidate, Session, Verification } from "../api/types";
import { StageHeading, StagePanel } from "../components/ClaimLayout";
import { OtpInput } from "../components/OtpInput";
import { isMockApi } from "../api";

type Props = {
  candidate: PlaceCandidate;
  verification: Verification;
  /** What we tell the owner we texted — the masked or the typed number. */
  target: string;
  onBack: () => void;
  onVerified: (session: Session) => void;
  onResent: (verification: Verification) => void;
};

/** Seconds until `iso`, floored at zero. */
function secondsUntil(iso: string): number {
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 1000));
}

/**
 * Counts down to `resendAvailableAt`, the one deadline worth showing.
 *
 * There is no countdown to `expiresAt`. Two timers on one screen made it look
 * like two different things were running out, and the expiry one also drove the
 * primary button — so it would relabel itself mid-entry. Expiry is now only ever
 * reported by the server, as `code_expired`, which is the one source that
 * actually decides it.
 */
function useCountdown(iso: string): number {
  const [seconds, setSeconds] = useState(() => secondsUntil(iso));

  useEffect(() => {
    setSeconds(secondsUntil(iso));
    const timer = setInterval(() => setSeconds(secondsUntil(iso)), 1000);
    return () => clearInterval(timer);
  }, [iso]);

  return seconds;
}

export function OtpStage({
  candidate,
  verification,
  target,
  onBack,
  onVerified,
  onResent,
}: Props) {
  const [code, setCode] = useState("");
  const session = useCreateSession();
  const resend = useSendVerification();

  const resendIn = useCountdown(verification.resendAvailableAt);

  const error = session.error;
  const isExpired = isProblem(error, "code_expired");
  const isLocked = isProblem(error, "too_many_attempts");
  const isWrong = isProblem(error, "invalid_code");

  const attemptsLeft =
    error instanceof ProblemError ? error.attemptsRemaining : undefined;
  const lockedFor =
    isLocked && error instanceof ProblemError ? error.retryAfter : undefined;

  const submit = useCallback(
    (value: string) => {
      if (value.length !== CODE_LENGTH || isLocked) return;
      session.reset();
      session.mutate(
        { verificationId: verification.verificationId, code: value },
        { onSuccess: onVerified },
      );
    },
    // `session` is a stable-enough mutation object; re-creating this on every
    // render would defeat OtpInput's completion effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verification.verificationId, isLocked],
  );

  const sendAgain = () => {
    session.reset();
    setCode("");
    resend.mutate({ placeId: candidate.placeId }, { onSuccess: onResent });
  };

  return (
    <StagePanel>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 font-satoshi text-[13px] font-medium text-color-secondary-text transition-colors hover:text-color-primary"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <StageHeading title="Enter your code.">
        Enter the code we sent to{" "}
        <strong className="font-semibold text-color-primary-text">{target}</strong>.
      </StageHeading>

      <OtpInput
        value={code}
        onChange={(next) => {
          if (session.isError) session.reset();
          setCode(next);
        }}
        onComplete={submit}
        length={CODE_LENGTH}
        hasError={Boolean(error)}
        disabled={session.isPending || isLocked}
      />

      <div className="mt-4 min-h-[40px] text-center">
        {isExpired && (
          <p role="alert" className="font-satoshi text-[13px] text-color-danger">
            That code has expired.
          </p>
        )}

        {!isExpired && isLocked && (
          <p role="alert" className="font-satoshi text-[13px] text-color-danger">
            Too many attempts.{" "}
            {lockedFor ? `Try again in ${lockedFor}s.` : "Try again shortly."}
          </p>
        )}

        {!isExpired && !isLocked && isWrong && (
          <p role="alert" className="font-satoshi text-[13px] text-color-danger">
            That code isn't right. Check your messages and try again.
            {attemptsLeft !== undefined && attemptsLeft > 0 && (
              <span className="mt-0.5 block text-color-secondary-text">
                {attemptsLeft} {attemptsLeft === 1 ? "attempt" : "attempts"} left.
              </span>
            )}
          </p>
        )}

        {!isExpired && !isLocked && !isWrong && session.isError && (
          <p role="alert" className="font-satoshi text-[13px] text-color-danger">
            {errorMessage(error)}
          </p>
        )}
      </div>

      {/* One button, one label. It waits for a full code and nothing else —
          notably not for a clock, which is what made it change under people. */}
      <Button
        variant="primary"
        size="responsive"
        isLoading={session.isPending}
        disabled={code.length !== CODE_LENGTH || isLocked}
        onClick={() => submit(code)}
        className="h-[50px] w-full rounded-full text-[13px] font-medium"
      >
        Verify code
      </Button>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={sendAgain}
          disabled={resendIn > 0 || resend.isPending}
          className="font-satoshi text-[13px] font-medium text-color-primary underline underline-offset-4 transition-opacity disabled:pointer-events-none disabled:opacity-45"
        >
          {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
        </button>

        {resend.isError && (
          <p role="alert" className="mt-2 font-satoshi text-[12px] text-color-danger">
            {errorMessage(resend.error)}
          </p>
        )}
      </div>

      {isMockApi && (
        <p className="mt-5 rounded-[10px] bg-color-background px-3 py-2 text-center font-satoshi text-[12px] text-color-secondary-text">
          Demo: <strong>00000</strong> shows the error state · any other code works
        </p>
      )}
    </StagePanel>
  );
}
