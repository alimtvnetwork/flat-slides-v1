import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/slides")({
  component: SlidesLayout,
});

function SlidesLayout() {
  return <Outlet />;
}