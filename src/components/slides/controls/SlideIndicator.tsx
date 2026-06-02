import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { useChrome } from "../chrome-store";

interface Props {
  current: number;
  total: number;
  onJump: (n: number) => void;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Slide indicator chip used inside the controller pill.
 * Click to type a slide number; Enter commits, Esc/blur cancels.
 * Shows a recent-jumps dropdown above the input.
 */
export function SlideIndicator({ current, total, onJump }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const recentJumps = useChrome((s) => s.recentJumps);
  const pushRecentJump = useChrome((s) => s.pushRecentJump);
  const clearRecentJumps = useChrome((s) => s.clearRecentJumps);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commit(value: string) {
    const n = parseInt(value, 10);
    if (Number.isFinite(n) && n >= 1 && n <= total) {
      pushRecentJump(n);
      onJump(n);
    }
    setEditing(false);
    setDraft("");
  }

  return (
    <div className="relative">
      {!editing ? (
        <button
          type="button"
          onClick={() => {
            setDraft(String(current));
            setEditing(true);
          }}
          aria-label={`Jump to slide. Current ${current} of ${total}`}
          className={cn(
            "inline-flex items-center justify-center h-7 min-w-[64px] px-2",
            "rounded-md text-[12px] tabular-nums font-medium",
            "text-[color:var(--ctrl-fg)] hover:bg-white/10 transition-colors",
          )}
        >
          <span className="text-[color:var(--ctrl-accent)]">{pad2(current)}</span>
          <span className="mx-1 text-white/40">/</span>
          <span>{pad2(total)}</span>
        </button>
      ) : (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") commit(draft);
            else if (e.key === "Escape") {
              setEditing(false);
              setDraft("");
            }
          }}
          onBlur={() => {
            setEditing(false);
            setDraft("");
          }}
          aria-label="Slide number"
          className={cn(
            "h-7 w-[68px] px-2 rounded-md text-[12px] tabular-nums",
            "bg-white/10 text-white border border-[color:var(--ctrl-border)]",
            "outline-none focus:border-[color:var(--ctrl-accent)]",
          )}
        />
      )}

      <AnimatePresence>
        {editing && recentJumps.filter((n) => n !== current).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "absolute bottom-full mb-2 left-1/2 -translate-x-1/2",
              "min-w-[120px] rounded-md border border-[color:var(--ctrl-border)]",
              "bg-[color:var(--ctrl-bg)] backdrop-blur-md p-1 shadow-lg",
            )}
          >
            <div className="flex items-center justify-between px-2 pb-1 text-[10px] uppercase tracking-wider text-white/50">
              <span>Recent</span>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  clearRecentJumps();
                }}
                className="inline-flex items-center text-white/60 hover:text-white"
                aria-label="Clear recent jumps"
              >
                <X size={11} />
              </button>
            </div>
            <ul className="flex flex-col">
              {recentJumps
                .filter((n) => n !== current && n <= total)
                .slice(0, 6)
                .map((n) => (
                  <li key={n}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        commit(String(n));
                      }}
                      className="w-full text-left px-2 py-1 rounded text-[12px] tabular-nums text-white/85 hover:bg-white/10"
                    >
                      Slide {pad2(n)}
                    </button>
                  </li>
                ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
