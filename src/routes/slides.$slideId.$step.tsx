import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ControlBar } from "@/components/slides/ControlBar";
import { RenderSlide } from "@/components/slides/RenderSlide";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { SettingsDrawer } from "@/components/slides/SettingsDrawer";
import { SlideTransition } from "@/components/slides/SlideTransition";
import { useDeck } from "@/components/slides/store";
import { slideStepCount } from "@/components/slides/types";
import { useFullscreen } from "@/components/slides/useFullscreen";

export const Route = createFileRoute("/slides/$slideId/$step")({
  head: ({ params }) => ({
    meta: [{ title: `Slide ${params.slideId} · step ${params.step}` }],
  }),
  component: SlideStepPage,
});

function SlideStepPage() {
  const { slideId, step } = Route.useParams();
  const navigate = useNavigate();
  const slides = useDeck((s) => s.deck.slides);
  const index = Math.max(0, (parseInt(slideId, 10) || 0) - 1);
  const slide = index >= 0 && index < slides.length ? slides[index] : undefined;
  const stepNum = Math.max(0, parseInt(step, 10) || 0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isFs, toggle: toggleFs, exit: exitFs } = useFullscreen();

  useEffect(() => {
    if (!slide) return;
    document.title = `${index + 1}/${slides.length} — ${slide.title}`;
  }, [slide, index, slides.length]);

  useEffect(() => {
    const stepCount = slide ? slideStepCount(slide) : 0;
    if (!slide || stepCount === 0) return;
    const last = stepCount - 1;
    const slideParam = String(index + 1);
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "F5") { e.preventDefault(); toggleFs(); return; }
      if (e.key === "Escape" && isFs) { exitFs(); return; }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        if (stepNum < last) {
          navigate({
            to: "/slides/$slideId/$step",
            params: { slideId: slideParam, step: String(stepNum + 1) },
          });
        } else if (index + 1 < slides.length) {
          navigate({ to: "/slides/$slideId", params: { slideId: String(index + 2) } });
        }
      } else if (e.key === "ArrowLeft") {
        if (stepNum > 0) {
          const target = stepNum - 1;
          if (target === 0) {
            navigate({ to: "/slides/$slideId", params: { slideId: slideParam } });
          } else {
            navigate({
              to: "/slides/$slideId/$step",
              params: { slideId: slideParam, step: String(target) },
            });
          }
        } else if (index > 0) {
          navigate({ to: "/slides/$slideId", params: { slideId: String(index) } });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slide, index, slides, navigate, stepNum, isFs, toggleFs, exitFs]);

  if (!slide || slideStepCount(slide) === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Link to="/slides" className="underline">Back to deck</Link>
      </div>
    );
  }
  const totalSteps = slideStepCount(slide);

  if (isFs) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-black">
        <div className="relative flex-1">
          <ScaledSlide>
            <SlideTransition transitionKey={`${slide.id}:${stepNum}`}>
              <RenderSlide slide={slide} step={stepNum} />
            </SlideTransition>
          </ScaledSlide>
        </div>
        <ControlBar
          slides={slides}
          index={index}
          step={stepNum}
          totalSteps={slide.steps.length}
          onOpenSettings={() => setSettingsOpen(true)}
          onPresent={toggleFs}
          isPresenting={isFs}
        />
        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          currentSlideId={slide.id}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <div className="flex-1 relative">
        <ScaledSlide>
          <SlideTransition transitionKey={`${slide.id}:${stepNum}`}>
            <RenderSlide slide={slide} step={stepNum} />
          </SlideTransition>
        </ScaledSlide>
      </div>
      <ControlBar
        slides={slides}
        index={index}
        step={stepNum}
        totalSteps={slide.steps.length}
        onOpenSettings={() => setSettingsOpen(true)}
        onPresent={toggleFs}
        isPresenting={isFs}
      />
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentSlideId={slide.id}
      />
    </div>
  );
}
