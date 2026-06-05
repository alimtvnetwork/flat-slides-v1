import type { NavigateFn } from "@tanstack/react-router";

import type { PresenterInspectorModel } from "./presenterInspectorModel";
import { slideStepCount, type Slide } from "./types";

export function moveInspectorPrev(
  model: PresenterInspectorModel,
  goTo: (n: number, step?: number) => void,
  slides: Slide[],
) {
  if (model.stepIndex > 0) return goTo(model.slideNumber, model.stepIndex);
  const prevSlide = slides[model.slideNumber - 2];
  const lastStep = prevSlide ? slideStepCount(prevSlide) : 0;
  return goTo(model.slideNumber - 1, lastStep > 1 ? lastStep : undefined);
}

export function moveInspectorNext(
  model: PresenterInspectorModel,
  goTo: (n: number, step?: number) => void,
) {
  const stepCount = slideStepCount(model.slide);
  if (stepCount > 1 && model.stepIndex < stepCount - 1) {
    return goTo(model.slideNumber, model.stepIndex + 2);
  }
  return goTo(model.slideNumber + 1);
}

export function navigateToInspector(
  navigate: NavigateFn,
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

export function exitInspector(navigate: NavigateFn, search: unknown, slideNumber: number) {
  void navigate({
    to: "/slides/$slideId",
    params: { slideId: String(slideNumber) },
    search: search as never,
  });
}

export function clampSlideNumber(value: number, total: number) {
  return Math.max(1, Math.min(total, value));
}
