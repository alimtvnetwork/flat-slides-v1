import { useCallback, useEffect, useRef, useState } from "react";

import type { Slide } from "../types";

/**
 * On-canvas focus-region editor (step 93). Toggled by `F`.
 *
 * Renders an SVG overlay at the 1920×1080 slide-space viewBox. The presenter
 * drags to draw a rectangle; on mouse-up the editor calls back with the
 * rect's slide-space coordinates so a parent inspector can persist it.
 *
 * This component intentionally does NOT mutate deck state directly — that
 * keeps the rectangle authoring pure UI and lets the eventual "save focus
 * region" pipeline live next to the rest of the deck-mutation API.
 */
interface Props {
  slide: Slide;
  active: boolean;
  /** Called with the drawn rectangle in 1920×1080 slide-space. */
  onRect?: (rect: { x: number; y: number; w: number; h: number }) => void;
  /** Remove the most recently added focus region. */
  onPopRegion?: () => void;
  onClose?: () => void;
}

export function FocusEditor({ slide, active, onRect, onPopRegion, onClose }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x: number; y: number } | null>(null);

  const toSlideSpace = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: Math.max(0, Math.min(1920, local.x)), y: Math.max(0, Math.min(1080, local.y)) };
  }, []);

  useEffect(() => {
    if (!active) setDrag(null);
  }, [active]);

  if (!active) return null;

  const existing = slide.focus ?? [];
  const rect = drag && {
    x: Math.min(drag.x0, drag.x),
    y: Math.min(drag.y0, drag.y),
    w: Math.abs(drag.x - drag.x0),
    h: Math.abs(drag.y - drag.y0),
  };

  return (
    <svg
      ref={svgRef}
      data-print-hide
      role="application"
      aria-label="Focus region editor — drag to draw a region"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 z-[70] cursor-crosshair"
      onPointerDown={(e) => {
        (e.target as Element).setPointerCapture?.(e.pointerId);
        const p = toSlideSpace(e);
        setDrag({ x0: p.x, y0: p.y, x: p.x, y: p.y });
      }}
      onPointerMove={(e) => {
        if (!drag) return;
        const p = toSlideSpace(e);
        setDrag({ ...drag, x: p.x, y: p.y });
      }}
      onPointerUp={() => {
        if (rect && rect.w > 12 && rect.h > 12) onRect?.(rect);
        setDrag(null);
      }}
    >
      <rect x={0} y={0} width={1920} height={1080} fill="rgba(0,0,0,0.35)" />
      {existing.map((r, i) => (
        <rect
          key={i}
          x={r.x} y={r.y} width={r.w} height={r.h}
          fill="none" stroke="#22d3ee" strokeWidth={3} strokeDasharray="12 8"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {rect && (
        <rect
          x={rect.x} y={rect.y} width={rect.w} height={rect.h}
          fill="rgba(34,211,238,0.18)" stroke="#22d3ee" strokeWidth={3}
          vectorEffect="non-scaling-stroke"
        />
      )}
      <foreignObject x={24} y={24} width={720} height={56}>
        <div className="flex items-center gap-3 rounded-full bg-black/70 px-4 py-2 text-white">
          <span className="text-[14px] uppercase tracking-[0.2em] text-white/70">Focus editor</span>
          <span className="text-[12px] text-white/60">{existing.length} region{existing.length === 1 ? "" : "s"}</span>
          {existing.length > 0 && onPopRegion && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPopRegion(); }}
              className="rounded-full border border-white/30 px-2 py-0.5 text-[12px] hover:bg-white/10"
            >
              Remove last
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
            className="rounded-full border border-white/30 px-2 py-0.5 text-[12px] hover:bg-white/10"
          >
            Close (F)
          </button>
        </div>
      </foreignObject>
    </svg>
  );
}
