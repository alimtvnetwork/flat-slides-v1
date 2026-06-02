import { useChrome } from "../chrome-store";
import { cn } from "@/lib/utils";

interface Props {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function KeyHint({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.4em] px-1 py-[1px] rounded border border-white/20 bg-white/10 text-[10px] font-medium text-white/80">
      {children}
    </kbd>
  );
}

/**
 * Presenter top-bar (Surface 1 of the slide-number system).
 * Hidden by default; toggle with `J`.
 */
export function PresenterTopBar({ current, total, onPrev, onNext }: Props) {
  const hidden = useChrome((s) => s.topJumperHidden);
  if (hidden || total === 0) return null;

  return (
    <div
      data-print-hide="true"
      aria-live="polite"
      className={cn(
        "fixed top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none",
        "flex items-center gap-2 h-7 rounded-full",
        "border border-yellow-400/20 bg-black/40 backdrop-blur-md px-3",
        "text-[11px] text-white/75 shadow-md",
      )}
    >
      <button
        type="button"
        onClick={onPrev}
        className="pointer-events-auto inline-flex items-center gap-1 text-white/70 hover:text-white"
        aria-label="Previous slide"
      >
        <span>Prev</span>
        <KeyHint>←</KeyHint>
      </button>
      <span className="text-white/30">|</span>
      <span className="tabular-nums">
        Slide <span className="text-yellow-300">{pad2(current)}</span>
        <span className="mx-1 text-white/40">/</span>
        <span>{pad2(total)}</span>
      </span>
      <span className="text-white/30">|</span>
      <button
        type="button"
        onClick={onNext}
        className="pointer-events-auto inline-flex items-center gap-1 text-white/70 hover:text-white"
        aria-label="Next slide"
      >
        <KeyHint>→</KeyHint>
        <span>Next</span>
      </button>
    </div>
  );
}
