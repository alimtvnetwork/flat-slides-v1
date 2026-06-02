import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { useChrome } from "@/components/slides/chrome-store";
import { ControlBar } from "@/components/slides/ControlBar";
import { DotPagination } from "@/components/slides/controls/DotPagination";
import { PresenterTopBar } from "@/components/slides/controls/PresenterTopBar";
import { SlideNumberBadge } from "@/components/slides/controls/SlideNumberBadge";
import { RenderSlide } from "@/components/slides/RenderSlide";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { SettingsDrawer } from "@/components/slides/SettingsDrawer";
import { SlideTransition } from "@/components/slides/SlideTransition";
import { useDeck } from "@/components/slides/store";
import { slideStepCount } from "@/components/slides/types";
import { useFullscreen } from "@/components/slides/useFullscreen";
import { useSlideNavigation } from "@/components/slides/useSlideNavigation";

export const Route = createFileRoute("/slides/$slideId/$step")({
  head: ({ params }) => ({
    meta: [{ title: `Slide ${params.slideId} · step ${params.step}` }],
  }),
  component: SlideStepPage,
});

function SlideStepPage() {
  const { slideId, step } = Route.useParams();
  const allSlides = useDeck((s) => s.deck.slides);
  const { linearSlides, total, next, prev, jump, goTo } = useSlideNavigation();
  const index = Math.max(0, (parseInt(slideId, 10) || 0) - 1);
  const slide = index >= 0 && index < linearSlides.length ? linearSlides[index] : undefined;
  const current = index + 1;
  const stepCount = slide ? slideStepCount(slide) : 0;
  const requestedStep = parseInt(step, 10);
  const stepNum = Number.isFinite(requestedStep)
    ? Math.max(0, Math.min(requestedStep - 1, Math.max(0, stepCount - 1)))
    : 0;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isFs, toggle: toggleFs, exit: exitFs } = useFullscreen();
  const toggleTopJumper = useChrome((s) => s.toggleTopJumper);

  const indexInAll = useMemo(
    () => (slide ? allSlides.findIndex((s) => s.id === slide.id) : -1),
    [allSlides, slide],
  );

  useEffect(() => {
    if (!slide) return;
    document.title = `${current}/${total} — ${slide.title}`;
  }, [slide, current, total]);

  useEffect(() => {
    if (!slide || stepCount === 0) return;
    const last = stepCount - 1;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "F5") { e.preventDefault(); toggleFs(); return; }
      if (e.key === "Escape" && isFs) { exitFs(); return; }
      if (e.key === "j" || e.key === "J") { toggleTopJumper(); return; }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        if (stepNum < last) {
          goTo(current, "forward", stepNum + 2);
        } else {
          next(current);
        }
      } else if (e.key === "ArrowLeft") {
        if (stepNum > 0) {
          const target = stepNum; // new step = stepNum (1-based: stepNum)
          if (target <= 1) {
            goTo(current, "backward");
          } else {
            goTo(current, "backward", target);
          }
        } else {
          prev(current);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slide, stepCount, stepNum, current, next, prev, goTo, isFs, toggleFs, exitFs, toggleTopJumper]);

  if (!slide || slideStepCount(slide) === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Link to="/slides" className="underline">Back to deck</Link>
      </div>
    );
  }
  const totalSteps = slideStepCount(slide);

  const overlays = (
    <>
      <PresenterTopBar current={current} total={total} onPrev={() => prev(current)} onNext={() => next(current)} />
      <DotPagination current={current} total={total} slides={linearSlides} onJump={jump} />
      <SlideNumberBadge current={current} total={total} />
    </>
  );

  if (isFs) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-black">
        <div className="relative min-h-0 flex-1">
          <ScaledSlide fitPadding={36}>
            <SlideTransition transitionKey={slide.id} allowZoom={slide.type === "center" && slide.display === true}>
              <RenderSlide slide={slide} step={stepNum} />
            </SlideTransition>
          </ScaledSlide>
          {overlays}
        </div>
        <ControlBar
          slides={allSlides}
          index={indexInAll >= 0 ? indexInAll : 0}
          step={stepNum}
          totalSteps={totalSteps}
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
    <div className="flex h-screen overflow-hidden flex-col bg-black">
      <div className="relative min-h-0 flex-1">
        <ScaledSlide fitPadding={36}>
          <SlideTransition transitionKey={slide.id} allowZoom={slide.type === "center" && slide.display === true}>
            <RenderSlide slide={slide} step={stepNum} />
          </SlideTransition>
        </ScaledSlide>
        {overlays}
      </div>
      <ControlBar
        slides={allSlides}
        index={indexInAll >= 0 ? indexInAll : 0}
        step={stepNum}
        totalSteps={totalSteps}
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
