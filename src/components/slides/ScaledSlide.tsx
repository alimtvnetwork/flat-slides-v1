import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Props = { children: ReactNode; className?: string };

/**
 * Renders children at a fixed 1920x1080 canvas, scaled to fit the parent.
 * Parent must have a non-zero size and `position: relative` (provided here).
 */
export function ScaledSlide({ children, className }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const recompute = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setScale(Math.min(width / 1920, height / 1080));
    };
    recompute();
    const frame = requestAnimationFrame(recompute);
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    window.addEventListener("resize", recompute);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", recompute);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={stageRef} className={`slide-stage ${className ?? ""}`}>
      <div className="slide-wrapper" style={{ ["--scale" as string]: String(scale) }}>
        {children}
      </div>
    </div>
  );
}
