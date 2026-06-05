import { MissingSlide, PresenterInspectorView } from "./PresenterInspectorView";
import { resolveInspectorModel } from "./presenterInspectorModel";
import { useDeck } from "./store";
import { useInspectorTimer } from "./useInspectorTimer";
import { useReducedMotion } from "./useReducedMotion";

export interface PresenterInspectorProps {
  slideId: string;
  step?: string;
}

export function PresenterInspector({ slideId, step }: PresenterInspectorProps) {
  const slides = useDeck((state) => state.deck.slides);
  const model = resolveInspectorModel(slides, slideId, step);
  const isReducedMotion = useReducedMotion();
  const timer = useInspectorTimer();

  if (!model) return <MissingSlide slideId={slideId} />;
  return <PresenterInspectorView model={model} isReducedMotion={isReducedMotion} {...timer} />;
}
