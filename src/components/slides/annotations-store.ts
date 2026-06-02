import { create } from "zustand";

export type AnnotationMode = "off" | "pointer" | "ink";

/** Point in slide-space (0..1920 × 0..1080). */
export interface InkPoint { x: number; y: number }
export interface InkStroke {
  id: string;
  color: string;
  width: number;
  points: InkPoint[];
}

/** Curated swatch palette (1-5 number keys cycle through these). */
export const INK_COLORS = [
  "#ef4444", // red
  "#facc15", // yellow
  "#22d3ee", // cyan
  "#a3e635", // lime
  "#ffffff", // white
] as const;

interface AnnotationsState {
  mode: AnnotationMode;
  color: string;
  width: number;
  /** Strokes keyed by slide id (NOT linear position). Persists across mode flips for the current slide. */
  strokes: Record<string, InkStroke[]>;

  setMode: (mode: AnnotationMode) => void;
  cycleMode: () => void;
  setColor: (color: string) => void;
  setWidth: (width: number) => void;

  beginStroke: (slideId: string, p: InkPoint) => string;
  extendStroke: (slideId: string, strokeId: string, p: InkPoint) => void;
  undo: (slideId: string) => void;
  clear: (slideId: string) => void;
  clearAll: () => void;
}

let strokeCounter = 0;
const nextStrokeId = () => `ink_${Date.now().toString(36)}_${strokeCounter++}`;

export const useAnnotations = create<AnnotationsState>((set) => ({
  mode: "off",
  color: INK_COLORS[0],
  width: 6,
  strokes: {},

  setMode: (mode) => set({ mode }),
  cycleMode: () =>
    set((s) => ({ mode: s.mode === "off" ? "pointer" : s.mode === "pointer" ? "ink" : "off" })),
  setColor: (color) => set({ color }),
  setWidth: (width) => set({ width: Math.max(1, Math.min(40, width)) }),

  beginStroke: (slideId, p) => {
    const id = nextStrokeId();
    set((s) => {
      const list = s.strokes[slideId] ?? [];
      const stroke: InkStroke = { id, color: s.color, width: s.width, points: [p] };
      return { strokes: { ...s.strokes, [slideId]: [...list, stroke] } };
    });
    return id;
  },
  extendStroke: (slideId, strokeId, p) =>
    set((s) => {
      const list = s.strokes[slideId];
      if (!list) return {};
      const updated = list.map((stroke) =>
        stroke.id === strokeId ? { ...stroke, points: [...stroke.points, p] } : stroke,
      );
      return { strokes: { ...s.strokes, [slideId]: updated } };
    }),
  undo: (slideId) =>
    set((s) => {
      const list = s.strokes[slideId];
      if (!list || list.length === 0) return {};
      return { strokes: { ...s.strokes, [slideId]: list.slice(0, -1) } };
    }),
  clear: (slideId) =>
    set((s) => {
      if (!s.strokes[slideId]) return {};
      const next = { ...s.strokes };
      delete next[slideId];
      return { strokes: next };
    }),
  clearAll: () => set({ strokes: {} }),
}));
