import { RenderSlide } from "./RenderSlide";
import { ScaledSlide } from "./ScaledSlide";
import type { PresenterInspectorModel } from "./presenterInspectorModel";
import type { Slide } from "./types";

export function CurrentSlidePanel({ model }: { model: PresenterInspectorModel }) {
  return (
    <SlidePanel
      label={`Current slide: ${model.slide.title}`}
      slide={model.slide}
      stepIndex={model.stepIndex}
      variant="current"
    />
  );
}

export function NextSlidePanel({ slide }: { slide?: Slide }) {
  return <SlidePanel label={nextSlideLabel(slide)} slide={slide} stepIndex={0} variant="next" />;
}

export function NotesPanel({ notes, title }: { notes: string; title: string }) {
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

function SlidePanel({
  label,
  slide,
  stepIndex,
  variant,
}: {
  label: string;
  slide?: Slide;
  stepIndex: number;
  variant: "current" | "next";
}) {
  return (
    <section aria-label={label} className={slidePanelClassName(variant)}>
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

function nextSlideLabel(slide?: Slide) {
  return slide ? `Next slide: ${slide.title}` : "Next slide";
}

function slidePanelClassName(variant: "current" | "next") {
  const base = "relative min-h-0 overflow-hidden rounded-md border border-border bg-card";
  return variant === "next" ? `${base} pointer-events-none` : base;
}
