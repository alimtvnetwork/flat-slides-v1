import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";
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
      className={cn(
        "flex overflow-hidden flex-col bg-[color:var(--slide-bg)]",
        "max-h-dvh max-w-[100vw] overscroll-none",
        isFullscreen ? "fixed inset-0 z-[200] h-dvh w-screen" : "h-dvh w-full",
      )}
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