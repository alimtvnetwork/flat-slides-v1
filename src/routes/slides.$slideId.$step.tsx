import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useChrome } from "@/components/slides/chrome-store";
import { CameraBubble } from "@/components/slides/controls/CameraBubble";
import { ControllerPill } from "@/components/slides/controls/ControllerPill";
import { DotPagination } from "@/components/slides/controls/DotPagination";
import { KeyboardShortcutsDialog } from "@/components/slides/controls/KeyboardShortcutsDialog";
import { PresenterToast } from "@/components/slides/controls/PresenterToast";
import { PresenterTopBar } from "@/components/slides/controls/PresenterTopBar";
import { SlideNumberBadge } from "@/components/slides/controls/SlideNumberBadge";
import { RenderSlide } from "@/components/slides/RenderSlide";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { SettingsDrawer } from "@/components/slides/SettingsDrawer";
import { SlideTransition } from "@/components/slides/SlideTransition";
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
  const { isFs, toggle: toggleFs, exit: exitFs } = useFullscreen();
  const toggleTopJumper = useChrome((s) => s.toggleTopJumper);
  const toggleCamera = useChrome((s) => s.toggleCamera);
  const scene = useChrome((s) => s.scene);
  const cycleCameraSize = useChrome((s) => s.cycleCameraSize);
  const toggleMusic = useChrome((s) => s.toggleMusic);
  const cycleScene = useChrome((s) => s.cycleScene);

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
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "F5") { e.preventDefault(); toggleFs(); return; }
      if (e.key === "Escape" && isFs) { exitFs(); return; }
      // Shift+arrows are handled by CameraBubble (nudge) — don't double-trigger nav.
      if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown")) return;
      if (e.shiftKey && (e.key === "c" || e.key === "C")) { cycleCameraSize(); return; }
      if (e.key === "j" || e.key === "J") { toggleTopJumper(); return; }
      if (e.key === "c" || e.key === "C") { toggleCamera(); return; }
      if (e.key === "m" || e.key === "M") { toggleMusic(); return; }
      if (e.key === "s" || e.key === "S") { cycleScene(); return; }
      if (e.key === "p" || e.key === "P") {
        // Defer to CameraBubble's own toggle via custom event so we don't duplicate logic.
        window.dispatchEvent(new CustomEvent("slides:camera-pip"));
        return;
      }
      if (e.key === "?" || e.key === "/") { e.preventDefault(); setHelpOpen((o) => !o); return; }
      if (e.key === "g" || e.key === "G") { navigate({ to: "/slides" }); return; }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        if (stepNum < last) goTo(current, "forward", stepNum + 2);
        else next(current);
      } else if (e.key === "ArrowLeft") {
        if (stepNum > 0) {
          const target = stepNum;
          if (target <= 1) goTo(current, "backward");
          else goTo(current, "backward", target);
        } else {
          prev(current);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slide, stepCount, stepNum, current, next, prev, goTo, isFs, toggleFs, exitFs, toggleTopJumper, toggleCamera, cycleCameraSize, toggleMusic, cycleScene, navigate]);

  if (!slide || slideStepCount(slide) === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Link to="/slides" className="underline">Back to deck</Link>
      </div>
    );
  }

  const surfaces = (
    <>
      <PresenterTopBar current={current} total={total} onPrev={() => prev(current)} onNext={() => next(current)} />
      <DotPagination current={current} total={total} slides={linearSlides} onJump={jump} />
      <SlideNumberBadge current={current} total={total} display={slide ? getDisplayNumber(slide, current) : undefined} />
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

  const slideOpacity = scene === "cam-only" ? 0.05 : scene === "split" ? 0.75 : 1;
  const slideStage = (
    <div style={{ opacity: slideOpacity, transition: "opacity 300ms ease" }} className="absolute inset-0">
      <ScaledSlide fitPadding={36}>
        <SlideTransition transitionKey={slide.id} allowZoom={slide.type === "center" && slide.display === true}>
          <RenderSlide slide={slide} step={stepNum} />
        </SlideTransition>
      </ScaledSlide>
    </div>
  );

  if (isFs) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-black">
        <div className="relative min-h-0 flex-1">
          {slideStage}
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
        {slideStage}
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
