/**
 * Regression test for issue 032 — pickJsonFile must reject non-JSON files
 * with a friendly toast instead of parsing them as JSON downstream.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pickJsonFile } from "./io";

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

function makeInput(file: File): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "file";
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  // jsdom doesn't honor click() for file inputs — that's fine; we just need the
  // input element so pickJsonFile attaches onchange to it.
  input.click = vi.fn();
  return input;
}

describe("pickJsonFile (issue 032)", () => {
  beforeEach(() => toastError.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("rejects a .txt file with a friendly toast", async () => {
    const input = makeInput(new File(["hello"], "notes.txt", { type: "text/plain" }));
    const promise = pickJsonFile(input);
    input.onchange?.(new Event("change"));
    await expect(promise).resolves.toBeNull();
    expect(toastError).toHaveBeenCalledWith(
      expect.stringMatching(/Not a JSON file/i),
      expect.objectContaining({ description: expect.any(String) }),
    );
  });

  it("accepts a .json file", async () => {
    const input = makeInput(new File(["{}"], "deck.json", { type: "application/json" }));
    const promise = pickJsonFile(input);
    input.onchange?.(new Event("change"));
    await expect(promise).resolves.toBe("{}");
    expect(toastError).not.toHaveBeenCalled();
  });
});
