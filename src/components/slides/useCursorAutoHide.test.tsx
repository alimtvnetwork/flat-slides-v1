import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CURSOR_HIDDEN_ATTR, CURSOR_IDLE_MS, useCursorAutoHide } from "./useCursorAutoHide";

function Harness({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useCursorAutoHide(() => ref.current, enabled);
  return <div ref={ref} data-testid="root" />;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useCursorAutoHide", () => {
  it("hides cursor after idle when enabled", () => {
    const { getByTestId } = render(<Harness enabled />);
    const el = getByTestId("root");
    expect(el.hasAttribute(CURSOR_HIDDEN_ATTR)).toBe(false);
    act(() => { vi.advanceTimersByTime(CURSOR_IDLE_MS + 10); });
    expect(el.getAttribute(CURSOR_HIDDEN_ATTR)).toBe("true");
  });

  it("reveals on pointermove and re-hides after idle", () => {
    const { getByTestId } = render(<Harness enabled />);
    const el = getByTestId("root");
    act(() => { vi.advanceTimersByTime(CURSOR_IDLE_MS + 10); });
    expect(el.getAttribute(CURSOR_HIDDEN_ATTR)).toBe("true");
    act(() => { window.dispatchEvent(new PointerEvent("pointermove")); });
    expect(el.hasAttribute(CURSOR_HIDDEN_ATTR)).toBe(false);
    act(() => { vi.advanceTimersByTime(CURSOR_IDLE_MS + 10); });
    expect(el.getAttribute(CURSOR_HIDDEN_ATTR)).toBe("true");
  });

  it("does not hide when disabled", () => {
    const { getByTestId } = render(<Harness enabled={false} />);
    const el = getByTestId("root");
    act(() => { vi.advanceTimersByTime(CURSOR_IDLE_MS + 10); });
    expect(el.hasAttribute(CURSOR_HIDDEN_ATTR)).toBe(false);
  });
});
