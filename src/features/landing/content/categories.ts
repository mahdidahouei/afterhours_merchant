import SeatForTwo from "@/assets/landing/what-we-do/categories/seat-for-two.svg?react";
import Oudegracht from "@/assets/landing/what-we-do/categories/oudegracht.svg?react";
import ProperBreakfast from "@/assets/landing/what-we-do/categories/proper-breakfast.svg?react";
import InsiderSelection from "@/assets/landing/what-we-do/categories/insider-selection.svg?react";
import MatchaAddict from "@/assets/landing/what-we-do/categories/matcha-addict.svg?react";
import HotelDining from "@/assets/landing/what-we-do/categories/hotel-dining.svg?react";
import Ramen from "@/assets/landing/what-we-do/categories/ramen.svg?react";

type SvgIcon = React.FC<React.SVGProps<SVGSVGElement>>;

/** The intent-based collections shown as pills in "What we do". */
export const CATEGORIES: { Icon: SvgIcon; label: string }[] = [
  { Icon: SeatForTwo, label: "Seat for two" },
  { Icon: Oudegracht, label: "Oudegracht" },
  { Icon: ProperBreakfast, label: "Proper Breakfast" },
  { Icon: InsiderSelection, label: "Insider Selection" },
  { Icon: MatchaAddict, label: "Matcha Addict" },
  { Icon: HotelDining, label: "Hotel Dining" },
  { Icon: Ramen, label: "The Ramen" },
];
