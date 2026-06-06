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
 *   - spec/old-slides/camera-2026/01-state-machine-and-hook.md §1–§11
 *   - spec/old-slides/camera-2026/02-overlay-rendering-and-surfaces.md §2
 *   - spec/old-slides/camera-2026/06-implementation-steps-1-30.md steps 1–6
 *
 * ─────────────────────────────────────────────────────────────────────────
 * STEP 1 AUDIT — spec 01 §3 (Ctx interface) vs this implementation.
 * Plan ref: .lovable/plan.md → Phase A · Step 1.
 *
 *   Spec action / field            Status   Implementation notes
 *   ─────────────────────────────  ───────  ───────────────────────────────
 *   phase / stream / error          ✅      `WebcamState`
 *   position                        ✅      `position` + clamped `setPosition`
 *   size (live painted)             ✅      `computedSize` via `resolveSize`
 *   sizeStep | null                 ⚠️      Exposed as `sizeCfg`; spec wants
 *                                           a derived `sizeStep` (null when
 *                                           free). Callers currently inspect
 *                                           `sizeCfg.kind` — acceptable but
 *                                           non-spec; flag for step 2.
 *   minimized                       ❌      No state, no MINI_W/H, no MIN_KEY
 *                                           wiring (constant declared only).
 *   toggle()                        ❌      Missing convenience action.
 *   show()                          ✅
 *   hide()                          ✅
 *   close()                         ✅      Spec also clears actionStackRef.
 *   toggleMinimized()               ❌      Missing.
 *   setPosition(x,y)                ✅      Signature differs (object arg).
 *   setSizeStep(s)                  ✅      Named `setStepSize`.
 *   growSize() / shrinkSize()       ✅      Folded into `stepSize(+1|-1)`.
 *   resizeFree(w,h?)                ✅      Named `setFreeSize(width)`.
 *   enterFullscreen()               ✅      Sync, not async; OK.
 *   exitFullscreen()                ⚠️      Covered by `restoreFromOverlay`
 *                                           (handles both fullscreen+stage);
 *                                           add named alias in step 2.
 *   pushFullscreenAction(a)         ❌      No `actionStackRef` / back stack.
 *   registerNavHandlers(h)          ❌      Only `emitPassthrough` exists;
 *                                           no handler registry for the deck
 *                                           to subscribe to passthrough.
 *   haloVisible / toggleHalo()      ✅      Named `halo` / `toggleHalo`.
 *   toggleStage()                   ❌      Only one-way `enterStage`.
 *   circleShape / toggleCircleShape ✅      Named `circle` / `toggleCircle`.
 *   cinematicExiting                ❌      No state.
 *   runCinematicCycle()             ❌      No `]` cycle + whoosh.
 *
 *   Out-of-spec extras kept (deliberate):
 *     • autoFrame / setAutoFrame / toggleAutoFrame  — spec 04 task.
 *     • plateVariant / setPlateVariant / cyclePlateVariant — spec 05 §6.
 *     • emitPassthrough — spec 02 §6; pair with registerNavHandlers in step 2.
 *
 *   Step 2 will implement every ❌ row and reconcile the two ⚠️ rows.
 * ─────────────────────────────────────────────────────────────────────────
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

/** spec 01 §2 — minimized "puck" footprint. Independent of step/free sizes. */
export const MINI_W = 96;
export const MINI_H = 96;

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

/** spec 01 §3 — stack entry tracked so cinematic / fullscreen can undo cleanly. */
export type FullscreenAction =
  | "enter-fullscreen"
  | "enter-stage"
  | "cinematic"
  | "goNext"
  | "goPrev";

/** spec 06 step 20 — deck-side handlers the camera invokes on passthrough. */
export interface NavHandlers {
  goNext: () => void;
  goPrev: () => void;
}

export interface PresenterWebcamCtx {
  state: WebcamState;
  position: { x: number; y: number };
  size: { w: number; h: number };
  sizeCfg: SizeConfig;
  /** Spec 01 §3 — null when free-resized or minimized; else the active preset. */
  sizeStep: SizeStep | null;
  /** Spec 01 §2 — 96×96 puck override; persisted under MIN_KEY. */
  minimized: boolean;

