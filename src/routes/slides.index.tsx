import { createFileRoute, Link } from "@tanstack/react-router";

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
                <span className="tabular-nums">{disabled ? "—" : String(linearIndex + 1).padStart(2, "0")}</span>
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
