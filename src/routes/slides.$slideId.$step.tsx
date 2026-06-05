import { createFileRoute } from "@tanstack/react-router";

import { SlidePresenterPage } from "@/components/slides/SlidePresenterPage";

export const Route = createFileRoute("/slides/$slideId/$step")({
  head: ({ params }) => ({
    meta: [{ title: `Slide ${params.slideId} · step ${params.step}` }],
  }),
  component: SlideStepPage,
});

function SlideStepPage() {
  const { slideId } = Route.useParams();
  return <SlidePresenterPage slideId={slideId} />;
}