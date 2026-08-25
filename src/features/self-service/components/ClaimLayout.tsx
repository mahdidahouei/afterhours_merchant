import { Link } from "react-router-dom";
import Logo from "@/assets/brand/logo.svg?react";
import { JourneyRail } from "./JourneyRail";
import { ProgressLine } from "./ProgressLine";
import { StepKicker } from "./StepKicker";

type Props = {
  activeIndex: number;
  stageLabel: string;
  /** Right-hand header slot — the profile strength meter, once there is one. */
  headerAside?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Page chrome for the whole claim flow: progress hairline, header, journey rail
 * and the work panel.
 *
 * The rail and the kicker are the same information at two sizes — the rail
 * shows all five steps with their subtitles from `lg` up, the kicker collapses
 * that to one line and five dots below it. Only one is ever rendered visibly.
 */
export function ClaimLayout({ activeIndex, stageLabel, headerAside, children }: Props) {
  return (
    <div className="min-h-screen bg-color-background-3">
      <ProgressLine activeIndex={activeIndex} />

      <header className="sticky top-0 z-[100] flex h-[60px] items-center justify-between border-b border-color-border bg-white/95 px-5 backdrop-blur-sm tb:px-7">
        <Link to="/" aria-label="Afterhours home" className="flex items-center">
          <Logo className="h-[17px] w-auto opacity-90" />
        </Link>

        <div className="flex items-center gap-3">
          <span className="font-satoshi text-[13px] font-semibold text-color-primary max-tb:hidden">
            {stageLabel}
          </span>
          {headerAside}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1180px] gap-12 px-5 pb-32 pt-7 tb:px-7 lg:pt-10">
        <JourneyRail activeIndex={activeIndex} />

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <StepKicker activeIndex={activeIndex} label={stageLabel} />
          {children}
        </div>
      </main>
    </div>
  );
}

/** The white card each stage's content sits on. */
export function StagePanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "rounded-[22px] border border-color-border bg-white p-6 tb:p-8 " + (className ?? "")
      }
    >
      {children}
    </div>
  );
}

/** Stage heading + supporting line. Every screen opens with one. */
export function StageHeading({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h1 className="font-lora text-[26px] font-medium leading-[1.2] text-color-primary-text tb:text-[30px]">
        {title}
      </h1>
      {children && (
        <p className="mt-2.5 max-w-[54ch] font-satoshi text-[14px] font-normal leading-[160%] text-color-secondary-text tb:text-[15px]">
          {children}
        </p>
      )}
    </div>
  );
}
