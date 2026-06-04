import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SlidePresenterPage } from "@/components/slides/SlidePresenterPage";

export const Route = createFileRoute("/slides/$slideId")({
  component: SlidesSlideLayout,
});

function SlidesSlideLayout() {
  const { slideId } = Route.useParams();
  return (
    <div data-slides-slide-route-root className="contents">
      <SlidePresenterPage slideId={slideId} />
      <Outlet />
    </div>
  );
}