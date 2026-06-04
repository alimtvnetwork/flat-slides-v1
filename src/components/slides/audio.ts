import { useDeck } from "./store";

/**
 * HTMLAudio-based playback with stop-before-play. Each cue keeps a single
 * <audio> reference so rapid retriggers replace the previous tail instead of
 * stacking. Files live in `/public/sounds/` (copied from `assets/sounds/`).
 *
 * Cues:
 *   - whoosh → fade_swoosh_v4.mp3 (slide-to-slide)
 *   - click  → click.mp3           (UI/jump affordance)
 */

type Kind = "whoosh" | "click";

const SOURCES: Record<Kind, string> = {
  whoosh: "/sounds/fade_swoosh_v4.mp3",
  click: "/sounds/click.mp3",
};

const refs: Partial<Record<Kind, HTMLAudioElement>> = {};
const lastAt: Partial<Record<Kind, number>> = {};

function getEl(kind: Kind): HTMLAudioElement | undefined {
  if (typeof window === "undefined") return undefined;
  let el = refs[kind];
  if (!el) {
    el = new Audio(SOURCES[kind]);
    el.preload = "auto";
    refs[kind] = el;
  }
  return el;
}

function play(kind: Kind, volume: number, dedupeMs = 80) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches && kind !== "click") return;
  const now = Date.now();
  if (now - (lastAt[kind] ?? 0) < dedupeMs) return;
  lastAt[kind] = now;
  const el = getEl(kind);
  if (!el) return;
  try {
    el.pause();
    el.currentTime = 0;
    el.volume = Math.max(0, Math.min(1, volume));
    void el.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

/** Slide-to-slide whoosh — uses the locked fade_swoosh_v4 asset. */
export function triggerWhoosh() {
  const { settings } = useDeck.getState().deck;
  if (!settings.soundEnabled) return;
  play("whoosh", Math.min(1, (settings.volume ?? 0.5) * 1.1), 120);
}

/** Soft click for jump / pagination / non-cinematic UI. */
export function triggerClick() {
  const { settings } = useDeck.getState().deck;
  if (!settings.soundEnabled) return;
  play("click", Math.min(1, (settings.volume ?? 0.5) * 0.6), 60);
}

/* Back-compat named exports — older call sites used these. */
export const playWhoosh = (v: number) => play("whoosh", v, 120);
export const playClick = (v: number) => play("click", v, 60);
