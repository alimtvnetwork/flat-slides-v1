import { slideStepCount, type Slide } from "./types";

const FIRST_SLIDE_NUMBER = 1;
const FIRST_STEP_NUMBER = 1;

export interface PresenterInspectorModel {
  slide: Slide;
  nextSlide?: Slide;
  slideNumber: number;
  totalSlides: number;
  stepIndex: number;
  stepLabel: string;
  notes: string;
}

export function resolveInspectorModel(
  slides: Slide[],
  slideId: string,
  step?: string,
): PresenterInspectorModel | null {
  const linearSlides = slides.filter((slide) => slide.enabled !== false);
  const index = resolveSlideIndex(slideId);
  const slide = linearSlides[index];
  if (!slide) return null;

  const stepIndex = resolveStepIndex(slide, step);
  return {
    slide,
    nextSlide: linearSlides[index + FIRST_SLIDE_NUMBER],
    slideNumber: index + FIRST_SLIDE_NUMBER,
    totalSlides: linearSlides.length,
    stepIndex,
    stepLabel: formatStepLabel(slide, stepIndex),
    notes: slide.notes?.trim() ?? "",
  };
}

function resolveSlideIndex(slideId: string) {
  const slideNumber = Number.parseInt(slideId, 10);
  if (!Number.isFinite(slideNumber)) return -1;
  return slideNumber - FIRST_SLIDE_NUMBER;
}

function resolveStepIndex(slide: Slide, step?: string) {
  const total = slideStepCount(slide);
  const requested = Number.parseInt(step ?? String(FIRST_STEP_NUMBER), 10);
  const safeStep = Number.isFinite(requested) ? requested : FIRST_STEP_NUMBER;
  return Math.max(0, Math.min(safeStep - FIRST_STEP_NUMBER, total - FIRST_STEP_NUMBER));
}

function formatStepLabel(slide: Slide, stepIndex: number) {
  const total = Math.max(FIRST_STEP_NUMBER, slideStepCount(slide));
  return `Step ${stepIndex + FIRST_STEP_NUMBER}/${total}`;
}