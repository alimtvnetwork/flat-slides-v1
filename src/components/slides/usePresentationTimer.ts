import { useEffect, useRef } from "react";

import { useTimer } from "./timer-store";

/**
 * Single rAF-driven ticker that drives `useTimer.tick`. Mount once at the
 * presentation root. Uses requestAnimationFrame (clamped to ~4 Hz) so the
 * timer keeps moving even in background tabs without burning CPU.
 */
export function usePresentationTimer() {
  const running = useTimer((s) => s.running);
  const tick = useTimer((s) => s.tick);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      lastRef.current = null;
      return;
    }
    let frame = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const step = () => {
      const now = performance.now();
      const last = lastRef.current ?? now;
      const delta = now - last;
      lastRef.current = now;
      if (delta > 0) tick(delta);
      timeout = setTimeout(() => {
        frame = requestAnimationFrame(step);
      }, 250); // 4 Hz is plenty for a MM:SS readout
    };
    frame = requestAnimationFrame(step);
    return () => {
      if (timeout) clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [running, tick]);
}
