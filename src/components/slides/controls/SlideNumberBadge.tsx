import { cn } from "@/lib/utils";

import { useChrome } from "../chrome-store";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

interface Props {
  current: number;
  total: number;
  className?: string;
}

/**
 * Bottom-right read-only slide number badge.
 * Surface 2 of the slide-number system (see spec/old-slides/27-slides-number).
 */
export function SlideNumberBadge({ current, total, className }: Props) {
  const visible = useChrome((s) => s.slideNumberBadgeVisible);
  if (!visible || total === 0) return null;
  return (
    <div
      data-print-hide="true"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 right-5 z-30 pointer-events-none select-none",
        "rounded-full border border-white/15 bg-black/40 backdrop-blur-md",
        "px-3 py-1 text-[12px] font-medium text-white/70 tabular-nums shadow-md",
        className,
      )}
    >
      <span className="text-yellow-300">{pad2(current)}</span>
      <span className="mx-1 text-white/40">/</span>
      <span>{pad2(total)}</span>
    </div>
  );
}
