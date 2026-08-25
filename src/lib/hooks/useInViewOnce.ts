import { useEffect, useRef, useState } from "react";

/**
 * True once the element has been at least `amount` visible, and true forever
 * after. Every landing section uses this to fire its entrance animation.
 *
 * This is the one motion behaviour worth owning rather than importing: it is
 * four lines of IntersectionObserver, and keeping it here means sections don't
 * each re-declare the same threshold.
 */
export function useInViewOnce<T extends HTMLElement = HTMLElement>(amount = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: amount },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [amount, inView]);

  return [ref, inView] as const;
}
