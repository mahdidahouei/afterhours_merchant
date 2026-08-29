import { useMemo, useState } from "react";
import { SearchNormal } from "iconsax-reactjs";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/Button";
import { ErrorState } from "@/ui/ErrorState";
import { Skeleton } from "@/ui/Skeleton";
import { TextField } from "@/ui/TextField";
import { useReservationPlatforms } from "../../api/queries";
import {
  PLATFORM_ORDER,
  platformLabel,
  type ClaimReservation,
  type ReservationPlatform,
} from "../../api/types";

type Props = {
  connected: ClaimReservation[];
  onPick: (platform: ReservationPlatform) => void;
  onDisconnect: (platformId: string) => void;
  isDisconnecting: boolean;
};

/**
 * Pick a booking platform.
 *
 * The list is exactly what `GET /reservation-platforms` returns — the three
 * integrations that actually exist. Only the display order and the brand casing
 * come from us, because the API's `name` is a lowercase key and its ordering
 * isn't a product decision. Anything the API adds later still appears, at the
 * end, under its own name.
 */
export function PlatformPicker({
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
      ? all.filter((p) => platformLabel(p.name).toLowerCase().includes(needle))
      : all;

    // Known platforms in product order; anything unrecognised after them.
    const rank = (p: ReservationPlatform) => {
      const index = PLATFORM_ORDER.indexOf(p.name.toLowerCase());
      return index === -1 ? PLATFORM_ORDER.length : index;
    };
    return [...matching].sort((a, b) => rank(a) - rank(b));
  }, [platforms.data, query]);

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
            No platforms found.
          </p>
        )}

        <ul className="flex flex-col gap-2.5">
          {rows.map((platform) => {
            const live = connected.find((r) => r.platformId === platform.id);
            const label = platformLabel(platform.name);

            return (
              <li
                key={platform.id}
                className={cn(
                  "flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-[16px] border p-3.5 transition-colors",
                  live
                    ? "border-color-success/40 bg-color-success/[0.04]"
                    : "border-color-border bg-white hover:border-color-primary/40",
                )}
              >
                <PlatformMark platform={platform} label={label} />

                <div className="min-w-0 flex-1">
                  <p className="font-satoshi text-[15px] font-semibold text-color-primary-text">
                    {label}
                  </p>
                  <p className="mt-0.5 font-satoshi text-[12px] text-color-secondary-text">
                    {live
                      ? live.integrationId
                        ? `Connected · ${live.integrationId}`
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
                    className="h-[44px] shrink-0 rounded-full text-xs font-normal max-tb:w-full"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline-connect"
                    size="small"
                    onClick={() => onPick(platform)}
                    className="h-[44px] shrink-0 rounded-full text-xs font-normal max-tb:w-full"
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
        </a>
        .
      </p>
    </>
  );
}

/** The platform's own icon, with its initial as the fallback. */
function PlatformMark({
  platform,
  label,
}: {
  platform: ReservationPlatform;
  label: string;
}) {
  if (platform.iconUrl) {
    return (
      <img
        src={platform.iconUrl}
        alt=""
        className="size-10 shrink-0 rounded-[10px] object-contain"
        loading="lazy"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="grid size-10 shrink-0 place-content-center rounded-[10px] bg-color-secondary font-lora text-[16px] font-medium text-color-primary"
    >
      {label.charAt(0)}
    </span>
  );
}

function PickerSkeleton() {
  return (
    <ul className="flex flex-col gap-2.5">
      {[0, 1, 2].map((row) => (
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
