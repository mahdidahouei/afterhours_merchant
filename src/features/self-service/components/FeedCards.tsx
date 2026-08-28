import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/ui/Button";
import { useDisconnectSocial, useStartSocialConnect } from "../api/queries";
import type { SocialConnection, SocialProvider } from "../api/types";

const PROVIDERS: { id: SocialProvider; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
];

type Props = { connections: SocialConnection[] };

/**
 * Link Instagram and TikTok so the listing shows tonight's posts.
 *
 * A real OAuth handshake: `POST /claim/social/{provider}/connect` hands back the
 * provider's consent screen, we leave for it, and the provider's callback
 * records the grant before bouncing back here. `redirectTo` is this exact URL,
 * so the owner returns to the photos step rather than the top of the flow, and
 * the claim is re-read on mount — which is what makes the connection appear.
 *
 * Facebook is absent on purpose: the contract says it can only be typed, never
 * connected, so it lives as a text field in the contact section instead.
 */
export function FeedCards({ connections }: Props) {
  const start = useStartSocialConnect();
  const disconnect = useDisconnectSocial();

  const open = (provider: SocialProvider) => {
    start.reset();
    start.mutate(
      { provider, redirectTo: window.location.href },
      { onSuccess: ({ authorizeUrl }) => window.location.assign(authorizeUrl) },
    );
  };

  return (
    <div className="rounded-[18px] border border-color-border bg-color-background-3 p-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <p className="font-lora text-[19px] font-medium text-color-primary-text">
          Bring your listing to life.
        </p>
        <span className="rounded-full bg-color-secondary px-2.5 py-0.5 font-satoshi text-[11px] font-semibold uppercase tracking-[0.08em] text-color-primary">
          Recommended
        </span>
      </div>

      <p className="mt-2 max-w-[70ch] font-satoshi text-[13px] leading-[165%] text-color-secondary-text">
        Connect your feeds and your newest posts show on your listing automatically —
        guests see tonight's dishes, not last year's. No re-uploading, ever.
      </p>

      <div className="mt-4 grid gap-3 tb:grid-cols-2">
        {PROVIDERS.map(({ id, label }) => (
          <FeedCard
            key={id}
            label={label}
            connection={connections.find((c) => c.provider === id) ?? null}
            isBusy={start.isPending || disconnect.isPending}
            onConnect={() => open(id)}
            onDisconnect={() => disconnect.mutate(id)}
          />
        ))}
      </div>

      {(start.isError || disconnect.isError) && (
        <p role="alert" className="mt-3 font-satoshi text-[13px] text-color-danger">
          {errorMessage(start.error ?? disconnect.error)}
        </p>
      )}
    </div>
  );
}

function FeedCard({
  label,
  connection,
  isBusy,
  onConnect,
  onDisconnect,
}: {
  label: string;
  connection: SocialConnection | null;
  isBusy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  // A revoked grant is kept deliberately, so the account doesn't just vanish —
  // it needs redoing, and saying that is more useful than showing "not connected".
  const isLive = connection !== null && !connection.revoked;

  return (
    <div
      className={cn(
        "rounded-[14px] border bg-white p-4 transition-colors",
        isLive ? "border-color-success/40 bg-[#2399620A]" : "border-color-border",
        connection?.revoked && "border-color-warning/50",
      )}
    >
      <p className="font-satoshi text-[14px] font-semibold text-color-primary-text">
        {label}
      </p>
      <p className="mt-0.5 font-satoshi text-[12px] text-color-secondary-text">
        {connection?.revoked
          ? "Access expired — reconnect to keep the feed live"
          : isLive
            ? connection.handle
              ? `Connected as @${connection.handle}`
              : "Connected"
            : "Not connected"}
      </p>

      {isLive ? (
        <Button
          variant="secondary"
          size="responsive"
          disabled={isBusy}
          onClick={onDisconnect}
          className="mt-3.5 h-[44px] w-full rounded-full text-[13px] font-normal"
        >
          Disconnect
        </Button>
      ) : (
        <Button
          variant="primary"
          size="responsive"
          isLoading={isBusy}
          onClick={onConnect}
          className="mt-3.5 h-[44px] w-full rounded-full text-[13px] font-medium"
        >
          {connection?.revoked ? `Reconnect ${label}` : `Log in with ${label}`}
        </Button>
      )}
    </div>
  );
}
