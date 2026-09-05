import { Link } from "react-router-dom";
import { Button } from "@/ui/Button";
import { platformLabel, type Claim } from "../api/types";
import { StagePanel } from "../components/ClaimLayout";

type Props = {
  claim: Claim;
  /** Sign out and start over on another restaurant. */
  onRestart: () => void;
  /**
   * Set while no booking platform is connected, so the offer stays open to an
   * owner who chose "I'll connect later" rather than disappearing on them.
   */
  onConnectBookings?: () => void;
};

/**
 * The three screens after the owner's work is done: with our team, almost
 * there, and live.
 *
 * They are one component because they differ only in copy and tone — the shape
 * is identical, and `submitted` and `approved` both just wait for the page's
 * poll to move them along.
 */
export function StatusStage({ claim, onRestart, onConnectBookings }: Props) {
  if (claim.status === "live") {
    return (
      <LiveScreen
        claim={claim}
        onRestart={onRestart}
        onConnectBookings={onConnectBookings}
      />
    );
  }

  const isApproved = claim.status === "approved";

  return (
    <StagePanel className="text-center">
      <div className="mx-auto flex max-w-[46ch] flex-col items-center">
        <StatusMark tone={isApproved ? "good" : "wait"} />

        <h1 className="mt-5 font-lora text-[26px] font-medium text-color-primary-text tb:text-[30px]">
          {isApproved ? "Almost there." : "With our team."}
        </h1>

        <p className="mt-2.5 font-satoshi text-[14px] leading-[165%] text-color-secondary-text tb:text-[15px]">
          {isApproved
            ? "Your listing is approved and being written to the directory. This usually takes a few minutes — you can close this tab."
            : "Your profile is with our team for review. We'll text you when it's live. You can close this tab; nothing is lost."}
        </p>

        <dl className="mt-7 w-full rounded-[14px] bg-color-background-3 px-5 py-4 text-left">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="font-satoshi text-[13px] text-color-secondary-text">Restaurant</dt>
            <dd className="font-satoshi text-[13px] font-semibold text-color-primary-text">
              {claim.place.name}
            </dd>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <dt className="font-satoshi text-[13px] text-color-secondary-text">Photos</dt>
            <dd className="font-satoshi text-[13px] font-semibold text-color-primary-text">
              {claim.photos.length}
            </dd>
          </div>
        </dl>

        {onConnectBookings && <ConnectOffer onConnect={onConnectBookings} />}

        <Link
          to="/"
          className="mt-6 font-satoshi text-[13px] font-medium text-color-primary underline underline-offset-4"
        >
          Back to Afterhours
        </Link>
      </div>
    </StagePanel>
  );
}

/**
 * Bookings can still be connected while the claim sits with an admin — it is
 * not part of what they review. An owner who skipped it shouldn't have to guess
 * that the offer is still open.
 */
function ConnectOffer({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="mt-6 w-full rounded-[14px] border border-color-border bg-white px-5 py-4 text-left">
      <p className="font-satoshi text-[14px] font-semibold text-color-primary-text">
        Take bookings directly
      </p>
      <p className="mt-1 font-satoshi text-[13px] leading-[160%] text-color-secondary-text">
        Connect your reservation platform and diners book you on Afterhours, with
        availability synced in realtime. You can do this now — it doesn't wait on us.
      </p>
      <Button
        variant="secondary"
        size="responsive"
        onClick={onConnect}
        className="mt-3.5 h-[44px] rounded-full text-[13px] font-normal"
      >
        Connect your bookings
      </Button>
    </div>
  );
}

function LiveScreen({ claim, onRestart, onConnectBookings }: Props) {
  const profile = claim.profile;

  const summary = [
    profile?.description ? "Your story" : null,
    profile?.cuisines.length ? "Cuisines, vibe & occasions" : null,
    profile?.email || profile?.social.instagram ? "Contact & social links" : null,
    profile?.menus.length
      ? `${profile.menus.length} ${profile.menus.length === 1 ? "menu" : "menus"}`
      : null,
    // A connected integration outranks the platform names the scan read off the
    // website: one is live and syncing, the other is something we noticed.
    claim.reservation.length
      ? `Realtime bookings via ${claim.reservation
          .map((r) => platformLabel(r.platformName))
          .join(" & ")}`
      : profile?.reservable && profile.reservationPlatforms.length
        ? `Reservations via ${profile.reservationPlatforms.join(", ")}`
        : null,
    claim.photos.length
      ? `${claim.photos.length} ${claim.photos.length === 1 ? "photo" : "photos"}`
      : null,
  ].filter(Boolean) as string[];

  return (
    <StagePanel className="text-center">
      <div className="mx-auto flex max-w-[48ch] flex-col items-center">
        <StatusMark tone="good" />

        <h1 className="mt-5 font-lora text-[26px] font-medium text-color-primary-text tb:text-[30px]">
          Your listing is live.
        </h1>

        <p className="mt-2.5 font-satoshi text-[14px] leading-[165%] text-color-secondary-text tb:text-[15px]">
          <strong className="font-semibold text-color-primary-text">
            {claim.place.name}
          </strong>{" "}
          is now in your hands. Guests will see your story, your menus, and how to book.
        </p>

        {summary.length > 0 && (
          <div className="mt-7 w-full rounded-[14px] bg-color-background-3 px-5 py-4 text-left">
            <p className="font-satoshi text-[12px] font-semibold uppercase tracking-[0.12em] text-color-secondary-text">
              What's on your profile
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {summary.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="mt-0.5 grid size-4 shrink-0 place-content-center rounded-full bg-color-primary text-[9px] text-white"
                  >
                    ✓
                  </span>
                  <span className="font-satoshi text-[13px] text-color-primary-text">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {onConnectBookings && <ConnectOffer onConnect={onConnectBookings} />}

        <div className="mt-7 flex w-full flex-col gap-2.5 tb:flex-row tb:justify-center">
          <Button
            variant="primary"
            size="responsive"
            onClick={onRestart}
            className="h-[46px] rounded-full px-6 text-[13px] font-medium"
          >
            Claim another restaurant
          </Button>
          <Link
            to="/"
            className="flex h-[46px] items-center justify-center rounded-full border border-color-border px-6 font-satoshi text-[13px] font-normal text-color-primary-text transition-colors hover:border-color-primary"
          >
            Back to Afterhours
          </Link>
        </div>
      </div>
    </StagePanel>
  );
}

function StatusMark({ tone }: { tone: "wait" | "good" }) {
  return (
    <span
      aria-hidden
      className={
        "grid size-14 place-content-center rounded-full text-[22px] " +
        (tone === "good"
          ? "bg-color-primary text-white"
          : "bg-color-secondary text-color-primary")
      }
    >
      {tone === "good" ? "✓" : "◷"}
    </span>
  );
}
