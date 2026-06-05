/**
 * camera-2026 task 11 — auto-frame transform pipeline (pure helpers).
 *
 * The spec asks for:
 *   - persisted enable flag (handled by `usePresenterWebcam` via AUTOFRAME_KEY)
 *   - hidden sampling: detector runs against the live <video>, off-DOM
 *     scratch sampling is optional; the throttle here keeps CPU ≪ 1%.
 *   - EMA smoothing so the head movement is buttery, not jittery.
 *   - mirror-aware transform (preview is `scaleX(-1)`; we flip the X axis
 *     of the face center before composing the translate/scale).
 *   - lost-face reset: if no detection lands within `LOST_FACE_RESET_MS`,
 *     the smoothed center drifts back to (0.5, 0.5) and the zoom relaxes.
 *   - identity transform on unsupported browsers — no-ops via `supported`.
 *
 * The pipeline is split into pure functions so it is fully unit-testable
 * without a DOM. `useAutoFrame` composes them; new callers (overlay,
 * preview thumbnail) can reuse the same helpers without re-deriving math.
 *
 * Spec sources:
 *   - spec/old-slides/camera-2026/04-autoframe-face-tracking.md §1–§5
 *   - spec/old-slides/camera-2026/06-implementation-steps-1-30.md step 11
 */

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Normalised face center + zoom signal in [0,1] video space. */
export interface FrameSample {
  cx: number;
  cy: number;
  /** How much of the frame the face fills along its larger axis. */
  fill: number;
}

/** Output of the smoothing pipeline, ready to compose with `mirror`. */
export interface FrameState {
  cx: number;
  cy: number;
  fill: number;
}

export const IDENTITY_FRAME: FrameState = { cx: 0.5, cy: 0.5, fill: 0 };

/** How aggressively to follow new detections. 1 = jump instantly, 0 = never move. */
export const EMA_ALPHA = 0.18;
/** A face this small or smaller produces zero extra zoom. */
export const ZOOM_FLOOR_FILL = 0.18;
/** A face this large saturates the extra-zoom term at MAX_EXTRA_ZOOM. */
export const ZOOM_CEIL_FILL = 0.55;
/** Maximum auto-zoom factor on top of the baseline 1.0. */
export const MAX_EXTRA_ZOOM = 0.45;
/** Maximum translate (in fraction of the bubble) to keep the face near center. */
export const MAX_TRANSLATE = 0.22;
/** If no detection lands within this window, glide back to identity. */
export const LOST_FACE_RESET_MS = 1500;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Pick the largest face from a detection batch (by bounding-box area). */
export function pickLargestFace<T extends { boundingBox: FaceBox }>(faces: T[]): T | null {
  if (faces.length === 0) return null;
  return faces.reduce((a, b) =>
    a.boundingBox.width * a.boundingBox.height >= b.boundingBox.width * b.boundingBox.height ? a : b,
  );
}

/** Convert a raw face box (in video pixels) to a normalised FrameSample. */
export function faceToSample(box: FaceBox, videoWidth: number, videoHeight: number): FrameSample {
  if (videoWidth <= 0 || videoHeight <= 0) return { cx: 0.5, cy: 0.5, fill: 0 };
  const cx = clamp((box.x + box.width / 2) / videoWidth, 0, 1);
  const cy = clamp((box.y + box.height / 2) / videoHeight, 0, 1);
  const fill = clamp(Math.max(box.width / videoWidth, box.height / videoHeight), 0, 1);
  return { cx, cy, fill };
}

/** One EMA step. `alpha` defaults to EMA_ALPHA. */
export function emaStep(prev: FrameState, next: FrameSample, alpha = EMA_ALPHA): FrameState {
  return {
    cx: lerp(prev.cx, next.cx, alpha),
    cy: lerp(prev.cy, next.cy, alpha),
    fill: lerp(prev.fill, next.fill, alpha),
  };
}

/** Lost-face reset: glide the state back toward identity at the same alpha. */
export function relaxToIdentity(prev: FrameState, alpha = EMA_ALPHA): FrameState {
  return emaStep(prev, { cx: 0.5, cy: 0.5, fill: 0 }, alpha);
}

/**
 * Convert a smoothed FrameState into a CSS transform string for the video
 * element. When `mirror` is true (presenter-facing preview), the X axis of
 * the face center is flipped before computing the translate so the face
 * stays under the same on-screen pixel after the outer `scaleX(-1)`.
 *
 * Returned transform is composed inside-out:
 *   translate(...) scale(...) [scaleX(-1) when mirror]
 *
 * That order means the mirror flip happens FIRST (on the raw video), then
 * we re-translate in the already-mirrored space.
 */
export function frameToTransform(state: FrameState, mirror: boolean): string {
  const cxEff = mirror ? 1 - state.cx : state.cx;
  // Translate the center of the face toward the center of the bubble.
  const tx = clamp((0.5 - cxEff) * 100, -MAX_TRANSLATE * 100, MAX_TRANSLATE * 100);
  const ty = clamp((0.5 - state.cy) * 100, -MAX_TRANSLATE * 100, MAX_TRANSLATE * 100);
  // Map fill ∈ [floor, ceil] → extra ∈ [0, MAX_EXTRA_ZOOM] linearly, clamped.
  const t = clamp((state.fill - ZOOM_FLOOR_FILL) / (ZOOM_CEIL_FILL - ZOOM_FLOOR_FILL), 0, 1);
  const scale = 1 + t * MAX_EXTRA_ZOOM;
  const mirrorPart = mirror ? " scaleX(-1)" : "";
  return `translate(${tx.toFixed(2)}%, ${ty.toFixed(2)}%) scale(${scale.toFixed(3)})${mirrorPart}`;
}

/** Identity transform — used while unsupported or fully relaxed. */
export function identityTransform(mirror: boolean): string {
  return mirror ? "scaleX(-1)" : "none";
}

/** Detect FaceDetector support without throwing during SSR. */
export function isAutoFrameSupported(): boolean {
  return typeof window !== "undefined" && typeof (window as { FaceDetector?: unknown }).FaceDetector === "function";
}
