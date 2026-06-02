import { AnimatePresence, motion } from "framer-motion";
import { StickyNote, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useReducedMotion } from "@/components/slides/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * Presenter notes peek — a small toggle pill that reveals the current slide's
 * speaker notes in a floating card. Hidden when there are no notes.
 */
export function PresenterNotesPeek({ notes }: { notes?: string }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  // Auto-close when notes disappear (e.g. on slide change to a no-notes slide).
  useEffect(() => {
    if (!notes) setOpen(false);
  }, [notes]);

  if (!notes) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50" data-print-hide="true">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Hide presenter notes" : "Show presenter notes"}
        className={cn(
          "app-focusable inline-flex items-center gap-1.5 rounded-full border border-white/15",
          "bg-black/60 px-3 py-1.5 text-xs text-white/80 backdrop-blur",
          "hover:bg-black/75 hover:text-white",
        )}
      >
        <StickyNote size={12} />
        Notes
      </button>
      <AnimatePresence>
        {open && (
          <motion.aside
            role="dialog"
            aria-label="Presenter notes"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: reduced ? 0.12 : 0.2 }}
            className="mt-2 w-[min(420px,80vw)] rounded-xl border border-white/15 bg-neutral-950/95 p-4 text-sm leading-relaxed text-white/90 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close notes"
              className="app-focusable absolute right-2 top-2 rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X size={14} />
            </button>
            <div className="whitespace-pre-wrap pr-6">{notes}</div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
