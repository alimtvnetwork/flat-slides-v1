import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import type { Slide } from "./types";

type Props = {
  slides: Slide[];
  index: number;
  step?: number;
  totalSteps?: number;
  onOpenSettings?: () => void;
};

/**
 * Bottom control bar used by the single-slide route.
 * Prev / editable N/Total / Next / Share / Settings.
 */
export function ControlBar({ slides, index, step, totalSteps, onOpenSettings }: Props) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const prev = slides[index - 1];
  const next = slides[index + 1];
  const current = slides[index];

  const jumpTo = (n: number) => {
    const target = slides[Math.max(0, Math.min(slides.length - 1, n - 1))];
    if (target) navigate({ to: "/slides/$slideId", params: { slideId: target.id } });
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: current?.title ?? "Slide", url });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 bg-neutral-950 px-6 py-3 text-sm text-neutral-300">
      <Link to="/slides" className="opacity-70 hover:opacity-100">← Overview</Link>

      <div className="flex items-center gap-4">
        {prev ? (
          <Link to="/slides/$slideId" params={{ slideId: prev.id }}>◀ Prev</Link>
        ) : (
          <span className="opacity-30">◀ Prev</span>
        )}

        {editing ? (
          <input
            autoFocus
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const n = parseInt(draft, 10);
                if (!Number.isNaN(n)) jumpTo(n);
                setEditing(false);
              } else if (e.key === "Escape") {
                setEditing(false);
              }
            }}
            className="w-16 rounded bg-neutral-800 px-2 py-0.5 text-center tabular-nums text-white outline-none ring-1 ring-neutral-700"
          />
        ) : (
          <span
            className="tabular-nums cursor-text select-none rounded px-2 py-0.5 hover:bg-neutral-800"
            title="Double-click to jump"
            onDoubleClick={() => {
              setDraft(String(index + 1));
              setEditing(true);
            }}
          >
            {index + 1} / {slides.length}
            {typeof step === "number" && totalSteps ? (
              <span className="ml-2 opacity-60">· step {step + 1}/{totalSteps}</span>
            ) : null}
          </span>
        )}

        {next ? (
          <Link to="/slides/$slideId" params={{ slideId: next.id }}>Next ▶</Link>
        ) : (
          <span className="opacity-30">Next ▶</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={share} className="opacity-70 hover:opacity-100">🔗 Share</button>
        {onOpenSettings ? (
          <button onClick={onOpenSettings} className="opacity-70 hover:opacity-100">⚙ Settings</button>
        ) : null}
      </div>
    </div>
  );
}
