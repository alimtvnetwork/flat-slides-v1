import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ControlBar } from "@/components/slides/ControlBar";
import { RenderSlide } from "@/components/slides/RenderSlide";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { SettingsDrawer } from "@/components/slides/SettingsDrawer";
import { SlideTransition } from "@/components/slides/SlideTransition";
import { useDeck } from "@/components/slides/store";
import { useFullscreen } from "@/components/slides/useFullscreen";

export const Route = createFileRoute("/slides/$slideId/$step")({
  head: ({ params }) => ({
    meta: [{ title: `Slide — ${params.slideId} · step ${params.step}` }],
  }),
  component: SlideStepPage,
});

function SlideStepPage() {
  const { slideId, step } = Route.useParams();
  const navigate = useNavigate();
  const slides = useDeck((s) => s.deck.slides);
  const index = slides.findIndex((s) => s.id === slideId);
  const slide = index >= 0 ? slides[index] : undefined;
  const stepNum = Math.max(0, parseInt(step, 10) || 0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!slide) return;
    document.title = `${index + 1}/${slides.length} — ${slide.title}`;
  }, [slide, index, slides.length]);

  useEffect(() => {
    if (!slide || slide.type !== "steps") return;
    const last = slide.steps.length - 1;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        if (stepNum < last) {
          navigate({
            to: "/slides/$slideId/$step",
            params: { slideId: slide.id, step: String(stepNum + 1) },
          });
        } else {
          const next = slides[index + 1];
          if (next) navigate({ to: "/slides/$slideId", params: { slideId: next.id } });
        }
      } else if (e.key === "ArrowLeft") {
        if (stepNum > 0) {
          const target = stepNum - 1;
          if (target === 0) {
            navigate({ to: "/slides/$slideId", params: { slideId: slide.id } });
          } else {
            navigate({
              to: "/slides/$slideId/$step",
              params: { slideId: slide.id, step: String(target) },
            });
          }
        } else {
          const prev = slides[index - 1];
          if (prev) navigate({ to: "/slides/$slideId", params: { slideId: prev.id } });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slide, index, slides, navigate, stepNum]);

  if (!slide || slide.type !== "steps") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Link to="/slides" className="underline">Back to deck</Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <div className="flex-1 relative">
        <ScaledSlide>
          <RenderSlide slide={slide} step={stepNum} />
        </ScaledSlide>
      </div>
      <ControlBar
        slides={slides}
        index={index}
        step={stepNum}
        totalSteps={slide.steps.length}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
