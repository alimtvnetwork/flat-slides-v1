/**
 * Step 26 (B21) — single keymap. Plain-letter presenter shortcuts dispatch
 * through this registry instead of an ad-hoc `if` ladder in
 * `SlidePresenterPage`. SHORTCUTS (in `shortcuts.ts`) owns the keys; this
 * file owns the side-effects. A parity test in `presenterActions.test.ts`
 * fails the build if a plain-key SHORTCUTS entry has no registered action,
 * so the catalogue and the handler can never silently drift again.
 *
 * Modifier-combo and navigation keys (Cmd+K, Cmd+Shift+L, F5, arrows,
 * Shift+letter pairs) remain hand-rolled in the presenter — they need
 * preventDefault/repeat-debounce/etc. that don't fit a single action shape.
 * Those ids are listed in `MODIFIER_SHORTCUT_IDS` so the parity test
 * tolerates them.
 */

import { useAnnotations } from "./annotations-store";
import { useAudience } from "./audience-store";
import { useChrome } from "./chrome-store";
import { cycleControllerAnchor } from "./controls/controller-anchor-store";
import type { ShortcutDef } from "./shortcuts";
import { matchShortcut, SHORTCUTS } from "./shortcuts";
import { useTimer } from "./timer-store";

export interface PresenterActionCtx {
  event: KeyboardEvent;
  slideId: string;
  current: number;
  isStepRoute: boolean;
  stepNum: number;
  toggleFullscreen: () => void;
  toggleTopJumper: () => void;
  toggleCamera: () => void;
  toggleMusic: () => void;
  cycleScene: () => void;
  openOverview: () => void;
  openHelp: () => void;
}

export type PresenterAction = (ctx: PresenterActionCtx) => void;

export interface InspectorActionCtx {
  event: KeyboardEvent;
  current: number;
  stepNum: number;
  stepCount: number;
  total: number;
  goPrev: () => void;
  goNext: () => void;
  exitInspector: () => void;
  resetTimer: () => void;
  toggleTimerPause: () => void;
}

export type InspectorAction = (ctx: InspectorActionCtx) => void;

const INK_COLORS = ["#ef4444", "#facc15", "#22d3ee", "#a3e635", "#ffffff"];

export const PRESENTER_KEY_ACTIONS: Record<string, PresenterAction> = {
  "fullscreen-toggle": ({ event, toggleFullscreen }) => {
    event.preventDefault();
    toggleFullscreen();
  },
  "move-controller": ({ event }) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    cycleControllerAnchor();
  },
  "open-overview": ({ event, openOverview }) => {
    event.preventDefault();
    openOverview();
  },
  "open-help": ({ event, openHelp }) => {
    event.preventDefault();
    openHelp();
  },
  "toggle-top-jumper": ({ toggleTopJumper }) => toggleTopJumper(),
  "toggle-camera": ({ toggleCamera }) => toggleCamera(),
  "cycle-camera-shape": () => {
    if (!useChrome.getState().camera.visible) useChrome.getState().cycleCameraShape();
  },
  "camera-pip": () => {
    window.dispatchEvent(new CustomEvent("slides:camera-pip"));
  },
  "toggle-music": ({ toggleMusic }) => toggleMusic(),
  "cycle-scene": ({ cycleScene }) => cycleScene(),
  "toggle-pointer": () =>
    useAnnotations.setState((st) => ({ mode: st.mode === "pointer" ? "off" : "pointer" })),
  "toggle-ink": () =>
    useAnnotations.setState((st) => ({ mode: st.mode === "ink" ? "off" : "ink" })),
  "clear-ink": ({ slideId }) => useAnnotations.getState().clear(slideId),
  "annotate-clear-mode": ({ event }) => {
    event.preventDefault();
    useAnnotations.setState({ mode: "off" });
  },
  "ink-color": ({ event }) => useAnnotations.setState({ color: INK_COLORS[Number(event.key) - 1] }),
  "toggle-timer": ({ event }) => {
    if (event.shiftKey) {
      useTimer.getState().reset();
      return;
    }
    useChrome.getState().toggleTimerVisible();
  },
  "toggle-rehearsal": ({ event }) => {
    if (event.shiftKey) {
      useTimer.getState().resetRehearsal();
      return;
    }
    useTimer.getState().toggleRehearsal();
  },
  "toggle-qr": () => useAudience.getState().toggleQr(),
  "toggle-poll": () => useAudience.getState().toggleResults(),
  "copy-share-link": ({ current, isStepRoute, stepNum }) => {
    const sid = useAudience.getState().sessionId;
    const url = `${window.location.origin}/slides/${current}${isStepRoute ? `/${stepNum + 1}` : ""}?session=${sid}`;
    navigator.clipboard?.writeText(url).then(
      () => useChrome.getState().flashToast("Share link copied"),
      () => useChrome.getState().flashToast("Copy failed"),
    );
  },
  "toggle-focus-editor": () => useChrome.getState().toggleFocusEditor(),
  "toggle-notes": () => useChrome.getState().toggleNotesPeek(),
  "open-inspector": ({ event, current }) => {
    event.preventDefault();
    const url = `${window.location.origin}/slides/inspector/${current}`;
    window.open(url, "riseup-presenter-inspector", "noopener,noreferrer");
  },
};

