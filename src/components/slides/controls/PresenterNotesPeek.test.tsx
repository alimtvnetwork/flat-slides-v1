import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PresenterNotesPeek } from "./PresenterNotesPeek";

describe("PresenterNotesPeek", () => {
  it("renders nothing when there are no notes", () => {
    const { container } = render(<PresenterNotesPeek />);
    expect(container.firstChild).toBeNull();
  });

  it("'N' toggles the panel open and closed", () => {
    render(<PresenterNotesPeek notes="hello speaker" />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(window, { key: "n" });
    expect(screen.getByRole("dialog")).toHaveTextContent("hello speaker");
    fireEvent.keyDown(window, { key: "n" });
    // Exit animation removes it asynchronously; immediately the open state flips,
    // but with framer-motion's AnimatePresence the node lingers. Assert the
    // controller button reflects collapsed state instead.
    expect(screen.getByLabelText(/show presenter notes/i)).toBeInTheDocument();
  });

  it("'Escape' closes the panel when open", () => {
    render(<PresenterNotesPeek notes="hi" />);
    fireEvent.keyDown(window, { key: "n" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByLabelText(/show presenter notes/i)).toBeInTheDocument();
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
