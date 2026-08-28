import { useState } from "react";
import { ArrowLeft, ArrowRight } from "iconsax-reactjs";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/ui/Button";
import { ErrorState } from "@/ui/ErrorState";
import { Skeleton } from "@/ui/Skeleton";
import { TextField } from "@/ui/TextField";
import { useReservationGuide } from "../../api/queries";
import type { GuideStep, ReservationPlatform } from "../../api/types";

type Props = {
  platform: ReservationPlatform;
  onBack: () => void;
  onConnect: (credentials: { integrationId?: string; apiKey?: string }) => void;
  isConnecting: boolean;
  error: unknown;
};

/**
 * Walk the owner through one platform's guide, then take the credential.
 *
 * The guide is the platform's, not ours: `GET /reservation-platforms/{id}/guide`
 * returns however many steps that platform needs. The only structure the UI
 * relies on is `need` — a step that has one asks for a credential, a step
 * without one is pure instruction — so a platform with one step or five renders
 * without a change here.
 */
export function PlatformSteps({
  platform,
  onBack,
  onConnect,
  isConnecting,
  error,
}: Props) {
  const guide = useReservationGuide(platform.id);
  const [index, setIndex] = useState(0);
  const [credential, setCredential] = useState("");

  if (guide.isPending) return <GuideSkeleton />;

  if (guide.isError) {
    return (
      <>
        <ErrorState error={guide.error} onRetry={() => void guide.refetch()} />
        <div className="mt-4 flex justify-center">
          <Button
            variant="secondary"
            size="small"
            onClick={onBack}
            className="h-[42px] rounded-full text-xs font-normal"
          >
            Change platform
          </Button>
        </div>
      </>
    );
  }

  const steps = guide.data.steps;
  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;
  const need = step.need ?? null;

  // The credential is only ever asked for once, on whichever step carries it.
  const needsCredential = Boolean(need);
  const canSubmit = !needsCredential || credential.trim().length > 0;

  const advance = () => {
    if (!isLast) {
      setIndex((current) => current + 1);
      return;
    }
    if (!canSubmit) return;

    onConnect(
      need?.field === "apikey"
        ? { apiKey: credential.trim() }
        : { integrationId: credential.trim() || undefined },
    );
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-color-secondary px-3 py-1 font-satoshi text-[12px] font-medium text-color-primary">
          Connecting {guide.data.name}
        </span>
        <span className="font-satoshi text-[12px] text-color-secondary-text">
          {index + 1} of {steps.length}
        </span>
        <span aria-hidden className="flex items-center gap-1">
          {steps.map((s, i) => (
            <span
              key={s.step}
              className={cn(
                "h-[3px] w-5 rounded-full transition-colors",
                i <= index ? "bg-color-primary" : "bg-color-border",
              )}
            />
          ))}
        </span>
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div>
          <h2 className="font-lora text-[24px] font-medium text-color-primary-text tb:text-[27px]">
            {step.title}
          </h2>

          <ol className="mt-5 flex flex-col gap-3.5">
            {step.body.map((line, i) => (
              <li key={line} className="flex gap-3">
                <span
                  aria-hidden
                  className="grid size-[22px] shrink-0 place-content-center rounded-full bg-color-secondary font-satoshi text-[11px] font-semibold text-color-primary"
                >
                  {i + 1}
                </span>
                <span className="font-satoshi text-[14px] leading-[160%] text-color-primary-text">
                  {line}
                </span>
              </li>
            ))}
          </ol>

          {need && (
            <div className="mt-6 flex flex-col gap-2.5 tb:flex-row tb:items-start">
              <div className="min-w-0 flex-1">
                <TextField
                  size="responsive"
                  placeholder={
                    need.placeholder ??
                    (need.field === "apikey"
                      ? `${guide.data.name} API key`
                      : `${guide.data.name} account ID`)
                  }
                  value={credential}
                  onChange={(event) => setCredential(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {Boolean(error) && (
            <p role="alert" className="mt-3.5 font-satoshi text-[13px] text-color-danger">
              {errorMessage(error)}
            </p>
          )}
        </div>

        {step.video ? <StepVideo src={step.video} /> : <StepHint step={step} />}
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-color-border pt-5">
        <button
          type="button"
          onClick={() => (index === 0 ? onBack() : setIndex((c) => c - 1))}
          className="inline-flex items-center gap-1.5 font-satoshi text-[13px] font-medium text-color-secondary-text transition-colors hover:text-color-primary"
        >
          <ArrowLeft size={16} /> {index === 0 ? "Change platform" : "Back"}
        </button>

        <div className="flex-1" />

        <Button
          variant="primary"
          size="responsive"
          isLoading={isConnecting}
          disabled={isConnecting || (isLast && !canSubmit)}
          onClick={advance}
          className="h-[48px] rounded-full px-6 text-[13px] font-medium max-tb:w-full"
        >
          {isLast ? "Connect" : "I've done this — continue"}
          {!isLast && <ArrowRight size={16} className="ml-1.5" />}
        </Button>
      </div>

      {isLast && (
        <p className="mt-3 text-right font-satoshi text-[12px] text-color-secondary-text max-tb:text-center">
          By connecting you agree with the Afterhours{" "}
          <a
            href="/terms-and-conditions"
            className="underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            terms and conditions
          </a>
          .
        </p>
      )}
    </>
  );
}

function StepVideo({ src }: { src: string }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-color-border bg-color-background-3 p-3">
      <p className="mb-2.5 font-satoshi text-[11px] font-semibold uppercase tracking-[0.12em] text-color-secondary-text">
        Where to click
      </p>
      <video
        src={src}
        muted
        loop
        autoPlay
        playsInline
        className="w-full rounded-[10px]"
      />
    </div>
  );
}

/**
 * What the panel shows when a step has no recording.
 *
 * The design fills this space with a drawing of the platform's own admin. We
 * can't draw nine of those from a contract that doesn't describe them, so the
 * space restates the step instead of sitting empty.
 */
function StepHint({ step }: { step: GuideStep }) {
  return (
    <div className="rounded-[16px] border border-color-border bg-color-background-3 p-5">
      <p className="font-satoshi text-[11px] font-semibold uppercase tracking-[0.12em] text-color-secondary-text">
        Step {step.step}
      </p>
      <p className="mt-2.5 font-satoshi text-[14px] font-semibold text-color-primary-text">
        {step.title}
      </p>
      <p className="mt-2 font-satoshi text-[13px] leading-[165%] text-color-secondary-text">
        Do this in your own {step.body.length > 1 ? "browser tab" : "dashboard"} and come
        back here — this page keeps your place.
      </p>
    </div>
  );
}

function GuideSkeleton() {
  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div>
        <Skeleton isLoaded={false} className="h-7 w-2/3" />
        <div className="mt-5 flex flex-col gap-3">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} isLoaded={false} className="h-4 w-full" />
          ))}
        </div>
      </div>
      <Skeleton isLoaded={false} className="h-[220px] rounded-[16px]" />
    </div>
  );
}
