import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CameraAnchor = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type CameraSize = "S" | "M" | "L" | "XL";
export type CameraShape = "circle" | "rect" | "squircle";
export type Scene = "normal" | "cam-only" | "split" | "stage-fill";

export const CAMERA_STAGE = { w: 1920, h: 1080 } as const;
export const CAMERA_SIZE_STEPS: Record<CameraSize, { w: number; h: number }> = {
  S: { w: 240, h: 135 },
  M: { w: 320, h: 180 },
  L: { w: 480, h: 270 },
  XL: { w: 720, h: 405 },
};
export const CAMERA_FREE_MIN_W = 160;
export const CAMERA_FREE_MAX_W = 960;
const CAMERA_MARGIN = 32;

export interface CameraState {
  visible: boolean;
  anchor: CameraAnchor;
  /** 1920×1080 slide-stage coordinates for the camera's top-left corner. */
  x: number;
  y: number;
  /** Legacy viewport offsets retained only for persisted-state migration/tests. */
  offsetX: number;
  offsetY: number;
  size: CameraSize;
  /** When set, overrides the preset width; height is always 16:9. */
  customSize: number | null;
  shape: CameraShape;
  mirror: boolean;
  /** Apply a chroma-key style mix-blend; cheap visual stand-in for greenscreen. */
  greenScreen: boolean;
  /** Backplate shown behind camera video / permission states. */
  backgroundMode: "color" | "image";
  backgroundColor: string;
  backgroundImage: string;
  /** Hide the bubble while NOT in fullscreen (presenter prefers cam only on stage). */
  fullscreenOnly: boolean;
  /** Auto-frame face via experimental FaceDetector (graceful no-op when unsupported). */
  autoFrame: boolean;
}

export interface MusicState {
  playing: boolean;
  volume: number;
}

export interface SlideMusicOverride {
  url: string;
  loop?: boolean;
  volume?: number;
}

const SIZE_ORDER: CameraSize[] = ["S", "M", "L", "XL"];
export const nextSize = (s: CameraSize): CameraSize =>
  SIZE_ORDER[(SIZE_ORDER.indexOf(s) + 1) % SIZE_ORDER.length];

const ANCHOR_ORDER: CameraAnchor[] = ["bottom-right", "bottom-left", "top-left", "top-right"];
export const nextAnchor = (a: CameraAnchor): CameraAnchor =>
  ANCHOR_ORDER[(ANCHOR_ORDER.indexOf(a) + 1) % ANCHOR_ORDER.length];

const SCENE_ORDER: Scene[] = ["normal", "split", "cam-only", "stage-fill"];
export const nextScene = (s: Scene): Scene =>
  SCENE_ORDER[(SCENE_ORDER.indexOf(s) + 1) % SCENE_ORDER.length];

const SHAPE_ORDER: CameraShape[] = ["circle", "squircle", "rect"];
export const nextShape = (s: CameraShape): CameraShape =>
  SHAPE_ORDER[(SHAPE_ORDER.indexOf(s) + 1) % SHAPE_ORDER.length];

export function cameraDimensions(camera: Pick<CameraState, "size" | "customSize">) {
  const width = camera.customSize ?? CAMERA_SIZE_STEPS[camera.size].w;
  const clampedWidth = Math.max(CAMERA_FREE_MIN_W, Math.min(CAMERA_FREE_MAX_W, Math.round(width)));
  return { w: clampedWidth, h: Math.round(clampedWidth * 9 / 16) };
}

export function clampCameraPosition(pos: { x: number; y: number }, dims: { w: number; h: number }) {
  return {
    x: Math.max(0, Math.min(CAMERA_STAGE.w - dims.w, Math.round(pos.x))),
    y: Math.max(0, Math.min(CAMERA_STAGE.h - dims.h, Math.round(pos.y))),
  };
}

function anchoredCameraPosition(anchor: CameraAnchor, dims: { w: number; h: number }) {
  if (anchor === "top-left") return { x: CAMERA_MARGIN, y: CAMERA_MARGIN };
  if (anchor === "top-right") return { x: CAMERA_STAGE.w - dims.w - CAMERA_MARGIN, y: CAMERA_MARGIN };
  if (anchor === "bottom-left") return { x: CAMERA_MARGIN, y: CAMERA_STAGE.h - dims.h - CAMERA_MARGIN };
  return { x: CAMERA_STAGE.w - dims.w - CAMERA_MARGIN, y: CAMERA_STAGE.h - dims.h - CAMERA_MARGIN };
}

function normalizeCameraSize(value: unknown): CameraSize {
  if (value === "S" || value === "M" || value === "L" || value === "XL") return value;
  if (value === "sm") return "S";
  if (value === "lg") return "L";
  return "M";
}

