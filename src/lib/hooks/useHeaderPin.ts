import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Sticky-header state, replacing react-headroom.
 *
 * Matches `<Headroom pin pinStart={100}>`, which is subtler than it looks. In
 * Headroom's `shouldUpdate`, the `pin` branch is tested *before* the
 * `currentScrollY <= pinStart` branch, so with `pin` set:
 *
 *   - `pinStart` never takes effect — it is dead configuration;
 *   - the `unfix` action is unreachable, so the header never returns to flow.
 *
 * The header therefore detaches on the first scroll event of any size and stays
 * detached, even back at the very top. That one-way latch is the behaviour to
 * copy: toggling on a scroll threshold instead re-expands the bar every time the
 * page returns to the top, which reads as the header animating on every scroll.
 *
 * `wrapperRef` must go on an element wrapping `headerRef`; it holds the header's
 * measured height so detaching never collapses the layout underneath.
 */
export function useHeaderPin() {
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
    // One scroll is all it takes, and there is no way back — so the listener
    // removes itself rather than re-rendering on every frame for the rest of
    // the page's life.
    const onScroll = () => {
      setPinned(true);
      window.removeEventListener("scroll", onScroll);
    };

    // A reload restoring a scrolled position starts pinned, matching what the
    // owner would have been looking at before.
    if (window.scrollY > 0) {
      setPinned(true);
      return;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { pinned, height, wrapperRef, headerRef };
}
