import { cn } from "@/lib/cn";
import { TextField } from "@/ui/TextField";
import { ChipPicker } from "../../components/ChipPicker";
import type { Profile, Taxonomy } from "../../api/types";
import { PROFILE_LIMITS, trimmed } from "./useProfileDraft";

type Props = {
  draft: Profile;
  taxonomy: Taxonomy | undefined;
  update: <K extends keyof Profile>(key: K, value: Profile[K]) => void;
  missing: Set<string>;
};

/** Tagline, description, and the four taxonomy pickers. */
export function StorySection({ draft, taxonomy, update, missing }: Props) {
  const description = draft.description ?? "";
  const remaining = PROFILE_LIMITS.description - description.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <TextField
          size="responsive"
          placeholder="Tagline"
          value={draft.tagline ?? ""}
          maxLength={PROFILE_LIMITS.tagline}
          onChange={(event) => update("tagline", trimmed(event.target.value))}
          errorMessage={missing.has("tagline") ? "Add a tagline" : undefined}
        />
        <p className="mt-1.5 pl-1 font-satoshi text-[12px] text-color-secondary-text">
          One line, up to {PROFILE_LIMITS.tagline} characters.
        </p>
      </div>

      {/* The design splits this in two: the pickers on the left, the type
          and the description on the right. */}
      <div className="grid gap-6 tb:grid-cols-2">
        <div className="flex flex-col gap-6">
          <ChipPicker
            label="Cuisines"
            options={taxonomy?.cuisines ?? []}
            value={draft.cuisines}
            onChange={(next) => update("cuisines", next)}
            emptyHint={missing.has("cuisines") ? "Pick at least one." : undefined}
          />

          <ChipPicker
            label="Vibe"
            options={taxonomy?.vibes ?? []}
            value={draft.vibes}
            onChange={(next) => update("vibes", next)}
            max={PROFILE_LIMITS.vibes}
          />

          <ChipPicker
            label="Perfect for"
            options={taxonomy?.perfectFor ?? []}
            value={draft.perfectFor}
            onChange={(next) => update("perfectFor", next)}
            max={PROFILE_LIMITS.perfectFor}
          />

          <ChipPicker
            label="Moments"
            options={taxonomy?.moments ?? []}
            value={draft.moments}
            onChange={(next) => update("moments", next)}
            max={PROFILE_LIMITS.moments}
            emptyHint="Brunch, late night, and so on."
          />
        </div>

        <div className="flex flex-col gap-6">
          {/*
          Establishment type is one value, not a list — the contract is explicit.
          `single` gives the picker radio behaviour while keeping the chip row the
          design draws.
        */}
          <ChipPicker
            label="Establishment type"
            options={taxonomy?.establishmentTypes ?? []}
            value={draft.establishmentType ? [draft.establishmentType] : []}
            onChange={(next) => update("establishmentType", next[0] ?? null)}
            single
          />

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label
                htmlFor="profile-description"
                className="font-satoshi text-[13px] font-medium text-color-primary-text"
              >
                About your restaurant
              </label>
              <span
                className={cn(
                  "font-satoshi text-[12px] tabular-nums",
                  remaining < 40 ? "text-color-danger" : "text-color-secondary-text",
                )}
              >
                {description.length} / {PROFILE_LIMITS.description}
              </span>
            </div>

            <textarea
              id="profile-description"
              rows={6}
              value={description}
              maxLength={PROFILE_LIMITS.description}
              onChange={(event) => update("description", trimmed(event.target.value))}
              placeholder="What should a guest know before they book?"
              className={cn(
                "mt-2 w-full resize-y rounded-[12px] border px-4 py-3",
                "font-satoshi text-[14px] leading-[160%] text-color-primary-text outline-none transition-colors",
                missing.has("description")
                  ? "border-color-danger"
                  : "border-color-border focus:border-[color:var(--color-field-focus)]",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
