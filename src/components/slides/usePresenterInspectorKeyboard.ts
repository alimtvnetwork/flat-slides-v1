import { useLocation, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo } from "react";

import { useChrome } from "./chrome-store";
import { dispatchInspectorKey } from "./presenterActions";
import { isTextEntryTarget, keyName, runInspectorAction } from "./presenterInspectorKeyGuards";
import {
  clampSlideNumber,
  exitInspector,
  moveInspectorNext,
  moveInspectorPrev,
  navigateToInspector,
} from "./presenterInspectorNavigation";
import type { PresenterInspectorModel } from "./presenterInspectorModel";
import { useDeck } from "./store";
import { slideStepCount } from "./types";

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
  const goPrev = useCallback(() => moveInspectorPrev(model, goTo, linearSlides), [goTo, linearSlides, model]);
  const goNext = useCallback(() => moveInspectorNext(model, goTo), [goTo, model]);
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
  document.addEventListener("keydown", onKeyDown, { capture: true });
  return () => document.removeEventListener("keydown", onKeyDown, true);
}

function handleInspectorKey(event: KeyboardEvent, input: InspectorKeyInput) {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
  if (isTextEntryTarget(event.target)) return;
  if (handleDirectInspectorKey(event, input)) return;
  dispatchInspectorKey(toInspectorCtx(event, input));
}

function handleDirectInspectorKey(event: KeyboardEvent, input: InspectorKeyInput) {
  const key = keyName(event);
  if (key === "r") return runInspectorAction(event, () => input.resetTimer(Date.now()));
  if (key === "p") return runInspectorAction(event, () => input.togglePause(Date.now()));
  if (key === "escape") return runInspectorAction(event, input.exit);
  return false;
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

interface InspectorKeyInput {
  model: PresenterInspectorModel;
  goPrev: () => void;
  goNext: () => void;
  exit: () => void;
  resetTimer: (now: number) => void;
  togglePause: (now: number) => void;
}
