import { useSyncExternalStore } from "react";

/**
 * Subscribe to a CSS media query.
 *
 * Replaces @mantine/hooks — that package was pulled in for this one hook.
 * useSyncExternalStore keeps the value correct through concurrent renders
 * without the mount-flash a useState/useEffect version has.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false, // server / prerender: assume desktop
  );
}

/**
 * Breakpoints used for behaviour (which control renders), as distinct from the
 * Tailwind breakpoints used for styling.
 *
 * These bounds are inclusive — `max-width: 768px` matches at exactly 768px,
 * where Tailwind's `tb:` (min-width 768px) has already taken effect. That
 * overlap is intentional: it is what the shipped app does, and several controls
 * are sized against it at exactly 768px and 1024px.
 */
export const useIsMobile = () => useMediaQuery("(max-width: 768px)");
export const useIsBelowDesktop = () => useMediaQuery("(max-width: 1024px)");
export const useIsSmallMobile = () => useMediaQuery("(max-width: 460px)");
