import { Outlet, createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createFileRoute("/slides")({
  component: SlidesLayout,
});

function SlidesLayout() {
  return (
    <SlidesFullscreenRoot>
      <Outlet />
    </SlidesFullscreenRoot>
  );
}

export function SlidesFullscreenRoot({ children }: { children: ReactNode }) {
  return (
    <div data-slides-fullscreen-root className="relative h-dvh w-full overflow-hidden bg-black">
      {children}
    </div>
  );
}