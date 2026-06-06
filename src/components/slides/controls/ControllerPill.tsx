import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { getSlidesPortalRoot } from "@/components/slides/fullscreenTarget";
import { useReducedMotion } from "@/components/slides/useReducedMotion";
import { cn } from "@/lib/utils";
import { useHoverReveal } from "./useHoverReveal";

import { anchorStyles, clampControllerAnchor, type ControllerAnchor } from "./controller-anchor";
import { useControllerAnchor } from "./controller-anchor-store";

import { SlideIndicator } from "./SlideIndicator";
import { ControllerOverflowMenu } from "./ControllerOverflowMenu";

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

/**
 * Hover-reveal controller pill. Collapsed = faint chip, expanded = full
  * toolbar. Portaled to the clipped slides root, anchored at one of 8 positions (persisted),
 * grace-delay collapse so the user doesn't lose it on quick mouse-out.
 */
export function ControllerPill(props: Props) {
  const { current, total, onPrev, onNext, onJump, onToggleFullscreen, onOpenSettings, onOpenHelp, isFullscreen, canPrev, canNext } = props;
  const anchor = useControllerAnchor((s) => s.anchor);
  const setAnchor = useControllerAnchor((s) => s.setAnchor);
  const cycleAnchor = useControllerAnchor((s) => s.cycleAnchor);
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

  // Issue 029: re-clamp the persisted anchor when the viewport shrinks
  // below what the pill needs at a corner. Snaps to bottom-center so the
  // pill never disappears past the right/left edge after resize.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const clamp = () => {
      const el = containerRef.current;
      if (!el) return;
      const next = clampControllerAnchor(anchor, window.innerWidth, el.getBoundingClientRect().width);
      if (next !== anchor) setAnchor(next);
    };
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [anchor, setAnchor]);

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
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={motionPreset}
        className={cn(
          "flex items-center gap-1 rounded-full",
          "border border-[color:var(--ctrl-border)] bg-[color:var(--ctrl-bg)]",
          "backdrop-blur-md px-1.5 py-1 shadow-2xl",
        )}
      >
        <PillButton navAction="prev" onClick={onPrev} disabled={canPrev === undefined ? current <= 1 : !canPrev} ariaLabel="Previous slide">
              <ChevronLeft size={16} />
            </PillButton>

            <SlideIndicator current={current} total={total} onJump={onJump} />

        <PillButton navAction="next" onClick={onNext} disabled={canNext === undefined ? current >= total : !canNext} ariaLabel="Next slide">
          <ChevronRight size={16} />
        </PillButton>

        <span className="mx-0.5 h-4 w-px bg-white/15" aria-hidden />
        <PillButton onClick={onToggleFullscreen} ariaLabel={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </PillButton>
        <PillButton onClick={onOpenSettings} ariaLabel="Settings">
          <Settings size={15} />
        </PillButton>
        <ControllerOverflowMenu onOpenSettings={onOpenSettings} onOpenHelp={onOpenHelp} />
      </motion.div>
    </div>
  );

  const portalRoot = getSlidesPortalRoot();
  if (!portalRoot) return node;
  return createPortal(node, portalRoot);
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
