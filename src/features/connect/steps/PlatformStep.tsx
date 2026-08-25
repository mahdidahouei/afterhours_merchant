import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SearchNormal } from "iconsax-reactjs";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/Button";
import { ErrorState } from "@/ui/ErrorState";
import { SearchField } from "@/ui/SearchField";
import { ROUTES } from "@/features/landing/content/links";
import type { PlatformKey } from "../types";
import { WizardBody } from "@/features/wizard";

/**
 * The three integrations, in the order they're presented.
 *
 * These are hard-coded rather than driven by /reservation-platforms because the
 * labels are brand names with specific casing ("GoTable", not "gotable") and the
 * order is a product decision. The API response is still what supplies each
 * platform's id when one is picked.
 */
const PLATFORMS: { key: PlatformKey; label: string }[] = [
  { key: "formitable", label: "Formitable" },
  { key: "guestplan", label: "Guestplan" },
  { key: "gotable", label: "GoTable" },
];

type Props = {
  onSelect: (key: PlatformKey) => void;
  /** A guide is being fetched — disable the buttons and show which one. */
  isPreparing: boolean;
  /** Set when the platform list itself failed to load. */
  loadError?: string;
  onRetryLoad: () => void;
};

export function PlatformStep({ onSelect, isPreparing, loadError, onRetryLoad }: Props) {
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<PlatformKey>();

  const matches = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return PLATFORMS;
    return PLATFORMS.filter((platform) =>
      platform.label.toLowerCase().includes(needle),
    );
  }, [search]);

  return (
    <WizardBody contentClassName="h-full gap-5 overflow-hidden tb:gap-4">
      <div className="flex w-full flex-col gap-4 tb:flex-row tb:gap-3">
        <SearchField
          size="responsive"
          className="flex-1"
          value={search}
          onChange={setSearch}
          icon={<SearchNormal size={20} color="#262626" />}
          placeholder="Find your reservation platform"
        />
      </div>

      {loadError && <ErrorState message={loadError} onRetry={onRetryLoad} />}

      <div className="flex w-full flex-col">
        {matches.map((platform, index) => (
          <div
            key={platform.key}
            className={cn(
              "flex items-center justify-between gap-[12px] py-[12px]",
              index < matches.length - 1 && "border-b border-[#E8E8E8]",
            )}
          >
            <span className="font-satoshi text-sm font-medium text-color-primary-text lg:text-base">
              {platform.label}
            </span>
            <Button
              variant="outline-connect"
              size="small"
              isLoading={isPreparing && chosen === platform.key}
              disabled={isPreparing}
              onClick={() => {
                setChosen(platform.key);
                onSelect(platform.key);
              }}
              className="h-[48px] w-[120px] text-xs font-normal"
            >
              Connect
            </Button>
          </div>
        ))}

        {matches.length === 0 && (
          <p className="py-8 text-center text-sm text-color-secondary-text">
            No platforms found.
          </p>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center">
        <p className="text-center font-satoshi text-[14px] font-medium text-color-secondary-text">
          Platform not listed? Request it
          <Link to={ROUTES.contact} className="text-[#5F413A] underline">
            here
          </Link>
          .
        </p>
      </div>
    </WizardBody>
  );
}
