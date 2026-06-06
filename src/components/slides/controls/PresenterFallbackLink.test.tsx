import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useChrome } from "../chrome-store";
import { PresenterFallbackLink } from "./PresenterFallbackLink";

describe("PresenterFallbackLink", () => {
  beforeEach(() => {
    // Component portals into [data-slides-fullscreen-root]; jsdom needs one.
    const root = document.createElement("div");
    root.setAttribute("data-slides-fullscreen-root", "");
    document.body.appendChild(root);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useChrome.setState({ presenterFallback: null, toast: null });
    document.querySelectorAll("[data-slides-fullscreen-root]").forEach((n) => n.remove());
  });

  it("shows a top-level presenter link when popup opening is blocked", () => {
    useChrome.getState().showPresenterFallback("http://localhost/slides/4?present=1", "popup-blocked");

    render(<PresenterFallbackLink />);

    const link = screen.getByRole("link", { name: /open presenter window/i });
    expect(link.getAttribute("href")).toBe("http://localhost/slides/4?present=1");
    expect(screen.getByRole("status").textContent).toContain("Presenter popup was blocked");
  });

  it("copies the fallback URL and can be dismissed", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    useChrome.getState().showPresenterFallback("http://localhost/slides/2/3?present=1", "popup-blocked");

    render(<PresenterFallbackLink />);
    fireEvent.click(screen.getByRole("button", { name: /copy presenter link/i }));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith("http://localhost/slides/2/3?present=1"));

    fireEvent.click(screen.getByRole("button", { name: /dismiss presenter fallback/i }));
    expect(useChrome.getState().presenterFallback).toBeNull();
  });
});