import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { useAnnotations, type InkPoint } from "../annotations-store";

interface Props {
  slideId: string;
}

/**
 * Combined laser-pointer + ink layer.
 *
 * Coordinates are projected into slide-space (0..1920 × 0..1080) via a 100%-
 * scaled SVG viewBox so strokes and the laser dot stay aligned with the
 * slide regardless of the host scale (mirrors `ScaledSlide`'s coordinate
 * system).
 *
 * - mode === "off"     → layer is `pointer-events:none`, renders persisted ink
 * - mode === "pointer" → laser dot follows cursor, no drawing
 * - mode === "ink"     → captures pointer to add strokes for this slide
 *
 * `data-print-hide` so the print/export route never includes the laser dot,
 * but strokes (persisted in the SVG) DO export — which is intentional for
 * lecture handouts.
 */
export function AnnotationLayer({ slideId }: Props) {
  const mode = useAnnotations((s) => s.mode);
  const strokes = useAnnotations((s) => s.strokes[slideId] ?? []);
  const color = useAnnotations((s) => s.color);
  const beginStroke = useAnnotations((s) => s.beginStroke);
  const extendStroke = useAnnotations((s) => s.extendStroke);

  const svgRef = useRef<SVGSVGElement>(null);
  const activeStroke = useRef<string | null>(null);
  const [cursor, setCursor] = useState<InkPoint | null>(null);

  // Hide laser when window loses focus.
  useEffect(() => {
    const onBlur = () => setCursor(null);
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  const toSlideSpace = (e: ReactPointerEvent): InkPoint | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((e.clientX - rect.left) / rect.width) * 1920,
      y: ((e.clientY - rect.top) / rect.height) * 1080,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent) => {
    const p = toSlideSpace(e);
    if (!p) return;
    setCursor(p);
    const id = activeStroke.current;
    if (mode === "ink" && id) extendStroke(slideId, id, p);
  };

  const handlePointerDown = (e: ReactPointerEvent) => {
    if (mode !== "ink") return;
    const p = toSlideSpace(e);
    if (!p) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    activeStroke.current = beginStroke(slideId, p);
  };

  const endStroke = () => {
    activeStroke.current = null;
  };

  const isInteractive = mode !== "off";

  return (
    <svg
      ref={svgRef}
      data-print-hide={mode === "pointer" ? "true" : undefined}
      viewBox="0 0 1920 1080"
      preserveAspectRatio="none"
      className="absolute inset-0 z-20"
      style={{
        pointerEvents: isInteractive ? "auto" : "none",
        cursor: mode === "ink" ? "crosshair" : mode === "pointer" ? "none" : "default",
      }}
      onPointerMove={isInteractive ? handlePointerMove : undefined}
      onPointerDown={isInteractive ? handlePointerDown : undefined}
      onPointerUp={endStroke}
      onPointerLeave={() => { setCursor(null); endStroke(); }}
      onPointerCancel={endStroke}
      aria-hidden
    >
      {strokes.map((stroke) => (
        <polyline
          key={stroke.id}
          fill="none"
          stroke={stroke.color}
          strokeWidth={stroke.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          points={stroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
        />
      ))}
      {mode === "pointer" && cursor ? (
        <g>
          <circle cx={cursor.x} cy={cursor.y} r={36} fill={color} opacity={0.18} />
          <circle cx={cursor.x} cy={cursor.y} r={14} fill={color} opacity={0.55} />
          <circle cx={cursor.x} cy={cursor.y} r={6}  fill={color} />
        </g>
      ) : null}
    </svg>
  );
}
