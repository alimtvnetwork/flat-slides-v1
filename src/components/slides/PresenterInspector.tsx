import { Link } from "@tanstack/react-router";

import { RenderSlide } from "./RenderSlide";
import { ScaledSlide } from "./ScaledSlide";
import { PresenterShell } from "./PresenterShell";
import { useDeck } from "./store";
import { slideStepCount, type Slide } from "./types";
import { useReducedMotion } from "./useReducedMotion";

const FIRST_SLIDE_NUMBER = 1;
const FIRST_STEP_NUMBER = 1;

export interface PresenterInspectorProps {
  slideId: string;
  step?: string;
}

export function PresenterInspector({ slideId, step }: PresenterInspectorProps) {
  const slides = useDeck((state) => state.deck.slides).filter((slide) => slide.enabled !== false);
  const index = resolveSlideIndex(slideId);
  const slide = slides[index];
  const nextSlide = slides[index + 1];
  const isReducedMotion = useReducedMotion();

  if (!slide) return <MissingSlide slideId={slideId} />;

  const stepIndex = resolveStepIndex(slide, step);
  const stepLabel = formatStepLabel(slide, stepIndex);
  const notes = slide.notes?.trim() ?? "";

  return (
    <PresenterShell isFullscreen={false}>
      <main
        aria-label="Presenter inspector"
        className="grid h-dvh min-h-0 gap-4 bg-background p-4 text-foreground md:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)] md:grid-rows-[minmax(0,1fr)_minmax(180px,24dvh)]"
        style={inspectorMotionStyle(isReducedMotion)}
      >
        <SlidePanel label={`Current slide: ${slide.title}`} slide={slide} stepIndex={stepIndex} variant="current" />
        <SlidePanel label={nextSlide ? `Next slide: ${nextSlide.title}` : "Next slide"} slide={nextSlide} stepIndex={0} variant="next" />
        <NotesPanel notes={notes} title={slide.title} />
        <InspectorFooter current={index + FIRST_SLIDE_NUMBER} total={slides.length} stepLabel={stepLabel} />
      </main>
    </PresenterShell>
  );
}

function SlidePanel({ label, slide, stepIndex, variant }: { label: string; slide?: Slide; stepIndex: number; variant: "current" | "next" }) {
  return (
    <section aria-label={label} className={panelClassName(variant)}>
      {slide ? (
        <ScaledSlide fitPadding={variant === "current" ? 24 : 18}>
          <RenderSlide slide={slide} step={stepIndex} />
        </ScaledSlide>
      ) : (
        <p className="grid h-full place-items-center text-sm text-muted-foreground">End of deck</p>
      )}
    </section>
  );
}

function NotesPanel({ notes, title }: { notes: string; title: string }) {
  return (
    <section aria-label="Speaker notes" className="min-h-0 overflow-y-auto rounded-md border border-border bg-card p-4">
      <h1 className="text-base font-semibold text-card-foreground">{title}</h1>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {notes || "No speaker notes for this slide."}
      </p>
    </section>
  );
}

function InspectorFooter({ current, total, stepLabel }: { current: number; total: number; stepLabel: string }) {
  return (
    <footer className="flex min-h-0 flex-col justify-between rounded-md border border-border bg-card p-4 text-card-foreground">
      <span className="text-xs uppercase text-muted-foreground">Presenter Inspector</span>
      <div className="flex items-end justify-between gap-4">
        <strong className="text-2xl tabular-nums">{stepLabel}</strong>
        <span className="text-sm tabular-nums text-muted-foreground">Slide {current}/{total}</span>
      </div>
    </footer>
  );
}

function MissingSlide({ slideId }: { slideId: string }) {
  return (
    <main className="grid h-dvh place-items-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Slide {slideId} not found.</h1>
        <Link to="/slides" className="mt-3 inline-block text-sm underline">Back to deck</Link>
      </div>
    </main>
  );
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
  return Math.max(0, Math.min(safeStep - FIRST_STEP_NUMBER, Math.max(0, total - FIRST_STEP_NUMBER)));
}

function formatStepLabel(slide: Slide, stepIndex: number) {
  const total = Math.max(FIRST_STEP_NUMBER, slideStepCount(slide));
  return `Step ${stepIndex + FIRST_STEP_NUMBER}/${total}`;
}

function panelClassName(variant: "current" | "next") {
  const base = "relative min-h-0 overflow-hidden rounded-md border border-border bg-card";
  return variant === "current" ? `${base} md:row-span-1` : base;
}

function inspectorMotionStyle(isReducedMotion: boolean) {
  return { transition: isReducedMotion ? "opacity 150ms linear" : "opacity 220ms ease" };
}
