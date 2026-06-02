import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Grid3x3, HelpCircle, Maximize2, Minimize2, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { cn } from "@/lib/utils";

import { SlideIndicator } from "./SlideIndicator";

export type ControllerAnchor =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

interface PositionStore {
  anchor: ControllerAnchor;
  setAnchor: (a: ControllerAnchor) => void;
}

const usePositionStore = create<PositionStore>()(
  persist(
    (set) => ({
      anchor: "bottom-right",
      setAnchor: (anchor) => set({ anchor }),
    }),
    { name: "slides-controller-pos-v1" },
  ),
);

function anchorStyles(a: ControllerAnchor): React.CSSProperties {
  const inset = "max(env(safe-area-inset-bottom, 0px), 16px)";
  const sideInset = "max(env(safe-area-inset-right, 0px), 16px)";
  switch (a) {
    case "top-left":      return { top: inset, left: sideInset };
    case "top-center":    return { top: inset, left: "50%", transform: "translateX(-50%)" };
    case "top-right":     return { top: inset, right: sideInset };
    case "middle-left":   return { top: "50%", left: sideInset, transform: "translateY(-50%)" };
    case "middle-right":  return { top: "50%", right: sideInset, transform: "translateY(-50%)" };
    case "bottom-left":   return { bottom: inset, left: sideInset };
    case "bottom-center": return { bottom: inset, left: "50%", transform: "translateX(-50%)" };
    case "bottom-right":
    default:              return { bottom: inset, right: sideInset };
  }
}

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
}

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Hover-reveal controller pill. Collapsed = faint chip, expanded = full
 * toolbar. Portaled to <body>, anchored at one of 8 positions (persisted),
 * grace-delay collapse so the user doesn't lose it on quick mouse-out.
 */
export function ControllerPill(props: Props) {
  const { current, total, onPrev, onNext, onJump, onOpenGrid, onToggleFullscreen, onOpenHelp, isFullscreen } = props;
  const anchor = usePositionStore((s) => s.anchor);
  const setAnchor = usePositionStore((s) => s.setAnchor);
  const [expanded, setExpanded] = useState(false);
  const collapseTimer = useRef<number | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => () => {
    if (collapseTimer.current !== undefined) window.clearTimeout(collapseTimer.current);
  }, []);

  function handleEnter() {
    if (collapseTimer.current !== undefined) {
      window.clearTimeout(collapseTimer.current);
      collapseTimer.current = undefined;
    }
    setExpanded(true);
  }

  function handleLeave() {
    if (collapseTimer.current !== undefined) window.clearTimeout(collapseTimer.current);
    collapseTimer.current = window.setTimeout(() => setExpanded(false), 280);
  }

  // Cycle through 8 anchors on right-click of the pill.
  function cycleAnchor() {
    const order: ControllerAnchor[] = [
      "bottom-right", "bottom-center", "bottom-left",
      "middle-left", "top-left", "top-center", "top-right", "middle-right",
    ];
    const idx = order.indexOf(anchor);
    setAnchor(order[(idx + 1) % order.length]);
  }

  if (!mounted) return null;

  const motionPreset = reduceMotion()
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 400, damping: 32 };

  const node = (
    <div
      data-print-hide="true"
      role="toolbar"
      aria-label="Slide controller"
      style={{ position: "fixed", zIndex: "var(--z-controller)" as unknown as number, ...anchorStyles(anchor) }}
      className="select-none"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onContextMenu={(e) => {
        e.preventDefault();
        cycleAnchor();
      }}
    >
      <AnimatePresence initial={false} mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={motionPreset}
            className={cn(
              "flex items-center gap-1 rounded-full",
              "border border-[color:var(--ctrl-border)] bg-[color:var(--ctrl-bg)]",
              "backdrop-blur-md px-2 py-1 shadow-2xl",
            )}
          >
            <PillButton onClick={onPrev} disabled={current <= 1} ariaLabel="Previous slide">
              <ChevronLeft size={16} />
            </PillButton>

            <SlideIndicator current={current} total={total} onJump={onJump} />

            <PillButton onClick={onNext} disabled={current >= total} ariaLabel="Next slide">
              <ChevronRight size={16} />
            </PillButton>

            <span className="mx-1 h-4 w-px bg-white/15" aria-hidden />

            <PillButton onClick={onOpenGrid} ariaLabel="Deck overview">
              <Grid3x3 size={15} />
            </PillButton>
            <PillButton onClick={onToggleFullscreen} ariaLabel={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </PillButton>
            <PillButton onClick={onOpenHelp} ariaLabel="Keyboard shortcuts">
              <HelpCircle size={15} />
            </PillButton>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            type="button"
            onClick={() => setExpanded(true)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.55, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ opacity: 1 }}
            transition={motionPreset}
            className={cn(
              "inline-flex items-center gap-1 rounded-full",
              "border border-[color:var(--ctrl-border)] bg-[color:var(--ctrl-bg)]",
              "backdrop-blur-md px-3 py-1 shadow-lg text-[11px] tabular-nums",
              "text-[color:var(--ctrl-fg)]",
            )}
            aria-label={`Show slide controller. Slide ${current} of ${total}`}
          >
            <span className="text-[color:var(--ctrl-accent)]">{current}</span>
            <span className="text-white/40">/</span>
            <span>{total}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );

  return createPortal(node, document.body);
}

function PillButton({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md",
        "text-[color:var(--ctrl-fg)] transition-colors",
        "hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}
