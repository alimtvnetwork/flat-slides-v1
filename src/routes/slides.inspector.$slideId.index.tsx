import { createFileRoute } from "@tanstack/react-router";

import { PresenterInspector } from "@/components/slides/PresenterInspector";

export const Route = createFileRoute("/slides/inspector/$slideId/")({
  head: ({ params }) => ({
    meta: [{ title: `Inspector · Slide ${params.slideId}` }],
  }),
  component: InspectorLeaf,
});

function InspectorLeaf() {
  const { slideId } = Route.useParams();
  return <PresenterInspector slideId={slideId} />;
}
