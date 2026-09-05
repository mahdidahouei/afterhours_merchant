import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { Select, type SelectOption } from "@/ui/Select";
import { Switch } from "@/ui/Switch";
import { TextField } from "@/ui/TextField";
import CallIcon from "@/assets/icons/call.svg?react";
import SmsIcon from "@/assets/icons/sms.svg?react";
import { useReservationPlatforms } from "../../api/queries";
import { platformLabel, type Profile } from "../../api/types";
import { trimmed } from "./useProfileDraft";

type Props = {
  draft: Profile;
  /** Listing phone. Lives on Place, not Profile — the only phone in the API. */
  phone: string;
  onPhoneChange: (value: string) => void;
  update: <K extends keyof Profile>(key: K, value: Profile[K]) => void;
  updateSocial: (key: keyof Profile["social"], value: string) => void;
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
  missing,
}: Props) {
  const platforms = useReservationPlatforms();

  /** The one platform on the profile, if any. The picker is single-select. */
  const chosen = draft.reservationPlatforms[0] ?? null;

  /**
   * The platforms to choose from.
   *
   * `GET /reservation-platforms` is the only real list the API has, and it is
   * the three we integrate with. The scan reads names off a website, so a
   * profile can arrive holding something that is not among them — "OpenTable",
   * say. Whatever is already there is added to the list rather than dropped, so
   * opening the picker can never silently erase what the scan found. A proper
   * catalogue is a backend ask; see docs/specs/2026-09-05-reservation-platform-picker.md.
   *
   * Options carry the brand name as their value, not the API's lowercase key,
   * because that is what this field already holds — free text in brand casing,
   * "Formitable". Matching is case-insensitive so a scan that wrote
   * "formitable" resolves to the same row rather than listing it twice.
   */
  const options = useMemo<SelectOption[]>(() => {
    const known = (platforms.data ?? []).map((platform) => {
      const label = platformLabel(platform.name);
      return { value: label, label };
    });

    if (chosen && !known.some((option) => sameName(option.value, chosen))) {
      return [...known, { value: chosen, label: chosen }];
    }
    return known;
  }, [platforms.data, chosen]);

  /** The stored value as one of the options above, whatever case it arrived in. */
  const selected = useMemo(
    () => options.find((option) => sameName(option.value, chosen))?.value ?? null,
    [options, chosen],
  );

  return (
    <div className="flex flex-col gap-5">
      {/*
        Four fields, two by two, exactly as the design draws them: phone and
        email, then the two handles. Facebook is not among them — the contract
        still carries it and the draft still round-trips whatever the scan
        found, but nothing on this screen edits it.
      */}
      <div className="grid items-start gap-3.5 tb:grid-cols-2">
        <TextField
          size="responsive"
          placeholder="Phone"
          icon={<CallIcon />}
          inputMode="tel"
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
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
        />

        <HandleField
          label="Instagram"
          at
          value={draft.social.instagram ?? ""}
          onChange={(value) => updateSocial("instagram", value)}
        />
        <HandleField
          label="TikTok · optional"
          value={draft.social.tiktok ?? ""}
          onChange={(value) => updateSocial("tiktok", value)}
          hint="Not found — add if you have one"
        />
      </div>

      <div>
        {/* The design puts the heading and the toggle on one line. */}
        <div className="flex items-center justify-between gap-3">
          <p className="font-satoshi text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--color-field-focus)]">
            Where guests can book
          </p>

          <Switch
            checked={draft.reservable}
            onChange={(checked) => update("reservable", checked)}
            label="We take reservations"
          />
        </div>

        {/*
          Dimmed rather than unmounted when reservations are off, which is what
          the design does — the platform the scan found stays readable, so
          turning the toggle back on doesn't look like it lost it.
        */}
        <div
          className={cn(
            "mt-2 transition-opacity duration-200",
            !draft.reservable && "pointer-events-none opacity-50",
          )}
        >
          {/*
            One platform, chosen from a list — not the chip row this used to be.
            `ui/Select` already wears the text field's clothes: same height, same
            border, and a placeholder that floats up into a label once there is
            a value, so it reads as a field the owner types into rather than a
            control of its own.
          */}
          <Select
            size="field"
            placeholder="Choose a reservation platform"
            options={options}
            value={selected}
            onChange={(value) => update("reservationPlatforms", [value])}
            isLoading={platforms.isPending}
            disabled={!draft.reservable}
          />
        </div>
      </div>
    </div>
  );
}

/** Platform names are free text, so two spellings of one brand must still match. */
const sameName = (a: string, b: string | null) =>
  b !== null && a.toLowerCase() === b.toLowerCase();

/** A social handle. The API stores handles without the @, so the @ is decoration. */
function HandleField({
  label,
  at,
  value,
  onChange,
  hint,
}: {
  label: string;
  /** Show the leading @. The design draws it on Instagram and not on TikTok. */
  at?: boolean;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  // The shared field, with the @ as its leading icon — the same slot every
  // other form in the app uses for one.
  return (
    <TextField
      size="responsive"
      placeholder={label}
      hint={hint}
      icon={
        at ? (
          <span
            aria-hidden
            className="font-satoshi text-[15px] text-color-secondary-text"
          >
            @
          </span>
        ) : undefined
      }
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/^@/, ""))}
    />
  );
}
