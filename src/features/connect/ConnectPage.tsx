import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { useDialog } from "@/app/providers/DialogProvider";
import { ROUTES } from "@/features/landing/content/links";
import connectError from "@/assets/connect/error.png";
import { usePlatformGuide, usePlatforms, useConnectRestaurant } from "./api";
import { WizardCard } from "@/features/wizard";
import { WizardHeader } from "./components/WizardHeader";
import { GuideStep, type GuideCredentials } from "./steps/GuideStep";
import { PlatformStep } from "./steps/PlatformStep";
import { RestaurantStep } from "./steps/RestaurantStep";
import { SuccessStep } from "./steps/SuccessStep";
import {
  guideIndex,
  guideStep,
  isGuideStep,
  previousStep,
  totalSteps,
  type Step,
} from "./steps";
import type { PlatformKey, Restaurant } from "./types";

export default function ConnectPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("restaurants");
  const [restaurantId, setRestaurantId] = useState<string>();
  const [platformId, setPlatformId] = useState<string>();

  const platforms = usePlatforms();
  const guide = usePlatformGuide();
  const connect = useConnectRestaurant();
  const { openDialog, closeDialog } = useDialog();

  useSeededHistory();

  const selectRestaurant = (restaurant: Restaurant) => {
    setRestaurantId(restaurant.id);
    setStep("platform");
  };

  const selectPlatform = async (key: PlatformKey) => {
    const platform = platforms.data?.find((item) => item.name === key);

    // The platform list is what supplies the id; without it there is nothing to
    // fetch a guide for. Say so rather than making the button do nothing.
    if (!platform) {
      openDialog({
        title: "We couldn't load that platform",
        subtitle: platforms.isError
          ? errorMessage(platforms.error)
          : "Please refresh the page and try again.",
        submitText: "Retry",
        onSubmit: () => {
          closeDialog();
          void platforms.refetch();
        },
      });
      return;
    }

    try {
      await guide.mutateAsync(platform.id);
    } catch (error) {
      // Stay on this step; landing on an empty instructions screen would be worse.
      openDialog({
        title: "We couldn't load the setup steps",
        subtitle: errorMessage(error),
        submitText: "Try again",
        cancelText: "Get help",
        onSubmit: () => {
          closeDialog();
          void selectPlatform(key);
        },
        onCancel: () => navigate(ROUTES.contact),
      });
      return;
    }

    setPlatformId(platform.id);
    setStep(guideStep(1));
  };

  const goBack = () => {
    const target = previousStep(step);
    if (target === "exit") navigate(-1);
    else setStep(target);
  };

  const submitConnection = async (credentials: GuideCredentials) => {
    if (!restaurantId || !platformId) return;
    closeDialog();

    try {
      await connect.mutateAsync({ restaurantId, platformId, ...credentials });
      setStep("success");
    } catch (error) {
      openDialog({
        icon: <img src={connectError} alt="" className="h-[100px] w-[100px]" />,
        title: "It looks like you are not connected yet!",
        // The old dialog said only this much, whatever went wrong. Showing the
        // actual reason is the difference between "retry forever" and "your API
        // key is wrong".
        subtitle: errorMessage(error),
        submitText: "Try again",
        cancelText: "Get help",
        // …and the old "Try again" merely closed the dialog. It now retries.
        onSubmit: () => {
          closeDialog();
          void submitConnection(credentials);
        },
        onCancel: () => navigate(ROUTES.contact),
      });
    }
  };

  const header = headerFor(step, guide.data?.name);

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-white 3xl:px-36">
      <div
        aria-hidden
        className="absolute inset-0 opacity-20"
        style={{ background: "linear-gradient(to bottom, #321B15, #EDE5D8)" }}
      />

      <div
        className={cn(
          "flex w-full flex-1 flex-col items-center justify-center gap-8 px-12",
          step === "success" &&
            "max-lg:h-screen max-tb:overflow-y-auto max-tb:overflow-x-hidden",
        )}
      >
        <WizardCard
          className={cn(
            step === "restaurants" && "lg:h-[500px]",
            step === "platform" && "lg:h-[540px] lg:max-h-[540px]",
            step === "success" &&
              "max-lg:h-auto max-lg:min-h-screen max-lg:shadow-none lg:h-auto lg:max-h-none",
          )}
        >
          {step === "success" ? (
            <SuccessStep data={connect.data} />
          ) : (
            <>
              <WizardHeader
                title={header.title}
                position={header.position}
                total={totalSteps(guide.data?.steps.length)}
                onBack={goBack}
              />

              {step === "restaurants" && <RestaurantStep onSelect={selectRestaurant} />}

              {step === "platform" && (
                <PlatformStep
                  onSelect={selectPlatform}
                  isPreparing={guide.isPending}
                  loadError={platforms.isError ? errorMessage(platforms.error) : undefined}
                  onRetryLoad={() => void platforms.refetch()}
                />
              )}

              {isGuideStep(step) && guide.data && (
                <GuideStep
                  guide={guide.data}
                  index={guideIndex(step)}
                  isConnecting={connect.isPending}
                  onAdvance={(next) => setStep(guideStep(next))}
                  onConnect={submitConnection}
                  onBack={goBack}
                />
              )}
            </>
          )}
        </WizardCard>

        {step !== "success" && (
          <p className="text-center font-satoshi text-[14px] font-normal text-color-secondary-text max-lg:hidden">
            by connecting your restaurant you agree with
            <br />
            Afterhours terms and conditions
          </p>
        )}
      </div>
    </main>
  );
}

/** Header copy and progress position for a given step. */
function headerFor(step: Step, platformName: string | undefined) {
  if (step === "platform") return { title: "Select your platform", position: 2 };
  if (isGuideStep(step)) {
    return {
      title: `Follow the steps bellow to connect with ${platformName ?? ""}.`,
      position: guideIndex(step) + 2,
    };
  }
  return { title: "Select your restaurant", position: 1 };
}

/**
 * Opening /connect directly makes it the first entry in the tab's history, so
 * the browser Back button would leave the site entirely. Seeding the landing
 * page underneath gives Back somewhere sensible to go — and is what the
 * wizard's own "exit" transition relies on.
 */
function useSeededHistory() {
  useEffect(() => {
    if ((window.history.state?.idx ?? 0) !== 0) return;

    const here = window.location.pathname + window.location.search;
    window.history.replaceState({ usr: null, key: "landing", idx: 0 }, "", "/");
    window.history.pushState({ usr: null, key: "connect", idx: 1 }, "", here);
  }, []);
}
