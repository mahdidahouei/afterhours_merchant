import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft } from "iconsax-reactjs";
import { errorMessage, isProblem, ProblemError } from "@/lib/errors";
import { Accordion } from "@/ui/Accordion";
import { Button } from "@/ui/Button";
import { usePatchPlace, useSaveProfile, useTaxonomy } from "../../api/queries";
import { useLeaveGuard, type LeaveGuardRef } from "../../session/leaveGuard";
import { write, type Claim } from "../../api/types";
import { StageHeading, StagePanel } from "../../components/ClaimLayout";
import { ContactSection } from "./ContactSection";
import { MenusSection, type Language } from "./MenusSection";
import { StorySection } from "./StorySection";
import { profileStrength, sectionOfField, useProfileDraft } from "./useProfileDraft";

type Props = {
  claim: Claim;
  onBack: () => void;
  onContinue: () => void;
  /** Save the draft if the journey rail navigates away from this screen. */
  leaveGuard: LeaveGuardRef;
  /** PENDING_API state, owned by the page so it survives stage switches. */
  languages: Record<string, Language>;
  onLanguageChange: (key: string, language: Language) => void;
  primaryPlatform: string | null;
  onPrimaryPlatformChange: (value: string | null) => void;
};

const SECTIONS = ["Your story", "Contact & reservations", "Your menus"] as const;

/**
 * The beat between one section finishing its collapse and the next opening.
 *
 * The design waits 500ms from the moment the open section is told to close,
 * against a 480ms collapse — so 20ms of stillness at the end, not none. Sitting
 * on the collapse's own completion rather than on a duration written down twice,
 * that 20ms is what's left to wait.
 */
const HANDOVER_MS = 20;

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
  onBack,
  onContinue,
  leaveGuard,
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

  /**
   * One section at a time, and the first one is already open.
   *
   * Opening another is two moves rather than one: the current section collapses,
   * and only once that animation has finished does the next expand. Doing both
   * at once slides everything below the fold up and back down again, and the
   * owner loses their place. `queuedSection` is what's waiting for that.
   */
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [queuedSection, setQueuedSection] = useState<number | null>(null);

  /**
   * The section the primary button acts on.
   *
   * It trails `openSection` but never goes back to nothing, so collapsing
   * everything by hand doesn't leave the button without a target — it still
   * offers the section after the last one they were reading.
   */
  const [focusedSection, setFocusedSection] = useState(0);
  const isLastSection = focusedSection === SECTIONS.length - 1;

  /** Toggle a section shut, or close whatever is open and queue this one. */
  const requestSection = (next: number) => {
    if (openSection === next) {
      setQueuedSection(null);
      setOpenSection(null);
      return;
    }

    setFocusedSection(next);

    if (openSection === null) {
      setOpenSection(next);
      return;
    }

    setQueuedSection(next);
    setOpenSection(null);
  };

  /** The accordion reports its own collapse, so no duration is duplicated here. */
  const handover = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(handover.current), []);

  const openQueuedSection = () => {
    if (queuedSection === null) return;
    handover.current = window.setTimeout(() => {
      setOpenSection(queuedSection);
      setQueuedSection(null);
    }, HANDOVER_MS);
  };

  /** Walk down the sections; only the last one leaves the screen. */
  const primaryAction = () => {
    if (isLastSection) {
      void saveAndContinue();
      return;
    }
    requestSection(focusedSection + 1);
  };

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
        .mutateAsync({ phone: write(phone.trim()) })
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

  /**
   * Leaving with edits in hand saves them first.
   *
   * The draft lives in this component, so walking away without saving would
   * silently drop it — and the owner's mental model is that everything saves as
   * it goes, which is what the rail promises.
   */
  const leaveTo = async (go: () => void) => {
    if (await commit()) go();
  };

  /** True when it is safe to leave: nothing to save, or the save worked. */
  const commit = async () => (isDirty || phoneChanged ? save() : true);

  // The rail can leave this screen without touching its own buttons.
  useLeaveGuard(leaveGuard, commit);

  return (
    <StagePanel>
      <StageHeading title="Here's what we found.">
        We built this from your website. Read it over, fix anything we got wrong — nothing
        is saved until you say so.
      </StageHeading>

      {claim.reviewNote && (
        <div
          role="alert"
          className="mb-5 rounded-[14px] border border-color-warning/40 bg-color-warning/[0.08] p-4"
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
            onToggle={() => requestSection(index)}
            onCollapsed={openQueuedSection}
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

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void leaveTo(onBack)}
              disabled={isSaving}
              className="inline-flex shrink-0 items-center gap-1.5 font-satoshi text-[13px] font-medium text-color-secondary-text transition-colors hover:text-color-primary disabled:opacity-60"
            >
              <ArrowLeft size={16} /> Back
            </button>

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
              onClick={primaryAction}
              className="h-[46px] rounded-full px-6 text-[13px] font-medium max-tb:flex-1"
            >
              {/*
                The label swaps when the last section is reached. `mode="wait"`
                so the width changes while both are invisible, making it read as
                a fade rather than a jump.
              */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isLastSection ? "finish" : "next"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {isLastSection ? "Looks good — add photos" : "Looks good"}
                </motion.span>
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </div>
    </StagePanel>
  );
}
