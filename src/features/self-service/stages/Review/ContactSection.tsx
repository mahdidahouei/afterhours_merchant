import { useState } from "react";
import { cn } from "@/lib/cn";
import { AddChip, Chip } from "@/ui/Chip";
import { Switch } from "@/ui/Switch";
import { TextField } from "@/ui/TextField";
import CallIcon from "@/assets/icons/call.svg?react";
import SmsIcon from "@/assets/icons/sms.svg?react";
import GlobeIcon from "@/assets/icons/global.svg?react";
import type { Profile } from "../../api/types";
import { trimmed } from "./useProfileDraft";

type Props = {
  draft: Profile;
  /** Listing phone. Lives on Place, not Profile — the only phone in the API. */
  phone: string;
  onPhoneChange: (value: string) => void;
  update: <K extends keyof Profile>(key: K, value: Profile[K]) => void;
  updateSocial: (key: keyof Profile["social"], value: string) => void;
  /** PENDING_API — `reservationPlatforms` is a flat list with no primary. */
  primaryPlatform: string | null;
  onPrimaryPlatformChange: (value: string | null) => void;
  missing: Set<string>;
};

/**
 * Contact details and how guests book.
 *
 * This section straddles two endpoints and that split is deliberate: phone is a
 * listing fact and goes to PATCH /claim/place, while email, socials and
 * everything about reservations is profile and goes to PUT /claim/profile. The
 * owner sees one form; the page routes each field to the right call.
 */
export function ContactSection({
  draft,
  phone,
  onPhoneChange,
  update,
  updateSocial,
  primaryPlatform,
  onPrimaryPlatformChange,
  missing,
}: Props) {
  const [newPlatform, setNewPlatform] = useState("");

  const addPlatform = () => {
    const value = newPlatform.trim();
    if (!value || draft.reservationPlatforms.includes(value)) return;
    update("reservationPlatforms", [...draft.reservationPlatforms, value]);
    setNewPlatform("");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3.5 tb:flex-row">
        <TextField
          size="responsive"
          placeholder="Phone"
          icon={<CallIcon />}
          inputMode="tel"
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          containerClassName="flex-1"
        />
        <TextField
          size="responsive"
          placeholder="Email"
          icon={<SmsIcon />}
          inputMode="email"
          value={draft.email ?? ""}
          onChange={(event) => update("email", trimmed(event.target.value))}
          errorMessage={missing.has("email") ? "Add an email" : undefined}
          hideErrorMessage
          containerClassName="flex-1"
        />
      </div>

      <fieldset className="flex flex-col gap-3.5">
        <legend className="mb-1 font-satoshi text-[13px] font-medium text-color-primary-text">
          Social
        </legend>

        <HandleField
          label="Instagram"
          value={draft.social.instagram ?? ""}
          onChange={(value) => updateSocial("instagram", value)}
        />
        <HandleField
          label="Facebook · optional"
          value={draft.social.facebook ?? ""}
          onChange={(value) => updateSocial("facebook", value)}
          placeholder="Not found — add if you have one"
        />
        <HandleField
          label="TikTok · optional"
          value={draft.social.tiktok ?? ""}
          onChange={(value) => updateSocial("tiktok", value)}
          placeholder="Not found — add if you have one"
        />
      </fieldset>

      <div className="rounded-[16px] border border-color-border p-4">
        <p className="font-satoshi text-[13px] font-medium text-color-primary-text">
          Where guests can book
        </p>

        <div className="mt-3">
          <Switch
            checked={draft.reservable}
            onChange={(checked) => update("reservable", checked)}
            label="We take reservations"
          />
        </div>

        {draft.reservable && (
          <div className="mt-4 flex flex-col gap-4">
            <TextField
              size="responsive"
              placeholder="Booking link"
              icon={<GlobeIcon />}
              inputMode="url"
              value={draft.reservationUrl ?? ""}
              onChange={(event) => update("reservationUrl", trimmed(event.target.value))}
            />

            <div>
              <span className="font-satoshi text-[13px] font-medium text-color-primary-text">
                Booking platforms
              </span>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {draft.reservationPlatforms.map((platform) => (
                  <PlatformChip
                    key={platform}
                    platform={platform}
                    isPrimary={primaryPlatform === platform}
                    onSetPrimary={() =>
                      onPrimaryPlatformChange(
                        primaryPlatform === platform ? null : platform,
                      )
                    }
                    onRemove={() => {
                      update(
                        "reservationPlatforms",
                        draft.reservationPlatforms.filter((p) => p !== platform),
                      );
                      if (primaryPlatform === platform) onPrimaryPlatformChange(null);
                    }}
                  />
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newPlatform}
                  onChange={(event) => setNewPlatform(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addPlatform();
                    }
                  }}
                  placeholder="Formitable, Guestplan…"
                  className="min-w-0 flex-1 rounded-[10px] border border-color-border px-3 py-2 font-satoshi text-sm outline-none focus:border-[color:var(--color-field-focus)]"
                />
                <AddChip onClick={addPlatform} label="Add" />
              </div>

              {/*
                PENDING_API — the contract's reservationPlatforms is a flat list
                of strings with no notion of a primary. The star is kept because
                the design has it and the field is expected; it holds local
                state and is labelled as not yet saved.
              */}
              {draft.reservationPlatforms.length > 1 && (
                <p className="mt-2.5 font-satoshi text-[12px] text-color-secondary-text">
                  Tap the star to flag your primary booking platform.{" "}
                  <span className="text-color-secondary-text">
                    Not saved yet — coming with the next API release.
                  </span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** A social handle. The API stores handles without the @, so the @ is decoration. */
function HandleField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-satoshi text-[12px] font-medium text-color-secondary-text">
        {label}
      </span>
      <span
        className={cn(
          "flex items-center rounded-[12px] border border-color-border bg-white",
          "focus-within:border-[color:var(--color-field-focus)]",
        )}
      >
        <span aria-hidden className="pl-3.5 font-satoshi text-[15px] text-color-secondary-text">
          @
        </span>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value.replace(/^@/, ""))}
          className="min-w-0 flex-1 bg-transparent px-2.5 py-3 font-satoshi text-[15px] font-medium text-color-primary-text outline-none placeholder:font-normal placeholder:text-color-secondary-text"
        />
      </span>
    </label>
  );
}

function PlatformChip({
  platform,
  isPrimary,
  onSetPrimary,
  onRemove,
}: {
  platform: string;
  isPrimary: boolean;
  onSetPrimary: () => void;
  onRemove: () => void;
}) {
  return (
    <Chip onRemove={onRemove} className={isPrimary ? "ring-1 ring-color-primary/40" : ""}>
      <button
        type="button"
        onClick={onSetPrimary}
        aria-pressed={isPrimary}
        aria-label={`Mark ${platform} as primary`}
        className="-ml-0.5 grid place-content-center"
      >
        <svg viewBox="0 0 16 16" className="size-3.5">
          <path
            d="M8 1.5l1.9 4 4.4.6-3.2 3 .8 4.4L8 11.4 4.1 13.5l.8-4.4-3.2-3 4.4-.6z"
            fill={isPrimary ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {platform}
      {isPrimary && <span className="text-[11px] opacity-70">· Primary</span>}
    </Chip>
  );
}
