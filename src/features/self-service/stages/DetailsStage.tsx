import { useState } from "react";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/ui/Button";
import { Switch } from "@/ui/Switch";
import { TextField } from "@/ui/TextField";
import CallIcon from "@/assets/icons/call.svg?react";
import SmallShopIcon from "@/assets/icons/small-shop.svg?react";
import SmallMapIcon from "@/assets/icons/small-map.svg?react";
import GlobeIcon from "@/assets/icons/global.svg?react";
import { isMockApi, simulateScanFailure } from "../api";
import { useBuildProfile, usePatchPlace } from "../api/queries";
import type { Claim, PlacePatch } from "../api/types";
import { StageHeading, StagePanel } from "../components/ClaimLayout";

type Props = { claim: Claim };

type Fields = { name: string; phone: string; address: string; websiteUri: string };

const fieldsOf = (claim: Claim): Fields => ({
  name: claim.place.name,
  address: claim.place.address,
  phone: claim.place.phone ?? "",
  websiteUri: claim.place.websiteUri ?? "",
});

/**
 * Confirm the listing facts, then hand off to the website scan.
 *
 * Also the screen a failed scan comes back to, with `scanError` shown above the
 * form — the contract routes `scan_failed` here so the owner can fix the URL and
 * retry, or skip the scan entirely.
 */
export function DetailsStage({ claim }: Props) {
  const [fields, setFields] = useState<Fields>(() => fieldsOf(claim));
  const [simulateFailure, setSimulateFailure] = useState(false);

  const patchPlace = usePatchPlace();
  const buildProfile = useBuildProfile();

  const hasFailed = claim.status === "scan_failed";
  const isBusy = patchPlace.isPending || buildProfile.isPending;

  const set = (key: keyof Fields) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setFields((prev) => ({ ...prev, [key]: event.target.value }));

  /** Only what actually changed — the contract treats omitted keys as unchanged. */
  const buildPatch = (): PlacePatch => {
    const original = fieldsOf(claim);
    const patch: PlacePatch = {};

    if (fields.name.trim() !== original.name) patch.name = fields.name.trim();
    if (fields.address.trim() !== original.address) patch.address = fields.address.trim();
    if (fields.phone.trim() !== original.phone) patch.phone = fields.phone.trim() || null;
    if (fields.websiteUri.trim() !== original.websiteUri) {
      patch.websiteUri = fields.websiteUri.trim() || null;
    }

    return patch;
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
            {claim.scanError ??
              "It may be down, or blocking automated visitors."}{" "}
            Your details are safe — nothing is lost.
          </p>
        </div>
      )}

      <StageHeading title="Check your details.">
        This is what the directory has on file. Correct anything that's off — then we'll
        read your website to build your full profile.
      </StageHeading>

      <div className="flex flex-col gap-3.5">
        <TextField
          size="responsive"
          placeholder="Restaurant name"
          icon={<SmallShopIcon />}
          value={fields.name}
          onChange={set("name")}
        />
        <TextField
          size="responsive"
          placeholder="Phone"
          icon={<CallIcon />}
          inputMode="tel"
          value={fields.phone}
          onChange={set("phone")}
        />
        <TextField
          size="responsive"
          placeholder="Address"
          icon={<SmallMapIcon />}
          value={fields.address}
          onChange={set("address")}
        />
        <div>
          <TextField
            size="responsive"
            placeholder="Website"
            icon={<GlobeIcon />}
            inputMode="url"
            value={fields.websiteUri}
            onChange={set("websiteUri")}
          />
          <p className="mt-1.5 pl-1 font-satoshi text-[12px] text-color-secondary-text">
            We'll read this to build your profile.
          </p>
        </div>
      </div>

      {(claim.place.rating !== null || claim.place.googleMapsUri) && (
        <GoogleFacts claim={claim} />
      )}

      {(patchPlace.isError || buildProfile.isError) && (
        <p role="alert" className="mt-4 font-satoshi text-[13px] text-color-danger">
          {errorMessage(patchPlace.error ?? buildProfile.error)}
        </p>
      )}

      {isMockApi && (
        <div className="mt-5 rounded-[12px] bg-color-background px-4 py-3">
          <Switch
            checked={simulateFailure}
            onChange={setSimulateFailure}
            label="Demo: simulate a failed website read"
          />
        </div>
      )}

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
