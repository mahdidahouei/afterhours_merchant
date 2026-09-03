import { lazy, Suspense, useRef, useState } from "react";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/ui/Button";
import { Switch } from "@/ui/Switch";
import { isMockApi, simulateScanFailure } from "../api";
import { useBuildProfile, usePatchPlace } from "../api/queries";
import { write, type Claim, type PlacePatch } from "../api/types";
import {
  useLeaveGuard,
  type LeaveGuard,
  type LeaveGuardRef,
} from "../session/leaveGuard";

import { StageHeading, StagePanel } from "../components/ClaimLayout";
import { DetailField } from "../components/DetailField";

/**
 * Split out on purpose: mapbox-gl is ~1.9 MB, which is more than the rest of
 * this feature put together. Loaded eagerly it would be downloaded by everyone
 * who opens the claim flow, to draw one panel on one step — and precached by
 * the service worker on top of that. This way it arrives only when the details
 * step actually renders.
 */
const LocationMap = lazy(() =>
  import("../components/LocationMap").then((m) => ({ default: m.LocationMap })),
);

const alwaysLeave = async () => true;

type Props = {
  claim: Claim;
  /**
   * Set only when the owner came back here from a later step. Its presence is
   * what turns this from "confirm, then scan" into "correct, then return".
   */
  onDone?: () => void;
  /** Save the listing facts if the journey rail navigates away. */
  leaveGuard?: LeaveGuardRef;
};

/**
 * Address is absent on purpose: `PATCH /claim/place` accepts name, phone,
 * websiteUri and neighbourhood, and nothing else. The address is Google's and
 * the directory keys off it, so it keeps its place in the grid but is shown
 * read-only — a field that silently discarded what was typed would be worse
 * than one that says where the value comes from.
 */
type Fields = { name: string; phone: string; websiteUri: string };

const fieldsOf = (claim: Claim): Fields => ({
  name: claim.place.name,
  phone: claim.place.phone ?? "",
  websiteUri: claim.place.websiteUri ?? "",
});

/**
 * Confirm the listing facts, then hand off to the website scan.
 *
 * Also the screen a failed scan comes back to, with `scanError` shown above the
 * form — the contract routes `scan_failed` here so the owner can fix the URL and
 * retry, or skip the scan entirely.
 *
 * And, with `onDone`, the screen an owner returns to later to fix a phone number
 * or a web address. In that mode it saves and goes back: re-running the scan
 * would rewrite the profile they have since edited by hand, which is not what
 * "I mistyped our number" should cost.
 */
