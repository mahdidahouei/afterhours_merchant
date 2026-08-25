import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Sticky-header state, replacing react-headroom.
 *
 * Behaviour matches the old `<Headroom pin pinStart={100}>`: the header sits in
 * normal flow until the page scrolls past `pinStart`, then detaches to the top
 * of the viewport and stays there (the `pin` prop meant direction was ignored).
 *
 * `wrapperRef` must go on an element wrapping `headerRef`; it holds the header's
 * measured height so detaching never collapses the layout underneath.
 */
export function useHeaderPin(pinStart = 100) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [pinned, setPinned] = useState(false);
  const [height, setHeight] = useState(0);

  // Measure before paint so the wrapper never renders at zero height.
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const measure = () => setHeight(el.offsetHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;

    const onScroll = () => {
      if (frame) return; // one layout read per frame
      frame = requestAnimationFrame(() => {
        frame = 0;
        setPinned(window.scrollY > pinStart);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pinStart]);

  return { pinned, height, wrapperRef, headerRef };
}