  /** Spec 01 §3 — convenience: on→hide, tray→show, else show. */
  toggle: () => Promise<void>;
  show: () => Promise<void>;
  hide: () => void;
  close: () => void;
  setPhase: (phase: WebcamPhase) => void;
  toggleMinimized: () => void;

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
  /** Spec 01 §7 — toggle stage on/off (re-uses the same snapshot/restore path). */
  toggleStage: () => void;
  /** Task 8 — restore the snapshot taken by enterFullscreen/enterStage. Idempotent. */
  restoreFromOverlay: () => void;
  /** Spec 01 §6 — named alias for `restoreFromOverlay` when only fullscreen is meant. */
  exitFullscreen: () => void;
  /** Spec 01 §3 — push an action onto the fullscreen back-stack. */
  pushFullscreenAction: (action: FullscreenAction) => void;
  /** Spec 06 step 20 — deck subscribes its goNext/goPrev; returns an unsubscribe. */
  registerNavHandlers: (handlers: NavHandlers) => () => void;
  /** Task 9 — convenience: dispatch a `riseup:webcam-passthrough` next/prev event. */
  emitPassthrough: (direction: "next" | "prev") => void;

  /** Spec 01 §3 — true while `runCinematicCycle()` plays its 0.8s squish/whoosh. */
  cinematicExiting: boolean;
  /** Spec 03 §1 — `]`: whoosh + 0.8s squish; reduced-motion = instant. */
  runCinematicCycle: () => void;

  /** Task 11 — persisted auto-frame enable flag. */
  autoFrame: boolean;
  setAutoFrame: (v: boolean) => void;
  toggleAutoFrame: () => void;
  /** Task 12 — persisted halo flag (independent of plate / circle). */
  halo: boolean;
  setHalo: (v: boolean) => void;
  toggleHalo: () => void;
  /** Task 13 — persisted plate variant; `circle=true` bypasses the plate visually. */
  plateVariant: PlateVariant;
  setPlateVariant: (v: PlateVariant) => void;
  cyclePlateVariant: () => void;
  /** Task 13 — persisted circle/squircle toggle; circle bypasses plate/mask. */
  circle: boolean;
  setCircle: (v: boolean) => void;
  toggleCircle: () => void;
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
  const [autoFrame, setAutoFrameState] = useState(() => readStoredFlag(AUTOFRAME_KEY, false));
  const [halo, setHaloState] = useState(() => readStoredFlag(HALO_KEY, true));
  const [circle, setCircleState] = useState(() => readStoredFlag(CIRCLE_KEY, true));
  const [plateVariant, setPlateVariantState] = useState<PlateVariant>(() => readStoredPlate());
  const [minimized, setMinimizedState] = useState(() => readStoredFlag(MIN_KEY, false));
  const [cinematicExiting, setCinematicExiting] = useState(false);
  const actionStackRef = useRef<FullscreenAction[]>([]);
  const navHandlersRef = useRef<NavHandlers | null>(null);

  const setAutoFrame = useCallback((v: boolean) => {
    setAutoFrameState(v);
    writeStoredFlag(AUTOFRAME_KEY, v);
  }, []);
  const toggleAutoFrame = useCallback(() => setAutoFrameState((v) => {
    writeStoredFlag(AUTOFRAME_KEY, !v);
    return !v;
  }), []);

  const setHalo = useCallback((v: boolean) => {
    setHaloState(v);
    writeStoredFlag(HALO_KEY, v);
  }, []);
  const toggleHalo = useCallback(() => setHaloState((v) => {
    writeStoredFlag(HALO_KEY, !v);
    return !v;
  }), []);

  const setCircle = useCallback((v: boolean) => {
    setCircleState(v);
    writeStoredFlag(CIRCLE_KEY, v);
  }, []);
  const toggleCircle = useCallback(() => setCircleState((v) => {
    writeStoredFlag(CIRCLE_KEY, !v);
    return !v;
  }), []);

  const setPlateVariant = useCallback((v: PlateVariant) => {
    setPlateVariantState(v);
    writeStoredPlate(v);
  }, []);
  const cyclePlateVariant = useCallback(() => setPlateVariantState((prev) => {
    const idx = PLATE_VARIANTS.indexOf(prev);
    const next = PLATE_VARIANTS[(idx + 1) % PLATE_VARIANTS.length];
    writeStoredPlate(next);
    return next;
  }), []);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setState = useCallback((next: WebcamState | ((prev: WebcamState) => WebcamState)) => {
    setStateInternal((prev) =>
      typeof next === "function" ? (next as (p: WebcamState) => WebcamState)(prev) : next,
    );
  }, []);

