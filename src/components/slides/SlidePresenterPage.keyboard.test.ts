import { describe, expect, it } from "vitest";

import { isPresenterFullscreenShortcut, resolveKeyEventElement } from "./SlidePresenterPage";

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

describe("resolveKeyEventElement (regression: window/document-target keydowns)", () => {
  it("returns null for the Document target so .closest is never called on it", () => {
    // Reproduces the TypeError path that silently killed `I`, `M`, `T`, `G`, `J` …
    expect(resolveKeyEventElement(document)).toBeNull();
    expect(resolveKeyEventElement(window)).toBeNull();
    expect(resolveKeyEventElement(null)).toBeNull();
  });

  it("returns the element when target is a real Element", () => {
    const el = document.createElement("button");
    expect(resolveKeyEventElement(el)).toBe(el);
  });
});
