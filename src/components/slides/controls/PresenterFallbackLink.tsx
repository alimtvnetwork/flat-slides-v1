import { Copy, ExternalLink, X } from "lucide-react";
import { createPortal } from "react-dom";

import { useChrome } from "@/components/slides/chrome-store";
import { getSlidesPortalRoot } from "@/components/slides/fullscreenTarget";

export function PresenterFallbackLink() {
  const fallback = useChrome((s) => s.presenterFallback);
  const clear = useChrome((s) => s.clearPresenterFallback);
  const flash = useChrome((s) => s.flashToast);

  if (!fallback || typeof document === "undefined") return null;

  async function copyUrl() {
    if (!fallback) return;
    try {
      await navigator.clipboard.writeText(fallback.url);
      flash("Presenter link copied");
    } catch {
      flash("Copy failed — check clipboard permissions");
    }
  }

  return createPortal(
    <aside
      data-print-hide="true"
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-[75] w-[min(520px,calc(100vw-32px))] -translate-x-1/2 rounded-lg border border-[color:var(--ctrl-border)] bg-[color:var(--ctrl-bg)] p-3 text-[color:var(--ctrl-fg)] shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Presenter popup was blocked</p>
          <a
            href={fallback.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex min-w-0 items-center gap-2 rounded-md border border-[color:var(--ctrl-border)] px-2 py-1.5 text-xs text-[color:var(--ctrl-accent)] hover:bg-white/10"
          >
            <ExternalLink size={14} />
            <span className="truncate">Open presenter window</span>
          </a>
        </div>
        <button
          type="button"
          onClick={copyUrl}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[color:var(--ctrl-fg)] hover:bg-white/10"
          aria-label="Copy presenter link"
        >
          <Copy size={14} />
        </button>
        <button
          type="button"
          onClick={clear}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[color:var(--ctrl-fg)] hover:bg-white/10"
          aria-label="Dismiss presenter fallback"
        >
          <X size={14} />
        </button>
      </div>
    </aside>,
    getSlidesPortalRoot() ?? document.body,
  );
}