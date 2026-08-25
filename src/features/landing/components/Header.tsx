import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { HamburgerMenu } from "iconsax-reactjs";
import { cn } from "@/lib/cn";
import { useHeaderPin } from "@/lib/hooks/useHeaderPin";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger,
} from "@/ui/Drawer";
import { AppLogo } from "./AppLogo";
import { ConnectButton } from "./ConnectButton";
import { DownloadApp } from "./DownloadApp";
import { EXTERNAL_LINKS, ROUTES } from "../content/links";

const CTA_TEXT = "Start Getting Reservations";

export function Header() {
  // Transparent and roomy at rest; a compact frosted bar once scrolled.
  const { pinned, height, wrapperRef, headerRef } = useHeaderPin(100);

  return (
    <div ref={wrapperRef} style={{ height: height || undefined, zIndex: 20 }}>
      <motion.header
        ref={headerRef}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn(
          "flex w-full items-center justify-between bg-transparent transition-[background-color,padding]",
          pinned
            ? "fixed inset-x-0 top-0 z-20 bg-white/25 px-8 py-5 backdrop-blur-[6px]"
            : "relative pt-10 max-tb:px-7",
        )}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AppLogo />
        </motion.div>

        <DesktopNav />

        <Drawer direction="right">
          <DrawerTrigger className="md:hidden" aria-label="Open menu">
            <HamburgerMenu size="32" className="text-color-primary-text" />
          </DrawerTrigger>

          <DrawerContent className="max-w-full overflow-y-auto overflow-x-hidden">
            <DrawerHeader className="items-center gap-4 py-10">
              <AppLogo className="mb-4" />
              <ConnectButton
                text={CTA_TEXT}
                hideIcon
                className="w-[calc(100%-2rem)]"
              />
            </DrawerHeader>

            <DrawerFooter className="items-center gap-3">
              <Link
                to={ROUTES.claim}
                className="flex w-[calc(100%-2rem)] items-center justify-center rounded-[26px] border border-[#dfdfdf] px-7 py-4 text-xs font-normal text-color-primary-text transition-all hover:border-color-primary hover:bg-color-primary hover:text-white"
              >
                Claim your restaurant
              </Link>

              <Link
                to={ROUTES.contact}
                className="flex w-[calc(100%-2rem)] items-center justify-center rounded-[26px] border border-[#dfdfdf] px-7 py-4 text-xs font-normal text-color-primary-text transition-all hover:border-color-primary hover:bg-color-primary hover:text-white"
              >
                Talk to us
              </Link>

              <p className="mt-2">Foodie? Download the app</p>
              <DownloadApp />
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </motion.header>
    </div>
  );
}

function DesktopNav() {
  return (
    <motion.nav
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      // The gap tightens below lg so the fourth action fits on one line at the
      // tablet widths, where there is no drawer to fall back to.
      className="hidden items-center gap-4 md:flex lg:gap-6"
    >
      <a
        href={EXTERNAL_LINKS.appStore}
        target="_blank"
        rel="noopener noreferrer"
        className="whitespace-nowrap font-satoshi text-[14px] font-medium text-[#262626] transition-opacity hover:opacity-70"
      >
        Explore the app
      </a>

      <Link
        to={ROUTES.contact}
        className="whitespace-nowrap font-satoshi text-[14px] font-medium text-[#262626]"
      >
        Partnership Inquiries
      </Link>

      <Link
        to={ROUTES.claim}
        className="whitespace-nowrap font-satoshi text-[14px] font-medium text-[#262626] transition-opacity hover:opacity-70"
      >
        Claim your restaurant
      </Link>

      <ConnectButton
        text={CTA_TEXT}
        hideIcon
        className="h-[40px] w-auto rounded-full px-5 font-satoshi text-[13px] font-medium"
      />
    </motion.nav>
  );
}
