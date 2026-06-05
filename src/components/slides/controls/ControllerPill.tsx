import { motion } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight, Grid3x3, HelpCircle, Maximize2, Minimize2, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useChrome } from "@/components/slides/chrome-store";
import { getSlidesPortalRoot } from "@/components/slides/fullscreenTarget";
import { useReducedMotion } from "@/components/slides/useReducedMotion";
import { cn } from "@/lib/utils";
import { useHoverReveal } from "./useHoverReveal";

import { anchorStyles, type ControllerAnchor } from "./controller-anchor";
import { useControllerAnchor } from "./controller-anchor-store";

import { MusicToggle } from "./MusicToggle";
import { ShareMenu } from "./ShareMenu";
import { SlideIndicator } from "./SlideIndicator";
import { ThemeChip } from "./ThemeChip";

export type { ControllerAnchor };

interface Props {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (n: number) => void;
  onOpenGrid: () => void;
  onToggleFullscreen: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  isFullscreen: boolean;
  canPrev?: boolean;
  canNext?: boolean;
}

function useCompactViewport() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(max-width: 640px)");
    const sync = () => setCompact(mql.matches);
    sync();
    mql.addEventListener?.("change", sync);
    return () => mql.removeEventListener?.("change", sync);
  }, []);
  return compact;
}

/**
 * Hover-reveal controller pill. Collapsed = faint chip, expanded = full
 * toolbar. Portaled to <body>, anchored at one of 8 positions (persisted),
 * grace-delay collapse so the user doesn't lose it on quick mouse-out.
 */
export function ControllerPill(props: Props) {
  const { current, total, onPrev, onNext, onJump, onOpenGrid, onToggleFullscreen, onOpenHelp, onOpenSettings, isFullscreen, canPrev, canNext } = props;
  const anchor = useControllerAnchor((s) => s.anchor);
  const cycleAnchor = useControllerAnchor((s) => s.cycleAnchor);
  const cameraVisible = useChrome((s) => s.camera.visible);
  const toggleCamera = useChrome((s) => s.toggleCamera);
  const compact = useCompactViewport();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isExpanded, handleEnter, handleLeave } = useHoverReveal(containerRef);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.closest('[aria-label="Slide controller"]')) active.blur();
    });
  }, [isFullscreen]);

  if (!mounted) return null;

  const motionPreset = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 400, damping: 32 };

  const node = (
    <div
      ref={containerRef}
      data-print-hide="true"
      role="toolbar"
      aria-label="Slide controller"
      data-collapsed={!isExpanded}
      style={{ position: "fixed", zIndex: "var(--z-controller)" as unknown as number, ...anchorStyles(anchor) }}
      className="select-none"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      onContextMenu={(e) => {
        e.preventDefault();
        cycleAnchor();
      }}
    >
      <motion.div
        key="expanded"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={motionPreset}
        className={cn(
          "flex items-center gap-1 rounded-full",
          "border border-[color:var(--ctrl-border)] bg-[color:var(--ctrl-bg)]",
          "backdrop-blur-md px-2 py-1 shadow-2xl",
        )}
      >
        <PillButton navAction="prev" onClick={onPrev} disabled={canPrev === undefined ? current <= 1 : !canPrev} ariaLabel="Previous slide">
              <ChevronLeft size={16} />
            </PillButton>

            <SlideIndicator current={current} total={total} onJump={onJump} />

        <PillButton navAction="next" onClick={onNext} disabled={canNext === undefined ? current >= total : !canNext} ariaLabel="Next slide">
              <ChevronRight size={16} />
            </PillButton>

            {!compact && (
              <>
                <span className="mx-1 h-4 w-px bg-white/15" aria-hidden />

                <PillButton onClick={onOpenGrid} ariaLabel="Deck overview">
                  <Grid3x3 size={15} />
                </PillButton>
                <PillButton onClick={onToggleFullscreen} ariaLabel={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </PillButton>
                <PillButton
                  onClick={toggleCamera}
                  ariaLabel={cameraVisible ? "Hide camera" : "Show camera"}
                  active={cameraVisible}
                >
                  <Camera size={15} />
                </PillButton>
                <MusicToggle compact />
                <ThemeChip />
                <ShareMenu current={current} />
                <PillButton onClick={onOpenSettings} ariaLabel="Settings">
                  <Settings size={15} />
                </PillButton>
                <PillButton onClick={onOpenHelp} ariaLabel="Keyboard shortcuts">
                  <HelpCircle size={15} />
                </PillButton>

                <span
                  className="ml-1 hidden text-[10px] uppercase tracking-wider text-white/35 md:inline"
                  aria-hidden
                  title="Right-click anywhere on the pill to move it"
                >
                  right-click to move
                </span>
              </>
            )}
      </motion.div>
    </div>
  );

  return createPortal(node, getSlidesPortalRoot() ?? document.body);
}

function PillButton({
  children,
  onClick,
  disabled,
  ariaLabel,
  active,
  navAction,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
  active?: boolean;
  navAction?: "prev" | "next";
}) {
  return (
    <button
      type="button"
      data-slide-nav={navAction}
      onKeyDown={(e) => {
        if (!navAction) return;
        if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.blur();
        onClick();
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (navAction) {
          e.preventDefault();
          const handledAt = Number(e.currentTarget.dataset.slideNavHandledAt ?? 0);
          if (Date.now() - handledAt < 700) return;
          e.currentTarget.blur();
          onClick();
          return;
        }
        e.currentTarget.blur();
        onClick();
      }}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md",
        "text-[color:var(--ctrl-fg)] transition-colors",
        "hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent",
        active && "text-[color:var(--ctrl-accent)] bg-white/10",
      )}
    >
      {children}
    </button>
  );
}
