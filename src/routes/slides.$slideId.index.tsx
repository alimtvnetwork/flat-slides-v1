import { createFileRoute } from "@tanstack/react-router";

import { SlidePresenterPage } from "@/components/slides/SlidePresenterPage";

export const Route = createFileRoute("/slides/$slideId/")({
  head: ({ params }) => ({
    meta: [{ title: `Slide ${params.slideId}` }],
  }),
  component: SlidePage,
});

function SlidePage() {
  const { slideId } = Route.useParams();
  return <SlidePresenterPage slideId={slideId} />;
}
