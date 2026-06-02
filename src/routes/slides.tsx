import { createFileRoute } from "@tanstack/react-router";

import { ScaledSlide } from "@/components/slides/ScaledSlide";
import {
  SampleDontMakeMeThink,
  SampleGlasswing,
  SampleSajidaProposal,
} from "@/components/slides/sample-slides";

export const Route = createFileRoute("/slides")({
  head: () => ({
    meta: [
      { title: "Slides — Sample Reproductions" },
      { name: "description", content: "Token + scaling preview of the three reference thumbnails." },
    ],
  }),
  component: SlidesDemo,
});

const slides = [
  { id: "glasswing", node: <SampleGlasswing /> },
  { id: "think", node: <SampleDontMakeMeThink /> },
  { id: "sajida", node: <SampleSajidaProposal /> },
];

function SlidesDemo() {
  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-100">Slide Reproductions</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        {slides.map((s) => (
          <div
            key={s.id}
            className="relative aspect-video w-full overflow-hidden rounded-lg ring-1 ring-neutral-800 bg-black"
          >
            <ScaledSlide>{s.node}</ScaledSlide>
            <div className="absolute left-3 top-3 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
              {s.id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
