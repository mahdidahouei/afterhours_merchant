import { useState } from "react";
import { ArrowDown2 } from "iconsax-reactjs";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/ui/Button";
import { Select } from "@/ui/Select";
import { TextField } from "@/ui/TextField";
import { Textarea } from "@/ui/Textarea";
import { useCreateClaimTicket, useTicketSubjects } from "../api/queries";
import type { PlaceCandidate } from "../api/types";

type Props = { candidate: PlaceCandidate };

/**
 * The way out when the text can't arrive.
 *
 * `POST /verifications` only ever texts the number already on the listing —
 * there is no parameter for a different one, by design. So an owner whose
 * listing carries a disconnected line, a former manager's mobile, or no number
 * at all cannot finish the flow, and this is their only route. That makes it
 * load-bearing rather than a nicety, which is why it sits on the verify screen
 * itself instead of behind a support link.
 */
export function ManualReview({ candidate }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const subjects = useTicketSubjects();
  const ticket = useCreateClaimTicket();

  const [subjectId, setSubjectId] = useState("");
  const [fullName, setFullName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [content, setContent] = useState("");

  const isComplete =
    Boolean(subjectId) &&
    fullName.trim() !== "" &&
    contactEmail.includes("@") &&
    contactNumber.trim() !== "" &&
    content.trim() !== "";

  const submit = () => {
    if (!isComplete) return;
    ticket.reset();
    ticket.mutate({
      subjectId,
      fullName: fullName.trim(),
      contactEmail: contactEmail.trim(),
      contactNumber: contactNumber.trim(),
      content: content.trim(),
      restaurantName: candidate.name,
      restaurantAddress: candidate.address,
    });
  };

  if (ticket.isSuccess) {
    return (
      <div className="mt-6 rounded-[14px] border border-color-success/40 bg-color-success/5 p-4">
        <p className="font-satoshi text-[14px] font-semibold text-color-primary-text">
          We've got it.
        </p>
        <p className="mt-1 font-satoshi text-[13px] leading-[160%] text-color-secondary-text">
          Someone will email {contactEmail.trim()} within one working day to verify you
          another way. Nothing you've done so far is lost.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-color-border pt-5">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="font-satoshi text-[13px] text-color-secondary-text">
          No access to this number, or is it wrong?{" "}
          <span className="font-semibold text-color-primary underline underline-offset-4">
            Request a manual review
          </span>
        </span>
        <ArrowDown2
          size={16}
          className={cn(
            "shrink-0 text-color-secondary-text transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="mt-4 flex flex-col gap-3">
          <Select
            size="responsive"
            placeholder="What's the problem?"
            value={subjectId}
            onChange={setSubjectId}
            isLoading={subjects.isPending}
            options={(subjects.data ?? []).map((subject) => ({
              value: subject.id,
              label: subject.name,
            }))}
          />

          <TextField
            size="responsive"
            placeholder="Your full name"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />

          <TextField
            size="responsive"
            placeholder="Your email"
            inputMode="email"
            autoComplete="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
          />

          <TextField
            size="responsive"
            placeholder="A number we can reach you on"
            inputMode="tel"
            autoComplete="tel"
            value={contactNumber}
            onChange={(event) => setContactNumber(event.target.value)}
          />

          <Textarea
            size="full-width"
            placeholder="How can we tell it's really you? Anything that helps — your role, a website mention, an invoice."
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />

          {ticket.isError && (
            <p role="alert" className="font-satoshi text-[13px] text-color-danger">
              {errorMessage(ticket.error)}
            </p>
          )}

          <Button
            variant="secondary"
            size="responsive"
            isLoading={ticket.isPending}
            disabled={!isComplete || ticket.isPending}
            onClick={submit}
            className="h-[46px] rounded-full text-[13px] font-normal"
          >
            Submit review request
          </Button>

          <p className="font-satoshi text-[12px] text-color-secondary-text">
            We'll check {candidate.name} against the address on the listing and get back to
            you by email.
          </p>
        </div>
      )}
    </div>
  );
}
