import { musicVolumePercentToGain } from "@/lib/slides/musicVolume";

import type { DeckMusic } from "./types";

const DEFAULT_LOOP = true;
export const CROSSFADE_MS = 300;
const CROSSFADE_STEPS = 6;
const CROSSFADE_TICK_MS = CROSSFADE_MS / CROSSFADE_STEPS;

interface ActiveTrack {
  audio: HTMLAudioElement;
  url: string;
}

let active: ActiveTrack | null = null;
let fadeTimer: ReturnType<typeof setInterval> | null = null;
let fadingOut: HTMLAudioElement | null = null;
let targetGain = 0;
let isPlaying = false;

export function configureDeckMusic(music: DeckMusic | undefined, musicVolume: number): void {
  targetGain = musicVolumePercentToGain(musicVolume);
  if (!music?.url) return clearDeckMusic();
  const loop = music.loop ?? DEFAULT_LOOP;
  if (!active) return assignActive(createTrack(music.url, loop));
  if (active.url !== music.url) return swapTo(music.url, loop);
  active.audio.loop = loop;
  if (!fadeTimer) active.audio.volume = targetGain;
}

export type PlayResult = { ok: true } | { ok: false; blocked: boolean };

export function setDeckMusicPlaying(playing: boolean): Promise<PlayResult> {
  isPlaying = playing;
  if (!playing) {
    stopDeckMusic();
    return Promise.resolve({ ok: true });
  }
  return startDeckMusic();
}

export function stopDeckMusic(): void {
  cancelFade();
  if (!active) return;
  try {
    active.audio.pause();
    active.audio.currentTime = 0;
  } catch (error) {
    console.warn("Unable to stop deck music", error);
  }
}

export function hasConfiguredDeckMusic(): boolean {
  return active !== null;
}

export function resetDeckMusicPlayerForTest(): void {
  cancelFade();
  pauseSafely(active?.audio ?? null);
  active = null;
  fadingOut = null;
  isPlaying = false;
  targetGain = 0;
}

function clearDeckMusic(): void {
  cancelFade();
  pauseSafely(active?.audio ?? null);
  active = null;
}

function assignActive(track: ActiveTrack): void {
  active = track;
}

function createTrack(url: string, loop: boolean): ActiveTrack {
  const audio = new Audio(url);
  audio.preload = "auto";
  audio.loop = loop;
  audio.volume = targetGain;
  return { audio, url };
}

function swapTo(url: string, loop: boolean): void {
  const prev = active!.audio;
  const next = createTrack(url, loop);
  assignActive(next);
  if (!isPlaying) {
    pauseSafely(prev);
    return;
  }
  next.audio.volume = 0;
  void next.audio.play().catch((error) => console.warn("crossfade play failed", error));
  startCrossfade(prev);
}

function startCrossfade(from: HTMLAudioElement): void {
  cancelFade();
  fadingOut = from;
  let step = 0;
  fadeTimer = setInterval(() => {
    step += 1;
    const ratio = step / CROSSFADE_STEPS;
    from.volume = Math.max(0, targetGain * (1 - ratio));
    if (active) active.audio.volume = Math.min(targetGain, targetGain * ratio);
    if (step >= CROSSFADE_STEPS) finishFade();
  }, CROSSFADE_TICK_MS);
}

function finishFade(): void {
  const from = fadingOut;
  cancelFade();
  pauseSafely(from);
  if (active) active.audio.volume = targetGain;
}

function cancelFade(): void {
  if (fadeTimer) clearInterval(fadeTimer);
  fadeTimer = null;
  fadingOut = null;
}

function pauseSafely(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (error) {
    console.warn("Unable to pause audio", error);
  }
}

async function startDeckMusic(): Promise<PlayResult> {
  if (!active) return { ok: true };
  cancelFade();
  active.audio.pause();
  active.audio.currentTime = 0;
  active.audio.volume = targetGain;
  try {
    await active.audio.play();
    return { ok: true };
  } catch (error) {
    const blocked = isAutoplayBlock(error);
    if (!blocked) console.warn("Unable to play deck music", error);
    return { ok: false, blocked };
  }
}

function isAutoplayBlock(error: unknown): boolean {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return error.name === "NotAllowedError";
  }
  return Boolean(error && (error as { name?: string }).name === "NotAllowedError");
}
