import { useEffect, useMemo, useRef, useState } from "react";
import { Map, SearchNormal } from "iconsax-reactjs";
import { useVirtualizer } from "@tanstack/react-virtual";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/ui/Button";
import { ErrorState } from "@/ui/ErrorState";
import { SearchField } from "@/ui/SearchField";
import { Select } from "@/ui/Select";
import { Skeleton } from "@/ui/Skeleton";
import NothingFoundIcon from "@/assets/icons/nothing-found.svg?react";
import ShopIcon from "@/assets/icons/shop.svg?react";
import LocationIcon from "@/assets/icons/location.svg?react";
import { useCities, useRestaurants } from "../api";
import type { Restaurant } from "../types";
import { WizardBody } from "@/features/wizard";

const ROW_HEIGHT = 47;
const ROW_GAP = 12;

type Props = {
  onSelect: (restaurant: Restaurant) => void;
};

export function RestaurantStep({ onSelect }: Props) {
  const cities = useCities();
  const [cityId, setCityId] = useState<string>();
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const restaurants = useRestaurants(cityId);

  // Default to the first city as soon as the list arrives.
  useEffect(() => {
    if (!cityId && cities.data?.length) setCityId(cities.data[0].value);
  }, [cities.data, cityId]);

  const matches = useMemo(() => {
    const all = restaurants.data ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((item) => item.name.toLowerCase().includes(needle));
  }, [restaurants.data, search]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: matches.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT + ROW_GAP,
    overscan: 7,
  });

  // Distinguish "nothing matched your search" from "we couldn't load anything".
  const loadError = cities.isError
    ? errorMessage(cities.error)
    : restaurants.isError
      ? errorMessage(restaurants.error)
      : undefined;

  const retryLoad = () => {
    if (cities.isError) void cities.refetch();
    else void restaurants.refetch();
  };

  const isEmpty = !loadError && restaurants.isSuccess && matches.length === 0;

  return (
    <WizardBody contentClassName="h-full gap-5 overflow-hidden tb:gap-4">
      <div className="flex w-full flex-col gap-4 tb:flex-row tb:gap-3">
        <SearchField
          ref={searchRef}
          size="responsive"
          className="flex-1"
          value={search}
          onChange={setSearch}
          icon={<SearchNormal size={20} color="#262626" />}
          placeholder="Type in your restaurant name here"
        />

        <Select
          size="responsive"
          containerClassName="tb:w-[229px]"
          options={cities.data ?? []}
          value={cityId}
          onChange={(next) => {
            setCityId(next);
            setSearch("");
          }}
          isLoaded={cities.isFetched}
          placeholder="Select City"
          icon={<Map size={20} color="#262626" />}
        />
      </div>

      {loadError && <ErrorState message={loadError} onRetry={retryLoad} />}

      {isEmpty && (
        <NoResults
          onRetry={() => {
            searchRef.current?.select();
            searchRef.current?.focus();
          }}
        />
      )}

      <div className="w-full overflow-auto">
        <div
          ref={scrollRef}
          className="scrollbar-thin flex flex-col gap-6"
          style={{ height: virtualizer.getTotalSize(), position: "relative" }}
        >
          {loadError ? null : restaurants.isLoading && cityId ? (
            <RestaurantListSkeleton />
          ) : (
            virtualizer.getVirtualItems().map(({ index, key, size, start }) => (
              <RestaurantRow
                key={key}
                restaurant={matches[index]}
                style={{ height: size, transform: `translateY(${start}px)` }}
                onSelect={onSelect}
              />
            ))
          )}
        </div>
      </div>
    </WizardBody>
  );
}

function RestaurantRow({
  restaurant,
  style,
  onSelect,
}: {
  restaurant: Restaurant;
  style: React.CSSProperties;
  onSelect: (restaurant: Restaurant) => void;
}) {
  return (
    <div
      style={style}
      className="absolute flex w-full items-center justify-between gap-2 border-b border-color-disabled-text py-3 last:border-none"
    >
      <div className="flex w-full flex-col items-start justify-center gap-1 overflow-hidden">
        <p className="min-w-0 truncate text-sm font-medium">{restaurant.name}</p>
        <p className="min-w-0 truncate text-xs text-color-primary-text">
          {restaurant.address}
        </p>
      </div>

      <Button
        variant="outline-connect"
        size="small"
        disabled={restaurant.connect}
        onClick={() => onSelect(restaurant)}
        className="h-[48px] shrink-0 text-xs font-normal"
      >
        {restaurant.connect ? "Connected" : "This is me"}
      </Button>
    </div>
  );
}

function NoResults({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="my-auto flex flex-col items-center gap-3">
      <NothingFoundIcon className="size-[72px]" />
      <div className="mb-3 max-w-[430px]">
        <p className="mb-3 text-center text-base font-semibold text-color-danger">
          Nothing found here
        </p>
        <p className="text-center text-base font-medium leading-7 text-color-secondary-text">
          We did not find a restaurant with this name. Try check your spelling
        </p>
      </div>
      <Button variant="secondary" onClick={onRetry}>
        Search again
      </Button>
    </div>
  );
}

function RestaurantListSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex w-full items-center justify-between gap-2 py-3">
          <div className="flex flex-col items-start justify-center gap-3">
            <div className="flex items-center gap-2">
              <ShopIcon className="text-color-primary" />
              <Skeleton isLoaded={false} className="h-4 w-44" />
            </div>
            <div className="flex items-center gap-2">
              <LocationIcon className="text-color-primary" />
              <Skeleton isLoaded={false} className="h-4 w-32" />
            </div>
          </div>
          <Skeleton isLoaded={false} className="h-[52px] w-[120px]" />
        </div>
      ))}
    </>
  );
}
