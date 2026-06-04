import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

import { useAnnotations } from "@/components/slides/annotations-store";
import { useAudience } from "@/components/slides/audience-store";
import { useAudienceSync } from "@/components/slides/useAudienceSync";
import { useChrome } from "@/components/slides/chrome-store";
import { AnnotationLayer } from "@/components/slides/controls/AnnotationLayer";
import { FocusEditor } from "@/components/slides/controls/FocusEditor";
import { AnnotationToolbar } from "@/components/slides/controls/AnnotationToolbar";
import { PollResultsOverlay } from "@/components/slides/controls/PollResultsOverlay";
import { QrOverlay } from "@/components/slides/controls/QrOverlay";
import { SharePill } from "@/components/slides/controls/SharePill";
import { TimerOverlay } from "@/components/slides/controls/TimerOverlay";
import { useDeck } from "@/components/slides/store";
import { useTimer } from "@/components/slides/timer-store";
import { usePresentationTimer } from "@/components/slides/usePresentationTimer";
import { CameraBubble } from "@/components/slides/controls/CameraBubble";
import { ControllerPill } from "@/components/slides/controls/ControllerPill";
import { DotPagination } from "@/components/slides/controls/DotPagination";
import { KeyboardShortcutsDialog } from "@/components/slides/controls/KeyboardShortcutsDialog";
import { PresenterToast } from "@/components/slides/controls/PresenterToast";
import { PresenterAutoStart } from "@/components/slides/controls/PresenterAutoStart";
import { PresenterTopBar } from "@/components/slides/controls/PresenterTopBar";
import { SlideNumberBadge } from "@/components/slides/controls/SlideNumberBadge";
import { RenderSlide } from "@/components/slides/RenderSlide";
import { CameraStage } from "@/components/slides/CameraStage";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
const SettingsDrawer = lazy(() =>
  import("@/components/slides/SettingsDrawer").then((m) => ({ default: m.SettingsDrawer })),
);
import { PresenterNotesPeek } from "@/components/slides/controls/PresenterNotesPeek";
import { SlideAriaAnnouncer } from "@/components/slides/controls/SlideAriaAnnouncer";
import { SlideTransition } from "@/components/slides/SlideTransition";
import { getDisplayNumber, slideStepCount } from "@/components/slides/types";
import { useFullscreen } from "@/components/slides/useFullscreen";
import { emitSlidesEvent } from "@/components/slides/telemetry";
import { useSlideNavigation } from "@/components/slides/useSlideNavigation";

export const Route = createFileRoute("/slides/$slideId/$step")({
  head: ({ params }) => ({
    meta: [{ title: `Slide ${params.slideId} · step ${params.step}` }],
  }),
  component: SlideStepPage,
});

