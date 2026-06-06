import { cn } from "@/lib/utils";

import { useChrome } from "../chrome-store";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

interface Props {
  /** 1-based linear position used for the denominator and fallback display. */
  current: number;
  total: number;
  /** Optional authored display number (overrides `current` for the numerator). */
  display?: number;
  className?: string;
}

/**
 * Bottom-right read-only slide number badge.
 * Surface 2 of the slide-number system (see spec/old-slides/27-slides-number).
 * When the active slide has an authored `number`, it shows the authored
 * value in the numerator while the denominator stays the linear total.
 */
export function SlideNumberBadge({ current, total, display, className }: Props) {
  const visible = useChrome((s) => s.slideNumberBadgeVisible);
  if (!visible || total === 0) return null;
  const shown = typeof display === "number" ? display : current;
  return (
    <div
      data-print-hide="true"
      data-presenter-frame-anchor="bottom-right"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 right-5 z-30 pointer-events-none select-none",
        "rounded-full border border-white/15 bg-black/40 backdrop-blur-md",
        "px-3 py-1 text-[12px] font-medium text-white/70 tabular-nums shadow-md",
        className,
      )}
    >
      <span className="text-yellow-300">{pad2(shown)}</span>
      <span className="mx-1 text-white/40">/</span>
      <span>{pad2(total)}</span>
    </div>
  );
}

