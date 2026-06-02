import { createFileRoute, Link } from "@tanstack/react-router";

import { RenderSlide } from "@/components/slides/RenderSlide";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { useDeck } from "@/components/slides/store";

export const Route = createFileRoute("/slides")({
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
  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-100">Deck Overview</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        {slides.map((s, i) => (
          <Link
            key={s.id}
            to="/slides/$slideId"
            params={{ slideId: s.id }}
            className="group relative aspect-video w-full overflow-hidden rounded-lg ring-1 ring-neutral-800 bg-black transition hover:ring-neutral-500"
          >
            <ScaledSlide>
              <RenderSlide slide={s} step={s.type === "steps" ? s.steps.length - 1 : 0} />
            </ScaledSlide>
            <div className="absolute left-3 top-3 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
              {i + 1}. {s.title}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
