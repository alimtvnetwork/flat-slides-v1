import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

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
import { PresenterFallbackLink } from "@/components/slides/controls/PresenterFallbackLink";
import { PresenterTopBar } from "@/components/slides/controls/PresenterTopBar";
import { SlideNumberBadge } from "@/components/slides/controls/SlideNumberBadge";
import { RenderSlide } from "@/components/slides/RenderSlide";
import { CameraStage } from "@/components/slides/CameraStage";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { PresenterNotesPeek } from "@/components/slides/controls/PresenterNotesPeek";
import { SlideAriaAnnouncer } from "@/components/slides/controls/SlideAriaAnnouncer";
import { PresenterShell, SlideStageShell } from "@/components/slides/PresenterShell";
import { SlideTransition } from "@/components/slides/SlideTransition";
import { getDisplayNumber, slideStepCount } from "@/components/slides/types";
import { useFullscreen } from "@/components/slides/useFullscreen";
import { emitSlidesEvent, installConsoleSink } from "@/components/slides/telemetry";
import { SLIDES_FULLSCREEN_URL_CHANGE_EVENT, type SlidesFullscreenUrlChangeDetail, useSlideNavigation } from "@/components/slides/useSlideNavigation";
import { PresenterTools } from "@/components/slides/PresenterTools";

const CommandPalette = lazy(() =>
  import("@/components/slides/CommandPalette").then((m) => ({ default: m.CommandPalette })),
);
const LintPanel = lazy(() =>
  import("@/components/slides/LintPanel").then((m) => ({ default: m.LintPanel })),
);
const SettingsDrawer = lazy(() =>
  import("@/components/slides/SettingsDrawer").then((m) => ({ default: m.SettingsDrawer })),
);

const SLIDE_NAVIGATION_COOLDOWN_MS = 280;

