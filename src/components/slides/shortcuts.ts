/**
 * Single source of truth for keyboard shortcuts.
 * Consumed by `useKeyboardShortcuts` (the handler) AND
 * `KeyboardShortcutsDialog` (the `/` help popup).
 *
 * Step 26 (B21): every entry now carries a stable `id`. The presenter
 * dispatches keys by looking up `matchShortcut(event)` and calling the
 * action registered for that id in `presenterActions.ts`. New shortcuts
 * MUST be added here first; the parity test in `presenterActions.test.ts`
 * fails fast if a presenter-group key has no registered action.
 */

export type ShortcutGroup =
  | "Navigation"
  | "Steps"
  | "Surfaces"
  | "Presenter"
  | "Camera"
  | "Annotate"
  | "Timer"
  | "Audience";

export type ShortcutScope = "presenter" | "inspector";

export interface ShortcutDef {
  /** Stable identifier consumed by the action registry. */
  id: string;
  /** Display key (e.g. "←", "Space", "F"). */
  display: string;
  /** Aliases matched against KeyboardEvent.key (case-insensitive). */
  keys: string[];
  label: string;
  group: ShortcutGroup;
  scope?: ShortcutScope;
}

function shortcut(
  id: string,
  display: string,
  keys: string[],
  label: string,
  group: ShortcutGroup,
): ShortcutDef {
  return { id, display, keys, label, group };
}

function inspectorShortcut(
  id: string,
  display: string,
  keys: string[],
  label: string,
  group: ShortcutGroup,
): ShortcutDef {
  return { ...shortcut(id, display, keys, label, group), scope: "inspector" };
}

export const SHORTCUTS: ShortcutDef[] = [
  shortcut("nav-prev", "←", ["ArrowLeft"], "Previous slide or step", "Navigation"),
  shortcut("nav-next", "→", ["ArrowRight", " ", "Enter"], "Next slide or step", "Navigation"),
  shortcut("annotate-clear-mode", "Esc", ["Escape"], "Clear annotation tool", "Annotate"),
  shortcut("fullscreen-toggle", "F5", ["F5"], "Toggle fullscreen", "Presenter"),
  shortcut("open-overview", "G", ["g"], "Open deck overview", "Surfaces"),
  shortcut("move-controller", "B", ["b"], "Move controller", "Presenter"),
  shortcut("toggle-top-jumper", "J", ["j"], "Toggle top jumper", "Surfaces"),
  shortcut("open-help", "?", ["/", "?"], "Show keyboard shortcuts", "Presenter"),
  shortcut("command-palette", "⌘K", [], "Command palette", "Presenter"),
  shortcut("click-jump", "Click N", [], "Jump to slide N", "Navigation"),
  shortcut("toggle-camera", "C", ["c"], "Toggle camera bubble", "Camera"),
  shortcut("cycle-camera-size", "Shift+C", [], "Cycle camera size", "Camera"),
  shortcut("cycle-camera-shape", "O", ["o"], "Cycle camera shape", "Camera"),
  shortcut("nudge-camera", "Shift+←→↑↓", [], "Nudge camera position", "Camera"),
  shortcut("camera-pip", "P", ["p"], "Picture-in-picture", "Camera"),
  shortcut("toggle-music", "M", ["m"], "Toggle background music", "Presenter"),
  shortcut("cycle-scene", "S", ["s"], "Cycle scene preset", "Presenter"),
  shortcut("toggle-pointer", "L", ["l"], "Toggle laser pointer", "Annotate"),
  shortcut("toggle-ink", "K", ["k"], "Toggle ink (draw)", "Annotate"),
  shortcut("clear-ink", "X", ["x"], "Clear ink on this slide", "Annotate"),
  shortcut("ink-color", "1-5", ["1", "2", "3", "4", "5"], "Pick ink color", "Annotate"),
  shortcut("undo-stroke", "⌘Z", [], "Undo last stroke", "Annotate"),
  shortcut("toggle-timer", "T", ["t"], "Toggle timer overlay", "Timer"),
  shortcut("reset-timer", "Shift+T", [], "Reset timer", "Timer"),
  shortcut("toggle-rehearsal", "R", ["r"], "Toggle rehearsal mode", "Timer"),
  shortcut("reset-rehearsal", "Shift+R", [], "Reset rehearsal data", "Timer"),
  shortcut("toggle-timer-run", "Shift+Space", [], "Pause / resume timer", "Timer"),
  shortcut("toggle-qr", "Q", ["q"], "Toggle audience QR", "Audience"),
  shortcut("toggle-poll", "V", ["v"], "Toggle live poll results", "Audience"),
  shortcut("copy-share-link", "Y", ["y"], "Copy share link", "Audience"),
  shortcut("toggle-focus-editor", "F", ["f"], "Edit focus regions", "Presenter"),
  shortcut("export-rehearsal", "⌘E", [], "Export rehearsal report", "Timer"),
  shortcut("export-annotations", "⌘⇧E", [], "Export annotations", "Annotate"),
  shortcut("toggle-lint", "⌘⇧L", [], "Toggle lint panel", "Presenter"),
  shortcut("toggle-notes", "N", ["n"], "Toggle presenter notes", "Presenter"),
  shortcut("esc-close-panel", "Esc", [], "Close open panel or dialog", "Surfaces"),
  inspectorShortcut(
    "inspector-nav-prev",
    "←",
    ["ArrowLeft"],
    "Inspector previous slide or step",
    "Navigation",
  ),
  inspectorShortcut(
    "inspector-nav-next",
    "→",
    ["ArrowRight", " ", "Enter"],
    "Inspector next slide or step",
    "Navigation",
  ),
  inspectorShortcut("inspector-reset-timer", "R", ["r", "KeyR"], "Reset inspector timer", "Timer"),
  inspectorShortcut(
    "inspector-toggle-timer-pause",
    "P",
    ["p", "KeyP"],
    "Pause / resume inspector timer",
    "Timer",
  ),
  inspectorShortcut("inspector-exit", "Esc", ["Escape"], "Exit presenter inspector", "Surfaces"),
];

