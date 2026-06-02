import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ControlBar } from "@/components/slides/ControlBar";
import { RenderSlide } from "@/components/slides/RenderSlide";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { SettingsDrawer } from "@/components/slides/SettingsDrawer";
import { SlideTransition } from "@/components/slides/SlideTransition";
import { useDeck } from "@/components/slides/store";
import { useFullscreen } from "@/components/slides/useFullscreen";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isFs, toggle: toggleFs, exit: exitFs } = useFullscreen();

  useEffect(() => {
    if (!slide) return;
    document.title = `${index + 1}/${slides.length} — ${slide.title}`;
  }, [slide, index, slides.length]);

  useEffect(() => {
    if (!slide) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "F5") { e.preventDefault(); toggleFs(); return; }
      if (e.key === "Escape" && isFs) { exitFs(); return; }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        if (slide.type === "steps" && slide.steps.length > 1) {
          navigate({
            to: "/slides/$slideId/$step",
            params: { slideId: slide.id, step: "1" },
          });
          return;
        }
        const next = slides[index + 1];
        if (next) navigate({ to: "/slides/$slideId", params: { slideId: next.id } });
      } else if (e.key === "ArrowLeft") {
        const prev = slides[index - 1];
        if (prev) navigate({ to: "/slides/$slideId", params: { slideId: prev.id } });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slide, index, slides, navigate, isFs, toggleFs, exitFs]);

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
          <SlideTransition transitionKey={slide.id}>
            <RenderSlide slide={slide} step={0} />
          </SlideTransition>
        </ScaledSlide>
      </div>
      <ControlBar
        slides={slides}
        index={index}
        step={slide.type === "steps" ? 0 : undefined}
        totalSteps={slide.type === "steps" ? slide.steps.length : undefined}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
