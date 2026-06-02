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
  onPresent?: () => void;
  isPresenting?: boolean;
};

/**
 * Bottom control bar used by the single-slide route.
 * Prev / editable N/Total / Next / Share / Settings.
 */
export function ControlBar({ slides, index, step, totalSteps, onOpenSettings, onPresent, isPresenting }: Props) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const current = slides[index];
  const prevSlide = slides[index - 1];
  const nextSlide = slides[index + 1];
  const lastStep = typeof totalSteps === "number" ? totalSteps - 1 : 0;
  const curStep = typeof step === "number" ? step : 0;

  const hasNext = (typeof step === "number" && curStep < lastStep) || Boolean(nextSlide);
  const hasPrev = (typeof step === "number" && curStep > 0) || Boolean(prevSlide);

  const goNext = () => {
    if (!current) return;
    if (typeof step === "number" && curStep < lastStep) {
      navigate({
        to: "/slides/$slideId/$step",
        params: { slideId: current.id, step: String(curStep + 1) },
      });
    } else if (nextSlide) {
      navigate({ to: "/slides/$slideId", params: { slideId: nextSlide.id } });
    }
  };

  const goPrev = () => {
    if (!current) return;
    if (typeof step === "number" && curStep > 0) {
      const target = curStep - 1;
      if (target === 0) {
        navigate({ to: "/slides/$slideId", params: { slideId: current.id } });
      } else {
        navigate({
          to: "/slides/$slideId/$step",
          params: { slideId: current.id, step: String(target) },
        });
      }
    } else if (prevSlide) {
      navigate({ to: "/slides/$slideId", params: { slideId: prevSlide.id } });
    }
  };

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
    <div
      className="flex items-center justify-between gap-4 bg-neutral-950 px-6 py-3 text-sm text-neutral-300"
      data-app-chrome
    >
      <Link to="/slides" className="opacity-70 hover:opacity-100">← Overview</Link>

      <div className="flex items-center gap-4">
        {hasPrev ? (
          <button onClick={goPrev} className="hover:opacity-100">◀ Prev</button>
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
        {onPresent ? (
          <button
            onClick={onPresent}
            className="rounded bg-amber-400 px-3 py-1 font-semibold text-neutral-900 hover:bg-amber-300"
            title="Toggle fullscreen presentation (F5)"
          >
            {isPresenting ? "⤢ Exit" : "▶ Present"}
          </button>
        ) : null}
        <button onClick={share} className="opacity-70 hover:opacity-100">🔗 Share</button>
        {onOpenSettings ? (
          <button onClick={onOpenSettings} className="opacity-70 hover:opacity-100">⚙ Settings</button>
        ) : null}
      </div>
    </div>
  );
}