  const computedSize = useMemo(
    () => (minimized ? { w: MINI_W, h: MINI_H } : resolveSize(sizeCfg)),
    [minimized, sizeCfg],
  );
  const sizeStep = useMemo<SizeStep | null>(
    () => (minimized || sizeCfg.kind !== "step" ? null : sizeCfg.id),
    [minimized, sizeCfg],
  );

  const toggleMinimized = useCallback(() => {
    setMinimizedState((v) => {
      writeStoredFlag(MIN_KEY, !v);
      return !v;
    });
  }, []);

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

  // ─── Spec 01 §3 / §7 — toggles, action-stack, nav handler registry ───
  const toggle = useCallback(async () => {
    const current = stateRef.current;
    if (current.phase === "on") { hide(); return; }
    await show();
  }, [hide, show]);

  const toggleStage = useCallback(() => {
    if (stateRef.current.phase === "stage") {
      restoreFromOverlay();
      return;
    }
    enterStage();
  }, [enterStage, restoreFromOverlay]);

  const exitFullscreen = useCallback(() => {
    if (stateRef.current.phase === "fullscreen") restoreFromOverlay();
  }, [restoreFromOverlay]);

  const pushFullscreenAction = useCallback((action: FullscreenAction) => {
    actionStackRef.current.push(action);
  }, []);

  const registerNavHandlers = useCallback((handlers: NavHandlers) => {
    navHandlersRef.current = handlers;
    return () => {
      if (navHandlersRef.current === handlers) navHandlersRef.current = null;
    };
  }, []);

  const emitPassthrough = useCallback((direction: "next" | "prev") => {
    const handlers = navHandlersRef.current;
    if (handlers) {
      direction === "next" ? handlers.goNext() : handlers.goPrev();
    }
    if (typeof window === "undefined") return;
    const detail: WebcamPassthroughDetail = { direction };
    window.dispatchEvent(new CustomEvent(WEBCAM_PASSTHROUGH_EVENT, { detail }));
  }, []);

  const cinematicTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runCinematicCycle = useCallback(() => {
    if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
    pushFullscreenAction("cinematic");
    setCinematicExiting(true);
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const delay = reduced ? 0 : 800;
    cinematicTimerRef.current = setTimeout(() => setCinematicExiting(false), delay);
  }, [pushFullscreenAction]);

  useEffect(() => () => {
    if (cinematicTimerRef.current) clearTimeout(cinematicTimerRef.current);
  }, []);

  const value = useMemo<PresenterWebcamCtx>(
    () => ({
      state,
      position,
      size: computedSize,
      sizeCfg,
      sizeStep,
      minimized,
      toggle,
      show,
      hide,
      close,
      setPhase,
      toggleMinimized,
      setPosition,
      stepSize,
      setStepSize,
      setFreeSize,
      enterFullscreen,
      enterStage,
      toggleStage,
      restoreFromOverlay,
      exitFullscreen,
      pushFullscreenAction,
      registerNavHandlers,
      emitPassthrough,
      cinematicExiting,
      runCinematicCycle,
      autoFrame,
      setAutoFrame,
      toggleAutoFrame,
      halo,
      setHalo,
      toggleHalo,
      plateVariant,
      setPlateVariant,
      cyclePlateVariant,
      circle,
      setCircle,
      toggleCircle,
    }),
    [
      state, position, computedSize, sizeCfg, sizeStep, minimized,
      toggle, show, hide, close, setPhase, toggleMinimized,
      setPosition, stepSize, setStepSize, setFreeSize,
      enterFullscreen, enterStage, toggleStage, restoreFromOverlay, exitFullscreen,
      pushFullscreenAction, registerNavHandlers, emitPassthrough,
      cinematicExiting, runCinematicCycle,
      autoFrame, setAutoFrame, toggleAutoFrame,
      halo, setHalo, toggleHalo,
      plateVariant, setPlateVariant, cyclePlateVariant,
      circle, setCircle, toggleCircle,
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
