import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * camera-2026 spec implementation — tasks 1–6.
 *
 *   1. Explicit phase state machine
 *      (`off | requesting | on | tray | fullscreen | stage | denied`).
 *   2. SSR-safe localStorage helpers under the `riseup.webcam.*` keys.
 *   3. `show()` acquires the stream at ideal 1280×720, audio:false, with
 *      DOMException → user-safe message mapping.
 *   4. Soft hide → `tray` (stream alive) vs hard close → `off` (tracks stopped).
 *   5. Position and size live in 1920×1080 stage coordinates. Drag/resize
 *      callers must divide raw pointer deltas by `--stage-scale` before
 *      handing them to `setPosition` / `setFreeSize`; clamping keeps the
 *      bubble inside the stage rect.
 *   6. Stepped sizes walk S→M→L→XL via `stepSize(+1 | -1)`. Free resize is
 *      width-driven 16:9, clamped to [FREE_MIN_W, FREE_MAX_W].
 *
 * Spec sources:
 *   - spec/old-slides/camera-2026/01-state-machine-and-hook.md §1–§8
 *   - spec/old-slides/camera-2026/02-overlay-rendering-and-surfaces.md §2
 *   - spec/old-slides/camera-2026/06-implementation-steps-1-30.md steps 1–6
 */

// ─────────────────────────── Types (spec §1) ───────────────────────────

export type WebcamPhase =
  | "off"
  | "requesting"
  | "on"
  | "tray"
  | "fullscreen"
  | "stage"
  | "denied";

export type SizeStep = "S" | "M" | "L" | "XL";

export const SIZE_STEPS: Record<SizeStep, { w: number; h: number }> = {
  S: { w: 240, h: 135 },
  M: { w: 320, h: 180 },
  L: { w: 480, h: 270 },
  XL: { w: 720, h: 405 },
};
export const STEP_ORDER: SizeStep[] = ["S", "M", "L", "XL"];

export const FREE_MIN_W = 160;
export const FREE_MAX_W = 960;
export const ASPECT_H_OVER_W = 9 / 16;

const STAGE_W = 1920;
const STAGE_H = 1080;

export const DEFAULT_POS = {
  x: STAGE_W - SIZE_STEPS.M.w - 32,
  y: 32,
};

export type SizeConfig =
  | { kind: "step"; id: SizeStep }
  | { kind: "free"; w: number; h: number };

export const DEFAULT_SIZE: SizeConfig = { kind: "step", id: "M" };

export interface WebcamState {
  phase: WebcamPhase;
  stream: MediaStream | null;
  error: string | null;
}

// ─────────────────────── Storage keys (spec §2) ───────────────────────

export const POS_KEY = "riseup.webcam.pos";
export const MIN_KEY = "riseup.webcam.min";
export const SIZE_KEY = "riseup.webcam.size";
export const HALO_KEY = "riseup.webcam.halo";
export const CIRCLE_KEY = "riseup.webcam.circle";
export const AUTOFRAME_KEY = "riseup.webcam.autoframe";
export const PLATE_KEY = "riseup.webcam.plate";

/** camera-2026 task 13 — plate variant under the bubble. `none` bypasses the plate entirely. */
export type PlateVariant = "none" | "neutral" | "gold";
export const PLATE_VARIANTS: PlateVariant[] = ["none", "neutral", "gold"];
export const DEFAULT_PLATE: PlateVariant = "neutral";

export function readStoredPlate(): PlateVariant {
  return safeRead(PLATE_KEY, DEFAULT_PLATE, (raw) =>
    (PLATE_VARIANTS as string[]).includes(raw) ? (raw as PlateVariant) : undefined,
  );
}
export function writeStoredPlate(v: PlateVariant) {
  safeWrite(PLATE_KEY, v);
}

export const _SIZE_STEPS_FOR_TEST = SIZE_STEPS;
export const _STEP_ORDER_FOR_TEST = STEP_ORDER;
export const _SIZE_KEY_FOR_TEST = SIZE_KEY;
export const _POS_KEY_FOR_TEST = POS_KEY;

const hasWindow = () => typeof window !== "undefined";

