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
  shortcut("fullscreen-toggle", "F / F5", ["F5", "f"], "Toggle fullscreen", "Presenter"),
  shortcut("open-overview", "G", ["g"], "Open deck overview", "Surfaces"),
  shortcut("move-controller", "B", ["b"], "Move controller", "Presenter"),
  shortcut("toggle-top-jumper", "J", ["j"], "Toggle top jumper", "Surfaces"),
  shortcut("open-help", "?", ["/", "?"], "Show keyboard shortcuts", "Presenter"),
  shortcut("command-palette", "⌘K", [], "Command palette", "Presenter"),
  shortcut("click-jump", "Click N", [], "Jump to slide N", "Navigation"),
  shortcut("webcam-hard-toggle", "I", ["i"], "Hard toggle camera", "Camera"),
  shortcut("webcam-soft-minimize", "M", [], "Minimize camera to tray", "Camera"),
  shortcut("webcam-autoframe", "F (cam)", [], "Toggle camera auto-frame", "Camera"),
  shortcut("webcam-zoom-in", "+", [], "Zoom camera in", "Camera"),
  shortcut("webcam-zoom-out", "−", [], "Zoom camera out", "Camera"),
  shortcut("webcam-exit-surface", "Esc", [], "Exit camera fullscreen or stage", "Camera"),
  shortcut("webcam-halo", "H", [], "Toggle camera halo", "Camera"),
  shortcut("webcam-stage-fill", "1", [], "Toggle camera stage-fill", "Camera"),
  shortcut("webcam-shape", "O", [], "Toggle camera shape", "Camera"),
  shortcut("webcam-fullscreen", "P", [], "Enter camera fullscreen", "Camera"),
  shortcut("webcam-fullscreen-exit", "[", [], "Exit camera fullscreen", "Camera"),
  shortcut("webcam-cinematic-cycle", "]", [], "Cycle camera cinematic mode", "Camera"),
  shortcut("webcam-nav-passthrough", "← → Space Enter", [], "Navigate slides from camera fullscreen", "Camera"),
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
  shortcut("toggle-focus-editor", "Shift+F", ["shift+f"], "Edit focus regions", "Presenter"),
  shortcut("export-rehearsal", "⌘E", [], "Export rehearsal report", "Timer"),
  shortcut("export-annotations", "⌘⇧E", [], "Export annotations", "Annotate"),
  shortcut("toggle-lint", "⌘⇧L", [], "Toggle lint panel", "Presenter"),
  shortcut("toggle-notes", "N", ["n"], "Toggle presenter notes", "Presenter"),
  shortcut("open-inspector", "I", ["i"], "Open presenter inspector (new window)", "Presenter"),
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
  // Issue 030: every alias in this catalogue is a single bare key. If the
  // user is holding a system modifier (Cmd/Ctrl/Alt) it's a browser/OS
  // shortcut (Cmd+P print, Ctrl+R reload, Alt+Tab, …) and we must not
  // intercept it. Shift is allowed because we use it for shifted aliases
  // (e.g. "?").
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  return def.keys.some((key) => matchesKeyAlias(event, key));
}

function matchesKeyAlias(event: KeyboardEvent, alias: string): boolean {
  const normalized = alias.toLowerCase();
  // Explicit "shift+x" alias: require Shift held and the remainder to match.
  if (normalized.startsWith("shift+")) {
    if (!event.shiftKey) return false;
    const rest = normalized.slice("shift+".length);
    return rest === event.key.toLowerCase() || rest === event.code.toLowerCase();
  }
  // Plain single-letter aliases must NOT fire when Shift is held — otherwise
  // Shift+I would fire both "open-inspector" (i) and "webcam-hard-toggle" (shift+i).
  // Non-letter aliases (e.g. "?", "/") are allowed regardless because shifted
  // punctuation is the only way to type them.
  if (event.shiftKey && /^[a-z]$/.test(normalized)) return false;
  return normalized === event.key.toLowerCase() || normalized === event.code.toLowerCase();
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

