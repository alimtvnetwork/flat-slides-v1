import { useLocation, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo } from "react";

import { useChrome } from "./chrome-store";
import { dispatchInspectorKey } from "./presenterActions";
import type { PresenterInspectorModel } from "./presenterInspectorModel";
import { useDeck } from "./store";
import { slideStepCount, type Slide } from "./types";

export function usePresenterInspectorKeyboard(model: PresenterInspectorModel) {
  const navigate = useNavigate();
  const location = useLocation();
  const resetTimer = useChrome((state) => state.resetInspectorTimer);
  const togglePause = useChrome((state) => state.toggleInspectorTimerPause);
  const slides = useDeck((state) => state.deck.slides);
  const linearSlides = useMemo(() => slides.filter((slide) => slide.enabled !== false), [slides]);
  const goTo = useCallback(
    (n: number, step?: number) => {
      const slideNumber = clampSlideNumber(n, linearSlides.length);
      const slide = linearSlides[slideNumber - 1];
      if (!slide) return;
      navigateToInspector(navigate, location.search, slideNumber, slideStepCount(slide), step);
    },
    [linearSlides, location.search, navigate],
  );
  const goPrev = useCallback(
    () => movePrev(model, goTo, linearSlides),
    [goTo, linearSlides, model],
  );
  const goNext = useCallback(() => moveNext(model, goTo), [goTo, model]);
  const exit = useCallback(
    () => exitInspector(navigate, location.search, model.slideNumber),
    [location.search, model.slideNumber, navigate],
  );

  useEffect(
    () => listenForInspectorKeys({ model, goPrev, goNext, exit, resetTimer, togglePause }),
    [exit, goNext, goPrev, model, resetTimer, togglePause],
  );
}

function listenForInspectorKeys(input: InspectorKeyInput) {
  const onKeyDown = (event: KeyboardEvent) => handleInspectorKey(event, input);
  window.addEventListener("keydown", onKeyDown, { capture: true });
  return () => window.removeEventListener("keydown", onKeyDown, true);
}

function handleInspectorKey(event: KeyboardEvent, input: InspectorKeyInput) {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
  if (isTextEntryTarget(event.target)) return;
  dispatchInspectorKey(toInspectorCtx(event, input));
}

function toInspectorCtx(event: KeyboardEvent, input: InspectorKeyInput) {
  return {
    event,
    current: input.model.slideNumber,
    stepNum: input.model.stepIndex,
    stepCount: slideStepCount(input.model.slide),
    total: input.model.totalSlides,
    goPrev: input.goPrev,
    goNext: input.goNext,
    exitInspector: input.exit,
    resetTimer: () => input.resetTimer(Date.now()),
    toggleTimerPause: () => input.togglePause(Date.now()),
  };
}

function movePrev(
  model: PresenterInspectorModel,
  goTo: (n: number, step?: number) => void,
  slides: Slide[],
) {
  if (model.stepIndex > 0) return goTo(model.slideNumber, model.stepIndex);
  const prevSlide = slides[model.slideNumber - 2];
  const lastStep = prevSlide ? slideStepCount(prevSlide) : 0;
  return goTo(model.slideNumber - 1, lastStep > 1 ? lastStep : undefined);
}

function moveNext(model: PresenterInspectorModel, goTo: (n: number, step?: number) => void) {
  const stepCount = slideStepCount(model.slide);
  if (stepCount > 1 && model.stepIndex < stepCount - 1) {
    return goTo(model.slideNumber, model.stepIndex + 2);
  }
  return goTo(model.slideNumber + 1);
}

function navigateToInspector(
  navigate: ReturnType<typeof useNavigate>,
  search: unknown,
  slideId: number,
  stepCount: number,
  step?: number,
) {
  if (step && step > 1 && step <= stepCount) {
    void navigate({
      to: "/slides/inspector/$slideId/$step",
      params: { slideId: String(slideId), step: String(step) },
      search: search as never,
      replace: true,
    });
    return;
  }
  void navigate({
    to: "/slides/inspector/$slideId",
    params: { slideId: String(slideId) },
    search: search as never,
    replace: true,
  });
}

function exitInspector(
  navigate: ReturnType<typeof useNavigate>,
  search: unknown,
  slideNumber: number,
) {
  void navigate({
    to: "/slides/$slideId",
    params: { slideId: String(slideNumber) },
    search: search as never,
  });
}

function isTextEntryTarget(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null;
  const tag = element?.tagName;
  return (
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || Boolean(element?.isContentEditable)
  );
}

function clampSlideNumber(value: number, total: number) {
  return Math.max(1, Math.min(total, value));
}

interface InspectorKeyInput {
  model: PresenterInspectorModel;
  goPrev: () => void;
  goNext: () => void;
  exit: () => void;
  resetTimer: (now: number) => void;
  togglePause: (now: number) => void;
}
