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
 * Tasks 1–3 of the camera-2026 spec pack.
 *
 *   Task 1: explicit phase state machine
 *           (`off | requesting | on | tray | fullscreen | stage | denied`).
 *   Task 2: SSR-safe localStorage helpers under the `riseup.webcam.*` keys,
 *           with try/catch + safe fallbacks so corrupt JSON or a missing
 *           `window` never throws during SSR / build:dev prerender.
 *   Task 3: `show()` acquires the stream at ideal 1280×720 (audio:false)
 *           and maps NotAllowedError / NotFoundError to user-safe messages.
 *
 * Wider behaviour (hide/close lifecycle, drag/resize in stage coords,
 * fullscreen / stage-fill round-trips, shortcuts, auto-frame, plates,
 * cursor auto-hide) lands in subsequent tasks; the surface here is shaped
 * so those tasks can extend without rewriting the provider.
 *
 * Spec sources:
 *   - spec/old-slides/camera-2026/01-state-machine-and-hook.md §1–§4
 *   - spec/old-slides/camera-2026/06-implementation-steps-1-30.md steps 1–4
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

// Exported under the spec's `_FOR_TEST` aliases so test code can target
// the exact identifiers the spec mentions without re-deriving them.
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
    // Corrupt JSON / blocked storage — fall through to defaults.
    return fallback;
  }
}

function safeWrite(key: string, value: string) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Quota or private-mode — in-memory state still wins.
  }
}

export function readStoredPos(): { x: number; y: number } {
  return safeRead(POS_KEY, DEFAULT_POS, (raw) => {
    const p = JSON.parse(raw) as { x?: unknown; y?: unknown };
    if (typeof p?.x === "number" && typeof p?.y === "number") {
      return { x: p.x, y: p.y };
    }
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
}

const WebcamCtx = createContext<PresenterWebcamCtx | null>(null);

export function PresenterWebcamProvider({ children }: { children: ReactNode }) {
  const [state, setStateInternal] = useState<WebcamState>(() => ({
    phase: "off",
    stream: null,
    error: null,
  }));
  const [position] = useState(() => readStoredPos());
  const [sizeCfg] = useState<SizeConfig>(() => readStoredSize());

  // Keep a ref so async callbacks see the latest state without re-creating handlers.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setState = useCallback((next: WebcamState | ((prev: WebcamState) => WebcamState)) => {
    setStateInternal((prev) => (typeof next === "function" ? (next as (p: WebcamState) => WebcamState)(prev) : next));
  }, []);

  const show = useCallback(async () => {
    const current = stateRef.current;
    // Re-show from tray / fullscreen reuses the live stream — no second prompt.
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
    // Soft hide → tray. Stream stays alive indefinitely so the camera light
    // doesn't blink between slides. `close()` is the only path that stops tracks.
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

  // Cleanup on unmount: kill any live tracks so the OS camera light goes out.
  useEffect(() => {
    return () => {
      stateRef.current.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const setPhase = useCallback(
    (phase: WebcamPhase) => setState((prev) => ({ ...prev, phase })),
    [setState],
  );

  const computedSize = useMemo(
    () => (sizeCfg.kind === "step" ? SIZE_STEPS[sizeCfg.id] : { w: sizeCfg.w, h: sizeCfg.h }),
    [sizeCfg],
  );

  const value = useMemo<PresenterWebcamCtx>(
    () => ({ state, position, size: computedSize, sizeCfg, show, hide, close, setPhase }),
    [state, position, computedSize, sizeCfg, show, hide, close, setPhase],
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

// Stage geometry exported for downstream tasks (drag/resize clamps).
export const STAGE_SIZE = { w: STAGE_W, h: STAGE_H } as const;
