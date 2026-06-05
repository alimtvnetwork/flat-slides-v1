import { Link } from "@tanstack/react-router";

import { RenderSlide } from "./RenderSlide";
import { ScaledSlide } from "./ScaledSlide";
import { PresenterShell } from "./PresenterShell";
import type { PresenterInspectorModel } from "./presenterInspectorModel";
import type { Slide } from "./types";

export function PresenterInspectorView({
  model,
  isReducedMotion,
}: {
  model: PresenterInspectorModel;
  isReducedMotion: boolean;
}) {
  return (
    <PresenterShell isFullscreen={false}>
      <main
        aria-label="Presenter inspector"
        className="grid h-dvh min-h-0 gap-4 bg-background p-4 text-foreground md:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)] md:grid-rows-[minmax(0,1fr)_minmax(180px,24dvh)]"
        style={inspectorMotionStyle(isReducedMotion)}
      >
        <SlidePanel
          label={`Current slide: ${model.slide.title}`}
          slide={model.slide}
          stepIndex={model.stepIndex}
        />
        <SlidePanel label={nextSlideLabel(model.nextSlide)} slide={model.nextSlide} stepIndex={0} />
        <NotesPanel notes={model.notes} title={model.slide.title} />
        <InspectorFooter model={model} />
      </main>
    </PresenterShell>
  );
}

export function MissingSlide({ slideId }: { slideId: string }) {
  return (
    <main className="grid h-dvh place-items-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Slide {slideId} not found.</h1>
        <Link to="/slides" className="mt-3 inline-block text-sm underline">
          Back to deck
        </Link>
      </div>
    </main>
  );
}

function SlidePanel({
  label,
  slide,
  stepIndex,
}: {
  label: string;
  slide?: Slide;
  stepIndex: number;
}) {
  return (
    <section
      aria-label={label}
      className="relative min-h-0 overflow-hidden rounded-md border border-border bg-card"
    >
      {slide ? <RenderedSlide slide={slide} stepIndex={stepIndex} /> : <EmptyNextSlide />}
    </section>
  );
}

function RenderedSlide({ slide, stepIndex }: { slide: Slide; stepIndex: number }) {
  return (
    <ScaledSlide fitPadding={20}>
      <RenderSlide slide={slide} step={stepIndex} />
    </ScaledSlide>
  );
}

function EmptyNextSlide() {
  return (
    <p className="grid h-full place-items-center text-sm text-muted-foreground">End of deck</p>
  );
}

function NotesPanel({ notes, title }: { notes: string; title: string }) {
  return (
    <section
      aria-label="Speaker notes"
      className="min-h-0 overflow-y-auto rounded-md border border-border bg-card p-4"
    >
      <h1 className="text-base font-semibold text-card-foreground">{title}</h1>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {notes || "No speaker notes for this slide."}
      </p>
    </section>
  );
}

function InspectorFooter({ model }: { model: PresenterInspectorModel }) {
  return (
    <footer className="flex min-h-0 flex-col justify-between rounded-md border border-border bg-card p-4 text-card-foreground">
      <span className="text-xs uppercase text-muted-foreground">Presenter Inspector</span>
      <div className="flex items-end justify-between gap-4">
        <strong className="text-2xl tabular-nums">{model.stepLabel}</strong>
        <span className="text-sm tabular-nums text-muted-foreground">
          Slide {model.slideNumber}/{model.totalSlides}
        </span>
      </div>
    </footer>
  );
}

function nextSlideLabel(slide?: Slide) {
  return slide ? `Next slide: ${slide.title}` : "Next slide";
}

function inspectorMotionStyle(isReducedMotion: boolean) {
  return { transition: isReducedMotion ? "opacity 150ms linear" : "opacity 220ms ease" };
}
