import { useNavigate } from "react-router-dom";
import { Button } from "@/ui/Button";
import { RestaurantPreviewCard } from "../components/RestaurantPreviewCard";
import { WizardBody } from "@/features/wizard";
import type { ConnectedRestaurant } from "../types";

export function SuccessStep({ data }: { data: ConnectedRestaurant | undefined }) {
  const navigate = useNavigate();

  return (
    <WizardBody
      className="max-tb:min-h-screen tb:my-auto lg:flex lg:items-center lg:justify-center lg:!py-[70px] lg:!pl-[92px] lg:!pr-[50px]"
      contentClassName="flex h-full flex-col items-center gap-6 max-tb:min-h-screen max-tb:justify-center tb:flex-row tb:items-center tb:gap-[40px] lg:gap-[60px]"
    >
      {data && (
        <div className="relative h-[330px] w-[300px] shrink-0 max-lg:ml-[50px]">
          <span
            className="absolute -left-[40px] top-[18px] z-10 rounded-[20px] px-[14px] pb-[7px] pt-[5px] font-satoshi text-[13px] font-medium text-color-primary-text"
            style={{
              background:
                "linear-gradient(135deg, #FFFFFF 0%, #EEEEEE 61%, #CACACA 100%)",
              boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)",
            }}
          >
            Newly Joined
          </span>

          {/* The card is rendered at its real 360px width and scaled down, so
              every inner dimension stays proportional to the diner app. */}
          <div className="origin-top-left scale-[0.75]">
            <RestaurantPreviewCard data={data} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 max-tb:items-center max-tb:text-center tb:max-w-[400px] tb:flex-1">
        <h2 className="font-satoshi text-[22px] font-bold text-color-primary-text tb:text-[24px] lg:text-[28px]">
          Your restaurant is <br className="hidden lg:inline" />
          connected to Afterhours!
        </h2>

        <p className="font-satoshi text-[14px] font-light leading-[160%] text-color-secondary-text">
          Your restaurant is now connected to Afterhours.{" "}
          <br className="hidden lg:inline" />
          Reservations from our diner community are free and{" "}
          <br className="hidden lg:inline" />
          managed directly through your own platform. A{" "}
          <span className="font-medium text-color-primary-text">
            confirmation email is on its way
          </span>{" "}
          — you may now close <br className="hidden lg:inline" />
          this tab.
        </p>

        <Button
          variant="primary"
          size="small"
          onClick={() => navigate(-1)}
          className="mt-6 h-[44px] w-[180px] text-xs"
        >
          Close this tab
        </Button>
      </div>
    </WizardBody>
  );
}
