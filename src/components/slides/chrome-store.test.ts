import { beforeEach, describe, expect, it } from "vitest";

import {
  nextAnchor,
  nextScene,
  nextShape,
  nextSize,
  useChrome,
} from "./chrome-store";

const RESET = useChrome.getState();

beforeEach(() => {
  // Restore the initial store snapshot so each test starts clean.
  useChrome.setState({
    ...RESET,
    camera: { ...RESET.camera, visible: false, offsetX: 0, offsetY: 0, customSize: null, size: "md", anchor: "bottom-right", shape: "circle", mirror: true, greenScreen: false },
    scene: "normal",
  });
});

describe("camera cycle helpers", () => {
  it("nextSize cycles sm → md → lg → sm", () => {
    expect(nextSize("sm")).toBe("md");
    expect(nextSize("md")).toBe("lg");
    expect(nextSize("lg")).toBe("sm");
  });

  it("nextAnchor cycles through 4 corners", () => {
    const order = ["bottom-right", "bottom-left", "top-left", "top-right"] as const;
    let cur: typeof order[number] = "bottom-right";
    for (let i = 0; i < 4; i++) cur = nextAnchor(cur);
    expect(cur).toBe("bottom-right");
  });

  it("nextShape cycles circle → squircle → rect → circle", () => {
    expect(nextShape("circle")).toBe("squircle");
    expect(nextShape("squircle")).toBe("rect");
    expect(nextShape("rect")).toBe("circle");
  });

  it("nextScene includes stage-fill in the cycle", () => {
    const seen = new Set<string>();
    let cur: ReturnType<typeof nextScene> = "normal";
    for (let i = 0; i < 4; i++) { seen.add(cur); cur = nextScene(cur); }
    expect(seen.has("stage-fill")).toBe(true);
    expect(seen.size).toBe(4);
  });
});

describe("chrome-store camera reducers", () => {
  it("toggleCamera flips visibility", () => {
    useChrome.getState().toggleCamera();
    expect(useChrome.getState().camera.visible).toBe(true);
    useChrome.getState().toggleCamera();
    expect(useChrome.getState().camera.visible).toBe(false);
  });

  it("cycleCameraAnchor resets offsets", () => {
    useChrome.setState({ camera: { ...useChrome.getState().camera, offsetX: 99, offsetY: -42 } });
    useChrome.getState().cycleCameraAnchor();
    const cam = useChrome.getState().camera;
    expect(cam.offsetX).toBe(0);
    expect(cam.offsetY).toBe(0);
    expect(cam.anchor).toBe("bottom-left");
  });

  it("setCameraCustomSize stores and clears custom size", () => {
    useChrome.getState().setCameraCustomSize(320);
    expect(useChrome.getState().camera.customSize).toBe(320);
    useChrome.getState().setCameraCustomSize(null);
    expect(useChrome.getState().camera.customSize).toBe(null);
  });

  it("cycleCameraShape advances the shape", () => {
    useChrome.getState().cycleCameraShape();
    expect(useChrome.getState().camera.shape).toBe("squircle");
  });

  it("cycleScene reaches stage-fill within 4 steps", () => {
    for (let i = 0; i < 4; i++) {
      useChrome.getState().cycleScene();
      if (useChrome.getState().scene === "stage-fill") return;
    }
    throw new Error("stage-fill not reached");
  });
});

describe("chrome-store notes peek", () => {
  it("toggleNotesPeek flips notesPeekOpen", () => {
    expect(useChrome.getState().notesPeekOpen).toBe(false);
    useChrome.getState().toggleNotesPeek();
    expect(useChrome.getState().notesPeekOpen).toBe(true);
    useChrome.getState().toggleNotesPeek();
    expect(useChrome.getState().notesPeekOpen).toBe(false);
  });

  it("setNotesPeekOpen sets the value directly", () => {
    useChrome.getState().setNotesPeekOpen(true);
    expect(useChrome.getState().notesPeekOpen).toBe(true);
    useChrome.getState().setNotesPeekOpen(false);
    expect(useChrome.getState().notesPeekOpen).toBe(false);
  });
});
