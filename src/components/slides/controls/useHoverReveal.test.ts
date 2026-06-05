import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRef } from "react";

import {
  HOVER_REVEAL_COLLAPSE_GRACE_MS,
  HOVER_REVEAL_EXPAND_MS,
  useHoverReveal,
} from "./useHoverReveal";

function setup(container: HTMLElement) {
  return renderHook(() => {
    const ref = useRef<HTMLElement>(container);
    return useHoverReveal(ref);
  });
}

describe("useHoverReveal", () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.useRealTimers();
    container.remove();
  });

  it("expands after 160ms hover intent", () => {
    const { result } = setup(container);
    act(() => result.current.handleEnter());
    expect(result.current.isExpanded).toBe(false);
    act(() => vi.advanceTimersByTime(HOVER_REVEAL_EXPAND_MS));
    expect(result.current.isExpanded).toBe(true);
  });

  it("cancels expand if mouse leaves before 160ms", () => {
    const { result } = setup(container);
    act(() => result.current.handleEnter());
    act(() => vi.advanceTimersByTime(80));
    act(() => result.current.handleLeave());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.isExpanded).toBe(false);
  });

  it("collapses after 400ms grace", () => {
    const { result } = setup(container);
    act(() => result.current.handleEnter());
    act(() => vi.advanceTimersByTime(HOVER_REVEAL_EXPAND_MS));
    act(() => result.current.handleLeave());
    act(() => vi.advanceTimersByTime(HOVER_REVEAL_COLLAPSE_GRACE_MS - 1));
    expect(result.current.isExpanded).toBe(true);
    act(() => vi.advanceTimersByTime(2));
    expect(result.current.isExpanded).toBe(false);
  });

  it("stays open while a child popover is mounted", () => {
    const { result } = setup(container);
    act(() => result.current.handleEnter());
    act(() => vi.advanceTimersByTime(HOVER_REVEAL_EXPAND_MS));
    const popover = document.createElement("div");
    popover.setAttribute("data-state", "open");
    container.appendChild(popover);
    act(() => result.current.handleLeave());
    act(() => vi.advanceTimersByTime(HOVER_REVEAL_COLLAPSE_GRACE_MS * 3));
    expect(result.current.isExpanded).toBe(true);
    popover.remove();
    act(() => vi.advanceTimersByTime(HOVER_REVEAL_COLLAPSE_GRACE_MS + 10));
    expect(result.current.isExpanded).toBe(false);
  });

  it("re-entering during grace cancels collapse", () => {
    const { result } = setup(container);
    act(() => result.current.handleEnter());
    act(() => vi.advanceTimersByTime(HOVER_REVEAL_EXPAND_MS));
    act(() => result.current.handleLeave());
    act(() => vi.advanceTimersByTime(200));
    act(() => result.current.handleEnter());
    act(() => vi.advanceTimersByTime(HOVER_REVEAL_COLLAPSE_GRACE_MS + 200));
    expect(result.current.isExpanded).toBe(true);
  });

  it("expands and collapses instantly under prefers-reduced-motion (Step 28)", () => {
    const mql = {
      matches: true, media: "(prefers-reduced-motion: reduce)", onchange: null,
      addEventListener: () => {}, removeEventListener: () => {},
      addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    };
    Object.defineProperty(window, "matchMedia", { writable: true, value: () => mql });

    const { result } = setup(container);
    act(() => result.current.handleEnter());
    act(() => vi.advanceTimersByTime(0));
    expect(result.current.isExpanded).toBe(true);

    act(() => result.current.handleLeave());
    act(() => vi.advanceTimersByTime(0));
    expect(result.current.isExpanded).toBe(false);
  });
});
