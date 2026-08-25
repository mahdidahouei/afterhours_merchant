import { useState } from "react";
import Markdown from "react-markdown";
import { Link2 } from "iconsax-reactjs";
import { cn } from "@/lib/cn";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { Button } from "@/ui/Button";
import { ErrorState } from "@/ui/ErrorState";
import { TextField } from "@/ui/TextField";
import { VideoPlayer } from "@/ui/VideoPlayer";
import ShopIcon from "@/assets/icons/shop.svg?react";
import type { GuideField, PlatformGuide } from "../types";
import { WizardActions, WizardBody } from "@/features/wizard";

/** Maps a guide's field name onto the connect payload's key. */
const PAYLOAD_KEY = {
  account_id: "inplatformId",
  apikey: "apikey",
} as const satisfies Record<GuideField["field"], string>;

export type GuideCredentials = { inplatformId?: string; apikey?: string };

type Props = {
  guide: PlatformGuide;
  /** 1-based index of the visible guide step. */
  index: number;
  isConnecting: boolean;
  onAdvance: (index: number) => void;
  onConnect: (credentials: GuideCredentials) => void;
  onBack: () => void;
};

export function GuideStep({
  guide,
  index,
  isConnecting,
  onAdvance,
  onConnect,
  onBack,
}: Props) {
  const isMobile = useIsMobile();
  const [values, setValues] = useState<Partial<Record<GuideField["field"], string>>>({});
  const [errors, setErrors] = useState<Partial<Record<GuideField["field"], string>>>({});

  const step = guide.steps[index - 1];
  const hasNext = index < guide.steps.length;
  const field = step?.need?.field;

  // A platform whose guide came back empty would otherwise render a blank panel
  // with a dead Connect button.
  if (!step) {
    return (
      <WizardBody>
        <ErrorState
          message={`We couldn't load the setup steps for ${guide.name}. Please go back and try again.`}
          onRetry={onBack}
          retryText="Go back"
        />
      </WizardBody>
    );
  }

  const submit = () => {
    // Only the visible step's field is validated. The old implementation tested
    // every field's error at once, so a stale error left behind on an earlier
    // step blocked Connect for good with nothing on screen to explain why.
    if (field && !values[field]?.trim()) {
      setErrors((prev) => ({ ...prev, [field]: "required" }));
      return;
    }

    if (hasNext) {
      onAdvance(index + 1);
      return;
    }

    const credentials: GuideCredentials = {};
    for (const [name, value] of Object.entries(values)) {
      if (value) credentials[PAYLOAD_KEY[name as GuideField["field"]]] = value;
    }
    onConnect(credentials);
  };

  const input = field ? (
    <TextField
      key={field}
      name={field}
      size={isMobile ? "responsive" : "default"}
      placeholder={step.need?.placeholder ?? ""}
      icon={<ShopIcon />}
      value={values[field] ?? ""}
      errorMessage={errors[field]}
      hideErrorMessage
      className="max-tb:w-full"
      containerClassName="max-tb:w-full"
      onChange={(event) => {
        const next = event.target.value;
        setValues((prev) => ({ ...prev, [field]: next }));
        setErrors((prev) => ({ ...prev, [field]: next.trim() ? undefined : "required" }));
      }}
    />
  ) : null;

  const submitButton = hasNext ? (
    <Button variant="primary" size="small" onClick={submit} className="h-[48px] text-xs">
      Next
    </Button>
  ) : (
    <Button
      variant="primary"
      size="small"
      isLoading={isConnecting}
      onClick={submit}
      className="h-[48px] text-xs"
    >
      <Link2 size={16} />
      Connect
    </Button>
  );

  return (
    <WizardBody
      className="max-tb:px-0"
      contentClassName="flex flex-col-reverse items-start gap-6 max-lg:flex-1 max-lg:overflow-y-auto max-lg:overflow-x-hidden lg:flex-row"
    >
      <div className="flex h-full w-full flex-col gap-2.5 max-tb:px-4 tb:w-auto">
        <p className="mb-3 text-base font-medium">{step.title}</p>

        {step.body.map((line, position) => (
          <div className="flex items-start gap-3" key={position}>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#e8e8e8]">
              <span className="text-xs text-color-primary-text">{position + 1}</span>
            </span>
            <div className="pt-1 text-xs text-color-primary-text [&_a]:underline [&_strong]:font-semibold">
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
          </div>
        ))}

        {/* Desktop and tablet: the field sits at the foot of the text column
            beside the action. On mobile it moves above, under the step list. */}
        <div className="mt-2.5 flex items-center gap-2.5 max-tb:hidden lg:mt-auto">
          {input}
          <div className="hidden tb:contents">{submitButton}</div>
        </div>
      </div>

      {input && <div className="w-full px-4 tb:hidden">{input}</div>}

      <div className="flex w-full flex-row items-center gap-2 px-4 tb:hidden">
        {guide.steps.map((_, position) => (
          <span
            key={position}
            className={cn(
              "h-[3px] flex-1 rounded-full bg-[#D9D9D9]",
              position + 1 <= index && "bg-color-primary",
            )}
          />
        ))}
      </div>

      {step.video && <VideoPlayer src={step.video} />}

      {isMobile && (
        <WizardActions
          onBack={onBack}
          onSubmit={submit}
          submitText={hasNext ? "Next" : "Connect"}
          isLoading={isConnecting}
        />
      )}
    </WizardBody>
  );
}

