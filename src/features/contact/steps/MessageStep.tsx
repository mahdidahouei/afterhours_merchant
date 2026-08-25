import type { Control } from "react-hook-form";
import { Category } from "iconsax-reactjs";
import { errorMessage } from "@/lib/errors";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { ControlledSelect } from "@/ui/Select";
import { ControlledTextarea } from "@/ui/Textarea";
import { useTicketSubjects } from "../api";
import type { ContactForm } from "../schema";

export function MessageStep({ control }: { control: Control<ContactForm> }) {
  const isMobile = useIsMobile();
  const subjects = useTicketSubjects();

  return (
    <div className="flex flex-col gap-3 max-tb:w-full">
      <ControlledSelect
        control={control}
        name="subject"
        size={isMobile ? "responsive" : "big"}
        options={subjects.data ?? []}
        isLoaded={subjects.isFetched}
        placeholder="What is the issue"
        icon={<Category size={16} />}
        hideErrorMessage
      />

      {subjects.isError && (
        <p role="alert" className="text-xs text-color-danger">
          {errorMessage(subjects.error)}{" "}
          <button
            type="button"
            onClick={() => void subjects.refetch()}
            className="underline"
          >
            Retry
          </button>
        </p>
      )}
      <ControlledTextarea
        control={control}
        name="content"
        size={isMobile ? "full-width" : "normal"}
        placeholder="Please add your message here"
      />
    </div>
  );
}
