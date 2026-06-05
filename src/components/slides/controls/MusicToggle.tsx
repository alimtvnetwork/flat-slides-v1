import { Music, VolumeX } from "lucide-react";
import { useEffect } from "react";

import { useChrome } from "@/components/slides/chrome-store";
import { useDeckMusic } from "@/components/slides/useDeckMusic";
import { cn } from "@/lib/utils";

/**
 * Inline music toggle. Renders nothing when the deck has no music track.
 * Mounts the useDeckMusic effect so playback follows chrome state.
 */
export function MusicToggle({ compact = false }: { compact?: boolean }) {
  const { hasTrack, playing } = useDeckMusic();
  const setMusic = useChrome((s) => s.setMusic);

  // Pause when unmounted (e.g. navigating away from slides).
  useEffect(() => () => setMusic({ playing: false }), [setMusic]);

  if (!hasTrack) return null;

  return (
    <div className={cn("inline-flex items-center gap-1.5", compact && "scale-90")}>
      <button
        type="button"
        aria-pressed={playing}
        aria-label={playing ? "Pause background music" : "Play background music"}
        onClick={() => setMusic({ playing: !playing })}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          "text-[color:var(--ctrl-fg)] hover:bg-white/10",
          playing && "text-[color:var(--ctrl-accent)]",
        )}
      >
        {playing ? <Music size={14} /> : <VolumeX size={14} />}
      </button>
    </div>
  );
}
