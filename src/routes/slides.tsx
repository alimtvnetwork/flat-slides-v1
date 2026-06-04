import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/slides")({
  component: SlidesLayout,
});

function SlidesLayout() {
  return (
    <div data-slides-fullscreen-root className="min-h-dvh bg-black">
      <Outlet />
    </div>
  );
}