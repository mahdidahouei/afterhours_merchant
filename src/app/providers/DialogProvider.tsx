import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Dialog, type DialogProps } from "@/ui/Dialog";

type DialogOptions = Omit<DialogProps, "isOpen" | "onClose">;

type DialogApi = {
  openDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
};

const DialogContext = createContext<DialogApi | null>(null);

/**
 * One app-level dialog, opened imperatively.
 *
 * Callers that need a confirmation mid-flow (the connect retry prompt) would
 * otherwise each have to own `isOpen` state and render their own instance. This
 * keeps a single mounted dialog and hands out `openDialog`.
 */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<DialogOptions | null>(null);

  const closeDialog = useCallback(() => setOptions(null), []);
  const openDialog = useCallback((next: DialogOptions) => setOptions(next), []);

  const api = useMemo(() => ({ openDialog, closeDialog }), [openDialog, closeDialog]);

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Dialog {...options} isOpen={options !== null} onClose={closeDialog} />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used inside <DialogProvider>");
  return context;
}