function normalizeCamera(camera: Partial<CameraState>): CameraState {
  const size = normalizeCameraSize(camera.size);
  const customSize = typeof camera.customSize === "number"
    ? Math.max(CAMERA_FREE_MIN_W, Math.min(CAMERA_FREE_MAX_W, Math.round(camera.customSize)))
    : null;
  const draft: CameraState = {
    ...DEFAULT_CAMERA,
    ...camera,
    size,
    customSize,
  };
  const fallback = anchoredCameraPosition(draft.anchor, cameraDimensions(draft));
  const hasStagePos = typeof camera.x === "number" && typeof camera.y === "number";
  const pos = clampCameraPosition(hasStagePos ? { x: camera.x!, y: camera.y! } : fallback, cameraDimensions(draft));
  return { ...draft, ...pos };
}

const DEFAULT_CAMERA: CameraState = {
  visible: true,
  anchor: "bottom-right",
  x: CAMERA_STAGE.w - CAMERA_SIZE_STEPS.M.w - CAMERA_MARGIN,
  y: CAMERA_MARGIN,
  offsetX: 0,
  offsetY: 0,
  size: "M",
  customSize: null,
  shape: "circle",
  mirror: true,
  greenScreen: false,
  backgroundMode: "color",
  backgroundColor: "#050505",
  backgroundImage: "",
  fullscreenOnly: false,
  autoFrame: false,
};

/**
 * Transient chrome / surface visibility state. Persisted so a presenter's
 * choices survive a refresh, but never exported with the deck JSON.
 */
export interface ChromeStore {
  /** Top-bar (presenter jumper) hidden by default; toggle with `J`. */
  topJumperHidden: boolean;
  /** Dot pagination row visible by default; toggle in settings. */
  dotPaginationVisible: boolean;
  /** Bottom-right small badge "04 / 13"; visible by default. */
  slideNumberBadgeVisible: boolean;
  /** Presenter timer overlay (top-left). Visible by default in fullscreen. */
  timerVisible: boolean;
  /** On-canvas focus-region editor open (toggled by `F`). */
  focusEditorOpen: boolean;
  /** Presenter notes peek panel open (toggled by `N`). Persisted so the
   *  presenter doesn't have to reopen it on every slide. */
  notesPeekOpen: boolean;
  /** Last theme id the user picked, independent of the active deck.
   *  Used to default new decks / scratch decks to the user's preference. */
  lastUsedThemeId: string | null;
  /** Recent jump history (linear positions), most-recent-first, max 8. */
  recentJumps: number[];
  /** Presenter webcam bubble (presenter-local, never exported). */
  camera: CameraState;
  /** Deck background music presenter state (never exported). */
  music: MusicState;
  /**
   * Active slide's per-slide music override (transient). Set by the
   * presenter on slide change so `useDeckMusic` can cross-fade between
   * deck-level music and the slide's override.
   */
  slideMusic: SlideMusicOverride | null;
  /** Active stage layout — drives bubble size and slide opacity. */
  scene: Scene;
  /** Brief toast text — used by routes to flash a scene/preset notice. */
  toast: { text: string; ts: number } | null;
  /** Persistent manual fallback shown when the browser blocks scripted presenter popups. */
  presenterFallback: { url: string; reason: "popup-blocked" | "fullscreen-blocked"; ts: number } | null;
  toggleTopJumper: () => void;
  setTopJumperHidden: (v: boolean) => void;
  setDotPaginationVisible: (v: boolean) => void;
  setSlideNumberBadgeVisible: (v: boolean) => void;
  setTimerVisible: (v: boolean) => void;
  toggleTimerVisible: () => void;
  setFocusEditorOpen: (v: boolean) => void;
  toggleFocusEditor: () => void;
  setNotesPeekOpen: (v: boolean) => void;
  toggleNotesPeek: () => void;
  setLastUsedThemeId: (id: string | null) => void;
  clearLastUsedThemeId: () => void;

  pushRecentJump: (n: number) => void;
  clearRecentJumps: () => void;
  setRecentJumps: (jumps: number[]) => void;
  setCamera: (patch: Partial<CameraState>) => void;
  toggleCamera: () => void;
  cycleCameraSize: () => void;
  cycleCameraAnchor: () => void;
  cycleCameraShape: () => void;
  setCameraCustomSize: (px: number | null) => void;
  setMusic: (patch: Partial<MusicState>) => void;
  toggleMusic: () => void;
  setSlideMusic: (override: SlideMusicOverride | null) => void;
  setScene: (s: Scene) => void;
  cycleScene: () => void;
  flashToast: (text: string) => void;
  showPresenterFallback: (url: string, reason?: "popup-blocked" | "fullscreen-blocked") => void;
  clearPresenterFallback: () => void;
}

