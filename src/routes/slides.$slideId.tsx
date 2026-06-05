import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SlidePresenterPage } from "@/components/slides/SlidePresenterPage";

export const Route = createFileRoute("/slides/$slideId")({
  component: SlidesSlideLayout,
});

/**
 * Hoist SlidePresenterPage into the `$slideId` layout so it stays mounted
 * across `/slides/N` ↔ `/slides/N/S` transitions. Without this, the leaf
 * route swap unmounts ControllerPill, SettingsDrawer, MusicToggle, and the
 * keyboard handler on every step change. SlidePresenterPage derives the
 * current step from `location.pathname`, so the leaves render nothing.
 */
function SlidesSlideLayout() {
  const { slideId } = Route.useParams();
  return (
    <>
      <SlidePresenterPage slideId={slideId} />
      <Outlet />
    </>
  );
}
