import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

import { Route as HandoutThreeUpRoute } from "../routes/slides.handout-3up";
import { useDeck } from "@/components/slides/store";

describe("/slides/handout-3up", () => {
  it("renders enabled slides in three-row handout pages", async () => {
    const rootRoute = createRootRoute({ component: () => <Outlet /> });
    const route = createRoute({
      getParentRoute: () => rootRoute,
      path: "/slides/handout-3up",
      component: HandoutThreeUpRoute.options.component,
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([route]),
      history: createMemoryHistory({ initialEntries: ["/slides/handout-3up"] }),
    });
    render(<RouterProvider router={router} />);
    await new Promise((r) => setTimeout(r, 0));

    const enabled = useDeck.getState().deck.slides.filter((s) => s.enabled !== false);
    const pages = document.querySelectorAll(".handout-threeup-page");
    expect(pages.length).toBe(Math.ceil(enabled.length / 3));
    expect(pages.length).toBeGreaterThan(0);

    pages.forEach((page) => {
      expect(page.querySelectorAll(".handout-threeup-row").length).toBe(3);
    });
    expect(document.querySelectorAll(".handout-threeup-row:not(.is-empty)").length).toBe(enabled.length);
    expect(screen.getAllByText(/Slide 1/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Ready to export 3-up handout").closest("[data-print-hide]")).toBeTruthy();
  });
});