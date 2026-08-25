import { useState } from "react";
import { ArrowLeft } from "iconsax-reactjs";
import { cn } from "@/lib/cn";
import { errorMessage, isProblem } from "@/lib/errors";
import { Button } from "@/ui/Button";
import { TextField } from "@/ui/TextField";
import CallIcon from "@/assets/icons/call.svg?react";
import { useSendVerification } from "../api/queries";
import type { PlaceCandidate, Verification } from "../api/types";
import { StageHeading, StagePanel } from "../components/ClaimLayout";

type Props = {
  candidate: PlaceCandidate;
  onBack: () => void;
  onSent: (verification: Verification, target: string) => void;
};

type Choice = "listed" | "custom";

/**
 * Prove ownership by receiving a text on the number the listing already carries.
 *
 * The "different number" path exists because listings go stale, but the server
 * still checks any number given against the listing — an owner cannot redirect
 * the code somewhere new. A mismatch comes back as `no_phone_on_listing`.
 */
export function VerifyOwnershipStage({ candidate, onBack, onSent }: Props) {
  const canUseListed = candidate.phoneMasked !== null;
  const [choice, setChoice] = useState<Choice>(canUseListed ? "listed" : "custom");
  const [phone, setPhone] = useState("");

  const send = useSendVerification();

  const submit = () => {
    if (choice === "custom" && !phone.trim()) return;
    send.reset();

    send.mutate(
      {
        placeId: candidate.placeId,
        ...(choice === "custom" ? { phone: phone.trim() } : {}),
      },
      {
        onSuccess: (verification) =>
          onSent(
            verification,
            choice === "custom" ? phone.trim() : verification.phoneMasked,
          ),
      },
    );
  };

  const mismatch = isProblem(send.error, "no_phone_on_listing");

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

      <div className="flex flex-col gap-3">
        {canUseListed && (
          <ChoiceCard
            selected={choice === "listed"}
            onSelect={() => setChoice("listed")}
            title="Phone on file"
            subtitle={candidate.phoneMasked!}
            hint="Yes, this is my number"
          />
        )}

        <ChoiceCard
          selected={choice === "custom"}
          onSelect={() => setChoice("custom")}
          title="I use a different number"
          subtitle="We'll check it against the listing"
        >
          {choice === "custom" && (
            <div className="mt-3.5">
              <TextField
                size="responsive"
                placeholder="Your phone number"
                icon={<CallIcon />}
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                errorMessage={mismatch ? " " : undefined}
                hideErrorMessage
              />
            </div>
          )}
        </ChoiceCard>
      </div>

      {send.isError && (
        <p role="alert" className="mt-3.5 font-satoshi text-[13px] text-color-danger">
          {mismatch
            ? "This number doesn't match the listing. Use the number on file, or contact us to update it first."
            : errorMessage(send.error)}
        </p>
      )}

      <Button
        variant="primary"
        size="responsive"
        isLoading={send.isPending}
        disabled={send.isPending || (choice === "custom" && !phone.trim())}
        onClick={submit}
        className="mt-6 h-[50px] w-full rounded-full text-[13px] font-medium"
      >
        {choice === "listed" && canUseListed
          ? `Send the code to ${candidate.phoneMasked}`
          : "Text me the code"}
      </Button>

      <p className="mt-3.5 text-center font-satoshi text-[12px] text-color-secondary-text">
        Your number is only used for verification. We never share it.
      </p>
    </StagePanel>
  );
}

function ChoiceCard({
  selected,
  onSelect,
  title,
  subtitle,
  hint,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[16px] border p-4 transition-colors",
        selected
          ? "border-color-primary bg-color-secondary/30"
          : "border-color-border bg-white hover:border-color-primary/40",
      )}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="radio"
          name="verification-number"
          checked={selected}
          onChange={onSelect}
          className="peer sr-only"
        />

        <span
          aria-hidden
          className={cn(
            "mt-0.5 grid size-[18px] shrink-0 place-content-center rounded-full border-2 transition-colors",
            "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
            selected ? "border-color-primary" : "border-color-border",
          )}
        >
          {selected && <span className="size-2 rounded-full bg-color-primary" />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-satoshi text-[13px] font-medium text-color-secondary-text">
            {title}
          </span>
          <span className="mt-0.5 block font-satoshi text-[15px] font-semibold text-color-primary-text">
            {subtitle}
          </span>
          {hint && (
            <span className="mt-0.5 block font-satoshi text-[12px] text-color-secondary-text">
              {hint}
            </span>
          )}
        </span>
      </label>

      {children}
    </div>
  );
}
