import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PresenterNotesPeek } from "./PresenterNotesPeek";

describe("PresenterNotesPeek", () => {
  it("renders nothing when there are no notes", () => {
    const { container } = render(<PresenterNotesPeek />);
    expect(container.firstChild).toBeNull();
  });

  it("'N' toggles the panel open", () => {
    render(<PresenterNotesPeek notes="hello speaker" />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(window, { key: "n" });
    expect(screen.getByRole("dialog").textContent).toContain("hello speaker");
  });

  it("ignores 'N' while typing in an input", () => {
    render(
      <>
        <input data-testid="typing" />
        <PresenterNotesPeek notes="hi" />
      </>,
    );
    const input = screen.getByTestId("typing");
    input.focus();
    fireEvent.keyDown(input, { key: "n" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
