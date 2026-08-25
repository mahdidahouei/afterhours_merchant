import { useEffect, useState } from "react";
import styles from "./Ripple.module.scss";

type Wave = { id: number; x: number; y: number; size: number };

const DURATION_MS = 1000;

/**
 * Material-style press feedback. Drop inside any positioned element.
 *
 * Waves clear themselves on a timer keyed to the animation length, so a rapid
 * series of clicks stacks rather than cancelling — which is what makes the
 * press feel responsive.
 */
export function Ripple() {
  const [waves, setWaves] = useState<Wave[]>([]);

  useEffect(() => {
    if (waves.length === 0) return;
    const timer = setTimeout(() => setWaves([]), DURATION_MS * 2);
    return () => clearTimeout(timer);
  }, [waves]);

  const addWave = (event: React.MouseEvent<HTMLSpanElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const size = Math.max(box.width, box.height);
    setWaves((prev) => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 0,
        x: event.clientX - box.left - size,
        y: event.clientY - box.top - size,
        size,
      },
    ]);
  };

  return (
    <span aria-hidden className={styles.host} onMouseDown={addWave}>
      {waves.map((wave) => (
        <span
          key={wave.id}
          className={styles.wave}
          style={{ top: wave.y, left: wave.x, width: wave.size, height: wave.size }}
        />
      ))}
    </span>
  );
}
