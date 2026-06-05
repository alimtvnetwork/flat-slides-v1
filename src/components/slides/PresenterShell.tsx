import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { useCursorAutoHide } from "@/components/slides/useCursorAutoHide";
import { useDeck } from "@/components/slides/store";
import { DARK_PRESET_BG } from "@/components/slides/slideBackground";
import { DEFAULT_DECK_SETTINGS } from "@/components/slides/settingsPersistence";

type Props = {
  isFullscreen: boolean;
  children: ReactNode;
};

function resolveShellBg(settings: { backgroundMode?: string; backgroundColor?: string }): string {
  if (settings.backgroundMode === "dark") return DARK_PRESET_BG;
  if (settings.backgroundColor) return settings.backgroundColor;
  return DARK_PRESET_BG;
}

/**
 * The shell background must match the deck background so the area around
 * the scaled slide doesn't fall back to black. We gate the read on a
 * post-hydration flag so that the SSR markup uses the deck defaults
 * (matching what the server rendered) and React can hydrate cleanly,
 * then we swap to the persisted/store value on the next render.
 */
function useShellBackground(): string {
  const settings = useDeck((s) => s.deck.settings);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return resolveShellBg(hydrated ? settings : DEFAULT_DECK_SETTINGS);
}

export function PresenterShell({ isFullscreen, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  useCursorAutoHide(() => rootRef.current, isFullscreen);
  const bg = useShellBackground();
  const style = { ["--slide-bg" as string]: bg, backgroundColor: bg } as CSSProperties;
  return (
    <div
      ref={rootRef}
      data-slide-presenter-root
      data-fullscreen={isFullscreen ? "true" : "false"}
      style={style}
      className="flex h-dvh w-full max-h-dvh max-w-[100vw] flex-col overflow-hidden overscroll-none"
    >
      {children}
    </div>
  );
}

export function SlideStageShell({ children }: { children: ReactNode }) {
  return (
    <div data-slide-stage-shell className="relative min-h-0 flex-1 overflow-hidden">
      {children}
    </div>
  );
}
