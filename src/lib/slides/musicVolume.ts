export const MIN_MUSIC_VOLUME = 0;
export const MAX_MUSIC_VOLUME = 100;
export const DEFAULT_MUSIC_VOLUME = 40;
export const MUSIC_VOLUME_STEP = 5;

export function musicVolumePercentToGain(volume: number): number {
  const gain = volume / MAX_MUSIC_VOLUME;
  return Math.max(0, Math.min(1, gain));
}