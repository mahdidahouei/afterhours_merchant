import { ArrowLeft } from "iconsax-reactjs";
import { errorMessage, isProblem } from "@/lib/errors";
import { Button } from "@/ui/Button";
import CallIcon from "@/assets/icons/call.svg?react";
import { useSendVerification } from "../api/queries";
import type { PlaceCandidate, Verification } from "../api/types";
import { StageHeading, StagePanel } from "../components/ClaimLayout";
import { ManualReview } from "../components/ManualReview";

type Props = {
  candidate: PlaceCandidate;
  onBack: () => void;
  onSent: (verification: Verification, target: string) => void;
};

/**
 * Prove ownership by receiving a text on the number the listing already carries.
 *
 * There is deliberately no "use a different number" option: `POST /verifications`
 * takes a `placeId` and nothing else, so the code can only ever go to the
 * listing's own number. That is the point — an owner who could redirect it
 * wouldn't be proving anything. Anyone who can't receive that text goes through
 * `ManualReview` instead.
 */
export function VerifyOwnershipStage({ candidate, onBack, onSent }: Props) {
  const send = useSendVerification();
  const canText = candidate.phoneMasked !== null;

  const submit = () => {
    send.reset();
    send.mutate(
      { placeId: candidate.placeId },
      { onSuccess: (verification) => onSent(verification, verification.phoneMasked) },
    );
  };

  const noPhone = isProblem(send.error, "no_phone_on_listing");
  const taken = isProblem(send.error, "place_already_claimed");

  return (
    <StagePanel>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 font-satoshi text-[13px] font-medium text-color-secondary-text transition-colors hover:text-color-primary"
      >
        <ArrowLeft size={16} /> Back to search
      </button>

      <StageHeading title="Prove it's yours.">
        We'll text a one-time code to the number on file for{" "}
        <strong className="font-semibold text-color-primary-text">{candidate.name}</strong>.
        Only the owner can complete this step.
      </StageHeading>

      {canText ? (
        <div className="flex items-center gap-3.5 rounded-[16px] bg-color-secondary/40 px-4 py-3.5">
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-content-center rounded-full bg-white text-color-primary"
          >
            <CallIcon />
          </span>
          <span>
            <span className="block font-satoshi text-[11px] font-semibold uppercase tracking-[0.12em] text-color-secondary-text">
              Number on file
            </span>
            <span className="mt-0.5 block font-lora text-[20px] font-medium tracking-[0.03em] text-color-primary-text">
              {candidate.phoneMasked}
            </span>
          </span>
        </div>
      ) : (
        <div className="rounded-[16px] border border-color-border bg-color-background-3 p-4">
          <p className="font-satoshi text-[14px] font-semibold text-color-primary-text">
            This listing has no phone number.
          </p>
          <p className="mt-1 font-satoshi text-[13px] leading-[160%] text-color-secondary-text">
            There's nothing for us to text, so we'll verify you another way. Request a
            manual review below and we'll take it from there.
          </p>
        </div>
      )}

      {send.isError && (
        <p role="alert" className="mt-3.5 font-satoshi text-[13px] text-color-danger">
          {taken
            ? "This restaurant has already been claimed. If that wasn't you, request a manual review below."
            : noPhone
              ? "There's no number on this listing to text. Request a manual review below."
              : errorMessage(send.error)}
        </p>
      )}

      {canText && (
        <>
          <Button
            variant="primary"
            size="responsive"
            isLoading={send.isPending}
            disabled={send.isPending}
            onClick={submit}
            className="mt-5 h-[52px] w-full rounded-full text-[14px] font-medium"
          >
            Text me the code
          </Button>

          <p className="mt-3.5 text-center font-satoshi text-[12px] text-color-secondary-text">
            Your number is only used for verification. We never share it.
          </p>
        </>
      )}

      <ManualReview candidate={candidate} />
    </StagePanel>
  );
}
