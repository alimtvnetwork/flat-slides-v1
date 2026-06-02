import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { useChrome } from "@/components/slides/chrome-store";
import { CommandPalette } from "@/components/slides/CommandPalette";
import { ControlBar } from "@/components/slides/ControlBar";
import { DotPagination } from "@/components/slides/controls/DotPagination";
import { PresenterTopBar } from "@/components/slides/controls/PresenterTopBar";
import { SlideNumberBadge } from "@/components/slides/controls/SlideNumberBadge";
import { LintPanel } from "@/components/slides/LintPanel";
import { PresenterTools } from "@/components/slides/PresenterTools";
import { RenderSlide } from "@/components/slides/RenderSlide";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { SettingsDrawer } from "@/components/slides/SettingsDrawer";
import { SlideTransition } from "@/components/slides/SlideTransition";
import { useDeck } from "@/components/slides/store";
import { slideStepCount } from "@/components/slides/types";
import { useFullscreen } from "@/components/slides/useFullscreen";
import { useSlideNavigation } from "@/components/slides/useSlideNavigation";

export const Route = createFileRoute("/slides/$slideId/")({
  head: ({ params }) => ({
    meta: [{ title: `Slide ${params.slideId}` }],
  }),
  component: SlidePage,
});

function SlidePage() {
  const { slideId } = Route.useParams();
  const navigate = useNavigate();
  const deck = useDeck((s) => s.deck);
  const allSlides = deck.slides;
  const { linearSlides, total, next, prev, jump, goTo } = useSlideNavigation();
  const index = Math.max(0, (parseInt(slideId, 10) || 0) - 1);
  const slide = index >= 0 && index < linearSlides.length ? linearSlides[index] : undefined;
  const current = index + 1;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [lintOpen, setLintOpen] = useState(false);
  const { isFs, toggle: toggleFs, exit: exitFs } = useFullscreen();
  const toggleTopJumper = useChrome((s) => s.toggleTopJumper);

  // Maintain ControlBar compatibility: pass the original `slides` and the
  // index of the current slide within that array.
  const indexInAll = useMemo(
    () => (slide ? allSlides.findIndex((s) => s.id === slide.id) : -1),
    [allSlides, slide],
  );

  useEffect(() => {
    if (!slide) return;
    document.title = `${current}/${total} — ${slide.title}`;
  }, [slide, current, total]);

  useEffect(() => {
    if (!slide) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setPaletteOpen((o) => !o); return;
      }
      if (e.key === "F5") { e.preventDefault(); toggleFs(); return; }
      if (e.key === "Escape" && isFs) { exitFs(); return; }
      if (e.key === "j" || e.key === "J") { toggleTopJumper(); return; }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        if (slideStepCount(slide) > 1) {
          goTo(current, "forward", 2);
          return;
        }
        next(current);
      } else if (e.key === "ArrowLeft") {
        prev(current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slide, current, next, prev, goTo, isFs, toggleFs, exitFs, toggleTopJumper]);

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
              <RenderSlide slide={slide} step={0} />
            </SlideTransition>
          </ScaledSlide>
          {overlays}
        </div>
        <ControlBar
          slides={allSlides}
          index={indexInAll >= 0 ? indexInAll : 0}
          step={slideStepCount(slide) > 0 ? 0 : undefined}
          totalSteps={slideStepCount(slide) || undefined}
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
            <RenderSlide slide={slide} step={0} />
          </SlideTransition>
        </ScaledSlide>
        {overlays}
      </div>
      <ControlBar
        slides={allSlides}
        index={indexInAll >= 0 ? indexInAll : 0}
        step={slideStepCount(slide) > 0 ? 0 : undefined}
        totalSteps={slideStepCount(slide) || undefined}
        onOpenSettings={() => setSettingsOpen(true)}
        onPresent={toggleFs}
        isPresenting={isFs}
      />
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentSlideId={slide.id}
      />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        slides={allSlides}
        onOpenSettings={() => setSettingsOpen(true)}
        onPresent={toggleFs}
        onOpenLint={() => setLintOpen(true)}
      />
      <LintPanel open={lintOpen} onClose={() => setLintOpen(false)} deck={deck} />
      <PresenterTools index={indexInAll >= 0 ? indexInAll : 0} total={allSlides.length} deck={deck} />
    </div>
  );
}
