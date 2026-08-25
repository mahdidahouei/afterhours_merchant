import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/Button";
import InfoIcon from "@/assets/icons/info.svg?react";

export type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  isLoading?: boolean;
  submitText?: React.ReactNode;
  cancelText?: React.ReactNode;
  onSubmit?: () => void;
  /** Omit to render a single-button dialog. */
  onCancel?: () => void;
  className?: string;
};

/**
 * Centred confirm/alert dialog. Rendered into #overlay so it escapes the
 * transformed, overflow-hidden containers the wizard sits inside.
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  subtitle,
  icon = <InfoIcon />,
  isLoading,
  submitText = "okey",
  cancelText = "close",
  onSubmit,
  onCancel,
  className,
}: DialogProps) {
  // Lock the page behind the dialog, and let Escape dismiss it.
  useEffect(() => {
    if (!isOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  const host = document.getElementById("overlay");
  if (!host) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2"
        >
          <motion.div
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "flex w-96 flex-col items-center gap-3 rounded-3xl bg-color-light p-7",
              className,
            )}
          >
            <div className="grid place-content-center rounded-full bg-color-background text-[64px] text-color-primary-text [&_svg]:size-20">
              {icon}
            </div>

            {title && (
              <div className="text-center text-[20px] font-medium text-color-primary-text">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="px-4 text-center text-base text-color-secondary-text">
                {subtitle}
              </div>
            )}

            <div className="mt-3 flex w-full flex-col-reverse gap-2 md:flex-row">
              {onCancel && (
                <Button
                  type="button"
                  variant="secondary"
                  size="responsive"
                  className="flex-1"
                  onClick={() => {
                    onClose();
                    onCancel();
                  }}
                >
                  {cancelText}
                </Button>
              )}

              <Button
                type="button"
                variant="primary"
                size="responsive"
                isLoading={isLoading}
                onClick={onSubmit}
                className={cn(
                  "flex-1",
                  !onCancel && "ml-auto w-40",
                  isLoading && "pointer-events-none",
                )}
              >
                {submitText}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    host,
  );
}
