import { useNavigate } from "react-router-dom";
import { Button } from "@/ui/Button";
import TimerLogo from "@/assets/icons/timer-logo.svg?react";

export function SubmittedStep() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center gap-[18px] py-14">
      <TimerLogo />

      <div className="flex flex-col items-center">
        <h1 className="text-lg font-medium text-color-primary-text">
          Review In Progress
        </h1>
        <p className="w-full text-center text-base font-light">
          Thank you for submitting the request, we will get <br /> back to you within 24
          hours.
        </p>
      </div>

      <Button
        variant="secondary"
        size="small"
        onClick={() => navigate(-1)}
        className="mt-3 rounded-[34px]"
      >
        Close
      </Button>
    </div>
  );
}
