import { ArrowLeft, Messages3 } from "iconsax-reactjs";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { Button, IconButton, IconLink } from "@/ui/Button";
import { ROUTES } from "@/features/landing/content/links";

type Props = {
  title: string;
  /** 1-based position of the current step, for the progress dots. */
  position: number;
  total: number;
  onBack: () => void;
};

export function WizardHeader({ title, position, total, onBack }: Props) {
  const isMobile = useIsMobile();

  return (
    <div className="flex shrink-0 justify-between gap-4 border-[#E8E8E8] p-[30px] pb-6 tb:border-b tb:pt-10 lg:px-[50px] lg:pb-[34px]">
      <div className="flex min-w-0 flex-row gap-2 max-tb:items-center tb:flex-col">
        <ProgressDots position={position} total={total} />

        <IconButton className="tb:hidden" onClick={onBack} aria-label="Go back">
          <ArrowLeft size={24} color="#000" />
        </IconButton>

        <p
          title={title}
          className="min-w-0 truncate text-sm font-medium text-color-primary-text tb:text-[#707070] 2lg:text-base"
        >
          {title}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {isMobile ? (
          <IconLink to={ROUTES.contact} className="lg:hidden" aria-label="Contact us">
            <Messages3 size={24} color="#262626" />
          </IconLink>
        ) : (
          <Link
            to={ROUTES.contact}
            className="flex h-[48px] w-[155px] items-center justify-center rounded-[26px] bg-color-background-2 text-xs font-medium text-color-primary-text lg:hidden"
          >
            Contact us
          </Link>
        )}

        <Button
          variant="secondary"
          size="small"
          onClick={onBack}
          className="h-[48px] text-xs !font-normal max-tb:hidden"
        >
          Go back
        </Button>
      </div>
    </div>
  );
}

function ProgressDots({ position, total }: { position: number; total: number }) {
  return (
    <div className="flex gap-0.5 max-tb:hidden">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "size-[5px] rounded-full bg-[#D9D9D9]",
            index + 1 === position && "w-6 bg-color-primary lg:w-3.5",
          )}
        />
      ))}
    </div>
  );
}
