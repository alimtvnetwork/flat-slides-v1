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
 * Synthesize a short downward "whoosh" using filtered noise — avoids
 * shipping a binary asset and works offline.
 */
export function playWhoosh(volume: number) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();

  const duration = 0.55;
  const bufferSize = Math.floor(ac.sampleRate * duration);
  const noiseBuf = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const src = ac.createBufferSource();
  src.buffer = noiseBuf;

  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 0.9;
  filter.frequency.setValueAtTime(2200, ac.currentTime);
  filter.frequency.exponentialRampToValueAtTime(280, ac.currentTime + duration);

  const gain = ac.createGain();
  const peak = Math.max(0, Math.min(1, volume));
  gain.gain.setValueAtTime(0.0001, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(peak, ac.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);

  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
  src.stop(ac.currentTime + duration);
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
