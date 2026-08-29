import { useState } from "react";
import Markdown from "react-markdown";
import { ArrowLeft, ArrowRight, Link2 } from "iconsax-reactjs";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/ui/Button";
import { ErrorState } from "@/ui/ErrorState";
import { Skeleton } from "@/ui/Skeleton";
import { TextField } from "@/ui/TextField";
import { VideoPlayer } from "@/ui/VideoPlayer";
import ShopIcon from "@/assets/icons/shop.svg?react";
import { useReservationGuide } from "../../api/queries";
import {
  CREDENTIAL_KEY,
  needOf,
  platformLabel,
  type GuideField,
  type ReservationConnectBody,
  type ReservationPlatform,
} from "../../api/types";

type Credentials = Omit<ReservationConnectBody, "platformId">;

type Props = {
  platform: ReservationPlatform;
  onBack: () => void;
  onConnect: (credentials: Credentials) => void;
  isConnecting: boolean;
  error: unknown;
};

/**
 * Walk one platform's guide, collecting whatever it asks for.
 *
 * The guide belongs to the platform, not to us: `GET /reservation-platforms/
 * {id}/guide` returns its own steps, its own markdown, and a screen recording
 * per step. Three details of the real payload shape this component:
 *
 *   - **Credentials accumulate.** Formitable asks for an API key on step 1 and a
 *     restaurant key on step 2, and both go in one `POST /claim/reservation`.
 *     Keeping only the last step's value would make Formitable impossible to
 *     connect, which is why `values` is a map and not a string.
 *   - **`need` is `[]` when nothing is wanted**, and `[]` is truthy — see
 *     `needOf`.
 *   - **`step` is not an index.** Formitable's second step is numbered 0, so
 *     position in the array is the only ordering to trust.
 *
 * `body` lines are markdown with links and bold; rendering them as text would
 * put literal `**Beheer**` on screen.
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
  const [values, setValues] = useState<Partial<Record<GuideField, string>>>({});
  const [missing, setMissing] = useState<GuideField | null>(null);

  const label = platformLabel(platform.name);

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

  // A guide that came back empty would otherwise be a blank panel with a dead
  // Connect button.
  if (!step) {
    return (
      <>
        <ErrorState
          message={`We couldn't load the setup steps for ${label}. Please go back and try again.`}
        />
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

  const need = needOf(step);
  const isLast = index >= steps.length - 1;

  const submit = () => {
    // Only this step's field is checked. Validating every field at once would
    // let an error left on an earlier step block Connect with nothing on screen
    // to explain why.
    if (need && !values[need.field]?.trim()) {
      setMissing(need.field);
      return;
    }
    setMissing(null);

    if (!isLast) {
      setIndex((current) => current + 1);
      return;
    }

    const credentials: Credentials = {};
    for (const [field, value] of Object.entries(values)) {
      if (value?.trim()) {
        credentials[CREDENTIAL_KEY[field as GuideField]] = value.trim();
      }
    }
    onConnect(credentials);
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {platform.iconUrl && (
          <img src={platform.iconUrl} alt="" className="size-7 rounded-[7px] object-contain" />
        )}
        <span className="rounded-full bg-color-secondary px-3 py-1 font-satoshi text-[12px] font-medium text-color-primary">
          Connecting {label}
        </span>
        <span className="font-satoshi text-[12px] text-color-secondary-text">
          {index + 1} of {steps.length}
        </span>
        <span aria-hidden className="flex items-center gap-1">
          {steps.map((_, position) => (
            <span
              key={position}
              className={cn(
                "h-[3px] w-5 rounded-full transition-colors",
                position <= index ? "bg-color-primary" : "bg-color-border",
              )}
            />
          ))}
        </span>
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
        <div>
          {/* The API's titles already read "Step 1: …", so no number is added. */}
          <h2 className="font-lora text-[22px] font-medium text-color-primary-text tb:text-[25px]">
            {step.title}
          </h2>

          <ol className="mt-5 flex flex-col gap-3.5">
            {step.body.map((line, position) => (
              <li key={position} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="grid size-[22px] shrink-0 place-content-center rounded-full bg-color-secondary font-satoshi text-[11px] font-semibold text-color-primary"
                >
                  {position + 1}
                </span>
                <div className="pt-0.5 font-satoshi text-[13.5px] leading-[165%] text-color-primary-text [&_a]:font-medium [&_a]:text-color-primary [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold">
                  <Markdown
                    components={{
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noreferrer noopener">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {line}
                  </Markdown>
                </div>
              </li>
            ))}
          </ol>

          {need && (
            <div className="mt-6">
              <TextField
                key={need.field}
                name={need.field}
                size="responsive"
                placeholder={need.placeholder ?? label}
                icon={<ShopIcon />}
                value={values[need.field] ?? ""}
                errorMessage={missing === need.field ? "required" : undefined}
                hideErrorMessage
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => {
                  const next = event.target.value;
                  setValues((prev) => ({ ...prev, [need.field]: next }));
                  if (next.trim()) setMissing(null);
                }}
              />
              {missing === need.field && (
                <p role="alert" className="mt-1.5 font-satoshi text-[12px] text-color-danger">
                  Paste the value from {label} to continue.
                </p>
              )}
            </div>
          )}

          {Boolean(error) && (
            <p role="alert" className="mt-3.5 font-satoshi text-[13px] text-color-danger">
              {errorMessage(error)}
            </p>
          )}
        </div>

        {step.video && <VideoPlayer src={step.video} className="lg:w-full" />}
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
          disabled={isConnecting}
          onClick={submit}
          className="h-[48px] rounded-full px-6 text-[13px] font-medium max-tb:w-full"
        >
          {isLast ? <Link2 size={16} className="mr-1.5" /> : null}
          {isLast ? "Connect" : "Next"}
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

function GuideSkeleton() {
  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
      <div>
        <Skeleton isLoaded={false} className="h-7 w-2/3" />
        <div className="mt-5 flex flex-col gap-3">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} isLoaded={false} className="h-4 w-full" />
          ))}
        </div>
      </div>
      <Skeleton isLoaded={false} className="aspect-video w-full rounded-[20px]" />
    </div>
  );
}
