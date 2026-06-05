import { useEffect, useMemo } from "react";

import { useChrome } from "./chrome-store";
import { armAutoplayRetry } from "./deckMusicAutoplayRecovery";
import { configureDeckMusic, setDeckMusicPlaying, stopDeckMusic } from "./deckMusicPlayer";
import { useDeck } from "./store";
import type { DeckMusic } from "./types";

/**
 * Plays the deck-level background music (or the active slide's
 * `sound.music` override) while `music.playing` is true in chrome state.
 * The URL is exported in the deck JSON; playback state is presenter-local.
 */
export function useDeckMusic() {
  const deckMusic = useDeck((s) => s.deck.music);
  const musicVolume = useDeck((s) => s.deck.settings.musicVolume);
  const slideMusic = useChrome((s) => s.slideMusic);
  const playing = useChrome((s) => s.music.playing);

  const effectiveMusic = useMemo<DeckMusic | undefined>(
    () => resolveEffectiveMusic(deckMusic, slideMusic),
    [deckMusic, slideMusic],
  );

  useEffect(() => {
    configureDeckMusic(effectiveMusic, musicVolume);
  }, [effectiveMusic?.url, effectiveMusic?.loop, musicVolume]);

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
  }, [playing, effectiveMusic?.url]);

  return { hasTrack: Boolean(effectiveMusic?.url), playing };
}

function resolveEffectiveMusic(
  deckMusic: DeckMusic | undefined,
  override: { url: string; loop?: boolean; volume?: number } | null,
): DeckMusic | undefined {
  if (override?.url) return { url: override.url, loop: override.loop, volume: override.volume };
  return deckMusic;
}
