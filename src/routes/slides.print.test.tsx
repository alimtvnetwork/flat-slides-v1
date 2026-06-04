import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";

beforeAll(() => {
  // jsdom does not implement ResizeObserver; ScaledSlide uses it.
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

import { Route as PrintRoute } from "../routes/slides.print";

describe("/slides/print", () => {
  it("renders one .print-page per enabled slide", async () => {
    const rootRoute = createRootRoute({ component: () => <Outlet /> });
    const printRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/slides/print",
      component: PrintRoute.options.component,
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([printRoute]),
      history: createMemoryHistory({ initialEntries: ["/slides/print"] }),
    });
    render(<RouterProvider router={router} />);
    // Wait a tick for router match.
    await new Promise((r) => setTimeout(r, 0));
    const pages = document.querySelectorAll(".print-page");
    expect(pages.length).toBeGreaterThan(0);
    // Each page must have an aria-label (the slide title).
    pages.forEach((p) => expect(p.getAttribute("aria-label")).toBeTruthy());
    expect(screen.getByText("Ready to export").closest("[data-print-hide]")).toBeTruthy();
    expect(screen.getByText("Press Cmd/Ctrl + P, then choose Save as PDF.")).toBeTruthy();
    expect(screen).toBeTruthy();
  });
});
