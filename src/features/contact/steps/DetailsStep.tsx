import type { Control } from "react-hook-form";
import { ControlledTextField } from "@/ui/TextField";
import { ControlledSelect } from "@/ui/Select";
import ProfileIcon from "@/assets/icons/profile.svg?react";
import SmallShopIcon from "@/assets/icons/small-shop.svg?react";
import SmallMapIcon from "@/assets/icons/small-map.svg?react";
import SmsIcon from "@/assets/icons/sms.svg?react";
import CallIcon from "@/assets/icons/call.svg?react";
import { useCountryCodes } from "../api";
import type { ContactForm } from "../schema";

export function DetailsStep({ control }: { control: Control<ContactForm> }) {
  const countryCodes = useCountryCodes();

  return (
    <div className="flex flex-col gap-3 max-tb:w-full">
      <div className="flex flex-col gap-3 tb:flex-row">
        <ControlledTextField
          control={control}
          name="fullName"
          placeholder="Full name"
          icon={<ProfileIcon />}
          size="responsive"
          hideErrorMessage
        />
        <ControlledTextField
          control={control}
          name="restaurantName"
          placeholder="Restaurant name"
          icon={<SmallShopIcon />}
          size="responsive"
          hideErrorMessage
        />
      </div>

      <div className="flex flex-col items-stretch gap-3 tb:flex-row">
        <ControlledTextField
          control={control}
          name="restaurantAddress"
          placeholder="Restaurant address"
          icon={<SmallMapIcon />}
          size="responsive"
          hideErrorMessage
        />
        <ControlledTextField
          control={control}
          name="contactEmail"
          placeholder="Contact email"
          icon={<SmsIcon />}
          size="responsive"
          hideErrorMessage
        />
      </div>

      {/* If the country list fails, the query's fallback keeps +31 selectable, so
          there is nothing for the user to act on and no message is shown. The
          failure is still reported centrally by the query cache. */}
      <div className="flex w-full gap-2">
        <ControlledSelect
          control={control}
          name="countryCode"
          defaultValue="+31"
          options={countryCodes.data ?? []}
          isLoaded={countryCodes.isFetched}
          placeholder="Code"
          size="square"
          className="w-[81px] shrink-0"
          isSearchable
          hideErrorMessage
        />
        <ControlledTextField
          control={control}
          name="contactNumber"
          placeholder="Phone number"
          icon={<CallIcon />}
          size="responsive"
          containerClassName="flex-1"
          hideErrorMessage
        />
      </div>
    </div>
  );
}
