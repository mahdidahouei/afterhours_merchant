import { useCallback, useEffect, useRef, useState } from "react";

export type StepIndex = 1 | 2 | 3;

/** Ignore wheel/swipe bursts arriving faster than this after a step change. */
const DEBOUNCE_MS = 600;
/** The section must be this visible before it captures scroll. */
const ACTIVATION_RATIO = 0.5;

/**
 * Turns vertical scrolling into step navigation while the section owns the
 * viewport, and hands scrolling back at the first and last step so the page
 * never traps the user.
 */
export function useStepScroll(sectionRef: React.RefObject<HTMLElement | null>) {
  const [step, setStep] = useState<StepIndex>(1);

  // Event handlers are attached once and read live values through refs;
  // re-binding a non-passive wheel listener on every step change would drop
  // events mid-gesture.
  const activeRef = useRef(false);
  const stepRef = useRef<StepIndex>(1);
  const lastChangeRef = useRef(0);

  stepRef.current = step;

  const goTo = useCallback((next: StepIndex) => {
    const now = Date.now();
    if (now - lastChangeRef.current < DEBOUNCE_MS) return;
    lastChangeRef.current = now;
    setStep(next);
  }, []);

  // Centre the section as soon as it becomes the focus of the viewport.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        activeRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          section.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      },
      { threshold: ACTIVATION_RATIO },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [sectionRef]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    /** True when this gesture should advance a step rather than scroll the page. */
    const shouldCapture = (down: boolean) => {
      if (!activeRef.current) return false;
      const current = stepRef.current;
      return down ? current < 3 : current > 1;
    };

    const onWheel = (event: WheelEvent) => {
      const down = event.deltaY > 0;
      if (!shouldCapture(down)) return;
      event.preventDefault();
      goTo((stepRef.current + (down ? 1 : -1)) as StepIndex);
    };

    let touchStartY = 0;

    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0].clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      const delta = touchStartY - event.touches[0].clientY;
      if (Math.abs(delta) <= 30) return;
      if (shouldCapture(delta > 0)) event.preventDefault();
    };

    const onTouchEnd = (event: TouchEvent) => {
      const delta = touchStartY - event.changedTouches[0].clientY;
      if (Math.abs(delta) <= 50) return;
      const down = delta > 0;
      if (!shouldCapture(down)) return;
      goTo((stepRef.current + (down ? 1 : -1)) as StepIndex);
    };

    // Scoped to the section, not the window, so global scrolling stays intact.
    section.addEventListener("wheel", onWheel, { passive: false });
    section.addEventListener("touchstart", onTouchStart, { passive: true });
    section.addEventListener("touchmove", onTouchMove, { passive: false });
    section.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      section.removeEventListener("wheel", onWheel);
      section.removeEventListener("touchstart", onTouchStart);
      section.removeEventListener("touchmove", onTouchMove);
      section.removeEventListener("touchend", onTouchEnd);
    };
  }, [sectionRef, goTo]);

  return { step, setStep: goTo };
}
