import { useChrome } from "../chrome-store";
import { classifyDrift, formatDuration, useTimer, type DriftLevel } from "../timer-store";
import type { Slide } from "../types";

const DRIFT_STYLE: Record<DriftLevel, { bg: string; fg: string; label: string }> = {
  idle: { bg: "bg-white/10",   fg: "text-white/70",  label: "" },
  ok:   { bg: "bg-emerald-500/25", fg: "text-emerald-200", label: "on pace" },
  warn: { bg: "bg-amber-500/30",   fg: "text-amber-100",   label: "slowing" },
  over: { bg: "bg-rose-500/30",    fg: "text-rose-100",    label: "over" },
};

interface Props {
  slide: Slide;
}

/**
 * TimerOverlay — top-left pill showing total elapsed + active slide pacing.
 * Hidden when chrome.timerVisible is false. Click toggles run/pause.
 *
 * - When slide has a `budget`, the badge shows `actual / budget` and tinted
 *   by drift level.
 * - When rehearsing, a small "REC" dot appears so the presenter knows it's
 *   recording dwell times.
 */
export function TimerOverlay({ slide }: Props) {
  const visible = useChrome((s) => s.timerVisible);
  const running = useTimer((s) => s.running);
  const elapsed = useTimer((s) => s.elapsed);
  const rehearsal = useTimer((s) => s.rehearsalMode);
  const slideMs = useTimer((s) => s.slideElapsed[slide.id] ?? 0);
  const toggle = useTimer((s) => s.toggle);

  if (!visible) return null;

  const drift = classifyDrift(slideMs, slide.budget);
  const style = DRIFT_STYLE[drift];

  return (
    <div
      data-print-hide="true"
      className="fixed left-5 top-5 z-30 flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs text-white shadow-md backdrop-blur-md"
    >
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1.5 rounded-full px-1.5 py-0.5 hover:bg-white/10"
        aria-label={running ? "Pause timer" : "Start timer"}
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${running ? "bg-emerald-400 animate-pulse" : "bg-white/40"}`}
        />
        <span className="font-mono tabular-nums">{formatDuration(elapsed)}</span>
      </button>
      {slide.budget ? (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${style.bg} ${style.fg}`}
          title={`Slide dwell ${formatDuration(slideMs)} of budget ${slide.budget}s`}
        >
          {formatDuration(slideMs)} / {slide.budget}s
          {style.label ? <span className="ml-1 opacity-80">· {style.label}</span> : null}
        </span>
      ) : null}
      {rehearsal ? (
        <span className="ml-0.5 flex items-center gap-1 rounded-full bg-rose-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-100">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
          rec
        </span>
      ) : null}
    </div>
  );
}
