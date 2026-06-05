import { useRef, type ReactNode } from "react";

import { useCursorAutoHide } from "@/components/slides/useCursorAutoHide";

type Props = {
  isFullscreen: boolean;
  children: ReactNode;
};

export function PresenterShell({ isFullscreen, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  useCursorAutoHide(() => rootRef.current, isFullscreen);
  return (
    <div
      ref={rootRef}
      data-slide-presenter-root
      data-fullscreen={isFullscreen ? "true" : "false"}
      className="flex h-dvh w-full max-h-dvh max-w-[100vw] flex-col overflow-hidden overscroll-none bg-[color:var(--slide-bg)]"
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