function safeRead<T>(key: string, fallback: T, parse: (raw: string) => T | undefined): T {
  if (!hasWindow()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = parse(raw);
    return parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: string) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota / private mode */
  }
}

export function readStoredPos(): { x: number; y: number } {
  return safeRead(POS_KEY, DEFAULT_POS, (raw) => {
    const p = JSON.parse(raw) as { x?: unknown; y?: unknown };
    if (typeof p?.x === "number" && typeof p?.y === "number") return { x: p.x, y: p.y };
    return undefined;
  });
}

export function writeStoredPos(pos: { x: number; y: number }) {
  safeWrite(POS_KEY, JSON.stringify(pos));
}

export function readStoredSize(): SizeConfig {
  return safeRead(SIZE_KEY, DEFAULT_SIZE, (raw) => {
    const parsed = JSON.parse(raw) as Partial<SizeConfig>;
    if (parsed?.kind === "step" && typeof parsed.id === "string" && parsed.id in SIZE_STEPS) {
      return { kind: "step", id: parsed.id as SizeStep };
    }
    if (parsed?.kind === "free" && typeof parsed.w === "number" && typeof parsed.h === "number") {
      return { kind: "free", w: parsed.w, h: parsed.h };
    }
    return undefined;
  });
}

export function writeStoredSize(size: SizeConfig) {
  safeWrite(SIZE_KEY, JSON.stringify(size));
}

export function readStoredFlag(key: string, fallback: boolean): boolean {
  return safeRead(key, fallback, (raw) => (raw === "1" ? true : raw === "0" ? false : undefined));
}

export function writeStoredFlag(key: string, value: boolean) {
  safeWrite(key, value ? "1" : "0");
}

// ─────────────────────── Geometry helpers (spec §5–§6) ───────────────────────

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function resolveSize(cfg: SizeConfig): { w: number; h: number } {
  if (cfg.kind === "step") return SIZE_STEPS[cfg.id];
  return { w: cfg.w, h: cfg.h };
}

/** Clamp a position so the bubble stays fully inside the 1920×1080 stage. */
export function clampPos(pos: { x: number; y: number }, size: { w: number; h: number }) {
  return {
    x: clamp(pos.x, 0, Math.max(0, STAGE_W - size.w)),
    y: clamp(pos.y, 0, Math.max(0, STAGE_H - size.h)),
  };
}

/** Width-driven 16:9 free resize, clamped to FREE_MIN_W..FREE_MAX_W. */
export function freeSizeFromWidth(width: number): { w: number; h: number } {
  const w = clamp(Math.round(width), FREE_MIN_W, FREE_MAX_W);
  return { w, h: Math.round(w * ASPECT_H_OVER_W) };
}

/** Walk S→M→L→XL by `dir` (+1 or -1), clamped to the array bounds. */
export function nextStep(current: SizeStep, dir: 1 | -1): SizeStep {
  const idx = STEP_ORDER.indexOf(current);
  const nextIdx = clamp(idx + dir, 0, STEP_ORDER.length - 1);
  return STEP_ORDER[nextIdx];
}

// ────────────────────── show() error mapping (spec §4) ──────────────────────

export function describeGetUserMediaError(err: unknown): string {
  const name = (err as DOMException | undefined)?.name ?? "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Camera permission denied. Enable it in your browser site settings.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera found on this device.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Camera is already in use by another application.";
  }
  if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
    return "No camera matched the requested resolution.";
  }
  return (err as Error | undefined)?.message || "Could not start camera.";
}

// ─────────────────────────── Context shape ───────────────────────────

export interface PresenterWebcamCtx {
  state: WebcamState;
  position: { x: number; y: number };
  size: { w: number; h: number };
  sizeCfg: SizeConfig;

  show: () => Promise<void>;
  hide: () => void;
  close: () => void;
  setPhase: (phase: WebcamPhase) => void;

  /** Set position in stage coordinates (callers convert pointer deltas via `/ --stage-scale`). */
  setPosition: (pos: { x: number; y: number }) => void;
  /** Step preset S↔M↔L↔XL. */
  stepSize: (dir: 1 | -1) => void;
  /** Snap to a named preset. */
  setStepSize: (id: SizeStep) => void;
  /** Free 16:9 resize driven by width in stage px. */
  setFreeSize: (width: number) => void;

