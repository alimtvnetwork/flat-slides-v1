import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { CommandPalette } from "@/components/slides/CommandPalette";
import { ControlBar } from "@/components/slides/ControlBar";
import { LintPanel } from "@/components/slides/LintPanel";
import { PresenterTools } from "@/components/slides/PresenterTools";
import { RenderSlide } from "@/components/slides/RenderSlide";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { SettingsDrawer } from "@/components/slides/SettingsDrawer";
import { SlideTransition } from "@/components/slides/SlideTransition";
import { useDeck } from "@/components/slides/store";
import { slideStepCount } from "@/components/slides/types";
import { useFullscreen } from "@/components/slides/useFullscreen";

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
  const slides = deck.slides;
  const index = Math.max(0, (parseInt(slideId, 10) || 0) - 1);
  const slide = index >= 0 && index < slides.length ? slides[index] : undefined;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [lintOpen, setLintOpen] = useState(false);
  const { isFs, toggle: toggleFs, exit: exitFs } = useFullscreen();

  useEffect(() => {
    if (!slide) return;
    document.title = `${index + 1}/${slides.length} — ${slide.title}`;
  }, [slide, index, slides.length]);

  useEffect(() => {
    if (!slide) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setPaletteOpen((o) => !o); return;
      }
      if (e.key === "F5") { e.preventDefault(); toggleFs(); return; }
      if (e.key === "Escape" && isFs) { exitFs(); return; }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        if (slideStepCount(slide) > 1) {
          navigate({
            to: "/slides/$slideId/$step",
            params: { slideId: String(index + 1), step: "2" },
          });
          return;
        }
        if (index + 1 < slides.length) {
          navigate({ to: "/slides/$slideId", params: { slideId: String(index + 2) } });
        }
      } else if (e.key === "ArrowLeft") {
        if (index > 0) {
          navigate({ to: "/slides/$slideId", params: { slideId: String(index) } });
        }
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

  if (isFs) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-black">
        <div className="relative flex-1">
          <ScaledSlide fitPadding={36}>
            <SlideTransition transitionKey={slide.id} allowZoom={slide.type === "center" && slide.display === true}>
              <RenderSlide slide={slide} step={0} />
            </SlideTransition>
          </ScaledSlide>
        </div>
        <ControlBar
          slides={slides}
          index={index}
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
      </div>
      <ControlBar
        slides={slides}
        index={index}
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
        slides={slides}
        onOpenSettings={() => setSettingsOpen(true)}
        onPresent={toggleFs}
        onOpenLint={() => setLintOpen(true)}
      />
      <LintPanel open={lintOpen} onClose={() => setLintOpen(false)} deck={deck} />
      <PresenterTools index={index} total={slides.length} deck={deck} />
    </div>
  );
}
