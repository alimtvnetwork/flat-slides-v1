import { createFileRoute, Link } from "@tanstack/react-router";
import { FileQuestion, Sparkles } from "lucide-react";

import { RenderSlide } from "@/components/slides/RenderSlide";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { useDeck } from "@/components/slides/store";
import { getDisplayNumber, slideStepCount } from "@/components/slides/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/slides/")({
  head: () => ({
    meta: [
      { title: "Slides — Overview" },
      { name: "description", content: "Deck overview grid." },
    ],
  }),
  component: SlidesOverview,
});

function SlidesOverview() {
  const slides = useDeck((s) => s.deck.slides);
  // Linear positions match the URL contract used by useSlideNavigation:
  // enabled (or undefined) slides are clickable; disabled ones are dimmed.
  const enabled = slides.filter((s) => s.enabled !== false);

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold text-neutral-100">Deck Overview</h1>
        <p className="text-xs text-neutral-500">{enabled.length} active · {slides.length} total</p>
      </div>
      {slides.length === 0 ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-neutral-800 bg-neutral-950 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-neutral-900 text-neutral-500 ring-1 ring-neutral-800">
            <FileQuestion size={32} />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-neutral-200">No slides yet</p>
            <p className="max-w-sm text-sm text-neutral-500">Import a deck JSON or try the spec sample to get started in seconds.</p>
          </div>
          <Link
            to="/slides/spec"
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-amber-300"
          >
            <Sparkles size={14} /> View JSON spec
          </Link>
        </div>
      ) : (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {slides.map((s) => {
          const linearIndex = enabled.indexOf(s);
          const disabled = linearIndex === -1;
          const stepCount = slideStepCount(s);
          const inner = (
            <>
              <ScaledSlide>
                <RenderSlide slide={s} step={Math.max(0, stepCount - 1)} />
              </ScaledSlide>
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-black/75 px-2 py-0.5 text-xs text-white">
                <span className="tabular-nums">
                  {disabled ? "—" : String(getDisplayNumber(s, linearIndex + 1)).padStart(2, "0")}
                </span>
                {!disabled && typeof s.number === "number" && s.number !== linearIndex + 1 && (
                  <span
                    title={`Authored number (linear position ${linearIndex + 1})`}
                    className="rounded bg-yellow-400/20 px-1 text-[9px] uppercase tracking-wide text-yellow-200"
                  >
                    auth
                  </span>
                )}
                <span className="opacity-70">·</span>
                <span className="line-clamp-1 max-w-[14rem]">{s.title}</span>
              </div>
              {stepCount > 1 && (
                <div className="absolute right-3 top-3 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/80">
                  {stepCount} steps
                </div>
              )}
              {disabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs uppercase tracking-wide text-white/80">
                  Disabled
                </div>
              )}
            </>
          );
          const className = cn(
            "group relative aspect-video w-full overflow-hidden rounded-lg ring-1 bg-black transition",
            disabled
              ? "ring-neutral-900 opacity-60 cursor-not-allowed"
              : "ring-neutral-800 hover:ring-neutral-500 hover:ring-2",
          );
          return disabled ? (
            <div key={s.id} className={className} aria-disabled>{inner}</div>
          ) : (
            <Link
              key={s.id}
              to="/slides/$slideId"
              params={{ slideId: String(linearIndex + 1) }}
              className={className}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
