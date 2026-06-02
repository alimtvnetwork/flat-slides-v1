import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, LayoutGrid, Minimize2, Play, Settings as SettingsIcon, Share2 } from "lucide-react";
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
        params: { slideId: String(index + 1), step: String(curStep + 2) },
      });
    } else if (nextSlide) {
      navigate({ to: "/slides/$slideId", params: { slideId: String(index + 2) } });
    }
  };

  const goPrev = () => {
    if (!current) return;
    if (typeof step === "number" && curStep > 0) {
      const target = curStep - 1;
      if (target === 0) {
        navigate({ to: "/slides/$slideId", params: { slideId: String(index + 1) } });
      } else {
        navigate({
          to: "/slides/$slideId/$step",
          params: { slideId: String(index + 1), step: String(target + 1) },
        });
      }
    } else if (prevSlide) {
      navigate({ to: "/slides/$slideId", params: { slideId: String(index) } });
    }
  };

  const jumpTo = (n: number) => {
    const clamped = Math.max(1, Math.min(slides.length, n));
    navigate({ to: "/slides/$slideId", params: { slideId: String(clamped) } });
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
      <Link to="/slides" className="inline-flex items-center gap-1 opacity-70 hover:opacity-100"><LayoutGrid size={14} /> Overview</Link>

      <div className="flex items-center gap-4">
        {hasPrev ? (
          <button onClick={goPrev} aria-label="Previous" className="inline-flex items-center gap-1 hover:opacity-100"><ChevronLeft size={16} /> Prev</button>
        ) : (
          <span className="inline-flex items-center gap-1 opacity-30"><ChevronLeft size={16} /> Prev</span>
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

        {hasNext ? (
          <button onClick={goNext} aria-label="Next" className="inline-flex items-center gap-1 hover:opacity-100">Next <ChevronRight size={16} /></button>
        ) : (
          <span className="inline-flex items-center gap-1 opacity-30">Next <ChevronRight size={16} /></span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {onPresent ? (
          <button
            onClick={onPresent}
            className="inline-flex items-center gap-1.5 rounded bg-amber-400 px-3 py-1 font-semibold text-neutral-900 hover:bg-amber-300"
            title="Toggle fullscreen presentation (F5)"
          >
            {isPresenting ? <><Minimize2 size={14} /> Exit</> : <><Play size={14} /> Present</>}
          </button>
        ) : null}
        <button onClick={share} aria-label="Share link" className="inline-flex items-center gap-1 opacity-70 hover:opacity-100"><Share2 size={14} /> Share</button>
        {onOpenSettings ? (
          <button onClick={onOpenSettings} aria-label="Settings" className="inline-flex items-center gap-1 opacity-70 hover:opacity-100"><SettingsIcon size={14} /> Settings</button>
        ) : null}
      </div>
    </div>
  );
}
