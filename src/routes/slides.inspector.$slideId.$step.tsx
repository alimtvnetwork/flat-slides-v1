import { createFileRoute } from "@tanstack/react-router";

import { PresenterInspector } from "@/components/slides/PresenterInspector";

export const Route = createFileRoute("/slides/inspector/$slideId/$step")({
  head: ({ params }) => ({
    meta: [{ title: `Inspector · Slide ${params.slideId} · Step ${params.step}` }],
  }),
  component: InspectorStepLeaf,
});

function InspectorStepLeaf() {
  const { slideId, step } = Route.useParams();
  return <PresenterInspector slideId={slideId} step={step} />;
}
