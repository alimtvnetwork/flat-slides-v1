import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { SlidePresenterPage } from "@/components/slides/SlidePresenterPage";

export const Route = createFileRoute("/slides")({
  component: SlidesLayout,
});

function SlidesLayout() {
  const location = useLocation();
  const slideRoute = parseSlideRoute(location.pathname);

  return (
    <SlidesFullscreenRoot>
      {slideRoute ? <SlidePresenterPage slideId={slideRoute.slideId} /> : null}
      <Outlet />
    </SlidesFullscreenRoot>
  );
}

function parseSlideRoute(pathname: string) {
  const match = pathname.match(/^\/slides\/(\d+)(?:\/(\d+))?\/?$/);
  if (!match) return null;
  return { slideId: match[1] };
}

export function SlidesFullscreenRoot({ children }: { children: ReactNode }) {
  return (
    <div data-slides-fullscreen-root className="relative h-dvh w-full overflow-hidden bg-black">
      {children}
    </div>
  );
}