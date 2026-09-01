import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { seedMockClaim } from "../api/mock";
import { claimKeys } from "../api/queries";
import type { ClaimStatus } from "../api/types";
import { clearToken } from "../session/tokenStore";
import type { DraftedStep } from "../stages";

/**
 * A dev-only jump-to-screen panel.
 *
 * The mock already makes every button succeed, but several screens are
 * expensive to reach on foot — `scan_failed` needs a switch flipped, and
 * submitted / approved / live sit 12–22 seconds behind a submit. This seeds the
 * mock directly into any status so every screen can be looked at in one click.
 *
 * Rendered only when the mock is the active API, so it cannot reach production:
 * `VITE_USE_MOCK` is false there and this whole component is tree-shaken out
 * along with mock.ts.
 */

type Target = {
  label: string;
  /** Undefined means the pre-token screens, which have no claim at all. */
  status?: ClaimStatus;
  draftedStep?: DraftedStep;
  reviewNote?: string;
  /** Seed photos / a connected platform, so resume has something to derive from. */
  photos?: boolean;
  reservation?: boolean;
  hint?: string;
};

const TARGETS: Target[] = [
  { label: "1 · Find", hint: "search “Oli”" },
  { label: "3 · Details", status: "verified" },
  { label: "3 · Scan failed", status: "scan_failed", hint: "error banner" },
  { label: "4 · Building", status: "scanning", hint: "progress" },
  {
    label: "3 · Details (revisit)",
    status: "drafted",
    draftedStep: "details",
    photos: true,
    hint: "back-edit",
  },
  { label: "4 · Build profile", status: "drafted", draftedStep: "review" },
  {
    label: "4 · Sent back",
    status: "drafted",
    draftedStep: "review",
    reviewNote:
      "Could you add a couple of interior photos and expand the description? It reads a little short.",
    hint: "admin note",
  },
  { label: "5 · Photos", status: "drafted", draftedStep: "photos" },
  {
    label: "5 · Photos (filled)",
    status: "drafted",
    draftedStep: "photos",
    photos: true,
    hint: "4 photos",
  },
  {
    label: "6 · Bookings",
    status: "drafted",
    draftedStep: "bookings",
    photos: true,
  },
  {
    label: "6 · Bookings (linked)",
    status: "drafted",
    draftedStep: "bookings",
    photos: true,
    reservation: true,
    hint: "Guestplan",
  },
  { label: "7 · Submitted", status: "submitted" },
  { label: "7 · Approved", status: "approved" },
  { label: "7 · Live", status: "live" },
];

type Props = {
  onJump: (draftedStep: DraftedStep | undefined, hasClaim: boolean) => void;
};

export function DevStageSwitcher({ onJump }: Props) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  const jump = async (target: Target) => {
    setActive(target.label);

    if (!target.status) {
      // Back to the beginning: no token, no claim, no cached anything.
      clearToken();
      queryClient.removeQueries({ queryKey: claimKeys.claim });
      onJump(undefined, false);
      return;
    }

    // Seeding reads the live platform list for the "already connected" state,
    // so this awaits before the screen is asked to render.
    await seedMockClaim(target.status, {
      reviewNote: target.reviewNote,
      photos: target.photos,
      reservation: target.reservation,
    });
    queryClient.removeQueries({ queryKey: claimKeys.claim });
    onJump(target.draftedStep, true);
  };

  return (
    <div className="fixed bottom-4 left-4 z-[300] print:hidden">
      {isOpen && (
        <div className="mb-2 w-[248px] overflow-hidden rounded-[14px] border border-color-border bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
          <p className="border-b border-color-border px-3.5 py-2.5 font-satoshi text-[11px] font-semibold uppercase tracking-[0.12em] text-color-secondary-text">
            Jump to screen
          </p>

          <ul className="max-h-[60vh] overflow-y-auto p-1.5 scrollbar-thin">
            {TARGETS.map((target) => (
              <li key={target.label}>
                <button
                  type="button"
                  onClick={() => void jump(target)}
                  className={cn(
                    "flex w-full items-baseline justify-between gap-2 rounded-[9px] px-2.5 py-2 text-left transition-colors",
                    active === target.label
                      ? "bg-color-secondary text-color-primary"
                      : "text-color-primary-text hover:bg-color-background",
                  )}
                >
                  <span className="font-satoshi text-[13px] font-medium">
                    {target.label}
                  </span>
                  {target.hint && (
                    <span className="shrink-0 font-satoshi text-[11px] text-color-secondary-text">
                      {target.hint}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <p className="border-t border-color-border px-3.5 py-2 font-satoshi text-[11px] leading-[150%] text-color-secondary-text">
            Mock data · dev only. OTP <strong>00000</strong> fails, account ID{" "}
            <strong>0</strong> is rejected; anything else works.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-9 items-center gap-2 rounded-full bg-color-primary px-4 font-satoshi text-[12px] font-semibold text-white shadow-[0_6px_24px_rgba(50,27,21,0.3)]"
      >
        <span aria-hidden className="text-[13px] leading-none">
          {isOpen ? "×" : "⚙"}
        </span>
        Screens
      </button>
    </div>
  );
}
