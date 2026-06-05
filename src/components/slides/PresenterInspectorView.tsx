import { Link } from "@tanstack/react-router";

import { PresenterShell } from "./PresenterShell";
import { InspectorFooter } from "./PresenterInspectorFooter";
import { CurrentSlidePanel, NextSlidePanel, NotesPanel } from "./PresenterInspectorPanels";
import type { PresenterInspectorModel } from "./presenterInspectorModel";
import { useInspectorTimer } from "./useInspectorTimer";

export function PresenterInspectorView({
  model,
  isReducedMotion,
}: {
  model: PresenterInspectorModel;
  isReducedMotion: boolean;
}) {
  const timer = useInspectorTimer();

  return (
    <PresenterShell isFullscreen={false}>
      <main
        aria-label="Presenter inspector"
        className="grid h-dvh min-h-0 gap-4 bg-background p-4 text-foreground md:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)] md:grid-rows-[minmax(0,1fr)_minmax(180px,24dvh)]"
        style={inspectorMotionStyle(isReducedMotion)}
      >
        <CurrentSlidePanel model={model} />
        <NextSlidePanel slide={model.nextSlide} />
        <NotesPanel notes={model.notes} title={model.slide.title} />
        <InspectorFooter model={model} {...timer} />
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

function inspectorMotionStyle(isReducedMotion: boolean) {
  return { transition: isReducedMotion ? "opacity 150ms linear" : "opacity 220ms ease" };
}
