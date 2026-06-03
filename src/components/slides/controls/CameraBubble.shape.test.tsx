import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useChrome } from "../chrome-store";
import { CameraBubble } from "./CameraBubble";

const RESET_CAMERA = useChrome.getState().camera;

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

  it("cycles camera shape with the spec shortcut O", () => {
    useChrome.setState({ camera: { ...useChrome.getState().camera, shape: "circle" } });
    render(<CameraBubble />);

    fireEvent.keyDown(window, { key: "O" });

    expect(useChrome.getState().camera.shape).toBe("squircle");
  });
});