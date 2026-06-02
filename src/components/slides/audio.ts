import { useDeck } from "./store";

let ctx: AudioContext | undefined;

function getCtx(): AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return undefined;
    ctx = new AC();
  }
  return ctx;
}

/**
 * V4 "faded" whoosh — soft downward swoosh, low-pass-shaped tail so it
 * doesn't compete with the speaker's voice. Engineered to ride under the
 * slide transition (~0.5 s) and decay to silence in ~0.9 s total.
 *
 * Voice 1: bandpass-swept white noise (the "movement").
 * Voice 2: parallel low-pass shelf that bleeds in late for the faded tail.
 */
export function playWhoosh(volume: number) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();

  const t0 = ac.currentTime;
  const duration = 0.9;
  const bufferSize = Math.floor(ac.sampleRate * duration);
  const noiseBuf = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const src = ac.createBufferSource();
  src.buffer = noiseBuf;

  // Voice 1 — bandpass sweep (the "swoosh" body).
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.7;
  bp.frequency.setValueAtTime(2400, t0);
  bp.frequency.exponentialRampToValueAtTime(220, t0 + 0.55);

  // Voice 2 — low-pass tail (the "faded" air).
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 0.4;
  lp.frequency.setValueAtTime(900, t0);
  lp.frequency.exponentialRampToValueAtTime(180, t0 + duration);

  // Master gain — soft attack (40 ms), long exponential release.
  const master = ac.createGain();
  const peak = Math.max(0, Math.min(1, volume)) * 0.55; // V4: -5 dB vs V3
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.exponentialRampToValueAtTime(peak, t0 + 0.04);
  master.gain.exponentialRampToValueAtTime(peak * 0.25, t0 + 0.45);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  src.connect(bp).connect(master);
  src.connect(lp).connect(master);
  master.connect(ac.destination);
  src.start(t0);
  src.stop(t0 + duration);
}

/** Throttled whoosh that reads current deck settings. */
let lastAt = 0;
export function triggerWhoosh() {
  const { settings } = useDeck.getState().deck;
  if (!settings.soundEnabled) return;
  const now = Date.now();
  if (now - lastAt < 120) return;
  lastAt = now;
  playWhoosh(settings.volume);
}

/** Short, soft click cue for jump / dot-pagination actions. */
export function playClick(volume: number) {
  if (typeof window === "undefined") return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(440, t + 0.08);
  const gain = ac.createGain();
  const peak = Math.max(0, Math.min(1, volume)) * 0.5;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.12);
}

let lastClickAt = 0;
export function triggerClick() {
  const { settings } = useDeck.getState().deck;
  if (!settings.soundEnabled) return;
  const now = Date.now();
  if (now - lastClickAt < 80) return;
  lastClickAt = now;
  playClick(settings.volume);
}
