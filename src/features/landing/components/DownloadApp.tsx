import { cn } from "@/lib/cn";
import PlayStore from "@/assets/brand/play-store.svg?react";
import AppStore from "@/assets/brand/app-store.svg?react";
import { EXTERNAL_LINKS } from "../content/links";

/** Store badges for the diner-facing app. */
export function DownloadApp({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <a
        href={EXTERNAL_LINKS.playStore}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get Afterhours on Google Play"
        className="rounded-lg bg-white/50 [&_svg]:max-w-[108px]"
      >
        <PlayStore />
      </a>
      <a
        href={EXTERNAL_LINKS.appStore}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Download Afterhours on the App Store"
        className="bg-white/50 [&_svg]:max-w-[108px]"
      >
        <AppStore />
      </a>
    </div>
  );
}
