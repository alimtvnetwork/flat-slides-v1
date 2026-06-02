import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CameraAnchor = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type CameraSize = "sm" | "md" | "lg";

export interface CameraState {
  visible: boolean;
  anchor: CameraAnchor;
  offsetX: number;
  offsetY: number;
  size: CameraSize;
  mirror: boolean;
}

export interface MusicState {
  playing: boolean;
  volume: number;
}

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
  /** Recent jump history (linear positions), most-recent-first, max 8. */
  recentJumps: number[];
  /** Presenter webcam bubble (presenter-local, never exported). */
  camera: CameraState;
  /** Deck background music presenter state (never exported). */
  music: MusicState;
  toggleTopJumper: () => void;
  setTopJumperHidden: (v: boolean) => void;
  setDotPaginationVisible: (v: boolean) => void;
  setSlideNumberBadgeVisible: (v: boolean) => void;
  pushRecentJump: (n: number) => void;
  clearRecentJumps: () => void;
  setCamera: (patch: Partial<CameraState>) => void;
  toggleCamera: () => void;
  setMusic: (patch: Partial<MusicState>) => void;
  toggleMusic: () => void;
}

export const useChrome = create<ChromeStore>()(
  persist(
    (set) => ({
      topJumperHidden: true,
      dotPaginationVisible: true,
      slideNumberBadgeVisible: true,
      recentJumps: [],
      camera: {
        visible: false,
        anchor: "bottom-right",
        offsetX: 0,
        offsetY: 0,
        size: "md",
        mirror: true,
      },
      music: { playing: false, volume: 0.4 },
      toggleTopJumper: () => set((s) => ({ topJumperHidden: !s.topJumperHidden })),
      setTopJumperHidden: (v) => set({ topJumperHidden: v }),
      setDotPaginationVisible: (v) => set({ dotPaginationVisible: v }),
      setSlideNumberBadgeVisible: (v) => set({ slideNumberBadgeVisible: v }),
      pushRecentJump: (n) =>
        set((s) => {
          const next = [n, ...s.recentJumps.filter((x) => x !== n)].slice(0, 8);
          return { recentJumps: next };
        }),
      clearRecentJumps: () => set({ recentJumps: [] }),
      setCamera: (patch) => set((s) => ({ camera: { ...s.camera, ...patch } })),
      toggleCamera: () => set((s) => ({ camera: { ...s.camera, visible: !s.camera.visible } })),
      setMusic: (patch) => set((s) => ({ music: { ...s.music, ...patch } })),
      toggleMusic: () => set((s) => ({ music: { ...s.music, playing: !s.music.playing } })),
    }),
    {
      name: "slides-chrome-v1",
      // Always pause music on reload — autoplay would be blocked anyway.
      partialize: (s) => ({
        topJumperHidden: s.topJumperHidden,
        dotPaginationVisible: s.dotPaginationVisible,
        slideNumberBadgeVisible: s.slideNumberBadgeVisible,
        camera: { ...s.camera, visible: false },
        music: { ...s.music, playing: false },
      }),
    },
  ),
);
