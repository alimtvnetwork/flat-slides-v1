import { afterEach, describe, expect, it, vi } from "vitest";

import { pickJsonFile } from "./io";

describe("pickJsonFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("clicks a mounted file input synchronously", async () => {
    const input = document.createElement("input");
    const click = vi.spyOn(input, "click").mockImplementation(() => {});
    document.body.appendChild(input);

    const pending = pickJsonFile(input);

    expect(click).toHaveBeenCalledOnce();
    expect(document.body.contains(input)).toBe(true);
    input.onchange?.(new Event("change"));
    await expect(pending).resolves.toBeNull();
  });
});