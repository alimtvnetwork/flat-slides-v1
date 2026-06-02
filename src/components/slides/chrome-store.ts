import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  toggleTopJumper: () => void;
  setTopJumperHidden: (v: boolean) => void;
  setDotPaginationVisible: (v: boolean) => void;
  setSlideNumberBadgeVisible: (v: boolean) => void;
  pushRecentJump: (n: number) => void;
  clearRecentJumps: () => void;
}

export const useChrome = create<ChromeStore>()(
  persist(
    (set) => ({
      topJumperHidden: true,
      dotPaginationVisible: true,
      slideNumberBadgeVisible: true,
      recentJumps: [],
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
    }),
    { name: "slides-chrome-v1" },
  ),
);
