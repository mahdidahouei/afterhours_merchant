import { assetUrl } from "@/lib/assetUrl";
import tag01 from "@/assets/landing/hero/tags/tag-01.svg";
import tag02 from "@/assets/landing/hero/tags/tag-02.svg";
import tag03 from "@/assets/landing/hero/tags/tag-03.svg";
import tag04 from "@/assets/landing/hero/tags/tag-04.svg";
import tag05 from "@/assets/landing/hero/tags/tag-05.svg";
import tag06 from "@/assets/landing/hero/tags/tag-06.svg";
import tag07 from "@/assets/landing/hero/tags/tag-07.svg";
import tag08 from "@/assets/landing/hero/tags/tag-08.svg";
import tag09 from "@/assets/landing/hero/tags/tag-09.svg";
import tag10 from "@/assets/landing/hero/tags/tag-10.svg";

export type HeroVideo = {
  /** Clip in /public/media/hero. Its poster is the same name with .webp. */
  src: string;
  poster: string;
  tag: string;
  icon: string;
};

const clip = (n: string, tag: string, icon: string): HeroVideo => ({
  src: assetUrl(`media/hero/${n}.mp4`),
  poster: assetUrl(`media/hero/${n}.webp`),
  tag,
  icon,
});

export const HERO_VIDEOS: HeroVideo[] = [
  clip("01", "Proper Breakfast", tag01),
  clip("02", "A Seat for Two", tag02),
  clip("03", "Special Occasions", tag03),
  clip("04", "Matcha Addict", tag04),
  clip("05", "Al Dente", tag05),
  clip("06", "Room for Dessert", tag06),
  clip("07", "Sushi House", tag07),
  clip("08", "Specialty Coffee", tag08),
  clip("09", "Chef Approved", tag09),
  clip("10", "Private Conversations", tag10),
];
