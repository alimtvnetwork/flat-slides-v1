import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/slides/$slideId/")({
  head: ({ params }) => ({
    meta: [{ title: `Slide ${params.slideId}` }],
  }),
  component: SlidePage,
});

function SlidePage() {
  return null;
}
