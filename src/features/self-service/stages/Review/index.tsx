import { useMemo, useState } from "react";
import { errorMessage, isProblem, ProblemError } from "@/lib/errors";
import { Accordion } from "@/ui/Accordion";
import { Button } from "@/ui/Button";
import { usePatchPlace, useSaveProfile, useTaxonomy } from "../../api/queries";
import type { Claim } from "../../api/types";
import { StageHeading, StagePanel } from "../../components/ClaimLayout";
import { ContactSection } from "./ContactSection";
import { MenusSection, type Language } from "./MenusSection";
import { StorySection } from "./StorySection";
import { profileStrength, sectionOfField, useProfileDraft } from "./useProfileDraft";

type Props = {
  claim: Claim;
  onContinue: () => void;
  /** PENDING_API state, owned by the page so it survives stage switches. */
  languages: Record<string, Language>;
  onLanguageChange: (key: string, language: Language) => void;
  primaryPlatform: string | null;
  onPrimaryPlatformChange: (value: string | null) => void;
};

const SECTIONS = ["Your story", "Contact & reservations", "Your menus"] as const;

/**
 * Read back what the scan found, correct it, and move on to photos.
 *
 * Saving writes to two endpoints, which is a contract requirement rather than a
 * convenience: the profile goes to `PUT /claim/profile` (which replaces
 * outright, so the whole object always goes) while phone is a listing fact and
 * goes to `PATCH /claim/place`.
 */
export function ReviewStage({
  claim,
  onContinue,
  languages,
  onLanguageChange,
  primaryPlatform,
  onPrimaryPlatformChange,
}: Props) {
  const taxonomy = useTaxonomy();
  const saveProfile = useSaveProfile();
  const patchPlace = usePatchPlace();

  const { draft, update, updateSocial, isDirty } = useProfileDraft(claim);
  const [phone, setPhone] = useState(claim.place.phone ?? "");
  const [openSection, setOpenSection] = useState<number | null>(0);

  const phoneChanged = phone.trim() !== (claim.place.phone ?? "");

  /** Missing paths from a rejected submit, grouped by the accordion they live in. */
  const missingBySection = useMemo(() => {
    const groups: [Set<string>, Set<string>, Set<string>] = [
      new Set(),
      new Set(),
      new Set(),
    ];
    const error = saveProfile.error;
    if (error instanceof ProblemError && error.missingFields) {
      for (const path of error.missingFields) groups[sectionOfField(path)].add(path);
    }
    return groups;
  }, [saveProfile.error]);

  const strength = profileStrength(draft, claim.photos.length);
  const isSaving = saveProfile.isPending || patchPlace.isPending;

  const save = async () => {
    saveProfile.reset();
    patchPlace.reset();

    // Listing facts first: if the phone is rejected we haven't already written a
    // profile the owner would then have to re-save.
    if (phoneChanged) {
      const ok = await patchPlace
        .mutateAsync({ phone: phone.trim() || null })
        .then(() => true)
        .catch(() => false);
      if (!ok) return false;
    }

    return saveProfile
      .mutateAsync(draft)
      .then(() => true)
      .catch(() => false);
  };

  const saveAndContinue = async () => {
    if (await save()) onContinue();
  };

  return (
    <StagePanel>
      <StageHeading title="Here's what we found.">
        We built this from your website. Read it over, fix anything we got wrong — nothing
        is saved until you say so.
      </StageHeading>

      {claim.reviewNote && (
        <div
          role="alert"
          className="mb-5 rounded-[14px] border border-color-warning/40 bg-[#EF894114] p-4"
        >
          <p className="font-satoshi text-[13px] font-semibold text-color-primary-text">
            Our team sent this back
          </p>
          <p className="mt-1 font-satoshi text-[13px] leading-[160%] text-color-secondary-text">
            {claim.reviewNote}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {SECTIONS.map((title, index) => (
          <Accordion
            key={title}
            index={index + 1}
            title={title}
            isOpen={openSection === index}
            onToggle={() => setOpenSection(openSection === index ? null : index)}
            hasError={missingBySection[index].size > 0}
          >
            {index === 0 && (
              <StorySection
                draft={draft}
                taxonomy={taxonomy.data}
                update={update}
                missing={missingBySection[0]}
              />
            )}

            {index === 1 && (
              <ContactSection
                draft={draft}
                phone={phone}
                onPhoneChange={setPhone}
                update={update}
                updateSocial={updateSocial}
                primaryPlatform={primaryPlatform}
                onPrimaryPlatformChange={onPrimaryPlatformChange}
                missing={missingBySection[1]}
              />
            )}

            {index === 2 && (
              <MenusSection
                draft={draft}
                update={update}
                languages={languages}
                onLanguageChange={onLanguageChange}
              />
            )}
          </Accordion>
        ))}
      </div>

      {(saveProfile.isError || patchPlace.isError) && (
        <p role="alert" className="mt-4 font-satoshi text-[13px] text-color-danger">
          {isProblem(saveProfile.error, "profile_incomplete")
            ? "A few fields still need filling — they're marked above."
            : errorMessage(saveProfile.error ?? patchPlace.error)}
        </p>
      )}

      {/* Sticky so the primary action is always in reach on a long form. */}
      <div className="sticky bottom-0 -mx-6 mt-6 border-t border-color-border bg-white/95 px-6 pb-1 pt-4 backdrop-blur-sm tb:-mx-8 tb:px-8">
        <div className="flex flex-col gap-3 tb:flex-row tb:items-center tb:justify-between">
          <div>
            <p className="font-satoshi text-[13px] font-semibold text-color-primary-text">
              Profile {strength}% complete
            </p>
            <p className="font-satoshi text-[12px] text-color-secondary-text">
              You can edit everything later, too.
            </p>
          </div>

          <div className="flex gap-2.5">
            {isDirty || phoneChanged ? (
              <Button
                variant="secondary"
                size="responsive"
                isLoading={isSaving}
                onClick={() => void save()}
                className="h-[46px] rounded-full text-[13px] font-normal max-tb:flex-1"
              >
                Save
              </Button>
            ) : null}

            <Button
              variant="primary"
              size="responsive"
              isLoading={isSaving}
              onClick={() => void saveAndContinue()}
              className="h-[46px] rounded-full px-6 text-[13px] font-medium max-tb:flex-1"
            >
              Looks good — add photos
            </Button>
          </div>
        </div>
      </div>
    </StagePanel>
  );
}
