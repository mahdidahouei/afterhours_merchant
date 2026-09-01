import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/ui/Button";
import { useDisconnectSocial, useStartSocialConnect } from "../api/queries";
import type { SocialConnection, SocialProvider } from "../api/types";
import { markSocialPending, socialReturnUrl } from "../session/socialReturn";

const PROVIDERS: { id: SocialProvider; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
];

type Props = {
  connections: SocialConnection[];
  /** Set when this page load is a provider bouncing back. */
  returnedFrom?: SocialProvider | null;
};

/**
 * Link Instagram and TikTok so the listing shows tonight's posts.
 *
 * A real OAuth handshake: `POST /claim/social/{provider}/connect` hands back the
 * provider's consent screen, the browser leaves for it, and the provider's
 * callback records the grant before redirecting to the `redirectTo` we asked
 * for — this page, undecorated. That the trip is a return, rather than someone
 * arriving fresh, is remembered in `session/socialReturn.ts`, which is what
 * keeps the session alive across it.
 *
 * Because the whole thing leaves the site, the only honest report of what
 * happened is the claim we re-read on the way back: if the provider is in
 * `claim.social` it worked, and if it isn't, it didn't. `returnedFrom` is what
 * lets that be said out loud instead of the card just sitting there unchanged.
 *
 * Facebook is absent on purpose: the contract says it can only be typed, never
 * connected, so it lives as a text field in the contact section instead.
 */
export function FeedCards({ connections, returnedFrom }: Props) {
  const start = useStartSocialConnect();
  const disconnect = useDisconnectSocial();

  // React Query reports the arguments of the call in flight, so "which button is
  // busy" needs no state of its own — and, more to the point, one provider's
  // spinner can't appear on the other's card.
  const startingProvider = start.isPending ? start.variables?.provider : undefined;
  const disconnectingProvider = disconnect.isPending ? disconnect.variables : undefined;

  const open = (provider: SocialProvider) => {
    start.reset();
    disconnect.reset();
    start.mutate(
      { provider, redirectTo: socialReturnUrl() },
      {
        onSuccess: ({ authorizeUrl }) => {
          // Mark before leaving: once `assign` runs, nothing else here does.
          markSocialPending(provider);
          window.location.assign(authorizeUrl);
        },
      },
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
        {PROVIDERS.map(({ id, label }) => {
          const connection = connections.find((c) => c.provider === id) ?? null;

          // Came back from this provider without a connection to show for it.
          const failed = returnedFrom === id && connection === null;

          const error =
            startFailedFor(start, id) ?? disconnectFailedFor(disconnect, id) ?? null;

          return (
            <FeedCard
              key={id}
              label={label}
              connection={connection}
              isConnecting={startingProvider === id}
              isDisconnecting={disconnectingProvider === id}
              // Leave the other card alone while one is working.
              isBlocked={
                (startingProvider !== undefined && startingProvider !== id) ||
                (disconnectingProvider !== undefined && disconnectingProvider !== id)
              }
              failed={failed}
              error={error}
              onConnect={() => open(id)}
              onDisconnect={() => {
                start.reset();
                disconnect.reset();
                disconnect.mutate(id);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** The error from a failed start, but only on the card that caused it. */
function startFailedFor(
  start: ReturnType<typeof useStartSocialConnect>,
  provider: SocialProvider,
): string | null {
  if (!start.isError || start.variables?.provider !== provider) return null;
  return errorMessage(start.error);
}

function disconnectFailedFor(
  disconnect: ReturnType<typeof useDisconnectSocial>,
  provider: SocialProvider,
): string | null {
  if (!disconnect.isError || disconnect.variables !== provider) return null;
  return errorMessage(disconnect.error);
}

function FeedCard({
  label,
  connection,
  isConnecting,
  isDisconnecting,
  isBlocked,
  failed,
  error,
  onConnect,
  onDisconnect,
}: {
  label: string;
  connection: SocialConnection | null;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isBlocked: boolean;
  failed: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  // A revoked grant is kept deliberately, so the account doesn't just vanish —
  // it needs redoing, and saying that is more useful than "not connected".
  const isLive = connection !== null && !connection.revoked;

  return (
    <div
      className={cn(
        "rounded-[14px] border bg-white p-4 transition-colors",
        isLive ? "border-color-success/40 bg-color-success/[0.04]" : "border-color-border",
        connection?.revoked && "border-color-warning/50",
        failed && "border-color-danger/50",
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
          isLoading={isDisconnecting}
          disabled={isDisconnecting || isBlocked}
          onClick={onDisconnect}
          className="mt-3.5 h-[44px] w-full rounded-full text-[13px] font-normal"
        >
          Disconnect
        </Button>
      ) : (
        <Button
          variant="primary"
          size="responsive"
          isLoading={isConnecting}
          disabled={isConnecting || isBlocked}
          onClick={onConnect}
          className="mt-3.5 h-[44px] w-full rounded-full text-[13px] font-medium"
        >
          {connection?.revoked ? `Reconnect ${label}` : `Log in with ${label}`}
        </Button>
      )}

      {(error || failed) && (
        <p role="alert" className="mt-2 font-satoshi text-[12px] text-color-danger">
          {error ?? `${label} wasn't connected. You can try again.`}
        </p>
      )}
    </div>
  );
}
