import { create } from "zustand";

/**
 * Presentation timer + rehearsal mode.
 *
 * - `elapsed` is the wall-clock running total (ms) since the timer was started.
 * - `slideElapsed[slideId]` accumulates per-slide dwell time (ms) for the
 *   active rehearsal session; cleared by `resetRehearsal`.
 * - Tick is driven externally by `usePresentationTimer` to keep this store
 *   side-effect-free and SSR-safe.
 */
interface TimerState {
  running: boolean;
  rehearsalMode: boolean;
  elapsed: number; // ms — total across the session
  /** Slide id currently being timed (so dwell time accumulates to the right bucket). */
  activeSlideId: string | null;
  /** Per-slide accumulated dwell time (ms) for the current rehearsal. */
  slideElapsed: Record<string, number>;

  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;

  /** Add `deltaMs` to total + active slide (called by the ticker). */
  tick: (deltaMs: number) => void;

  setActiveSlide: (slideId: string) => void;

  toggleRehearsal: () => void;
  resetRehearsal: () => void;
  /** Pure JSON dump of the current rehearsal — used by the export action. */
  exportRehearsal: () => { totalMs: number; perSlide: Record<string, number>; recordedAt: string };
}

export const useTimer = create<TimerState>((set, get) => ({
  running: false,
  rehearsalMode: false,
  elapsed: 0,
  activeSlideId: null,
  slideElapsed: {},

  start: () => set({ running: true }),
  pause: () => set({ running: false }),
  toggle: () => set((s) => ({ running: !s.running })),
  reset: () => set({ elapsed: 0, running: false }),

  tick: (deltaMs) =>
    set((s) => {
      if (!s.running) return {};
      const next: Partial<TimerState> = { elapsed: s.elapsed + deltaMs };
      if (s.rehearsalMode && s.activeSlideId) {
        const prior = s.slideElapsed[s.activeSlideId] ?? 0;
        next.slideElapsed = { ...s.slideElapsed, [s.activeSlideId]: prior + deltaMs };
      }
      return next;
    }),

  setActiveSlide: (slideId) => set({ activeSlideId: slideId }),

  toggleRehearsal: () =>
    set((s) => ({
      rehearsalMode: !s.rehearsalMode,
      // Entering rehearsal auto-resets the per-slide bucket so each take is clean.
      slideElapsed: !s.rehearsalMode ? {} : s.slideElapsed,
      elapsed: !s.rehearsalMode ? 0 : s.elapsed,
      running: !s.rehearsalMode ? true : s.running,
    })),
  resetRehearsal: () => set({ slideElapsed: {}, elapsed: 0 }),
  exportRehearsal: () => {
    const s = get();
    return { totalMs: s.elapsed, perSlide: s.slideElapsed, recordedAt: new Date().toISOString() };
  },
}));

/** Format ms → "MM:SS" or "H:MM:SS" if ≥ 1 hour. */
export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);
  const ss = String(s).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Drift classification for the pacing badge. Compares actual dwell to the
 * slide's authored `budget` (seconds).
 *
 * - "ok"    — within 90% of budget
 * - "warn"  — between 90% and 120%
 * - "over"  — past 120% of budget
 * - "idle"  — no budget set
 */
export type DriftLevel = "idle" | "ok" | "warn" | "over";
export function classifyDrift(actualMs: number, budgetSec?: number): DriftLevel {
  if (!budgetSec || budgetSec <= 0) return "idle";
  const ratio = actualMs / 1000 / budgetSec;
  if (ratio < 0.9) return "ok";
  if (ratio < 1.2) return "warn";
  return "over";
}