export function DetailsStage({ claim, onDone, leaveGuard }: Props) {
  // `useLeaveGuard` is a hook, so it can't be called conditionally; a screen
  // rendered without a guard registers into a ref nobody reads.
  const ownRef = useRef<LeaveGuard | null>(null);
  const fallbackGuardRef = leaveGuard ?? ownRef;
  const [fields, setFields] = useState<Fields>(() => fieldsOf(claim));
  const [simulateFailure, setSimulateFailure] = useState(false);

  const patchPlace = usePatchPlace();
  const buildProfile = useBuildProfile();

  const hasFailed = claim.status === "scan_failed";
  const isRevisit = Boolean(onDone);
  const isBusy = patchPlace.isPending || buildProfile.isPending;

  const isDirty = (() => {
    const original = fieldsOf(claim);
    return (
      fields.name.trim() !== original.name ||
      fields.phone.trim() !== original.phone ||
      fields.websiteUri.trim() !== original.websiteUri
    );
  })();

  /**
   * Only what actually changed. An omitted key is unchanged; a `Nullable` with
   * `set: true` and an empty value is the only way to clear a field, which is
   * why `write()` exists rather than a bare null.
   */
  const buildPatch = (): PlacePatch => {
    const original = fieldsOf(claim);
    const patch: PlacePatch = {};

    if (fields.name.trim() !== original.name) patch.name = fields.name.trim();
    if (fields.phone.trim() !== original.phone) patch.phone = write(fields.phone.trim());
    if (fields.websiteUri.trim() !== original.websiteUri) {
      patch.websiteUri = write(fields.websiteUri.trim());
    }

    return patch;
  };

  /** True when it is safe to leave: nothing changed, or the patch went through. */
  const commit = async () => {
    const patch = buildPatch();
    if (Object.keys(patch).length === 0) return true;
    return patchPlace
      .mutateAsync(patch)
      .then(() => true)
      .catch(() => false);
  };

  // The rail can leave this screen without touching its own buttons. Only a
  // revisit has anything to protect: on the first pass the owner has to press
  // a button to get anywhere, and the rail offers nothing to click.
  useLeaveGuard(fallbackGuardRef, isRevisit ? commit : alwaysLeave);

  /** Save the listing facts and go back, without touching the profile. */
  const saveAndReturn = async () => {
    if (await commit()) onDone?.();
  };

  const start = async (options?: { skipScan?: boolean }) => {
    simulateScanFailure(simulateFailure);

    const patch = buildPatch();
    if (Object.keys(patch).length > 0) {
      await patchPlace.mutateAsync(patch).catch(() => null);
      if (patchPlace.isError) return;
    }

    buildProfile.mutate(options ?? {});
  };

  return (
    <StagePanel>
      {hasFailed && (
        <div
          role="alert"
          className="mb-6 rounded-[16px] border border-color-danger/30 bg-color-danger/5 p-4"
        >
          <p className="font-satoshi text-[14px] font-semibold text-color-danger">
            We couldn't reach your site.
          </p>
          <p className="mt-1 font-satoshi text-[13px] leading-[160%] text-color-secondary-text">
            {claim.scanError ?? "It may be down, or blocking automated visitors."} Your
            details are safe — nothing is lost.
          </p>
        </div>
      )}

      <StageHeading title="Check your details.">
        {isRevisit
          ? "Fix anything that's wrong here. Your profile, photos and bookings stay exactly as you left them."
          : "This is what the directory has on file. Correct anything that's off — then we'll read your website to build your full profile."}
      </StageHeading>

      {/* The design's 2 x 2: name and phone, then address and website. */}
      <div className="grid gap-2.5 tb:grid-cols-2">
        <DetailField
          label="Restaurant name"
          value={fields.name}
          onChange={(value) => setFields((prev) => ({ ...prev, name: value }))}
        />
        <DetailField
          label="Phone"
          value={fields.phone}
          inputMode="tel"
          autoComplete="tel"
          onChange={(value) => setFields((prev) => ({ ...prev, phone: value }))}
        />
        {/* Read-only, and badged rather than footnoted: a hint below the box
            would make this cell taller than the one beside it and break the
            row the design lines up. */}
        <DetailField
          label="Address"
          badge="From Google"
          value={claim.place.address}
          readOnly
        />
        <DetailField
          label="Website"
          badge={isRevisit ? undefined : "Builds your profile"}
          value={fields.websiteUri}
          inputMode="url"
          onChange={(value) => setFields((prev) => ({ ...prev, websiteUri: value }))}
        />
      </div>

      {claim.place.location && (
        <div className="mt-3 overflow-hidden rounded-[16px] border border-color-border">
          <div className="px-4 py-3">
            <p className="font-satoshi text-[11px] font-semibold uppercase tracking-[0.12em] text-color-secondary-text">
              Location on the map
            </p>
            <p className="mt-0.5 font-satoshi text-[13px] text-color-secondary-text">
              This is where guests will be sent, from your Google listing.{" "}
              <a
                href="/contact-us"
                className="font-medium text-color-primary underline underline-offset-4"
              >
                Tell us
              </a>{" "}
              if the address or pin is wrong.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="h-[240px] w-full border-t border-color-border bg-color-background-3 tb:h-[280px]" />
            }
          >
            <LocationMap
            lat={claim.place.location.lat}
            lng={claim.place.location.lng}
            label={claim.place.name}
            className="h-[240px] w-full border-t border-color-border bg-color-background-3 tb:h-[280px]"
            fallback={
              <span className="font-satoshi text-[13px] text-color-secondary-text">
                {claim.place.address}
                {claim.place.googleMapsUri && (
                  <>
                    {" · "}
                    <a
                      href={claim.place.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-color-primary underline underline-offset-4"
                    >
                      Open in Google Maps
                    </a>
                  </>
                )}
              </span>
            }
            />
          </Suspense>
        </div>
      )}

      {(claim.place.rating !== null || claim.place.googleMapsUri) && (
        <GoogleFacts claim={claim} />
      )}

      {(patchPlace.isError || buildProfile.isError) && (
        <p role="alert" className="mt-4 font-satoshi text-[13px] text-color-danger">
          {errorMessage(patchPlace.error ?? buildProfile.error)}
        </p>
      )}

      {isMockApi && !isRevisit && (
        <div className="mt-5 rounded-[12px] bg-color-background px-4 py-3">
          <Switch
            checked={simulateFailure}
            onChange={setSimulateFailure}
            label="Demo: simulate a failed website read"
          />
        </div>
      )}

      {isRevisit ? (
        // No back link: saving returns them, and the journey rail is the way
        // out without saving. A third exit only adds a decision.
        <div className="mt-6 flex justify-end border-t border-color-border pt-5">
          <Button
            variant="primary"
            size="responsive"
            isLoading={isBusy}
            disabled={isBusy || !fields.name.trim() || !isDirty}
            onClick={() => void saveAndReturn()}
            className="h-[48px] rounded-full px-6 text-[13px] font-medium max-tb:w-full"
          >
            {isDirty ? "Save changes" : "Saved"}
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            variant="primary"
            size="responsive"
            isLoading={isBusy}
            disabled={isBusy || !fields.name.trim()}
            onClick={() => void start()}
            className="h-[50px] w-full rounded-full text-[13px] font-medium"
          >
            {hasFailed ? "Try again" : "Looks right — build my profile"}
          </Button>

          <Button
            variant="secondary"
            size="responsive"
            disabled={isBusy}
            onClick={() => void start({ skipScan: true })}
            className="h-[46px] w-full rounded-full text-[13px] font-normal"
          >
            Fill in my profile by hand
          </Button>
        </div>
      )}
    </StagePanel>
  );
}

/** Rating and review count only exist after verification — never in search. */
function GoogleFacts({ claim }: { claim: Claim }) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[12px] bg-color-background px-4 py-3">
      {claim.place.rating !== null && (
        <span className="font-satoshi text-[13px] font-semibold text-color-primary-text">
          {claim.place.rating.toFixed(1)}
          {claim.place.reviewCount !== null && (
            <span className="font-normal text-color-secondary-text">
              {" "}
              · {claim.place.reviewCount} reviews
            </span>
          )}
        </span>
      )}

      {claim.place.googleMapsUri && (
        <a
          href={claim.place.googleMapsUri}
          target="_blank"
          rel="noopener noreferrer"
          className="font-satoshi text-[13px] font-medium text-color-primary underline underline-offset-4"
        >
          Open
        </a>
      )}

      <span className="font-satoshi text-[12px] text-color-secondary-text">
        from your Google listing
      </span>
    </div>
  );
}
