import { useEffect, useRef, type CSSProperties, type KeyboardEventHandler, type ReactNode } from "react";

import { useCursorAutoHide } from "@/components/slides/useCursorAutoHide";
import { useHydratedDeckSettings } from "@/components/slides/useHydratedDeckSettings";
import { DARK_PRESET_BG } from "@/components/slides/slideBackground";

type Props = {
  isFullscreen: boolean;
  children: ReactNode;
  onKeyDownCapture?: KeyboardEventHandler<HTMLDivElement>;
};

function resolveShellBg(settings: { backgroundMode?: string; backgroundColor?: string }): string {
  if (settings.backgroundMode === "dark") return DARK_PRESET_BG;
  if (settings.backgroundColor) return settings.backgroundColor;
  return DARK_PRESET_BG;
}

export function PresenterShell({ isFullscreen, children, onKeyDownCapture }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  useCursorAutoHide(() => rootRef.current, isFullscreen);
  useEffect(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) return;
    rootRef.current?.focus({ preventScroll: true });
  }, []);
  const settings = useHydratedDeckSettings();
  const bg = resolveShellBg(settings);
  const style = { ["--slide-bg" as string]: bg, backgroundColor: bg } as CSSProperties;
  return (
    <div
      ref={rootRef}
      data-slide-presenter-root
      data-fullscreen={isFullscreen ? "true" : "false"}
      tabIndex={-1}
      onKeyDownCapture={onKeyDownCapture}
      style={style}
      className="flex h-dvh w-full max-h-dvh max-w-[100vw] flex-col overflow-hidden overscroll-none focus:outline-none"
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