export function matchesShortcut(event: KeyboardEvent, def: ShortcutDef): boolean {
  return def.keys.some((k) => k.toLowerCase() === event.key.toLowerCase());
}

/**
 * Step 26: find the first SHORTCUTS entry whose `keys` aliases match
 * `event.key`. Returns `undefined` when no plain-key binding applies
 * (e.g. modifier combos, mouse-only shortcuts, unmapped keys).
 */
export function matchShortcut(
  event: KeyboardEvent,
  scope: ShortcutScope = "presenter",
): ShortcutDef | undefined {
  return SHORTCUTS.find(
    (def) => hasScope(def, scope) && def.keys.length > 0 && matchesShortcut(event, def),
  );
}

function hasScope(def: ShortcutDef, scope: ShortcutScope): boolean {
  if (scope === "inspector") return def.scope === "inspector";
  return def.scope !== "inspector";
}

/**
 * camera-2026 task 10 — explicit camera shortcut catalogue.
 *
 * Reconciled with existing deck shortcuts above to avoid silent collisions:
 *   - `m` (Music) and `f` (Focus regions) keep their current meanings.
 *     Camera soft-hide / auto-frame use Alt-modified variants so both
 *     features remain reachable from the keyboard.
 *   - `1`–`5` are claimed by the ink-color picker only while an ink tool
 *     is active; outside annotation mode, the camera handler may consume
 *     `1` to enter stage-fill. The presenter dispatcher decides priority.
 *
 * The handler in `SlidePresenterPage` should iterate this list AFTER its
 * input-guard check and AFTER ink/annotation tools have first refusal.
 */
export const CAMERA_SHORTCUTS: ShortcutDef[] = [
  {
    id: "cam-info",
    display: "I",
    keys: ["i"],
    label: "Show camera info / status",
    group: "Camera",
  },
  {
    id: "cam-soft-hide",
    display: "Alt+M",
    keys: [],
    label: "Soft-hide camera to tray",
    group: "Camera",
  },
  {
    id: "cam-autoframe",
    display: "Alt+F",
    keys: [],
    label: "Toggle camera auto-frame",
    group: "Camera",
  },
  { id: "cam-halo", display: "H", keys: ["h"], label: "Toggle camera halo", group: "Camera" },
  {
    id: "cam-size-down",
    display: "[",
    keys: ["["],
    label: "Camera size step down",
    group: "Camera",
  },
  { id: "cam-size-up", display: "]", keys: ["]"], label: "Camera size step up", group: "Camera" },
  { id: "cam-fill-stage", display: "1", keys: ["1"], label: "Camera fill stage", group: "Camera" },
];
