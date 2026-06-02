import { useEffect, useRef } from "react";

import { useChrome } from "./chrome-store";
import { useDeck } from "./store";

/**
 * Plays the deck-level background music track (if any) while
 * `music.playing` is true in chrome state. Presenter-local — the URL is
 * exported in the deck JSON but the playback state is never serialized.
 */
export function useDeckMusic() {
  const music = useDeck((s) => s.deck.music);
  const playing = useChrome((s) => s.music.playing);
  const volume = useChrome((s) => s.music.volume);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!music?.url) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }
    if (!audioRef.current) {
      const el = new Audio(music.url);
      el.loop = music.loop ?? true;
      el.volume = Math.max(0, Math.min(1, volume));
      audioRef.current = el;
    } else {
      if (audioRef.current.src !== music.url) audioRef.current.src = music.url;
      audioRef.current.loop = music.loop ?? true;
    }
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [music?.url, music?.loop, volume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = Math.max(0, Math.min(1, volume));
  }, [volume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) void el.play().catch(() => {});
    else el.pause();
  }, [playing]);

  return { hasTrack: Boolean(music?.url), playing };
}