export function SlidePresenterPage({ slideId }: { slideId: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [fullscreenPathname, setFullscreenPathname] = useState<string | null>(null);
  const fullscreenPathnameRef = useRef<string | null>(null);
  const lastNavigationAtRef = useRef(0);
  const keyHandlerRef = useRef<(event: KeyboardEvent) => void>(() => {});
  const deck = useDeck((s) => s.deck);
  const allSlides = deck.slides;
  const { linearSlides, total, next, prev, jump, goTo } = useSlideNavigation();
  const effectivePathname = fullscreenPathname ?? location.pathname;
  const effectiveSlideId = getRouteSlideId(effectivePathname) ?? slideId;
  const index = Math.max(0, (parseInt(effectiveSlideId, 10) || 0) - 1);
  const slide = index >= 0 && index < linearSlides.length ? linearSlides[index] : undefined;
  const current = index + 1;
  const stepCount = slide ? slideStepCount(slide) : 0;
  const routeStep = getRouteStep(effectivePathname);
  const isStepRoute = routeStep !== null && stepCount > 0;
  const requestedStep = routeStep ?? 1;
  const stepNum = Math.max(0, Math.min(requestedStep - 1, Math.max(0, stepCount - 1)));
  const cameraStep = isStepRoute ? stepNum + 1 : 0;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [lintOpen, setLintOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { isFs, toggle: toggleFs } = useFullscreen();
  const toggleTopJumper = useChrome((s) => s.toggleTopJumper);
  const toggleCamera = useChrome((s) => s.toggleCamera);
  const cycleCameraSize = useChrome((s) => s.cycleCameraSize);
  const toggleMusic = useChrome((s) => s.toggleMusic);
  const cycleScene = useChrome((s) => s.cycleScene);
  const scene = useChrome((s) => s.scene);
  const focusEditorOpen = useChrome((s) => s.focusEditorOpen);

  usePresentationTimer();
  useAudienceSync({
    slideIndex: current,
    slideId: slide?.id ?? "",
    stepNum: isStepRoute ? stepNum + 1 : 1,
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
    if (isStepRoute && stepCount > 1) emitSlidesEvent({ type: "step-change", current, step: stepNum + 1, stepCount });
  }, [current, isStepRoute, stepNum, stepCount]);

  useEffect(() => {
    emitSlidesEvent({ type: "scene-change", scene });
  }, [scene]);

  useEffect(() => installConsoleSink(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncFullscreenRoute = (pathname: string) => {
      const slideId = getRouteSlideId(pathname);
      if (!slideId) return;
      const step = getRouteStep(pathname);
      if (step && step > 1) {
        void navigate({ to: "/slides/$slideId/$step", params: { slideId, step: String(step) }, search: location.search as never, replace: true });
      } else {
        void navigate({ to: "/slides/$slideId", params: { slideId }, search: location.search as never, replace: true });
      }
    };
    const onFullscreenUrlChange = (event: Event) => {
      const pathname = (event as CustomEvent<SlidesFullscreenUrlChangeDetail>).detail?.pathname;
      if (!pathname) return;
      if (document.fullscreenElement) {
        fullscreenPathnameRef.current = pathname;
        setFullscreenPathname(pathname);
        return;
      }
      syncFullscreenRoute(pathname);
    };
    const onFullscreenChange = () => {
      if (document.fullscreenElement) {
        fullscreenPathnameRef.current = fullscreenPathnameRef.current ?? location.pathname;
        setFullscreenPathname(fullscreenPathnameRef.current);
        return;
      }
      const pathname = fullscreenPathnameRef.current;
      fullscreenPathnameRef.current = null;
      setFullscreenPathname(null);
      if (pathname && pathname !== location.pathname) syncFullscreenRoute(pathname);
    };
    onFullscreenChange();
    window.addEventListener(SLIDES_FULLSCREEN_URL_CHANGE_EVENT, onFullscreenUrlChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      window.removeEventListener(SLIDES_FULLSCREEN_URL_CHANGE_EVENT, onFullscreenUrlChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [location.pathname, location.search, navigate]);

  keyHandlerRef.current = (e: KeyboardEvent) => {
      if (!slide) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (settingsOpen || paletteOpen || lintOpen || helpOpen) return;
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault(); setLintOpen((o) => !o); return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setPaletteOpen((o) => !o); return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        if (e.shiftKey) void import("@/components/slides/exportAnnotations").then((m) => m.downloadAnnotations());
        else void import("@/components/slides/exportRehearsal").then((m) => m.downloadRehearsalReport(deck.title));
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "F5") { e.preventDefault(); toggleFs(); return; }
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
      if (e.key === "p" || e.key === "P") { window.dispatchEvent(new CustomEvent("slides:camera-pip")); return; }
      if (e.key === "l" || e.key === "L") { useAnnotations.setState((st) => ({ mode: st.mode === "pointer" ? "off" : "pointer" })); return; }
      if (e.key === "k" || e.key === "K") { useAnnotations.setState((st) => ({ mode: st.mode === "ink" ? "off" : "ink" })); return; }
      if (e.key === "x" || e.key === "X") { useAnnotations.getState().clear(slide.id); return; }
      if (e.key === "Escape") { e.preventDefault(); useAnnotations.setState({ mode: "off" }); return; }
      if (/^[1-5]$/.test(e.key)) {
        const colors = ["#ef4444", "#facc15", "#22d3ee", "#a3e635", "#ffffff"];
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
        const url = `${window.location.origin}/slides/${current}${isStepRoute ? `/${stepNum + 1}` : ""}?session=${sid}`;
        navigator.clipboard?.writeText(url).then(
          () => useChrome.getState().flashToast("Share link copied"),
          () => useChrome.getState().flashToast("Copy failed"),
        );
        return;
      }
      if (e.key === "f" || e.key === "F") { useChrome.getState().toggleFocusEditor(); return; }
      if (e.key === "g" || e.key === "G") { e.preventDefault(); openDeckOverview(); return; }
      const isForwardKey = e.key === "ArrowRight" || e.key === " " || e.code === "Space" || e.key === "Spacebar" || e.key === "Enter";
      if (isForwardKey) {
        e.preventDefault();
        if (e.repeat) return;
        goNextStepAware();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (e.repeat) return;
        goPrevStepAware();
      }
    };
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => keyHandlerRef.current(event);
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  if (!slide) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="mb-4">Slide not found.</p>
          <Link to="/slides" className="underline">Back to deck</Link>
        </div>
      </div>
    );
  }

  function goPrevStepAware() {
    if (!claimNavigationSlot()) return;
    if (isStepRoute && stepNum > 0) {
      const target = stepNum;
      if (target <= 1) goTo(current, "backward");
      else goTo(current, "backward", target);
    } else {
      prev(current);
    }
  }

  function goNextStepAware() {
    if (!claimNavigationSlot()) return;
    if (!isStepRoute && stepCount > 1) goTo(current, "forward", 2);
    else if (isStepRoute && stepNum < stepCount - 1) goTo(current, "forward", stepNum + 2);
    else next(current);
  }

  function claimNavigationSlot() {
    const now = typeof performance === "undefined" ? Date.now() : performance.now();
    if (now - lastNavigationAtRef.current < SLIDE_NAVIGATION_COOLDOWN_MS) return false;
    lastNavigationAtRef.current = now;
    return true;
  }

  function openDeckOverview() {
    if (typeof document !== "undefined" && document.fullscreenElement) {
      void document.exitFullscreen().finally(() => navigate({ to: "/slides" }));
      return;
    }
    navigate({ to: "/slides" });
  }

  const focusStep = Math.max(1, cameraStep || 1);
  const surfaces = (
    <>
      <PresenterTopBar current={current} total={total} onPrev={goPrevStepAware} onNext={goNextStepAware} />
      <DotPagination current={current} total={total} slides={linearSlides} onJump={jump} />
      <SlideNumberBadge current={current} total={total} display={getDisplayNumber(slide, current)} />
      <AnnotationLayer slideId={slide.id} />
      <FocusEditor
        slide={slide}
        active={focusEditorOpen}
        onRect={(rect: { x: number; y: number; w: number; h: number }) => {
          const stepBoundRect = stepCount > 0 ? { ...rect, step: focusStep } : rect;
          useDeck.getState().upsertSlide({ ...slide, focus: [...(slide.focus ?? []), stepBoundRect] });
          useChrome.getState().flashToast("Focus region added");
        }}
        onPopRegion={() => {
          const nextFocus = (slide.focus ?? []).slice(0, -1);
          useDeck.getState().upsertSlide({ ...slide, focus: nextFocus.length ? nextFocus : undefined });
          useChrome.getState().flashToast("Removed last focus region");
        }}
        onClose={() => useChrome.getState().setFocusEditorOpen(false)}
      />
      <AnnotationToolbar slideId={slide.id} />
      <TimerOverlay slide={slide} />
      <PollResultsOverlay slide={slide} />
      <SharePill current={current} step={isStepRoute ? stepNum + 1 : undefined} />
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
      onOpenGrid={openDeckOverview}
      onToggleFullscreen={toggleFs}
      onOpenHelp={() => setHelpOpen(true)}
      onOpenSettings={() => setSettingsOpen(true)}
      isFullscreen={isFs}
      canPrev={isStepRoute ? current > 1 || stepNum > 0 : current > 1}
      canNext={isStepRoute ? current < total || stepNum < stepCount - 1 : stepCount > 1 || current < total}
    />
  );

  return (
    <PresenterShell isFullscreen={isFs}>
      <SlideStageShell>
        <div
          style={{ opacity: scene === "cam-only" ? 0.05 : scene === "split" ? 0.75 : 1, transition: "opacity 300ms ease" }}
          className="absolute inset-0"
        >
          <ScaledSlide fitPadding={36}>
            <SlideTransition transitionKey={slide.id} transitionKind={deck.settings.transition} slide={slide}>
              <CameraStage slide={slide} step={cameraStep}><RenderSlide slide={slide} step={stepNum} /></CameraStage>
            </SlideTransition>
          </ScaledSlide>
        </div>
        {surfaces}
      </SlideStageShell>
      {controller}
      <CameraBubble />
      <PresenterToast />
      <PresenterFallbackLink />
      <PresenterAutoStart />
      {settingsOpen && (
        <Suspense fallback={null}>
          <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} currentSlideId={slide.id} />
        </Suspense>
      )}
      <SlideAriaAnnouncer current={current} total={total} step={isStepRoute ? stepNum + 1 : undefined} stepCount={isStepRoute ? stepCount : undefined} title={slide.title} />
      <PresenterNotesPeek notes={slide.notes} />
      {paletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette
            open={paletteOpen}
            onClose={() => setPaletteOpen(false)}
            slides={allSlides}
            onJump={jump}
            onOpenOverview={openDeckOverview}
            onOpenSettings={() => setSettingsOpen(true)}
            onPresent={toggleFs}
            onOpenLint={() => setLintOpen(true)}
          />
        </Suspense>
      )}
      <KeyboardShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      {lintOpen && (
        <Suspense fallback={null}>
          <LintPanel open={lintOpen} onClose={() => setLintOpen(false)} deck={deck} />
        </Suspense>
      )}
      {!isFs && <PresenterTools index={index} total={total} deck={deck} />}
    </PresenterShell>
  );
}

function getRouteStep(pathname: string) {
  const match = pathname.match(/^\/slides\/[^/]+\/(\d+)(?:\/)?$/);
  if (!match) return null;
  const step = parseInt(match[1], 10);
  return Number.isFinite(step) ? step : null;
}

function getRouteSlideId(pathname: string) {
  const match = pathname.match(/^\/slides\/(\d+)(?:\/\d+)?(?:\/)?$/);
  return match?.[1] ?? null;
}