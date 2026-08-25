import { ArrowLeft } from "iconsax-reactjs";
import { cn } from "@/lib/cn";
import { useIsBelowDesktop, useIsMobile, useIsSmallMobile } from "@/lib/hooks/useMediaQuery";
import { Button } from "@/ui/Button";

type Props = {
  onBack?: () => void;
  onSubmit: () => void;
  submitText?: string;
  backText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * The back / continue pair at the foot of every wizard screen.
 *
 * Below `lg` it detaches into a fixed bar so the primary action stays reachable
 * without scrolling. The two size decisions look redundant but are not: the
 * buttons' own `size` switches their padding model, while `compact` decides
 * whether they get the 48px wizard height or the default 52px.
 */
export function WizardActions({
  onBack,
  onSubmit,
  submitText = "Continue",
  backText = "back",
  isLoading,
  disabled,
  className,
}: Props) {
  const isBelowDesktop = useIsBelowDesktop();
  const isMobile = useIsMobile();
  const isSmallMobile = useIsSmallMobile();

  const compact = !isBelowDesktop;
  const heightClass = compact && "h-[48px]";

  return (
    <div
      className={cn(
        "mt-auto flex items-center justify-center gap-3 pb-3 max-tb:px-4",
        "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:w-full max-lg:bg-white",
        "max-lg:pt-4 max-lg:shadow-[0_-4px_20px_0px_rgba(0,0,0,0.10)]",
        className,
      )}
    >
      {onBack && (
        <Button
          type="button"
          variant="secondary"
          size={isSmallMobile ? "responsive" : "small"}
          onClick={onBack}
          className={cn("w-[132px] text-xs", heightClass)}
        >
          <ArrowLeft size={20} /> {backText}
        </Button>
      )}

      <Button
        type="button"
        variant="primary"
        size={isMobile ? "responsive" : "small"}
        isLoading={isLoading}
        disabled={isLoading || disabled}
        onClick={onSubmit}
        className={cn("text-xs max-tb:flex-1", heightClass)}
      >
        {submitText}
      </Button>
    </div>
  );
}
