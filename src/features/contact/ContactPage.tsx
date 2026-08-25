import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { errorMessage } from "@/lib/errors";
import { WizardActions, WizardCard } from "@/features/wizard";
import { useSubmitTicket } from "./api";
import { contactSchema, DETAILS_FIELDS, type ContactForm } from "./schema";
import { DetailsStep } from "./steps/DetailsStep";
import { MessageStep } from "./steps/MessageStep";
import { SubmittedStep } from "./steps/SubmittedStep";

type Part = 1 | 2;

export default function ContactPage() {
  const navigate = useNavigate();
  const [part, setPart] = useState<Part>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submit = useSubmitTicket();

  const { control, handleSubmit, trigger } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { countryCode: "+31" },
  });

  // Part one only ever advances — never submits, even once part two is filled in.
  const goToMessage = async () => {
    if (await trigger(DETAILS_FIELDS)) setPart(2);
  };

  const send = handleSubmit((values) => {
    // Clear the previous failure before retrying, or the old error sits on
    // screen next to a spinner and reads as if the retry has already failed.
    submit.reset();
    submit.mutate(values, { onSuccess: () => setIsSubmitted(true) });
  });

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-[72px] bg-white px-12 lg:pb-[100px] 2xl:px-36">
      <div
        aria-hidden
        className="absolute inset-0 opacity-20"
        style={{ background: "linear-gradient(to bottom, #321B15, #EDE5D8)" }}
      />

      <WizardCard className="min-h-0 justify-center lg:min-w-[750px]">
        {isSubmitted ? (
          <SubmittedStep />
        ) : (
          <div className="flex min-h-0 flex-col gap-9 px-5 max-tb:flex-1 max-lg:pb-24 tb:px-7 tb:pb-9 tb:pt-6 lg:h-full lg:justify-between 2lg:px-[50px]">
            <div className="flex w-full flex-col items-center gap-9">
              <h1 className="pt-4 text-lg font-medium text-color-primary-text">
                Please fill in the information below.
              </h1>

              {part === 1 ? (
                <DetailsStep control={control} />
              ) : (
                <MessageStep control={control} />
              )}

              {submit.isError && (
                <p role="alert" className="-my-4 text-center text-color-danger">
                  {errorMessage(submit.error)}
                </p>
              )}
            </div>

            <WizardActions
              onBack={() => {
                if (part === 1) {
                  navigate(-1);
                  return;
                }
                submit.reset();
                setPart(1);
              }}
              onSubmit={part === 1 ? goToMessage : send}
              submitText={part === 1 ? "Next" : "Submit"}
              isLoading={submit.isPending}
            />
          </div>
        )}
      </WizardCard>
    </main>
  );
}
