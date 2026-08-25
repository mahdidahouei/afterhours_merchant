import { cn } from "@/lib/cn";
import { Link } from "@/ui/Button";
import Logo from "@/assets/brand/logo.svg?react";

/** Wordmark that always returns to the landing page. */
export function AppLogo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      size="responsive"
      aria-label="Afterhours home"
      className={cn("flex items-center rounded-none", className)}
    >
      <Logo />
    </Link>
  );
}
