import { useNavigate } from "react-router-dom";
import { ArrowCircleRight2 } from "iconsax-reactjs";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/Button";
import { ROUTES } from "../content/links";

type Props = {
  text?: string;
  hideIcon?: boolean;
  className?: string;
};

/** The page's primary call to action. Appears in the header, hero and drawer. */
export function ConnectButton({ text = "Connect", hideIcon = false, className }: Props) {
  const navigate = useNavigate();

  return (
    <Button
      variant="primary"
      size="responsive"
      onClick={() => navigate(ROUTES.connect)}
      className={cn(
        "h-12 w-[140px] bg-color-primary text-xs font-medium hover:scale-105",
        className,
      )}
    >
      {text}
      {!hideIcon && <ArrowCircleRight2 size={26} />}
    </Button>
  );
}
