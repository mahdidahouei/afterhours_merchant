import { motion } from "motion/react";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";
import { Link } from "@/ui/Button";
import Instagram from "@/assets/brand/instagram.svg?react";
import Linkedin from "@/assets/brand/linkedin.svg?react";
import { AppLogo } from "./AppLogo";
import { DownloadApp } from "./DownloadApp";
import { EXTERNAL_LINKS, ROUTES } from "../content/links";

const FOOTER_LINKS = [
  { to: ROUTES.contact, label: "Get in touch" },
  { to: ROUTES.terms, label: "Terms of service" },
  { to: ROUTES.privacy, label: "Privacy Policy" },
];

/** Social icons. Rendered twice — the two blocks swap in and out by breakpoint. */
function Socials({ className }: { className?: string }) {
  return (
    <div className={className}>
      <a
        href={EXTERNAL_LINKS.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Afterhours on Instagram"
      >
        <Instagram />
      </a>
      <a
        href={EXTERNAL_LINKS.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Afterhours on LinkedIn"
      >
        <Linkedin />
      </a>
    </div>
  );
}

export function Footer() {
  const [ref, inView] = useInViewOnce<HTMLElement>();

  return (
    <footer ref={ref} className="flex flex-col gap-12 max-tb:px-7 tb:flex-row">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
        transition={{ duration: 0.6 }}
        className="flex-1 space-y-4"
      >
        <AppLogo />
        <p className="text-sm text-color-secondary-text">
          © 2025 Afterhours. All rights reserved.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col justify-between gap-12 max-tb:items-start tb:items-start md:flex-row md:items-center"
      >
        <div className="space-y-4 max-tb:order-2">
          {FOOTER_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              size="responsive"
              className="justify-stretch font-normal normal-case text-color-primary-text max-3xl:text-sm"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="space-y-4 max-tb:order-1">
          <p className="text-sm text-color-secondary-text">Download the diner app</p>
          <DownloadApp />
          <Socials className="hidden items-center gap-6 border-t border-t-[#1d1d1d]/20 pt-4 tb:flex lg:hidden" />
        </div>

        <Socials className="flex items-center gap-6 max-tb:order-3 tb:hidden lg:flex" />
      </motion.div>
    </footer>
  );
}
