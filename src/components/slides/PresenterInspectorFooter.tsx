import type { PresenterInspectorModel } from "./presenterInspectorModel";

export function InspectorFooter({
  model,
  timerLabel,
  isTimerPaused,
}: {
  model: PresenterInspectorModel;
  timerLabel: string;
  isTimerPaused: boolean;
}) {
  return (
    <footer className="flex min-h-0 flex-col justify-between rounded-md border border-border bg-card p-4 text-card-foreground">
      <span className="text-xs uppercase text-muted-foreground">Presenter Inspector</span>
      <div className="flex items-end justify-between gap-4">
        <StepAndSlide model={model} />
        <TimerReadout label={timerLabel} isPaused={isTimerPaused} />
      </div>
    </footer>
  );
}

function StepAndSlide({ model }: { model: PresenterInspectorModel }) {
  return (
    <div>
      <strong className="block text-2xl tabular-nums">{model.stepLabel}</strong>
      <span className="text-sm tabular-nums text-muted-foreground">
        Slide {model.slideNumber}/{model.totalSlides}
      </span>
    </div>
  );
}

function TimerReadout({ label, isPaused }: { label: string; isPaused: boolean }) {
  return <strong className="text-3xl tabular-nums">{isPaused ? `${label} paused` : label}</strong>;
}
