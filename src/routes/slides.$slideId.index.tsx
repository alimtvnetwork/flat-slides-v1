import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useChrome } from "@/components/slides/chrome-store";
import { CommandPalette } from "@/components/slides/CommandPalette";
import { CameraBubble } from "@/components/slides/controls/CameraBubble";
import { ControllerPill } from "@/components/slides/controls/ControllerPill";
import { DotPagination } from "@/components/slides/controls/DotPagination";
import { KeyboardShortcutsDialog } from "@/components/slides/controls/KeyboardShortcutsDialog";
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
  const [helpOpen, setHelpOpen] = useState(false);
  const { isFs, toggle: toggleFs, exit: exitFs } = useFullscreen();
  const toggleTopJumper = useChrome((s) => s.toggleTopJumper);
  const toggleCamera = useChrome((s) => s.toggleCamera);
  const cycleCameraSize = useChrome((s) => s.cycleCameraSize);
  const toggleMusic = useChrome((s) => s.toggleMusic);
  const cycleScene = useChrome((s) => s.cycleScene);
  const scene = useChrome((s) => s.scene);

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
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "F5") { e.preventDefault(); toggleFs(); return; }
      if (e.key === "Escape" && isFs) { exitFs(); return; }
      if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown")) return;
      if (e.shiftKey && (e.key === "c" || e.key === "C")) { cycleCameraSize(); return; }
      if (e.key === "j" || e.key === "J") { toggleTopJumper(); return; }
      if (e.key === "c" || e.key === "C") { toggleCamera(); return; }
      if (e.key === "m" || e.key === "M") { toggleMusic(); return; }
      if (e.key === "s" || e.key === "S") { cycleScene(); return; }
      if (e.key === "p" || e.key === "P") { window.dispatchEvent(new CustomEvent("slides:camera-pip")); return; }
      if (e.key === "?" || e.key === "/") { e.preventDefault(); setHelpOpen((o) => !o); return; }
      if (e.key === "g" || e.key === "G") { navigate({ to: "/slides" }); return; }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        if (slideStepCount(slide) > 1) { goTo(current, "forward", 2); return; }
        next(current);
      } else if (e.key === "ArrowLeft") {
        prev(current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slide, current, next, prev, goTo, isFs, toggleFs, exitFs, toggleTopJumper, toggleCamera, cycleCameraSize, toggleMusic, cycleScene, navigate]);

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

  const surfaces = (
    <>
      <PresenterTopBar current={current} total={total} onPrev={() => prev(current)} onNext={() => next(current)} />
      <DotPagination current={current} total={total} slides={linearSlides} onJump={jump} />
      <SlideNumberBadge current={current} total={total} />
    </>
  );

  const controller = (
    <ControllerPill
      current={current}
      total={total}
      onPrev={() => prev(current)}
      onNext={() => next(current)}
      onJump={jump}
      onOpenGrid={() => navigate({ to: "/slides" })}
      onToggleFullscreen={toggleFs}
      onOpenHelp={() => setHelpOpen(true)}
      onOpenSettings={() => setSettingsOpen(true)}
      isFullscreen={isFs}
    />
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
          {surfaces}
        </div>
        {controller}
        <CameraBubble />
        <KeyboardShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
        <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} currentSlideId={slide.id} />
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
        {surfaces}
      </div>
      {controller}
      <CameraBubble />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} currentSlideId={slide.id} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        slides={allSlides}
        onOpenSettings={() => setSettingsOpen(true)}
        onPresent={toggleFs}
        onOpenLint={() => setLintOpen(true)}
      />
      <KeyboardShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <LintPanel open={lintOpen} onClose={() => setLintOpen(false)} deck={deck} />
      <PresenterTools index={index} total={total} deck={deck} />
    </div>
  );
}
