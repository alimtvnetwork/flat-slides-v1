import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { RenderSlide } from "@/components/slides/RenderSlide";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { useDeck } from "@/components/slides/store";

export const Route = createFileRoute("/slides/$slideId")({
  head: ({ params }) => ({
    meta: [{ title: `Slide — ${params.slideId}` }],
  }),
  component: SlidePage,
});

function SlidePage() {
  const { slideId } = Route.useParams();
  const navigate = useNavigate();
  const slides = useDeck((s) => s.deck.slides);
  const index = slides.findIndex((s) => s.id === slideId);
  const slide = index >= 0 ? slides[index] : undefined;

  useEffect(() => {
    if (!slide) return;
    document.title = `${index + 1}/${slides.length} — ${slide.title}`;
  }, [slide, index, slides.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        const next = slides[index + 1];
        if (next) navigate({ to: "/slides/$slideId", params: { slideId: next.id } });
      } else if (e.key === "ArrowLeft") {
        const prev = slides[index - 1];
        if (prev) navigate({ to: "/slides/$slideId", params: { slideId: prev.id } });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, slides, navigate]);

  if (!slide) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="mb-4">Slide not found.</p>
          <Link to="/slides" className="underline">Back to deck</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <div className="flex-1 relative">
        <ScaledSlide>
          <RenderSlide slide={slide} />
        </ScaledSlide>
      </div>
      <div className="flex items-center justify-between gap-4 bg-neutral-950 px-6 py-3 text-sm text-neutral-300">
        <Link to="/slides" className="opacity-70 hover:opacity-100">← Overview</Link>
        <div className="flex items-center gap-4">
          {slides[index - 1] ? (
            <Link to="/slides/$slideId" params={{ slideId: slides[index - 1].id }}>◀ Prev</Link>
          ) : <span className="opacity-30">◀ Prev</span>}
          <span className="tabular-nums">{index + 1} / {slides.length}</span>
          {slides[index + 1] ? (
            <Link to="/slides/$slideId" params={{ slideId: slides[index + 1].id }}>Next ▶</Link>
          ) : <span className="opacity-30">Next ▶</span>}
        </div>
        <span className="opacity-60 truncate max-w-[40%]">{slide.title}</span>
      </div>
    </div>
  );
}