export const INSPECTOR_KEY_ACTIONS: Record<string, InspectorAction> = {
  "inspector-nav-prev": ({ event, goPrev }) => {
    event.preventDefault();
    goPrev();
  },
  "inspector-nav-next": ({ event, goNext }) => {
    event.preventDefault();
    goNext();
  },
  "inspector-reset-timer": ({ event, resetTimer }) => {
    event.preventDefault();
    resetTimer();
  },
  "inspector-toggle-timer-pause": ({ event, toggleTimerPause }) => {
    event.preventDefault();
    toggleTimerPause();
  },
  "inspector-exit": ({ event, exitInspector }) => {
    event.preventDefault();
    exitInspector();
  },
};

/**
 * SHORTCUTS ids that are handled outside the registry because they need
 * modifier-combo branching, repeat-debounce, or are mouse/menu only.
 */
export const MODIFIER_SHORTCUT_IDS: ReadonlySet<string> = new Set([
  "nav-prev",
  "nav-next",
  "command-palette",
  "click-jump",
  "cycle-camera-size",
  "nudge-camera",
  "undo-stroke",
  "reset-timer",
  "reset-rehearsal",
  "toggle-timer-run",
  "export-rehearsal",
  "export-annotations",
  "toggle-lint",
  "esc-close-panel",
]);

/**
 * Look up the SHORTCUTS entry for an event and run its registered action,
 * if any. Returns the matched def (or undefined) so callers can decide
 * whether to fall through to the legacy navigation branches.
 */
export function dispatchPresenterKey(ctx: PresenterActionCtx): ShortcutDef | undefined {
  const def = matchShortcut(ctx.event);
  if (!def) return undefined;
  const action = PRESENTER_KEY_ACTIONS[def.id];
  if (!action) return def;
  action(ctx);
  return def;
}

export function dispatchInspectorKey(ctx: InspectorActionCtx): ShortcutDef | undefined {
  const def = matchShortcut(ctx.event, "inspector");
  if (!def) return undefined;
  const action = INSPECTOR_KEY_ACTIONS[def.id];
  if (!action) return def;
  action(ctx);
  return def;
}

/** Test-visible: SHORTCUTS entries that bind plain keys (no modifiers). */
export function plainKeyShortcuts(): ShortcutDef[] {
  return SHORTCUTS.filter((s) => s.scope !== "inspector" && s.keys.length > 0);
}

export function inspectorKeyShortcuts(): ShortcutDef[] {
  return SHORTCUTS.filter((s) => s.scope === "inspector" && s.keys.length > 0);
}
