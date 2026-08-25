import { Drawer as Vaul } from "vaul";
import { cn } from "@/lib/cn";

/**
 * Thin styling layer over vaul. Only the pieces the mobile nav uses are
 * exported — the original wrapper shipped ten components for a menu that needs
 * five.
 */

export const Drawer = Vaul.Root;
export const DrawerTrigger = Vaul.Trigger;
export const DrawerClose = Vaul.Close;

export function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Vaul.Content>) {
  return (
    <Vaul.Portal>
      <Vaul.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <Vaul.Content
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-auto w-3/4 flex-col border-l bg-white sm:max-w-sm",
          className,
        )}
        {...props}
      >
        {/* vaul requires a title for the dialog's accessible name. */}
        <Vaul.Title className="sr-only">Menu</Vaul.Title>
        {children}
      </Vaul.Content>
    </Vaul.Portal>
  );
}

export function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-0.5 p-4", className)} {...props} />;
}

export function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />;
}
