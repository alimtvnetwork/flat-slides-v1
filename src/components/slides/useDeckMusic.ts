import { useEffect } from "react";

import { useChrome } from "./chrome-store";
import { armAutoplayRetry } from "./deckMusicAutoplayRecovery";
import { configureDeckMusic, setDeckMusicPlaying, stopDeckMusic } from "./deckMusicPlayer";
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

  useEffect(() => {
    configureDeckMusic(music, volume);
  }, [music?.url, music?.loop, volume]);

  useEffect(() => () => stopDeckMusic(), []);

  useEffect(() => {
    let disposeRetry: (() => void) | null = null;
    let cancelled = false;
    void setDeckMusicPlaying(playing).then((result) => {
      if (cancelled || result.ok || !result.blocked) return;
      disposeRetry = armAutoplayRetry();
    });
    return () => {
      cancelled = true;
      disposeRetry?.();
    };
  }, [playing, music?.url]);

  return { hasTrack: Boolean(music?.url), playing };
}

