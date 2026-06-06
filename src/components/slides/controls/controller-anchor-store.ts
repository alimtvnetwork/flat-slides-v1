import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEFAULT_CONTROLLER_ANCHOR, nextControllerAnchor, type ControllerAnchor } from "./controller-anchor";

export const CONTROLLER_ANCHOR_STORAGE_KEY = "riseup.controller.anchor.v3";

interface ControllerAnchorStore {
  anchor: ControllerAnchor;
  setAnchor: (anchor: ControllerAnchor) => void;
  cycleAnchor: () => void;
}

export const useControllerAnchor = create<ControllerAnchorStore>()(
  persist(
    (set) => ({
      anchor: DEFAULT_CONTROLLER_ANCHOR,
      setAnchor: (anchor) => set({ anchor }),
      cycleAnchor: () => set((state) => ({ anchor: nextControllerAnchor(state.anchor) })),
    }),
    { name: CONTROLLER_ANCHOR_STORAGE_KEY, partialize: (state) => ({ anchor: state.anchor }) },
  ),
);

export function cycleControllerAnchor(): void {
  useControllerAnchor.getState().cycleAnchor();
}