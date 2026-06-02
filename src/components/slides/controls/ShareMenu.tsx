import { AnimatePresence, motion } from "framer-motion";
import { Link2, QrCode, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAudience } from "@/components/slides/audience-store";
import { useChrome } from "@/components/slides/chrome-store";
import { useReducedMotion } from "@/components/slides/useReducedMotion";
import { cn } from "@/lib/utils";

interface Props {
  current: number;
  step?: number;
}

/**
 * Share popover for the controller pill: copy deep link, toggle QR overlay,
 * or fall through to native Web Share when available.
 */
export function ShareMenu({ current, step }: Props) {
  const sessionId = useAudience((s) => s.sessionId);
  const qrVisible = useAudience((s) => s.qrVisible);
  const toggleQr = useAudience((s) => s.toggleQr);
  const flash = useChrome((s) => s.flashToast);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function deepLink() {
    const base = `${window.location.origin}/slides/${current}${step && step > 1 ? `/${step}` : ""}`;
    return `${base}?session=${sessionId}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(deepLink());
      flash("Share link copied");
    } catch {
      flash("Copy failed — check clipboard permissions");
    }
    setOpen(false);
  }

  async function nativeShare() {
    const url = deepLink();
    if (navigator.share) {
      try { await navigator.share({ title: "Slide", url }); } catch { /* user cancelled */ }
    } else {
      await copyLink();
    }
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Share menu"
        className={cn(
          "app-focusable inline-flex h-7 w-7 items-center justify-center rounded-md",
          "text-[color:var(--ctrl-fg)] transition-colors hover:bg-white/10",
          open && "bg-white/10 text-[color:var(--ctrl-accent)]",
        )}
      >
        <Share2 size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: reduced ? 0.08 : 0.12 }}
            className={cn(
              "absolute bottom-full mb-2 right-0 min-w-[180px]",
              "rounded-md border border-[color:var(--ctrl-border)] bg-[color:var(--ctrl-bg)]",
              "backdrop-blur-md p-1 shadow-xl",
            )}
          >
            <MenuItem onClick={copyLink} icon={<Link2 size={13} />} label="Copy deep link" />
            <MenuItem
              onClick={() => { toggleQr(); setOpen(false); }}
              icon={<QrCode size={13} />}
              label={qrVisible ? "Hide QR code" : "Show QR code"}
            />
            {typeof navigator !== "undefined" && "share" in navigator && (
              <MenuItem onClick={nativeShare} icon={<Share2 size={13} />} label="Share via…" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-white/85 hover:bg-white/10"
    >
      <span className="text-white/60">{icon}</span>
      {label}
    </button>
  );
}
