import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

import { useAudienceSync } from "@/components/slides/useAudienceSync";
import { useChrome } from "@/components/slides/chrome-store";
import { AnnotationLayer } from "@/components/slides/controls/AnnotationLayer";
import { FocusEditor } from "@/components/slides/controls/FocusEditor";
import { QrOverlay } from "@/components/slides/controls/QrOverlay";
import { useDeck } from "@/components/slides/store";
import { useTimer } from "@/components/slides/timer-store";
import { usePresentationTimer } from "@/components/slides/usePresentationTimer";
import { ControllerPill } from "@/components/slides/controls/ControllerPill";
import { dispatchPresenterKey } from "@/components/slides/presenterActions";
import { KeyboardShortcutsDialog } from "@/components/slides/controls/KeyboardShortcutsDialog";
import { PresenterToast } from "@/components/slides/controls/PresenterToast";
import { PresenterAutoStart } from "@/components/slides/controls/PresenterAutoStart";
import { PresenterFallbackLink } from "@/components/slides/controls/PresenterFallbackLink";
import { SlideNumberBadge } from "@/components/slides/controls/SlideNumberBadge";
import { RenderSlide } from "@/components/slides/RenderSlide";
import { CameraStage } from "@/components/slides/CameraStage";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { SlideAriaAnnouncer } from "@/components/slides/controls/SlideAriaAnnouncer";
import { PresenterShell, SlideStageShell } from "@/components/slides/PresenterShell";
import { SlideTransition } from "@/components/slides/SlideTransition";
import { getDisplayNumber, slideStepCount } from "@/components/slides/types";
import { useFullscreen } from "@/components/slides/useFullscreen";
import { emitSlidesEvent, installConsoleSink } from "@/components/slides/telemetry";
import { SLIDES_FULLSCREEN_URL_CHANGE_EVENT, type SlidesFullscreenUrlChangeDetail, useSlideNavigation } from "@/components/slides/useSlideNavigation";

const CommandPalette = lazy(() =>
  import("@/components/slides/CommandPalette").then((m) => ({ default: m.CommandPalette })),
);
const LintPanel = lazy(() =>
  import("@/components/slides/LintPanel").then((m) => ({ default: m.LintPanel })),
);
const SettingsDrawer = lazy(() =>
  import("@/components/slides/SettingsDrawer").then((m) => ({ default: m.SettingsDrawer })),
);

const SLIDE_NAVIGATION_COOLDOWN_MS = 650;

