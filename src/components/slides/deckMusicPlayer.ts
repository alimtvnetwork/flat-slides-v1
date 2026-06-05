import type { DeckMusic } from "./types";

const MIN_VOLUME = 0;
const MAX_VOLUME = 1;
const DEFAULT_LOOP = true;

let audio: HTMLAudioElement | null = null;
let audioUrl: string | null = null;

export function configureDeckMusic(music: DeckMusic | undefined, volume: number): void {
  if (!music?.url) return clearDeckMusic();
  const el = getDeckMusicAudio(music.url);
  el.loop = music.loop ?? DEFAULT_LOOP;
  el.volume = clampVolume(volume);
}

export function setDeckMusicPlaying(isPlaying: boolean): void {
  if (!isPlaying) return stopDeckMusic();
  startDeckMusic();
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

function startDeckMusic(): void {
  if (!audio) return;
  stopDeckMusic();
  void audio.play().catch((error) => console.warn("Unable to play deck music", error));
}

function clampVolume(volume: number): number {
  return Math.max(MIN_VOLUME, Math.min(MAX_VOLUME, volume));
}