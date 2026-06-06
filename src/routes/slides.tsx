import { Outlet, createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { PresenterWebcamOverlay } from "@/components/slides/PresenterWebcamOverlay";

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
      {/* Spec 02 step 16 — overlay mounts once at the deck root so all surfaces share state. */}
      <PresenterWebcamOverlay />
      <Toaster />
    </div>
  );
}
