import { useEffect } from "react";

import { useAnnotations, INK_COLORS } from "../annotations-store";

interface Props {
  slideId: string;
}

const MODE_LABEL: Record<string, string> = {
  off: "Off",
  pointer: "Laser",
  ink: "Ink",
};

/**
 * Compact annotation status pill — bottom-center.
 * Hidden when mode === "off". Shows mode, active color swatch, and
 * undo/clear actions for the current slide.
 */
export function AnnotationToolbar({ slideId }: Props) {
  const mode = useAnnotations((s) => s.mode);
  const color = useAnnotations((s) => s.color);
  const setColor = useAnnotations((s) => s.setColor);
  const setMode = useAnnotations((s) => s.setMode);
  const undo = useAnnotations((s) => s.undo);
  const clear = useAnnotations((s) => s.clear);
  const hasStrokes = useAnnotations((s) => (s.strokes[slideId]?.length ?? 0) > 0);

  // Cmd/Ctrl+Z undoes the last stroke for the active slide while annotating.
  useEffect(() => {
    if (mode !== "ink") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo(slideId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, slideId, undo]);

  if (mode === "off") return null;

  return (
    <div
      data-print-hide="true"
      className="fixed bottom-16 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-md flex items-center gap-2"
    >
      <span className="font-medium uppercase tracking-wide opacity-80">{MODE_LABEL[mode]}</span>
      <span className="mx-1 h-3 w-px bg-white/20" />
      {INK_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setColor(c)}
          className="h-4 w-4 rounded-full border border-white/40"
          style={{ background: c, outline: c === color ? "2px solid white" : "none", outlineOffset: 1 }}
          aria-label={`Use color ${c}`}
        />
      ))}
      <span className="mx-1 h-3 w-px bg-white/20" />
      <button
        type="button"
        onClick={() => undo(slideId)}
        disabled={!hasStrokes}
        className="rounded px-2 py-0.5 hover:bg-white/10 disabled:opacity-30"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={() => clear(slideId)}
        disabled={!hasStrokes}
        className="rounded px-2 py-0.5 hover:bg-white/10 disabled:opacity-30"
      >
        Clear
      </button>
      <button
        type="button"
        onClick={() => setMode("off")}
        className="ml-1 rounded px-2 py-0.5 hover:bg-white/10"
        title="Esc"
      >
        ✕
      </button>
    </div>
  );
}
