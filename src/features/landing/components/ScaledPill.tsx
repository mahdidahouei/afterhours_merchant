import { useLayoutEffect, useRef, useState } from "react";
import { Pill } from "./Pill";

/**
 * A pill that shrinks rather than wraps.
 *
 * Equivalent to Flutter's `BoxFit.scaleDown`: the text stays on one line and is
 * scaled down only when its natural width exceeds the container. Wrapping would
 * change the card's height and push the step visual out of alignment.
 */
export function ScaledPill({ children }: { children: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const pill = pillRef.current;
    if (!wrapper || !pill) return;

    const update = () => {
      const natural = pill.scrollWidth;
      const available = wrapper.clientWidth;
      if (!natural || !available) return;
      setScale(natural > available ? available / natural : 1);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div
      ref={wrapperRef}
      className="flex w-full justify-center overflow-hidden lg:justify-start"
    >
      <Pill ref={pillRef} style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
        {children}
      </Pill>
    </div>
  );
}
