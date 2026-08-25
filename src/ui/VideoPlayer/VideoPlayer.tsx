import { cn } from "@/lib/cn";

type Props = {
  src: string;
  className?: string;
};

/**
 * Native video with browser controls.
 *
 * Replaces video.js + @videojs-player/react (~400 KB, plus its own stylesheet)
 * which were used for exactly this: autoplay, loop, inline, controls. The
 * browser's own player does all four and is keyboard- and screen-reader-correct
 * for free.
 *
 * `key={src}` forces a remount when the guide advances to another step so the
 * new clip actually loads instead of the old one lingering.
 */
export function VideoPlayer({ src, className }: Props) {
  return (
    <div
      className={cn(
        "relative flex aspect-video h-auto max-h-[286px] w-full items-center justify-center",
        "overflow-hidden bg-[#E6E6E6] max-lg:min-h-[260px] tb:w-full tb:rounded-[20px] lg:w-auto",
        className,
      )}
    >
      <video
        key={src}
        src={src}
        autoPlay
        loop
        muted
        controls
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
