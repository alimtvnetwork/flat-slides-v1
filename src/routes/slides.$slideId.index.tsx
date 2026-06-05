import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/slides/$slideId/")({
  head: ({ params }) => ({
    meta: [{ title: `Slide ${params.slideId}` }],
  }),
  // Presenter UI is owned by the parent `slides.$slideId.tsx` layout so it
  // survives `/N` ↔ `/N/S` param changes. This leaf intentionally renders
  // nothing.
  component: () => null,
});
