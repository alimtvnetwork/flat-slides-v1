import { Outlet, createFileRoute } from "@tanstack/react-router";

/**
 * Layout parent for `/slides/inspector/$slideId(/$step)`. Renders only an
 * Outlet so the inspector branch does not double-mount the main
 * SlidePresenterPage chrome. See presenter-inspector.spec.md.
 */
export const Route = createFileRoute("/slides/inspector/$slideId")({
  component: () => <Outlet />,
});
