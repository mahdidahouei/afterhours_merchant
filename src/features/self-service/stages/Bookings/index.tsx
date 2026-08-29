import { useState } from "react";
import { ArrowLeft } from "iconsax-reactjs";
import { errorMessage, isProblem, ProblemError } from "@/lib/errors";
import { Button } from "@/ui/Button";
import {
  useConnectReservation,
  useDisconnectReservation,
  useSubmitClaim,
} from "../../api/queries";
import type { Claim, ReservationPlatform } from "../../api/types";
import { StageHeading, StagePanel } from "../../components/ClaimLayout";
import { PlatformPicker } from "./PlatformPicker";
import { PlatformSteps } from "./PlatformSteps";

type Props = {
  claim: Claim;
  onBack: () => void;
};

/**
 * Step 6 — connect the restaurant's booking system.
 *
 * This is the old standalone Connect widget, folded into the claim: same three
 * beats (pick a platform, follow its guide, hand over the account id), but
 * against `POST /claim/reservation` with the claim's own token rather than a
 * restaurant id. Once the widget is retired this is the only copy left.
 *
 * Connecting is optional and always has been — a restaurant with no integration
 * is still a complete listing, so both this and "I'll connect later" end the
 * same way: submit the claim for review.
 */
export function BookingsStage({ claim, onBack }: Props) {
  const [platform, setPlatform] = useState<ReservationPlatform | null>(null);

  const connect = useConnectReservation();
  const disconnect = useDisconnectReservation();
  const submit = useSubmitClaim();

  const isConnected = claim.reservation.length > 0;

  const finish = () => {
    submit.reset();
    submit.mutate();
  };

  const connectAndFinish = (credentials: { integrationId?: string; apiKey?: string }) => {
    if (!platform) return;
    connect.reset();

    connect.mutate(
      { platformId: platform.id, ...credentials },
      {
        // Back to the list on success: the owner can see it connected, add a
        // second platform, or finish. Submitting straight from here would hide
        // the result of the thing they just did.
        onSuccess: () => setPlatform(null),
      },
    );
  };

  return (
    <StagePanel>
      {platform ? (
        <PlatformSteps
          platform={platform}
          onBack={() => {
            connect.reset();
            setPlatform(null);
          }}
          onConnect={connectAndFinish}
          isConnecting={connect.isPending}
          error={connect.error}
        />
      ) : (
        <>
          <StageHeading title="Turn lookers into booked tables.">
            Connect your reservation platform and diners book you directly on Afterhours —
            your availability syncs in realtime, and every booking lands in your own
            system. Free, and set up in about two minutes.
          </StageHeading>

          <PlatformPicker
            connected={claim.reservation}
            onPick={setPlatform}
            onDisconnect={(platformId) => disconnect.mutate(platformId)}
            isDisconnecting={disconnect.isPending}
          />

          {disconnect.isError && (
            <p role="alert" className="mt-4 font-satoshi text-[13px] text-color-danger">
              {errorMessage(disconnect.error)}
            </p>
          )}

          {submit.isError && (
            <p role="alert" className="mt-4 font-satoshi text-[13px] text-color-danger">
              {isProblem(submit.error, "profile_incomplete")
                ? incompleteMessage(submit.error)
                : errorMessage(submit.error)}
            </p>
          )}

          {/* Not sticky: the picker ends in a footnote, and a pinned bar would
              sit on top of it for the whole scroll. */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-color-border pt-5">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 font-satoshi text-[13px] font-medium text-color-secondary-text transition-colors hover:text-color-primary"
            >
              <ArrowLeft size={16} /> Back
            </button>

            <div className="flex-1" />

            {isConnected ? (
              <Button
                variant="primary"
                size="responsive"
                isLoading={submit.isPending}
                onClick={finish}
                className="h-[48px] rounded-full px-6 text-[13px] font-medium max-tb:w-full"
              >
                Submit for review
              </Button>
            ) : (
              <button
                type="button"
                onClick={finish}
                disabled={submit.isPending}
                className="font-satoshi text-[13px] font-medium text-color-secondary-text underline underline-offset-4 transition-colors hover:text-color-primary disabled:opacity-60"
              >
                {submit.isPending ? "Sending…" : "I'll connect later"}
              </button>
            )}
          </div>
        </>
      )}
    </StagePanel>
  );
}

/** Which step the owner has to go back to, in their words. */
const FIELD_LABELS: Record<string, string> = {
  photos: "a photo",
  tagline: "your tagline",
  description: "your description",
  cuisines: "your cuisines",
  menus: "a menu",
  email: "a contact email",
};

/**
 * Name what's missing instead of pointing vaguely backwards.
 *
 * Submit is the end of a six-step flow, so "something is missing" leaves the
 * owner to re-open three screens to find out what. `profile_incomplete` carries
 * `missingFields`; this turns those paths into the sentence they'd say
 * themselves, and names the step to go back to.
 */
function incompleteMessage(error: unknown): string {
  const missing =
    error instanceof ProblemError && error.missingFields?.length
      ? error.missingFields
      : [];

  if (missing.length === 0) {
    return "A few things are still missing — go back and check your profile and photos.";
  }

  const labels = missing.map((path) => FIELD_LABELS[path.split(".")[0]] ?? path);
  const unique = [...new Set(labels)];
  const list =
    unique.length === 1
      ? unique[0]
      : `${unique.slice(0, -1).join(", ")} and ${unique[unique.length - 1]}`;

  const step = missing.some((path) => path.startsWith("photos"))
    ? unique.length === 1
      ? "Add your photos"
      : "Build your profile and Add your photos"
    : "Build your profile";

  return `We still need ${list}. Go back to ${step}.`;
}