  /** Task 8 — enter camera CSS fullscreen, snapshotting current phase/pos/size. */
  enterFullscreen: () => void;
  /** Task 8 — fill the slide stage rect (cover), snapshotting prior state. */
  enterStage: () => void;
  /** Task 8 — restore the snapshot taken by enterFullscreen/enterStage. Idempotent. */
  restoreFromOverlay: () => void;
  /** Task 9 — convenience: dispatch a `riseup:webcam-passthrough` next/prev event. */
  emitPassthrough: (direction: "next" | "prev") => void;
}

/** Task 9 — event name for nav keys forwarded by the camera while fullscreen/stage owns focus. */
export const WEBCAM_PASSTHROUGH_EVENT = "riseup:webcam-passthrough" as const;

export interface WebcamPassthroughDetail {
  direction: "next" | "prev";
}

const WebcamCtx = createContext<PresenterWebcamCtx | null>(null);

export function PresenterWebcamProvider({ children }: { children: ReactNode }) {
  const [state, setStateInternal] = useState<WebcamState>(() => ({
    phase: "off",
    stream: null,
    error: null,
  }));
  const [position, setPositionState] = useState(() => readStoredPos());
  const [sizeCfg, setSizeCfgState] = useState<SizeConfig>(() => readStoredSize());

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setState = useCallback((next: WebcamState | ((prev: WebcamState) => WebcamState)) => {
    setStateInternal((prev) =>
      typeof next === "function" ? (next as (p: WebcamState) => WebcamState)(prev) : next,
    );
  }, []);

  const computedSize = useMemo(() => resolveSize(sizeCfg), [sizeCfg]);

  // Re-clamp position whenever the size shrinks/grows so the bubble can't drift off-stage.
  useEffect(() => {
    setPositionState((prev) => {
      const clamped = clampPos(prev, computedSize);
      return clamped.x === prev.x && clamped.y === prev.y ? prev : clamped;
    });
  }, [computedSize]);

  const setPosition = useCallback(
    (pos: { x: number; y: number }) => {
      setPositionState((prev) => {
        const clamped = clampPos(pos, computedSize);
        if (clamped.x === prev.x && clamped.y === prev.y) return prev;
        writeStoredPos(clamped);
        return clamped;
      });
    },
    [computedSize],
  );

  const commitSize = useCallback((cfg: SizeConfig) => {
    setSizeCfgState(cfg);
    writeStoredSize(cfg);
  }, []);

  const stepSize = useCallback(
    (dir: 1 | -1) => {
      setSizeCfgState((prev) => {
        // Free → snap to the nearest step in the requested direction.
        if (prev.kind === "free") {
          const widths = STEP_ORDER.map((id) => ({ id, w: SIZE_STEPS[id].w }));
          const sorted = dir === 1
            ? widths.find((s) => s.w > prev.w) ?? widths[widths.length - 1]
            : [...widths].reverse().find((s) => s.w < prev.w) ?? widths[0];
          const next: SizeConfig = { kind: "step", id: sorted.id };
          writeStoredSize(next);
          return next;
        }
        const id = nextStep(prev.id, dir);
        const next: SizeConfig = { kind: "step", id };
        writeStoredSize(next);
        return next;
      });
    },
    [],
  );

  const setStepSize = useCallback(
    (id: SizeStep) => commitSize({ kind: "step", id }),
    [commitSize],
  );

  const setFreeSize = useCallback(
    (width: number) => commitSize({ kind: "free", ...freeSizeFromWidth(width) }),
    [commitSize],
  );

  const show = useCallback(async () => {
    const current = stateRef.current;
    if ((current.phase === "tray" || current.phase === "fullscreen") && current.stream) {
      setState({ phase: "on", stream: current.stream, error: null });
      return;
    }
    if (current.phase === "on" || current.phase === "requesting") return;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState({ phase: "denied", stream: null, error: "Camera API unavailable in this browser." });
      return;
    }

    setState({ phase: "requesting", stream: null, error: null });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      setState({ phase: "on", stream, error: null });
    } catch (err) {
      setState({ phase: "denied", stream: null, error: describeGetUserMediaError(err) });
    }
  }, [setState]);

  const hide = useCallback(() => {
    setState((prev) =>
      prev.phase !== "on" || !prev.stream
        ? prev
        : { phase: "tray", stream: prev.stream, error: null },
    );
  }, [setState]);

  const close = useCallback(() => {
    setState((prev) => {
      prev.stream?.getTracks().forEach((t) => t.stop());
      return { phase: "off", stream: null, error: null };
    });
  }, [setState]);

  useEffect(() => {
    return () => {
      stateRef.current.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const setPhase = useCallback(
    (phase: WebcamPhase) => setState((prev) => ({ ...prev, phase })),
    [setState],
  );

  // ─── Task 8: fullscreen / stage round-trip with exact restore ───
  type OverlaySnapshot = {
    phase: WebcamPhase;
    position: { x: number; y: number };
    sizeCfg: SizeConfig;
  };
  const snapshotRef = useRef<OverlaySnapshot | null>(null);

  const enterOverlay = useCallback(
    (target: "fullscreen" | "stage") => {
      const current = stateRef.current;
      // Only meaningful when a live stream exists; ignore silently otherwise so
      // callers can wire a single shortcut without branching on phase.
      if (!current.stream || current.phase === "off" || current.phase === "denied") return;
      // First enter snapshots; a subsequent enter does NOT re-snapshot (so
      // toggling fullscreen → stage and back still restores the original bubble).
      if (!snapshotRef.current) {
        snapshotRef.current = { phase: current.phase, position, sizeCfg };
      }
      setState({ phase: target, stream: current.stream, error: null });
    },
    [position, sizeCfg, setState],
  );

  const enterFullscreen = useCallback(() => enterOverlay("fullscreen"), [enterOverlay]);
  const enterStage = useCallback(() => enterOverlay("stage"), [enterOverlay]);

  const restoreFromOverlay = useCallback(() => {
    const snap = snapshotRef.current;
    snapshotRef.current = null;
    setState((prev) => {
      // Only restore from overlay phases — leave non-overlay states alone.
      if (prev.phase !== "fullscreen" && prev.phase !== "stage") return prev;
      const targetPhase: WebcamPhase = snap?.phase ?? "on";
      return { phase: targetPhase, stream: prev.stream, error: null };
    });
    if (snap) {
      // Restore geometry atomically with the phase change.
      setPositionState(clampPos(snap.position, resolveSize(snap.sizeCfg)));
      setSizeCfgState(snap.sizeCfg);
    }
  }, [setState]);

  // ─── Task 9: nav passthrough for fullscreen / stage ───
  const emitPassthrough = useCallback((direction: "next" | "prev") => {
    if (typeof window === "undefined") return;
    const detail: WebcamPassthroughDetail = { direction };
    window.dispatchEvent(new CustomEvent(WEBCAM_PASSTHROUGH_EVENT, { detail }));
  }, []);

  const value = useMemo<PresenterWebcamCtx>(
    () => ({
      state,
      position,
      size: computedSize,
      sizeCfg,
      show,
      hide,
      close,
      setPhase,
      setPosition,
      stepSize,
      setStepSize,
      setFreeSize,
      enterFullscreen,
      enterStage,
      restoreFromOverlay,
      emitPassthrough,
    }),
    [
      state,
      position,
      computedSize,
      sizeCfg,
      show,
      hide,
      close,
      setPhase,
      setPosition,
      stepSize,
      setStepSize,
      setFreeSize,
      enterFullscreen,
      enterStage,
      restoreFromOverlay,
      emitPassthrough,
    ],
  );

  return <WebcamCtx.Provider value={value}>{children}</WebcamCtx.Provider>;
}

export function usePresenterWebcam(): PresenterWebcamCtx {
  const ctx = useContext(WebcamCtx);
  if (!ctx) {
    throw new Error("usePresenterWebcam must be used inside <PresenterWebcamProvider>");
  }
  return ctx;
}

export const STAGE_SIZE = { w: STAGE_W, h: STAGE_H } as const;
