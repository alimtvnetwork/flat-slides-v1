import { AnimatePresence, motion } from "framer-motion";
import { StickyNote, X } from "lucide-react";
import { useEffect } from "react";

import { useChrome } from "@/components/slides/chrome-store";
import { useReducedMotion } from "@/components/slides/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * Presenter notes peek — a small toggle pill that reveals the current slide's
 * speaker notes in a floating card. Hidden when there are no notes.
 * Open/closed state is persisted in the chrome store so it survives slide
 * navigation and refresh.
 */
export function PresenterNotesPeek({ notes }: { notes?: string }) {
  const open = useChrome((s) => s.notesPeekOpen);
  const setOpen = useChrome((s) => s.setNotesPeekOpen);
  const toggle = useChrome((s) => s.toggleNotesPeek);
  const reduced = useReducedMotion();

  // "N" toggles the peek (skip while typing).
  useEffect(() => {
    if (!notes) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        toggle();
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notes, open, toggle, setOpen]);

  if (!notes) return null;

  return (
    <div
      className="fixed z-50"
      data-print-hide="true"
      data-presenter-frame-anchor="bottom-left"
    >
      <button
        type="button"
        onClick={toggle}
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
            className="mt-2 w-[min(420px,calc(var(--presenter-frame-width)-32px),80vw)] rounded-xl border border-white/15 bg-neutral-950/95 p-4 text-sm leading-relaxed text-white/90 shadow-2xl"
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
