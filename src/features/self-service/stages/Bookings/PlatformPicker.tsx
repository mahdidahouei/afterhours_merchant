import { useMemo, useState } from "react";
import { SearchNormal } from "iconsax-reactjs";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/Button";
import { ErrorState } from "@/ui/ErrorState";
import { Skeleton } from "@/ui/Skeleton";
import { TextField } from "@/ui/TextField";
import { useReservationPlatforms } from "../../api/queries";
import type { ClaimReservation, ReservationPlatform } from "../../api/types";

type Props = {
  /** Platform names the scan read off the website, so they can be surfaced first. */
  mentioned: string[];
  connected: ClaimReservation[];
  onPick: (platform: ReservationPlatform) => void;
  onDisconnect: (platformId: string) => void;
  isDisconnecting: boolean;
};

/**
 * Pick a booking platform.
 *
 * The list is ordered with the platforms the owner's own website mentions at the
 * top — the scan already worked out which they use, and making them hunt for it
 * in an alphabetical list of nine would waste that.
 */
export function PlatformPicker({
  mentioned,
  connected,
  onPick,
  onDisconnect,
  isDisconnecting,
}: Props) {
  const [query, setQuery] = useState("");
  const platforms = useReservationPlatforms();

  const rows = useMemo(() => {
    const all = platforms.data ?? [];
    const needle = query.trim().toLowerCase();
    const matching = needle
      ? all.filter((p) => p.name.toLowerCase().includes(needle))
      : all;

    const isMine = (p: ReservationPlatform) =>
      mentioned.some((name) => name.toLowerCase() === p.name.toLowerCase());

    return [...matching.filter(isMine), ...matching.filter((p) => !isMine(p))];
  }, [platforms.data, query, mentioned]);

  if (platforms.isError) {
    return <ErrorState error={platforms.error} onRetry={() => void platforms.refetch()} />;
  }

  return (
    <>
      <TextField
        size="responsive"
        placeholder="Find your reservation platform"
        icon={<SearchNormal size={20} color="#262626" />}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="mt-4">
        {platforms.isPending && <PickerSkeleton />}

        {!platforms.isPending && rows.length === 0 && (
          <p className="py-8 text-center font-satoshi text-[14px] text-color-secondary-text">
            Nothing matches “{query.trim()}”.
          </p>
        )}

        <ul className="flex flex-col gap-2.5">
          {rows.map((platform) => {
            const live = connected.find((r) => r.platformId === platform.id);

            return (
              <li
                key={platform.id}
                className={cn(
                  "flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-[16px] border p-3.5 transition-colors",
                  live
                    ? "border-color-success/40 bg-[#2399620A]"
                    : "border-color-border bg-white hover:border-color-primary/40",
                )}
              >
                <PlatformMark platform={platform} />

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-satoshi text-[15px] font-semibold text-color-primary-text">
                    {platform.name}
                    {!live &&
                      mentioned.some(
                        (name) => name.toLowerCase() === platform.name.toLowerCase(),
                      ) && (
                        <span className="rounded-full bg-color-secondary px-2 py-0.5 font-satoshi text-[11px] font-medium text-color-primary">
                          Your platform
                        </span>
                      )}
                  </p>

                  <p className="mt-0.5 font-satoshi text-[12px] text-color-secondary-text">
                    {live
                      ? live.integrationId
                        ? `Connected · account ${live.integrationId}`
                        : "Connected"
                      : "Realtime availability, free"}
                  </p>
                </div>

                {live ? (
                  <Button
                    variant="secondary"
                    size="small"
                    disabled={isDisconnecting}
                    onClick={() => onDisconnect(platform.id)}
                    className="h-[40px] shrink-0 rounded-full text-xs font-normal max-tb:w-full"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline-connect"
                    size="small"
                    onClick={() => onPick(platform)}
                    className="h-[40px] shrink-0 rounded-full text-xs font-normal max-tb:w-full"
                  >
                    Connect
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-5 text-center font-satoshi text-[12px] text-color-secondary-text">
        Platform not listed?{" "}
        <a
          href="/contact-us"
          className="font-medium text-color-primary underline underline-offset-4"
        >
          Request it here
        </a>{" "}
        — we add new partners every month.
      </p>
    </>
  );
}

/** The platform's icon, or its initial when the API has no artwork for it. */
function PlatformMark({ platform }: { platform: ReservationPlatform }) {
  if (platform.iconUrl) {
    return (
      <img
        src={platform.iconUrl}
        alt=""
        className="size-10 shrink-0 rounded-[10px] object-contain"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="grid size-10 shrink-0 place-content-center rounded-[10px] bg-color-secondary font-lora text-[16px] font-medium text-color-primary"
    >
      {platform.name.charAt(0)}
    </span>
  );
}

function PickerSkeleton() {
  return (
    <ul className="flex flex-col gap-2.5">
      {[0, 1, 2, 3].map((row) => (
        <li
          key={row}
          className="flex items-center gap-3 rounded-[16px] border border-color-border p-3.5"
        >
          <Skeleton isLoaded={false} className="size-10 rounded-[10px]" />
          <div className="flex-1">
            <Skeleton isLoaded={false} className="h-4 w-1/3" />
            <div className="mt-2">
              <Skeleton isLoaded={false} className="h-3 w-1/2" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
