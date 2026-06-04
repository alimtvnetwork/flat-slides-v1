import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/slides/$slideId/$step")({
  head: ({ params }) => ({
    meta: [{ title: `Slide ${params.slideId} · step ${params.step}` }],
  }),
  component: SlideStepPage,
});

function SlideStepPage() {
  return null;
}