export function SlidePresenterPage({ slideId }: { slideId: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [fullscreenPathname, setFullscreenPathname] = useState<string | null>(null);
  const fullscreenPathnameRef = useRef<string | null>(null);
  const lastNavigationAtRef = useRef(0);
  const pressedNavigationKeysRef = useRef<Set<string>>(new Set());
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
  const setSlideMusic = useChrome((s) => s.setSlideMusic);
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
    const override = slide?.sound?.music;
    setSlideMusic(override ? { url: override.url, loop: override.loop, volume: override.volume } : null);
    return () => setSlideMusic(null);
  }, [slide?.id, slide?.sound?.music?.url, slide?.sound?.music?.loop, slide?.sound?.music?.volume, setSlideMusic]);

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
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      const targetUsesNativeActivation = Boolean(target?.closest("button,a,select,[role='button'],[role='menuitem'],[role='slider']"));
      if (targetUsesNativeActivation && (e.key === "Enter" || e.key === " " || e.code === "Space" || e.key === "Spacebar")) return;
      if (settingsOpen || paletteOpen || lintOpen || helpOpen) return;
      if (isHiddenPresenterChromeShortcut(e)) return;
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
      // Modifier-combo branches that don't fit the per-key registry shape.
      if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown")) return;
      if (e.shiftKey && (e.key === "c" || e.key === "C")) { cycleCameraSize(); return; }
      if (e.key === " " && e.shiftKey) { e.preventDefault(); useTimer.getState().toggle(); return; }

      // Step 26 — single keymap. SHORTCUTS owns the keys, presenterActions
      // owns the side-effects. Everything below (except the navigation
      // arrows) flows through dispatchPresenterKey.
      const matched = dispatchPresenterKey({
        event: e,
        slideId: slide.id,
        current,
        isStepRoute,
        stepNum,
        toggleFullscreen: toggleFs,
        toggleTopJumper,
        toggleCamera,
        toggleMusic,
        cycleScene,
        openOverview: openDeckOverview,
        openHelp: () => setHelpOpen((o) => !o),
      });
      if (matched && matched.id !== "nav-prev" && matched.id !== "nav-next") return;

      const isForwardKey = e.key === "ArrowRight" || e.key === " " || e.code === "Space" || e.key === "Spacebar" || e.key === "Enter";
      if (isForwardKey) {
        e.preventDefault();
        if (!claimNavigationKey(e)) return;
        goNextStepAware();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (!claimNavigationKey(e)) return;
        goPrevStepAware();
      }
    };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => keyHandlerRef.current(event);
    const onKeyUp = (event: KeyboardEvent) => {
      pressedNavigationKeysRef.current.delete(getNavigationKeyId(event));
    };
    window.addEventListener("keydown", onKey, { capture: true });
    window.addEventListener("keyup", onKeyUp, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKeyUp, true);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleNavButtonEvent = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>('button[data-slide-nav="next"],button[data-slide-nav="prev"]');
      if (!button || button.disabled) return;
      const action = button.dataset.slideNav;
      if (action !== "next" && action !== "prev") return;
      const handledAt = Number(button.dataset.slideNavHandledAt ?? 0);
      event.preventDefault();
      event.stopPropagation();
      if (Date.now() - handledAt < 700) return;
      button.blur();
      button.dataset.slideNavHandledAt = String(Date.now());
      if (action === "next") moveNextStepAware();
      else movePrevStepAware();
    };
    document.addEventListener("pointerup", handleNavButtonEvent, true);
    document.addEventListener("click", handleNavButtonEvent, true);
    return () => {
      document.removeEventListener("pointerup", handleNavButtonEvent, true);
      document.removeEventListener("click", handleNavButtonEvent, true);
    };
  });

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
    movePrevStepAware();
  }

  function goNextStepAware() {
    if (!claimNavigationSlot()) return;
    moveNextStepAware();
  }

  function movePrevStepAware() {
    if (isStepRoute && stepNum > 0) {
      const target = stepNum;
      if (target <= 1) goTo(current, "backward");
      else goTo(current, "backward", target);
    } else {
      prev(current);
    }
  }

  function moveNextStepAware() {
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

  function claimNavigationKey(event: KeyboardEvent) {
    if (event.repeat) return false;
    const keyId = getNavigationKeyId(event);
    if (pressedNavigationKeysRef.current.has(keyId)) return false;
    pressedNavigationKeysRef.current.add(keyId);
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
      <QrOverlay />
    </>
  );

  const controller = (
    <ControllerPill
      current={current}
      total={total}
        onPrev={movePrevStepAware}
        onNext={moveNextStepAware}
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
          <ScaledSlide fitPadding={isFs ? 0 : 36}>
            <SlideTransition transitionKey={slide.id} transitionKind={deck.settings.transition} slide={slide} isFullscreen={isFs}>
              <CameraStage slide={slide} step={cameraStep}><RenderSlide slide={slide} step={stepNum} /></CameraStage>
            </SlideTransition>
          </ScaledSlide>
        </div>
        {surfaces}
      </SlideStageShell>
      {controller}
      <PresenterToast />
      <PresenterFallbackLink />
      <PresenterAutoStart />
      {settingsOpen && (
        <Suspense fallback={null}>
          <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} currentSlideId={slide.id} />
        </Suspense>
      )}
      <SlideAriaAnnouncer current={current} total={total} step={isStepRoute ? stepNum + 1 : undefined} stepCount={isStepRoute ? stepCount : undefined} title={slide.title} />
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

function getNavigationKeyId(event: KeyboardEvent) {
  return event.code || event.key;
}

function isHiddenPresenterChromeShortcut(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  const key = event.key.toLowerCase();
  if (["j", "c", "m", "s", "t", "q", "p", "n"].includes(key)) {
    event.preventDefault();
    return true;
  }
  return false;
}