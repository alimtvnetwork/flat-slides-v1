import { afterEach, describe, expect, it, vi } from "vitest";

import { normalizeCatastrophicSsrResponse } from "./server";

describe("SSR catastrophic error normalizer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("leaves normal responses untouched", async () => {
    const response = new Response("ok", { status: 200, headers: { "content-type": "text/plain" } });

    await expect(normalizeCatastrophicSsrResponse(response)).resolves.toBe(response);
  });

  it("converts h3-swallowed HTTPError JSON into the static HTML fallback and logs a raw error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = new Response('{"status":500,"unhandled":true,"message":"HTTPError"}', {
      status: 500,
      headers: { "content-type": "application/json" },
    });

    const normalized = await normalizeCatastrophicSsrResponse(response);

    expect(normalized.status).toBe(500);
    expect(normalized.headers.get("content-type")).toContain("text/html");
    await expect(normalized.text()).resolves.toContain("This page didn't load");
    expect(consoleError).toHaveBeenCalledWith(expect.any(Error));
  });
});