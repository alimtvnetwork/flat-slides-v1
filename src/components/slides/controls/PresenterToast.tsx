import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useChrome } from "@/components/slides/chrome-store";
import { getSlidesPortalRoot } from "@/components/slides/fullscreenTarget";

/**
 * Brief bottom-center toast driven by chrome.toast updates. Auto-dismiss
 * after 1.6s. Used for scene changes, "Camera on", "Music paused" hints.
 */
export function PresenterToast() {
  const toast = useChrome((s) => s.toast);
  const [visible, setVisible] = useState<{ text: string; ts: number } | null>(null);

  useEffect(() => {
    if (!toast) return;
    setVisible(toast);
    const t = window.setTimeout(() => setVisible(null), 1600);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          key={visible.ts}
          data-print-hide="true"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-white/15 bg-black/80 px-4 py-1.5 text-xs uppercase tracking-wide text-white shadow-lg backdrop-blur"
        >
          {visible.text}
        </motion.div>
      )}
    </AnimatePresence>,
    getSlidesPortalRoot() ?? document.body,
  );
}
