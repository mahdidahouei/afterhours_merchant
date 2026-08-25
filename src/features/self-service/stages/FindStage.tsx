import { useState } from "react";
import { SearchNormal } from "iconsax-reactjs";
import { cn } from "@/lib/cn";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { errorMessage, isProblem } from "@/lib/errors";
import { Button } from "@/ui/Button";
import { ErrorState } from "@/ui/ErrorState";
import { Skeleton } from "@/ui/Skeleton";
import { TextField } from "@/ui/TextField";
import { usePlaceSearch } from "../api/queries";
import type { PlaceCandidate } from "../api/types";
import { StageHeading, StagePanel } from "../components/ClaimLayout";

/** Short enough that the list feels live, long enough not to search per keystroke. */
const SEARCH_DEBOUNCE_MS = 300;

type Props = {
  onSelect: (candidate: PlaceCandidate) => void;
  onRequestListing: (query: string) => void;
};

export function FindStage({ onSelect, onRequestListing }: Props) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const search = usePlaceSearch(debounced);

  const isTyping = query.trim() !== debounced.trim();
  const isSearching = search.isFetching || isTyping;
  const hasQuery = debounced.trim().length >= 2;
  const results = search.data ?? [];

  return (
    <StagePanel>
      <StageHeading title="Claim your restaurant.">
        Find your listing, confirm you're the owner, and take control of your profile. It
        takes about five minutes.
      </StageHeading>

      <TextField
        size="responsive"
        placeholder="Your restaurant's name and city"
        icon={<SearchNormal size={20} color="#262626" />}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        trailing={isSearching && hasQuery ? <Spinner /> : undefined}
        autoFocus
      />

      <div className="mt-6">
        {!hasQuery && (
          <p className="py-8 text-center font-satoshi text-sm text-color-secondary-text">
            Start typing to search the directory.
          </p>
        )}

        {hasQuery && search.isError && (
          <ErrorState error={search.error} onRetry={() => void search.refetch()} />
        )}

        {hasQuery && !search.isError && isSearching && !search.data && <ResultsSkeleton />}

        {hasQuery && !search.isError && !isSearching && results.length === 0 && (
          <NoResults query={debounced} onRequestListing={onRequestListing} />
        )}

        {hasQuery && results.length > 0 && (
          <>
            <p className="mb-3 font-satoshi text-[13px] font-medium text-color-secondary-text">
              {results.length} {results.length === 1 ? "match" : "matches"}
            </p>
            <ul className="flex flex-col gap-2.5">
              {results.map((candidate) => (
                <li key={candidate.placeId}>
                  <ResultCard candidate={candidate} onSelect={onSelect} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </StagePanel>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="block size-4 animate-spin rounded-full border-2 border-color-border border-t-color-primary"
    />
  );
}

/**
 * A search result.
 *
 * Deliberately thin: the contract warns that Google's text search returns no
 * rating, review count, photo or website, so there is nothing to build a richer
 * card around. Rating arrives on `claim.place` after verification.
 */
function ResultCard({
  candidate,
  onSelect,
}: {
  candidate: PlaceCandidate;
  onSelect: (candidate: PlaceCandidate) => void;
}) {
  const isClaimed = candidate.claimability === "claimed";
  const cannotText = candidate.phoneMasked === null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[16px] border p-4 transition-colors tb:flex-row tb:items-center",
        isClaimed
          ? "border-color-border bg-color-background-3"
          : "border-color-border bg-white hover:border-color-primary/40",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-satoshi text-[15px] font-semibold text-color-primary-text">
          {candidate.name}
        </p>
        <p className="mt-0.5 font-satoshi text-[13px] text-color-secondary-text">
          {candidate.address}
        </p>

        <p className="mt-1.5 font-satoshi text-[12px] text-color-secondary-text">
          {candidate.phoneMasked ?? "No phone on this listing"}
        </p>
      </div>

      {isClaimed ? (
        <ClaimedNotice />
      ) : (
        <Button
          variant="outline-connect"
          size="small"
          onClick={() => onSelect(candidate)}
          className="h-[44px] shrink-0 text-xs font-normal max-tb:w-full"
        >
          {cannotText ? "Continue" : "This is my restaurant"}
        </Button>
      )}
    </div>
  );
}

/** `claimability: "claimed"` is a dead end — the contract says point at support. */
function ClaimedNotice() {
  return (
    <div className="shrink-0 text-left tb:text-right">
      <p className="font-satoshi text-[12px] font-medium text-color-primary-text">
        Already claimed
      </p>
      <a
        href="/contact-us"
        className="font-satoshi text-[12px] text-color-secondary-text underline"
      >
        Contact us
      </a>
    </div>
  );
}

function NoResults({
  query,
  onRequestListing,
}: {
  query: string;
  onRequestListing: (query: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="font-satoshi text-[15px] font-semibold text-color-primary-text">
        We couldn't find that one.
      </p>
      <p className="max-w-[42ch] font-satoshi text-sm leading-[160%] text-color-secondary-text">
        Check the spelling, or add your city to narrow it down. If your restaurant isn't
        listed yet, we can add it for you.
      </p>
      <Button
        variant="secondary"
        size="small"
        onClick={() => onRequestListing(query)}
        className="mt-1 h-[44px] text-xs"
      >
        Request a new listing
      </Button>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <ul className="flex flex-col gap-2.5">
      {[0, 1, 2].map((row) => (
        <li key={row} className="rounded-[16px] border border-color-border p-4">
          <Skeleton isLoaded={false} className="h-4 w-1/3" />
          <div className="mt-2">
            <Skeleton isLoaded={false} className="h-3.5 w-2/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Exported so the page can show the right message for a claimed place. */
export const claimBlockedMessage = (error: unknown): string | null =>
  isProblem(error, "place_already_claimed") || isProblem(error, "no_phone_on_listing")
    ? errorMessage(error)
    : null;
