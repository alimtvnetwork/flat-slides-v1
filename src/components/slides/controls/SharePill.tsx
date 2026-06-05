import { useEffect, useState } from "react";

import { useAudience } from "../audience-store";
import { useChrome } from "../chrome-store";

/**
 * Compact share button — copies a deep link to the *current* slide (and
 * step, when present) plus the session id so a recipient who opens it
 * lands on the same slide AND auto-joins the live session.
 *
 * Why bake session id into the URL? Sharing a `/slides/N` link without
 * the session would put the recipient on the deck in their own isolated
 * BroadcastChannel — they'd see slides but never receive votes / state
 * from the original presenter session.
 */
export function SharePill({ current, step }: { current: number; step?: number }) {
  const sessionId = useAudience((s) => s.sessionId);
  const flash = useChrome((s) => s.flashToast);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const onClick = async () => {
    if (typeof window === "undefined") return;
    const base = `${window.location.origin}/slides/${current}${step && step > 1 ? `/${step}` : ""}`;
    const url = `${base}?session=${sessionId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      flash("Share link copied");
    } catch {
      flash("Copy failed — check clipboard permissions");
    }
  };

  return (
    <button
      data-print-hide
      data-presenter-frame-anchor="top-right"
      style={{ ["--presenter-safe-inset" as string]: "20px" }}
      type="button"
      onClick={onClick}
      className="fixed z-[60] rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/80 backdrop-blur-md transition hover:bg-black/75"
      title="Copy deep link to this slide (Y)"
      aria-label="Copy share link to current slide"
    >
      {copied ? "Copied ✓" : "Share link"}
    </button>
  );
}
