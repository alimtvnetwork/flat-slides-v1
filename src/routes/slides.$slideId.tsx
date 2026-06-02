import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/slides/$slideId")({
  component: SlidesSlideLayout,
});

function SlidesSlideLayout() {
  return <Outlet />;
}