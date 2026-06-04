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

import { Route as HandoutRoute } from "../routes/slides.handout";
import { useDeck } from "@/components/slides/store";

describe("/slides/handout", () => {
  it("renders one .handout-page per enabled slide with a slide-number label", async () => {
    const rootRoute = createRootRoute({ component: () => <Outlet /> });
    const route = createRoute({
      getParentRoute: () => rootRoute,
      path: "/slides/handout",
      component: HandoutRoute.options.component,
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([route]),
      history: createMemoryHistory({ initialEntries: ["/slides/handout?paper=a4"] }),
    });
    render(<RouterProvider router={router} />);
    await new Promise((r) => setTimeout(r, 0));

    const enabled = useDeck.getState().deck.slides.filter((s) => s.enabled !== false);
    const pages = document.querySelectorAll(".handout-page");
    expect(pages.length).toBe(enabled.length);
    expect(pages.length).toBeGreaterThan(0);
    expect(document.querySelector(".handout-deck")?.getAttribute("data-paper")).toBe("a4");

    // First page must carry the "Slide 1" label.
    expect(screen.getAllByText(/Slide 1/i).length).toBeGreaterThan(0);

    // Each page must have either notes text or the empty placeholder.
    pages.forEach((p) => {
      const body = p.querySelector(".handout-notes-body, .handout-notes-empty");
      expect(body).toBeTruthy();
    });

    // Print instruction notice is hidden from printed output via data-print-hide.
    expect(screen.getByText("Ready to export handout").closest("[data-print-hide]")).toBeTruthy();
  });
});
