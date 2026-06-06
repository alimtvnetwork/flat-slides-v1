/**
 * presenterWebcamPlate — spec 07 §2 row "presenterWebcamPlate.test.tsx".
 *
 * Asserts the two-plate shade contract from spec 05 §2/§8:
 *   - white shadow plate (z0) + gold plate (z1) render behind the masked video,
 *   - both plates are sized to `boxW + 2*platePad` / `boxH + 2*platePad`,
 *   - the masked video frame sits above them (z2), so the rim is visible,
 *   - circle mode hides the rectangle-only plates (mask bypass),
 *   - no raw hex bleeds into the on-card styling (tokenized only).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

import {
  PresenterWebcamProvider,
  usePresenterWebcam,
  SIZE_STEPS,
} from "./usePresenterWebcam";
import { PresenterWebcamOverlay } from "./PresenterWebcamOverlay";

function Driver({
  onReady,
}: {
  onReady: (ctx: ReturnType<typeof usePresenterWebcam>) => void;
}) {
  const ctx = usePresenterWebcam();
  onReady(ctx);
  return null;
}

async function mountOnPhase() {
  const fakeStream = {
    getTracks: () => [{ stop: vi.fn() }],
  } as unknown as MediaStream;
  // @ts-expect-error test stub
  globalThis.navigator.mediaDevices = {
    getUserMedia: vi.fn().mockResolvedValue(fakeStream),
  };

  let ctx!: ReturnType<typeof usePresenterWebcam>;
  const utils = render(
    <PresenterWebcamProvider>
      <Driver onReady={(c) => (ctx = c)} />
      <PresenterWebcamOverlay />
    </PresenterWebcamProvider>,
  );
  await act(async () => {
    await ctx.show();
  });
  return { ctx: () => ctx, ...utils };
}

describe("PresenterWebcamOverlay — two-plate shade (spec 05 §2/§8)", () => {
  beforeEach(() => {
    localStorage.clear();
    // jsdom doesn't implement HTMLMediaElement.play(); stub to a resolved promise.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HTMLMediaElement.prototype as any).play = vi.fn().mockResolvedValue(undefined);
  });

  it("renders white(z0) + gold(z1) plates sized to box + 2*platePad behind masked video(z2)", async () => {
    const { ctx } = await mountOnPhase();
    const card = await screen.findByTestId("presenter-webcam-on");

    const size = ctx().size;
    expect(size).toEqual(SIZE_STEPS.M); // default
    const platePad = Math.round(size.w * 0.07);
    const expectedW = size.w + platePad * 2;
    const expectedH = size.h + platePad * 2;

    const imgs = card.querySelectorAll("img[aria-hidden]");
    // White + gold plates render only in rectangle mode (default circle=false).
    expect(imgs.length).toBe(2);

    const [white, gold] = Array.from(imgs) as HTMLImageElement[];
    expect(white.style.zIndex).toBe("0");
    expect(gold.style.zIndex).toBe("1");
    for (const img of [white, gold]) {
      expect(img.style.width).toBe(`${expectedW}px`);
      expect(img.style.height).toBe(`${expectedH}px`);
      expect(img.style.left).toBe(`${-platePad}px`);
      expect(img.style.top).toBe(`${-platePad}px`);
      expect(img.style.pointerEvents).toBe("none");
    }

    // Masked video frame is the next stacking layer above the plates.
    const frame = card.querySelector('div[style*="z-index: 2"]') as HTMLElement | null;
    expect(frame).not.toBeNull();
    expect(frame!.style.overflow).toBe("hidden");
  });

  it("circle mode bypasses the rectangle plates (mask off)", async () => {
    const { ctx } = await mountOnPhase();
    act(() => ctx().toggleCircle());
    const card = await screen.findByTestId("presenter-webcam-on");
    expect(card.querySelectorAll("img[aria-hidden]").length).toBe(0);
  });

  it("on-card styling uses theme tokens only — no raw hex literals", async () => {
    await mountOnPhase();
    const card = await screen.findByTestId("presenter-webcam-on");
    // Inline styles on this card + descendants must not carry raw hex colors;
    // halo + glow are written via hsl(var(--background)/--gold) per spec 05 §7.
    const all = [card, ...Array.from(card.querySelectorAll<HTMLElement>("*"))];
    for (const el of all) {
      const inline = el.getAttribute("style") ?? "";
      expect(inline).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });
});
