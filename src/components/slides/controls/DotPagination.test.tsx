import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DotPagination } from "./DotPagination";
import type { Slide } from "../types";

const makeSlides = (n: number): Slide[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `s${i + 1}`,
    type: "center" as const,
    title: `S${i + 1}`,
    heading: [`H${i + 1}`],
  }));

describe("DotPagination keyboard nav", () => {
  it("ArrowRight moves focus to the next dot", () => {
    const slides = makeSlides(3);
    const { getAllByRole } = render(
      <DotPagination current={1} total={3} slides={slides} onJump={vi.fn()} />,
    );
    const buttons = getAllByRole("button");
    buttons[0].focus();
    expect(document.activeElement).toBe(buttons[0]);
    fireEvent.keyDown(buttons[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("ArrowLeft moves focus to the previous dot", () => {
    const slides = makeSlides(3);
    const { getAllByRole } = render(
      <DotPagination current={2} total={3} slides={slides} onJump={vi.fn()} />,
    );
    const buttons = getAllByRole("button");
    buttons[2].focus();
    fireEvent.keyDown(buttons[2], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("ArrowLeft on first dot is a no-op", () => {
    const slides = makeSlides(2);
    const { getAllByRole } = render(
      <DotPagination current={1} total={2} slides={slides} onJump={vi.fn()} />,
    );
    const buttons = getAllByRole("button");
    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(buttons[0]);
  });
});
