import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CameraAnchor = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type CameraSize = "sm" | "md" | "lg";
export type Scene = "normal" | "cam-only" | "split";

export interface CameraState {
  visible: boolean;
  anchor: CameraAnchor;
  offsetX: number;
  offsetY: number;
  size: CameraSize;
  mirror: boolean;
  /** Apply a chroma-key style mix-blend; cheap visual stand-in for greenscreen. */
  greenScreen: boolean;
  /** Hide the bubble while NOT in fullscreen (presenter prefers cam only on stage). */
  fullscreenOnly: boolean;
}

export interface MusicState {
  playing: boolean;
  volume: number;
}

const SIZE_ORDER: CameraSize[] = ["sm", "md", "lg"];
export const nextSize = (s: CameraSize): CameraSize =>
  SIZE_ORDER[(SIZE_ORDER.indexOf(s) + 1) % SIZE_ORDER.length];

const ANCHOR_ORDER: CameraAnchor[] = ["bottom-right", "bottom-left", "top-left", "top-right"];
export const nextAnchor = (a: CameraAnchor): CameraAnchor =>
  ANCHOR_ORDER[(ANCHOR_ORDER.indexOf(a) + 1) % ANCHOR_ORDER.length];

const SCENE_ORDER: Scene[] = ["normal", "split", "cam-only"];
export const nextScene = (s: Scene): Scene =>
  SCENE_ORDER[(SCENE_ORDER.indexOf(s) + 1) % SCENE_ORDER.length];

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
  /** Recent jump history (linear positions), most-recent-first, max 8. */
  recentJumps: number[];
  /** Presenter webcam bubble (presenter-local, never exported). */
  camera: CameraState;
  /** Deck background music presenter state (never exported). */
  music: MusicState;
  /** Active stage layout — drives bubble size and slide opacity. */
  scene: Scene;
  /** Brief toast text — used by routes to flash a scene/preset notice. */
  toast: { text: string; ts: number } | null;
  toggleTopJumper: () => void;
  setTopJumperHidden: (v: boolean) => void;
  setDotPaginationVisible: (v: boolean) => void;
  setSlideNumberBadgeVisible: (v: boolean) => void;
  setTimerVisible: (v: boolean) => void;
  toggleTimerVisible: () => void;
  setFocusEditorOpen: (v: boolean) => void;
  toggleFocusEditor: () => void;
  pushRecentJump: (n: number) => void;
  clearRecentJumps: () => void;
  setCamera: (patch: Partial<CameraState>) => void;
  toggleCamera: () => void;
  cycleCameraSize: () => void;
  cycleCameraAnchor: () => void;
  setMusic: (patch: Partial<MusicState>) => void;
  toggleMusic: () => void;
  setScene: (s: Scene) => void;
  cycleScene: () => void;
  flashToast: (text: string) => void;
}

export const useChrome = create<ChromeStore>()(
  persist(
    (set) => ({
      topJumperHidden: true,
      dotPaginationVisible: true,
      slideNumberBadgeVisible: true,
      timerVisible: true,
      recentJumps: [],
      camera: {
        visible: false,
        anchor: "bottom-right",
        offsetX: 0,
        offsetY: 0,
        size: "md",
        mirror: true,
        greenScreen: false,
        fullscreenOnly: false,
      },
      music: { playing: false, volume: 0.4 },
      scene: "normal",
      toast: null,
      toggleTopJumper: () => set((s) => ({ topJumperHidden: !s.topJumperHidden })),
      setTopJumperHidden: (v) => set({ topJumperHidden: v }),
      setDotPaginationVisible: (v) => set({ dotPaginationVisible: v }),
      setSlideNumberBadgeVisible: (v) => set({ slideNumberBadgeVisible: v }),
      setTimerVisible: (v) => set({ timerVisible: v }),
      toggleTimerVisible: () => set((s) => ({ timerVisible: !s.timerVisible })),
      pushRecentJump: (n) =>
        set((s) => {
          const next = [n, ...s.recentJumps.filter((x) => x !== n)].slice(0, 8);
          return { recentJumps: next };
        }),
      clearRecentJumps: () => set({ recentJumps: [] }),
      setCamera: (patch) => set((s) => ({ camera: { ...s.camera, ...patch } })),
      toggleCamera: () => set((s) => ({ camera: { ...s.camera, visible: !s.camera.visible } })),
      cycleCameraSize: () => set((s) => ({ camera: { ...s.camera, size: nextSize(s.camera.size) } })),
      cycleCameraAnchor: () => set((s) => ({ camera: { ...s.camera, anchor: nextAnchor(s.camera.anchor), offsetX: 0, offsetY: 0 } })),
      setMusic: (patch) => set((s) => ({ music: { ...s.music, ...patch } })),
      toggleMusic: () => set((s) => ({ music: { ...s.music, playing: !s.music.playing } })),
      setScene: (scene) => set({ scene, toast: { text: `Scene: ${scene}`, ts: Date.now() } }),
      cycleScene: () =>
        set((s) => {
          const scene = nextScene(s.scene);
          return { scene, toast: { text: `Scene: ${scene}`, ts: Date.now() } };
        }),
      flashToast: (text) => set({ toast: { text, ts: Date.now() } }),
    }),
    {
      name: "slides-chrome-v1",
      // Always pause music on reload — autoplay would be blocked anyway.
      partialize: (s) => ({
        topJumperHidden: s.topJumperHidden,
        dotPaginationVisible: s.dotPaginationVisible,
        slideNumberBadgeVisible: s.slideNumberBadgeVisible,
        timerVisible: s.timerVisible,
        camera: { ...s.camera, visible: false },
        music: { ...s.music, playing: false },
        scene: s.scene,
      }),
    },
  ),
);
