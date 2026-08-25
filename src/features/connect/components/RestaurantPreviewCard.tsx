import cardFallback from "@/assets/connect/card-fallback.webp";
import heart from "@/assets/connect/heart.png";
import star from "@/assets/connect/star.png";
import type { ConnectedRestaurant } from "../types";

/**
 * Price bands as the diner app renders them. The API has shipped several
 * spellings of the same band over time, so all of them map here rather than
 * leaving the card blank on an unexpected value.
 */
const PRICE_LABELS: Record<string, string> = {
  cheap: "€20 or less",
  moderate: "€20 - 40",
  normal: "€20 - 40",
  expensive: "€ 40 - 60",
  "very-expensive": "€60 plus",
  veryExpensive: "€60 plus",
  "very expensive": "€60 plus",
};

/** How the restaurant will appear to diners, shown back as confirmation. */
export function RestaurantPreviewCard({ data }: { data: ConnectedRestaurant }) {
  const photo =
    data.thumbnailPhoto?.sizes?.["512"] ??
    data.thumbnailPhoto?.sizes?.original ??
    cardFallback;

  return (
    <div className="relative flex w-[360px] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0px_8px_30px_rgba(0,0,0,0.06)]">
      <div className="relative h-[325px] w-full">
        <img
          src={photo}
          alt={data.name}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.src = cardFallback;
          }}
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between px-[16px] py-[20px]">
          {data.label ? (
            <span className="rounded-[24px] bg-color-secondary px-[12px] pb-[8px] pt-[6px] font-satoshi text-[16px] font-medium text-color-primary">
              {data.label}
            </span>
          ) : (
            <span />
          )}
          <img src={heart} alt="" className="h-[38px] w-[38px]" />
        </div>
      </div>

      <div className="flex flex-col gap-[2px] px-[16px] py-[16px]">
        <div className="flex items-center justify-between gap-[8px]">
          <p className="min-w-0 truncate font-lora text-[18px] font-semibold text-color-primary-text">
            {data.name}
          </p>
          <div className="flex shrink-0 items-center gap-[5px] pl-[8px]">
            <img src={star} alt="" className="mb-[3px] h-[12.5px] w-[12.5px]" />
            <span className="font-satoshi text-[14px] font-bold text-color-primary-text">
              {data.rating?.toFixed(1) ?? "–"}
            </span>
          </div>
        </div>

        <p className="min-w-0 truncate font-satoshi text-[16px] font-normal text-color-primary-text">
          {[data.neighbourhood, data.cuisinse].filter(Boolean).join(", ")}
        </p>

        <div className="mt-[10px] flex items-center gap-[12px]">
          <span className="rounded-[24px] bg-color-secondary px-[16px] py-[4px] font-satoshi text-[14px] font-medium text-color-primary">
            Reservable
          </span>
          <span className="font-satoshi text-[14px] font-medium text-color-primary-text">
            {PRICE_LABELS[data.priceRange] ?? PRICE_LABELS.normal}
          </span>
        </div>
      </div>
    </div>
  );
}
