import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useChrome } from "../chrome-store";
import { DotPagination } from "./DotPagination";
import { PresenterTopBar } from "./PresenterTopBar";
import { SlideNumberBadge } from "./SlideNumberBadge";
import type { Slide } from "../types";

const RESET = useChrome.getState();
const slides: Slide[] = ["One", "Two"].map((title, i) => ({ id: `s${i + 1}`, type: "center", title, heading: [title] }));

beforeEach(() => useChrome.setState({ ...RESET, topJumperHidden: true, dotPaginationVisible: true, slideNumberBadgeVisible: true }));

describe("slide-number visibility surfaces", () => {
  it("keeps the presenter top bar hidden by default and visible when opted in", () => {
    const { rerender } = render(<PresenterTopBar current={1} total={2} onPrev={() => undefined} onNext={() => undefined} />);
    expect(screen.queryByText("Slide")).toBeNull();
    act(() => useChrome.getState().setTopJumperHidden(false));
    rerender(<PresenterTopBar current={1} total={2} onPrev={() => undefined} onNext={() => undefined} />);
    expect(screen.getByText("Slide").closest("[data-print-hide]")).toBeTruthy();
  });

  it("toggles the bottom slide-number badge through chrome state", () => {
    const { rerender } = render(<SlideNumberBadge current={1} total={2} />);
    expect(screen.getByText("01")).toBeTruthy();
    act(() => useChrome.getState().setSlideNumberBadgeVisible(false));
    rerender(<SlideNumberBadge current={1} total={2} />);
    expect(screen.queryByText("01")).toBeNull();
  });

  it("renders dot pagination as print-hidden chrome", () => {
    render(<DotPagination current={1} total={2} slides={slides} onJump={() => undefined} />);
    expect(screen.getByLabelText("Slide pagination").getAttribute("data-print-hide")).toBe("true");
  });
});