export const useChrome = create<ChromeStore>()(
  persist(
    (set) => ({
      topJumperHidden: true,
      dotPaginationVisible: true,
      slideNumberBadgeVisible: true,
      timerVisible: true,
      focusEditorOpen: false,
      notesPeekOpen: false,
      lastUsedThemeId: null,
      recentJumps: [],
      camera: { ...DEFAULT_CAMERA },
      music: { playing: false, volume: 0.4 },
      slideMusic: null,
      scene: "normal",
      toast: null,
      presenterFallback: null,
      toggleTopJumper: () => set((s) => ({ topJumperHidden: !s.topJumperHidden })),
      setTopJumperHidden: (v) => set({ topJumperHidden: v }),
      setDotPaginationVisible: (v) => set({ dotPaginationVisible: v }),
      setSlideNumberBadgeVisible: (v) => set({ slideNumberBadgeVisible: v }),
      setTimerVisible: (v) => set({ timerVisible: v }),
      toggleTimerVisible: () => set((s) => ({ timerVisible: !s.timerVisible })),
      setFocusEditorOpen: (v) => set({ focusEditorOpen: v }),
      toggleFocusEditor: () => set((s) => ({ focusEditorOpen: !s.focusEditorOpen })),
      setNotesPeekOpen: (v) => set({ notesPeekOpen: v }),
      toggleNotesPeek: () => set((s) => ({ notesPeekOpen: !s.notesPeekOpen })),
      setLastUsedThemeId: (id) => set({ lastUsedThemeId: id }),
      clearLastUsedThemeId: () => set({ lastUsedThemeId: null }),

      pushRecentJump: (n) =>
        set((s) => {
          const next = [n, ...s.recentJumps.filter((x) => x !== n)].slice(0, 8);
          return { recentJumps: next };
        }),
      clearRecentJumps: () => set({ recentJumps: [] }),
      setRecentJumps: (jumps) => set({ recentJumps: jumps.slice(0, 8) }),
      setCamera: (patch) => set((s) => ({ camera: normalizeCamera({ ...s.camera, ...patch }) })),
      toggleCamera: () => set((s) => ({ camera: { ...s.camera, visible: !s.camera.visible } })),
      cycleCameraSize: () => set((s) => {
        const next = { ...s.camera, size: nextSize(s.camera.size), customSize: null };
        return { camera: normalizeCamera({ ...next, ...clampCameraPosition({ x: next.x, y: next.y }, cameraDimensions(next)) }) };
      }),
      cycleCameraAnchor: () => set((s) => {
        const anchor = nextAnchor(s.camera.anchor);
        const next = { ...s.camera, anchor, offsetX: 0, offsetY: 0 };
        return { camera: normalizeCamera({ ...next, ...anchoredCameraPosition(anchor, cameraDimensions(next)) }) };
      }),
      cycleCameraShape: () => set((s) => ({ camera: { ...s.camera, shape: nextShape(s.camera.shape) } })),
      setCameraCustomSize: (px) => set((s) => {
        const next = { ...s.camera, customSize: px };
        return { camera: normalizeCamera({ ...next, ...clampCameraPosition({ x: next.x, y: next.y }, cameraDimensions(next)) }) };
      }),
      setMusic: (patch) => set((s) => ({ music: { ...s.music, ...patch } })),
      toggleMusic: () => set((s) => ({ music: { ...s.music, playing: !s.music.playing } })),
      setScene: (scene) => set({ scene, toast: { text: `Scene: ${scene}`, ts: Date.now() } }),
      cycleScene: () =>
        set((s) => {
          const scene = nextScene(s.scene);
          return { scene, toast: { text: `Scene: ${scene}`, ts: Date.now() } };
        }),
      flashToast: (text) => set({ toast: { text, ts: Date.now() } }),
      showPresenterFallback: (url, reason = "popup-blocked") =>
        set({ presenterFallback: { url, reason, ts: Date.now() } }),
      clearPresenterFallback: () => set({ presenterFallback: null }),
    }),
    {
      name: "slides-chrome-v2",
      // Always pause music on reload — autoplay would be blocked anyway.
      partialize: (s) => ({
        topJumperHidden: s.topJumperHidden,
        dotPaginationVisible: s.dotPaginationVisible,
        slideNumberBadgeVisible: s.slideNumberBadgeVisible,
        timerVisible: s.timerVisible,
        notesPeekOpen: s.notesPeekOpen,
        lastUsedThemeId: s.lastUsedThemeId,
        camera: s.camera,
        music: { ...s.music, playing: false },
        scene: s.scene,
      }),
      merge: (persisted, current) => {
        const state = persisted as Partial<ChromeStore> | undefined;
        return {
          ...current,
          ...state,
          camera: normalizeCamera({ ...(state?.camera ?? current.camera), visible: state?.camera?.visible ?? DEFAULT_CAMERA.visible }),
          music: { ...current.music, ...(state?.music ?? current.music), playing: false },
        };
      },
    },
  ),
);
