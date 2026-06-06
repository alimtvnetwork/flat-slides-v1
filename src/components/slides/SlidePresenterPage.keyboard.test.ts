import { describe, expect, it } from "vitest";

import { isPresenterFullscreenShortcut } from "./SlidePresenterPage";

describe("SlidePresenterPage fullscreen shortcut", () => {
  it("treats F, Shift+F, and F5 as fullscreen", () => {
    expect(isPresenterFullscreenShortcut(new KeyboardEvent("keydown", { key: "f" }))).toBe(true);
    expect(isPresenterFullscreenShortcut(new KeyboardEvent("keydown", { key: "F", shiftKey: true }))).toBe(true);
    expect(isPresenterFullscreenShortcut(new KeyboardEvent("keydown", { key: "Unidentified", code: "KeyF" }))).toBe(true);
    expect(isPresenterFullscreenShortcut(new KeyboardEvent("keydown", { key: "F5", code: "F5" }))).toBe(true);
  });

  it("does not steal system-modified F shortcuts", () => {
    expect(isPresenterFullscreenShortcut(new KeyboardEvent("keydown", { key: "f", metaKey: true }))).toBe(false);
    expect(isPresenterFullscreenShortcut(new KeyboardEvent("keydown", { key: "f", ctrlKey: true }))).toBe(false);
    expect(isPresenterFullscreenShortcut(new KeyboardEvent("keydown", { key: "f", altKey: true }))).toBe(false);
  });
});