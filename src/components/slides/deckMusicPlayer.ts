import { musicVolumePercentToGain } from "@/lib/slides/musicVolume";

import type { DeckMusic } from "./types";

const DEFAULT_LOOP = true;

let audio: HTMLAudioElement | null = null;
let audioUrl: string | null = null;

export function configureDeckMusic(music: DeckMusic | undefined, musicVolume: number): void {
  if (!music?.url) return clearDeckMusic();
  const el = getDeckMusicAudio(music.url);
  el.loop = music.loop ?? DEFAULT_LOOP;
  el.volume = musicVolumePercentToGain(musicVolume);
}

export type PlayResult = { ok: true } | { ok: false; blocked: boolean };

export function setDeckMusicPlaying(isPlaying: boolean): Promise<PlayResult> {
  if (!isPlaying) {
    stopDeckMusic();
    return Promise.resolve({ ok: true });
  }
  return startDeckMusic();
}

export function stopDeckMusic(): void {
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (error) {
    console.warn("Unable to stop deck music", error);
  }
}

export function hasConfiguredDeckMusic(): boolean {
  return Boolean(audioUrl);
}

export function resetDeckMusicPlayerForTest(): void {
  clearDeckMusic();
}

function clearDeckMusic(): void {
  stopDeckMusic();
  audio = null;
  audioUrl = null;
}

function getDeckMusicAudio(url: string): HTMLAudioElement {
  if (!audio) return createDeckMusicAudio(url);
  updateDeckMusicUrl(url);
  return audio;
}

function createDeckMusicAudio(url: string): HTMLAudioElement {
  audio = new Audio(url);
  audio.preload = "auto";
  audioUrl = url;
  return audio;
}

function updateDeckMusicUrl(url: string): void {
  if (audioUrl === url || !audio) return;
  stopDeckMusic();
  audio.src = url;
  audioUrl = url;
}

async function startDeckMusic(): Promise<PlayResult> {
  if (!audio) return { ok: true };
  stopDeckMusic();
  try {
    await audio.play();
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
