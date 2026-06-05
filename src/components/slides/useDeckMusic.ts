import { useEffect } from "react";

import { useChrome } from "./chrome-store";
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
    return () => stopDeckMusic();
  }, [music?.url, music?.loop, volume]);

  useEffect(() => {
    setDeckMusicPlaying(playing);
  }, [playing, music?.url]);

  return { hasTrack: Boolean(music?.url), playing };
}
