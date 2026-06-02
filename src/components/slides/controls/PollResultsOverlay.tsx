import { useAudience } from "../audience-store";
import type { Slide } from "../types";

/**
 * Tiny live-poll readout pinned to the bottom-left of a poll slide.
 * Reflects votes accumulated via BroadcastChannel from audience tabs.
 * The slide widget itself still renders the question + options at full
 * scale; this overlay just gives the presenter a compact at-a-glance
 * tally without occluding the main composition.
 */
export function PollResultsOverlay({ slide }: { slide: Slide }) {
  const visible = useAudience((s) => s.resultsVisible);
  const tally = useAudience((s) => s.polls[slide.id]);

  if (!visible || slide.type !== "poll") return null;
  const counts = tally?.counts ?? slide.options.map(() => 0);
  const total = counts.reduce((a, b) => a + b, 0);

  return (
    <div
      data-print-hide
      className="pointer-events-none absolute bottom-24 left-6 z-[55] w-[280px] rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white backdrop-blur-md"
      aria-label="Live poll results"
    >
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/60">
        <span>Live tally</span>
        <span>{total} {total === 1 ? "vote" : "votes"}</span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {slide.options.map((opt, i) => {
          const count = counts[i] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <li key={i} className="text-[12px]">
              <div className="flex items-center justify-between">
                <span className="truncate pr-2">{opt}</span>
                <span className="tabular-nums text-white/70">{pct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-white/80" style={{ width: `${pct}%`, transition: "width 280ms ease" }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
