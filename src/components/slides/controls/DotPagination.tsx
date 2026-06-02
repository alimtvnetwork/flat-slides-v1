import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { cn } from "@/lib/utils";

import type { Slide } from "../types";

interface Props {
  current: number;
  total: number;
  slides: Slide[];
  onJump: (n: number) => void;
  className?: string;
}

/**
 * Dot pagination row. Active dot is a wider gold pill with a shared
 * `layoutId` so it springs between slots. Surface 3 of the slide-number
 * system (see spec/old-slides/27-slides-number/05-surface-dot-pagination.md).
 */
export function DotPagination({ current, total, slides, onJump, className }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (total === 0) return null;
  const overflow = total > 28;

  return (
    <nav
      data-print-hide="true"
      aria-label="Slide pagination"
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-30",
        "max-w-[min(90vw,1200px)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1 rounded-full border border-white/10",
          "bg-black/35 px-2 py-1 backdrop-blur-md shadow-lg",
          overflow && "overflow-x-auto no-scrollbar",
        )}
        style={
          overflow
            ? {
                maskImage:
                  "linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)",
              }
            : undefined
        }
      >
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          const slide = slides[n - 1];
          const active = n === current;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onJump(n)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" && n < total) {
                  e.preventDefault();
                  (e.currentTarget.nextElementSibling as HTMLButtonElement | null)?.focus();
                } else if (e.key === "ArrowLeft" && n > 1) {
                  e.preventDefault();
                  (e.currentTarget.previousElementSibling as HTMLButtonElement | null)?.focus();
                }
              }}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered((h) => (h === n ? null : h))}
              aria-current={active ? "true" : undefined}
              aria-label={`Slide ${n}${slide?.title ? `: ${slide.title}` : ""}`}
              className={cn(
                "relative shrink-0 inline-flex items-center justify-center",
                "h-6 min-w-6 rounded-full px-2 transition-colors",
                "text-[10px] tabular-nums",
                active
                  ? "text-black"
                  : "text-white/55 hover:text-white/90",
              )}
            >
              {active && (
                <motion.span
                  layoutId="dot-pagination-active"
                  className="absolute inset-0 rounded-full bg-yellow-300"
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                />
              )}
              <span className={cn("relative", active && "text-[11px] font-semibold")}>{n}</span>

              <AnimatePresence>
                {hovered === n && slide?.title && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.14 }}
                    className={cn(
                      "pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2",
                      "whitespace-nowrap rounded-md bg-black/85 px-2 py-1",
                      "text-[11px] font-medium text-white shadow-lg",
                    )}
                  >
                    {n}. {slide.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
