import { useEffect, useState } from "react";

/**
 * SSR-safe `prefers-reduced-motion` listener. Components that animate
 * (SlideTransition, CameraStage, AnnotationLayer fade-ins) should call this
 * and skip non-essential motion when it returns `true`.
 *
 * Returns `false` during SSR/first paint to avoid hydration mismatches —
 * the real value is picked up in an effect on the client.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
