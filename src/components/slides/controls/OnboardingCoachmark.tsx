import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Grid3x3, HelpCircle, Keyboard, Maximize2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useOnboardingFlag } from "@/components/slides/useOnboardingFlag";

/**
 * First-run coachmark. Renders once per browser (gated by useOnboardingFlag).
 * Shows the core keyboard map + how to find the controller pill.
 * Dismissed by Esc, the close button, or "Got it".
 */
export function OnboardingCoachmark() {
  const { seen, markSeen } = useOnboardingFlag();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (seen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") markSeen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [seen, markSeen]);

  if (!mounted || seen) return null;

  const node = (
    <AnimatePresence>
      <motion.div
        key="onboarding-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={markSeen}
        data-print-hide="true"
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Glasswing"
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-[min(92vw,520px)] rounded-2xl border border-white/15 bg-neutral-950/95 p-6 text-white shadow-2xl"
        >
          <button
            type="button"
            aria-label="Dismiss"
            onClick={markSeen}
            className="absolute right-3 top-3 rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>

          <div className="mb-4 flex items-center gap-2 text-white/80">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.25em]">Welcome</span>
          </div>

          <h2 className="mb-2 text-2xl font-semibold">Drive the deck without leaving the slide</h2>
          <p className="mb-5 text-sm text-white/70">
            Hover the bottom-right edge to reveal the controller pill. Right-click it to move it
            anywhere. These keys work from any slide:
          </p>

          <ul className="mb-6 space-y-2 text-sm">
            <KeyRow keys={["→", "Space"]} label="Next slide / step" />
            <KeyRow keys={["←"]} label="Previous slide / step" />
            <KeyRow keys={["F5"]} label="Present (fullscreen)" icon={<Maximize2 size={14} />} />
            <KeyRow keys={["G"]} label="Deck overview" icon={<Grid3x3 size={14} />} />
            <KeyRow keys={["S"]} label="Settings" />
            <KeyRow keys={["?"]} label="All shortcuts" icon={<HelpCircle size={14} />} />
            <KeyRow keys={["C"]} label="Toggle presenter camera" />
          </ul>

          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-white/50">
              <Keyboard className="h-3.5 w-3.5" />
              Press Esc to dismiss
            </span>
            <button
              type="button"
              onClick={markSeen}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
            >
              Got it
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(node, document.body);
}

function KeyRow({ keys, label, icon }: { keys: string[]; label: string; icon?: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className="flex items-center gap-2 text-white/90">
        {icon}
        {label}
      </span>
      <span className="flex gap-1">
        {keys.map((k) => (
          <kbd
            key={k}
            className="rounded-md border border-white/20 bg-black/60 px-2 py-0.5 text-[11px] font-mono tabular-nums text-white"
          >
            {k}
          </kbd>
        ))}
      </span>
    </li>
  );
}
