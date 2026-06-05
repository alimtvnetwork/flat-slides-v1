import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useChrome } from "../chrome-store";
import { CameraBubble } from "./CameraBubble";

const RESET_CAMERA = useChrome.getState().camera;

function setFullscreenElement(element: Element | null) {
  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    get: () => element,
  });
  document.dispatchEvent(new Event("fullscreenchange"));
}

describe("CameraBubble shape surfaces", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: vi.fn(() => new Promise(() => {})) },
    });
    useChrome.setState({
      camera: { ...RESET_CAMERA, visible: true, shape: "squircle", autoFrame: false },
      scene: "normal",
    });
  });

  afterEach(() => {
    cleanup();
    setFullscreenElement(null);
    vi.unstubAllGlobals();
    useChrome.setState({ camera: { ...RESET_CAMERA, visible: false }, scene: "normal" });
  });

  it("uses the supplied squircle mask and two image plates for squircle mode", () => {
    render(<CameraBubble />);

    const region = screen.getByRole("region", { name: /presenter camera/i });
    const frame = region.querySelector('[data-camera-shape="squircle"]') as HTMLElement | null;

    expect(frame).not.toBeNull();
    expect(frame?.style.maskImage || frame?.style.webkitMaskImage).toContain("02-squircle-mask-black");
    expect(region.querySelector('[data-camera-plate="white"]')).not.toBeNull();
    expect(region.querySelector('[data-camera-plate="gold"]')).not.toBeNull();
  });

  it("does not show squircle plates for circle mode", () => {
    useChrome.setState({ camera: { ...useChrome.getState().camera, shape: "circle" } });
    render(<CameraBubble />);

    const region = screen.getByRole("region", { name: /presenter camera/i });

    expect(region.querySelector('[data-camera-shape="circle"]')).not.toBeNull();
    expect(region.querySelector('[data-camera-plate="white"]')).toBeNull();
    expect(region.querySelector('[data-camera-plate="gold"]')).toBeNull();
  });

  it("applies camera background color and image settings to the shaped frame", () => {
    useChrome.setState({
      camera: {
        ...useChrome.getState().camera,
        backgroundMode: "image",
        backgroundColor: "#123456",
        backgroundImage: "https://example.com/camera-bg.png",
      },
    });
    render(<CameraBubble />);

    const frame = screen.getByRole("region", { name: /presenter camera/i }).querySelector('[data-camera-shape="squircle"]') as HTMLElement;

    expect(frame.style.backgroundColor).toBe("rgb(18, 52, 86)");
    expect(frame.style.backgroundImage).toContain("camera-bg.png");
  });

  it("cycles camera shape with the spec shortcut O", () => {
    useChrome.setState({ camera: { ...useChrome.getState().camera, shape: "circle" } });
    render(<CameraBubble />);

    fireEvent.keyDown(window, { key: "O" });

    expect(useChrome.getState().camera.shape).toBe("squircle");
  });

  it("keeps stage-fill camera inside the scaled slide frame", async () => {
    document.documentElement.style.setProperty("--stage-scale", "0.5");
    document.documentElement.style.setProperty("--presenter-frame-left", "100px");
    document.documentElement.style.setProperty("--presenter-frame-top", "50px");
    document.body.innerHTML = '<div class="slide-wrapper"></div>';
    const rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains("slide-wrapper")) {
        return { left: 100, top: 50, width: 960, height: 540, right: 1060, bottom: 590, x: 100, y: 50, toJSON: () => ({}) } as DOMRect;
      }
      return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
    });
    useChrome.setState({ scene: "stage-fill" });

    render(<CameraBubble />);

    const region = screen.getByRole("region", { name: /presenter camera/i });
    await waitFor(() => expect(region.style.width).toBe("960px"));
    expect(region.dataset.cameraStageFill).toBe("true");
    expect(region.style.height).toBe("540px");
    expect(region.style.left).toBe("100px");
    expect(region.style.top).toBe("50px");
    expect(region.style.right).toBe("");
    expect(region.style.bottom).toBe("");
    rectSpy.mockRestore();
  });

  it("clamps free camera chrome to the measured presenter frame", async () => {
    document.documentElement.style.setProperty("--stage-scale", "0.5");
    document.documentElement.style.setProperty("--presenter-frame-left", "100px");
    document.documentElement.style.setProperty("--presenter-frame-top", "50px");
    useChrome.setState({
      camera: { ...useChrome.getState().camera, x: 1900, y: 1070, customSize: 320, shape: "circle" },
    });

    render(<CameraBubble />);

    const region = screen.getByRole("region", { name: /presenter camera/i });
    await waitFor(() => expect(region.style.left).toBe("900px"));
    expect(region.style.top).toBe("500px");
  });

  it("clips camera controls to the bubble surface in fullscreen", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    setFullscreenElement(root);

    render(<CameraBubble />);

    const region = screen.getByRole("region", { name: /presenter camera/i });
    await waitFor(() => expect(region.style.overflow).toBe("hidden"));
    expect(region.className).toContain("overflow-hidden");
    root.remove();
  });
});