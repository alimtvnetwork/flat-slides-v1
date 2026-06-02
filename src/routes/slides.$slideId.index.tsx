import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useAnnotations } from "@/components/slides/annotations-store";
import { useAudience } from "@/components/slides/audience-store";
import { useAudienceSync } from "@/components/slides/useAudienceSync";
import { useChrome } from "@/components/slides/chrome-store";
import { AnnotationLayer } from "@/components/slides/controls/AnnotationLayer";
import { AnnotationToolbar } from "@/components/slides/controls/AnnotationToolbar";
import { PollResultsOverlay } from "@/components/slides/controls/PollResultsOverlay";
import { QrOverlay } from "@/components/slides/controls/QrOverlay";
import { SharePill } from "@/components/slides/controls/SharePill";
import { TimerOverlay } from "@/components/slides/controls/TimerOverlay";
import { useTimer } from "@/components/slides/timer-store";
import { usePresentationTimer } from "@/components/slides/usePresentationTimer";
import { CommandPalette } from "@/components/slides/CommandPalette";
import { CameraBubble } from "@/components/slides/controls/CameraBubble";
import { ControllerPill } from "@/components/slides/controls/ControllerPill";
import { DotPagination } from "@/components/slides/controls/DotPagination";
import { KeyboardShortcutsDialog } from "@/components/slides/controls/KeyboardShortcutsDialog";
import { PresenterToast } from "@/components/slides/controls/PresenterToast";
import { PresenterTopBar } from "@/components/slides/controls/PresenterTopBar";
import { SlideNumberBadge } from "@/components/slides/controls/SlideNumberBadge";
import { LintPanel } from "@/components/slides/LintPanel";
import { PresenterTools } from "@/components/slides/PresenterTools";
import { RenderSlide } from "@/components/slides/RenderSlide";
import { CameraStage } from "@/components/slides/CameraStage";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { SettingsDrawer } from "@/components/slides/SettingsDrawer";
import { SlideTransition } from "@/components/slides/SlideTransition";
import { useDeck } from "@/components/slides/store";
import { getDisplayNumber, slideStepCount } from "@/components/slides/types";
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

  // Drive the presentation timer; record dwell into the active slide bucket.
  usePresentationTimer();
  // Broadcast presenter state so audience tabs stay in sync.
  useAudienceSync({
    slideIndex: current,
    slideId: slide?.id ?? "",
    stepNum: 1,
    total,
    title: slide?.title,
  });
  useEffect(() => {
    if (!slide) return;
    document.title = `${current}/${total} — ${slide.title}`;
    useTimer.getState().setActiveSlide(slide.id);
    // Auto-start the timer on first slide visit so presenters never forget.
    if (!useTimer.getState().running && useTimer.getState().elapsed === 0) {
      useTimer.getState().start();
    }
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
      if (e.key === "l" || e.key === "L") {
        useAnnotations.setState((st) => ({ mode: st.mode === "pointer" ? "off" : "pointer" })); return;
      }
      if (e.key === "k" || e.key === "K") {
        useAnnotations.setState((st) => ({ mode: st.mode === "ink" ? "off" : "ink" })); return;
      }
      if (e.key === "x" || e.key === "X") { useAnnotations.getState().clear(slide.id); return; }
      if (e.key === "Escape") { useAnnotations.setState({ mode: "off" }); /* fallthrough */ }
      if (/^[1-5]$/.test(e.key)) {
        const colors = ["#ef4444","#facc15","#22d3ee","#a3e635","#ffffff"];
        useAnnotations.setState({ color: colors[Number(e.key) - 1] }); return;
      }
      if (e.key === "t" || e.key === "T") {
        if (e.shiftKey) { useTimer.getState().reset(); return; }
        useChrome.getState().toggleTimerVisible(); return;
      }
      if (e.key === "r" || e.key === "R") {
        if (e.shiftKey) { useTimer.getState().resetRehearsal(); return; }
        useTimer.getState().toggleRehearsal(); return;
      }
      if (e.key === " " && e.shiftKey) { e.preventDefault(); useTimer.getState().toggle(); return; }
      if (e.key === "?" || e.key === "/") { e.preventDefault(); setHelpOpen((o) => !o); return; }
      if (e.key === "q" || e.key === "Q") { useAudience.getState().toggleQr(); return; }
      if (e.key === "v" || e.key === "V") { useAudience.getState().toggleResults(); return; }
      if (e.key === "y" || e.key === "Y") {
        const sid = useAudience.getState().sessionId;
        const url = `${window.location.origin}/slides/${current}?session=${sid}`;
        navigator.clipboard?.writeText(url).then(
          () => useChrome.getState().flashToast("Share link copied"),
          () => useChrome.getState().flashToast("Copy failed"),
        );
        return;
      }
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
      <SlideNumberBadge current={current} total={total} display={slide ? getDisplayNumber(slide, current) : undefined} />
      <AnnotationLayer slideId={slide.id} />
      <AnnotationToolbar slideId={slide.id} />
      <TimerOverlay slide={slide} />
      <PollResultsOverlay slide={slide} />
      <SharePill current={current} />
      <QrOverlay />
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
          <div
            style={{ opacity: scene === "cam-only" ? 0.05 : scene === "split" ? 0.75 : 1, transition: "opacity 300ms ease" }}
            className="absolute inset-0"
          >
            <ScaledSlide fitPadding={36}>
              <SlideTransition transitionKey={slide.id} allowZoom={slide.type === "center" && slide.display === true}>
                <CameraStage slide={slide} step={1}><RenderSlide slide={slide} step={0} /></CameraStage>
              </SlideTransition>
            </ScaledSlide>
          </div>
          {surfaces}
        </div>
        {controller}
        <CameraBubble />
        <PresenterToast />
        <KeyboardShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
        <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} currentSlideId={slide.id} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden flex-col bg-black">
      <div className="relative min-h-0 flex-1">
        <div
          style={{ opacity: scene === "cam-only" ? 0.05 : scene === "split" ? 0.75 : 1, transition: "opacity 300ms ease" }}
          className="absolute inset-0"
        >
          <ScaledSlide fitPadding={36}>
            <SlideTransition transitionKey={slide.id} allowZoom={slide.type === "center" && slide.display === true}>
              <CameraStage slide={slide} step={1}><RenderSlide slide={slide} step={0} /></CameraStage>
            </SlideTransition>
          </ScaledSlide>
        </div>
        {surfaces}
      </div>
      {controller}
      <CameraBubble />
      <PresenterToast />
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
