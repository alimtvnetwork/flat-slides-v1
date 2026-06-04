import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/slides/$slideId")({
  component: SlidesSlideLayout,
});

function SlidesSlideLayout() {
  return (
    <div data-slides-slide-route-root className="contents">
      <Outlet />
    </div>
  );
}