function SlideStepPage() {
  const { slideId, step } = Route.useParams();
  const navigate = useNavigate();
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
  const [helpOpen, setHelpOpen] = useState(false);
  const { isFs, toggle: toggleFs } = useFullscreen();
  const toggleTopJumper = useChrome((s) => s.toggleTopJumper);
  const toggleCamera = useChrome((s) => s.toggleCamera);
  const scene = useChrome((s) => s.scene);
  const focusEditorOpen = useChrome((s) => s.focusEditorOpen);
  const cycleCameraSize = useChrome((s) => s.cycleCameraSize);
  const toggleMusic = useChrome((s) => s.toggleMusic);
  const cycleScene = useChrome((s) => s.cycleScene);

  usePresentationTimer();
  useAudienceSync({
    slideIndex: current,
    slideId: slide?.id ?? "",
    stepNum: stepNum + 1,
    total,
    title: slide?.title,
  });
  useEffect(() => {
    if (!slide) return;
    document.title = `${current}/${total} — ${slide.title}`;
    useTimer.getState().setActiveSlide(slide.id);
    if (!useTimer.getState().running && useTimer.getState().elapsed === 0) {
      useTimer.getState().start();
    }
    emitSlidesEvent({ type: "slide-change", current, total, slideId: slide.id, title: slide.title });
  }, [slide, current, total]);

  useEffect(() => {
    if (stepCount > 1) emitSlidesEvent({ type: "step-change", current, step: stepNum + 1, stepCount });
  }, [current, stepNum, stepCount]);

  useEffect(() => {
    emitSlidesEvent({ type: "scene-change", scene });
  }, [scene]);

  useEffect(() => {
    if (!slide || stepCount === 0) return;
    const last = stepCount - 1;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (settingsOpen || helpOpen) return;
      if ((e.metaKey || e.ctrlKey) && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        if (e.shiftKey) { void import("@/components/slides/exportAnnotations").then((m) => m.downloadAnnotations()); }
        else { void import("@/components/slides/exportRehearsal").then((m) => m.downloadRehearsalReport(useDeck.getState().deck.title)); }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "F5") { e.preventDefault(); toggleFs(); return; }
      // Shift+arrows are handled by CameraBubble (nudge) — don't double-trigger nav.
      if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown")) return;
      if (e.shiftKey && (e.key === "c" || e.key === "C")) { cycleCameraSize(); return; }
      if (e.key === "j" || e.key === "J") { toggleTopJumper(); return; }
      if (e.key === "c" || e.key === "C") { toggleCamera(); return; }
      if (e.key === "o" || e.key === "O") {
        if (!useChrome.getState().camera.visible) useChrome.getState().cycleCameraShape();
        return;
      }
      if (e.key === "m" || e.key === "M") { toggleMusic(); return; }
      if (e.key === "s" || e.key === "S") { cycleScene(); return; }
      if (e.key === "p" || e.key === "P") {
        window.dispatchEvent(new CustomEvent("slides:camera-pip"));
        return;
      }
      if (e.key === "l" || e.key === "L") {
        useAnnotations.setState((st) => ({ mode: st.mode === "pointer" ? "off" : "pointer" })); return;
      }
      if (e.key === "k" || e.key === "K") {
        useAnnotations.setState((st) => ({ mode: st.mode === "ink" ? "off" : "ink" })); return;
      }
      if (e.key === "x" || e.key === "X") { useAnnotations.getState().clear(slide!.id); return; }
      if (e.key === "Escape") { e.preventDefault(); useAnnotations.setState({ mode: "off" }); return; }
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
        const url = `${window.location.origin}/slides/${current}/${stepNum + 1}?session=${sid}`;
        navigator.clipboard?.writeText(url).then(
          () => useChrome.getState().flashToast("Share link copied"),
          () => useChrome.getState().flashToast("Copy failed"),
        );
        return;
      }
      if (e.key === "f" || e.key === "F") { useChrome.getState().toggleFocusEditor(); return; }
      if (e.key === "g" || e.key === "G") { e.preventDefault(); navigate({ to: "/slides" }); return; }
      const isForwardKey = e.key === "ArrowRight" || e.key === " " || e.code === "Space" || e.key === "Spacebar" || e.key === "Enter";
      if (isForwardKey) {
        e.preventDefault();
        if (stepNum < last) goTo(current, "forward", stepNum + 2);
        else next(current);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (stepNum > 0) {
          const target = stepNum;
          if (target <= 1) goTo(current, "backward");
          else goTo(current, "backward", target);
        } else {
          prev(current);
        }
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, true);
  }, [slide, stepCount, stepNum, current, next, prev, goTo, toggleFs, toggleTopJumper, toggleCamera, cycleCameraSize, toggleMusic, cycleScene, navigate, settingsOpen, helpOpen]);

  if (!slide || slideStepCount(slide) === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black text-white">
        <Link to="/slides" className="underline">Back to deck</Link>
      </div>
    );
  }

  const goPrevStepAware = () => {
    if (stepNum > 0) {
      const target = stepNum;
      if (target <= 1) goTo(current, "backward");
      else goTo(current, "backward", target);
    } else {
      prev(current);
    }
  };
  const goNextStepAware = () => {
    const last = stepCount - 1;
    if (stepNum < last) goTo(current, "forward", stepNum + 2);
    else next(current);
  };

  const surfaces = (
    <>
      <PresenterTopBar current={current} total={total} onPrev={goPrevStepAware} onNext={goNextStepAware} />
      <DotPagination current={current} total={total} slides={linearSlides} onJump={jump} />
      <SlideNumberBadge current={current} total={total} display={slide ? getDisplayNumber(slide, current) : undefined} />
      <AnnotationLayer slideId={slide.id} />
      <FocusEditor
        slide={slide}
        active={focusEditorOpen}
        onRect={(rect: { x: number; y: number; w: number; h: number }) => {
          useDeck.getState().upsertSlide({ ...slide, focus: [...(slide.focus ?? []), rect] });
          useChrome.getState().flashToast("Focus region added");
        }}
        onClose={() => useChrome.getState().setFocusEditorOpen(false)}
      />
      <AnnotationToolbar slideId={slide.id} />
      <TimerOverlay slide={slide} />
      <PollResultsOverlay slide={slide} />
      <SharePill current={current} step={stepNum + 1} />
      <QrOverlay />
    </>
  );

  const controller = (
    <ControllerPill
      current={current}
      total={total}
      onPrev={goPrevStepAware}
      onNext={goNextStepAware}
      onJump={jump}
      onOpenGrid={() => navigate({ to: "/slides" })}
      onToggleFullscreen={toggleFs}
      onOpenHelp={() => setHelpOpen(true)}
      onOpenSettings={() => setSettingsOpen(true)}
      isFullscreen={isFs}
      canPrev={current > 1 || stepNum > 0}
      canNext={current < total || stepNum < stepCount - 1}
    />
  );

  const slideOpacity = scene === "cam-only" ? 0.05 : scene === "split" ? 0.75 : 1;
  const slideStage = (
    <div style={{ opacity: slideOpacity, transition: "opacity 300ms ease" }} className="absolute inset-0">
      <ScaledSlide fitPadding={36}>
        <SlideTransition transitionKey={slide.id}>
          <CameraStage slide={slide} step={stepNum + 1}><RenderSlide slide={slide} step={stepNum} /></CameraStage>
        </SlideTransition>
      </ScaledSlide>
    </div>
  );

  return (
    <div
      data-slide-presenter-root
      className={`${isFs ? "fixed inset-0 z-[200]" : "h-dvh"} flex overflow-hidden flex-col bg-black`}
    >
      <div className="relative min-h-0 flex-1">
        {slideStage}
        {surfaces}
      </div>
      {controller}
      <CameraBubble />
      <PresenterToast />
      <KeyboardShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      {settingsOpen && (
        <Suspense fallback={null}>
          <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} currentSlideId={slide.id} />
        </Suspense>
      )}
      <SlideAriaAnnouncer current={current} total={total} step={stepNum + 1} stepCount={stepCount} title={slide.title} />
      <PresenterNotesPeek notes={slide.notes} />
    </div>
  );
}
