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

export type ShortcutGroup = "Navigation" | "Steps" | "Surfaces" | "Presenter" | "Camera" | "Annotate" | "Timer" | "Audience";

export interface ShortcutDef {
  /** Stable identifier consumed by the action registry. */
  id: string;
  /** Display key (e.g. "←", "Space", "F"). */
  display: string;
  /** Aliases matched against KeyboardEvent.key (case-insensitive). */
  keys: string[];
  label: string;
  group: ShortcutGroup;
}

export const SHORTCUTS: ShortcutDef[] = [
  { id: "nav-prev",            display: "←",     keys: ["ArrowLeft"],                 label: "Previous slide or step", group: "Navigation" },
  { id: "nav-next",            display: "→",     keys: ["ArrowRight", " ", "Enter"],  label: "Next slide or step",     group: "Navigation" },
  { id: "annotate-clear-mode", display: "Esc",   keys: ["Escape"],                    label: "Clear annotation tool",  group: "Annotate" },
  { id: "fullscreen-toggle",   display: "F5",    keys: ["F5"],                        label: "Toggle fullscreen",      group: "Presenter" },
  { id: "open-overview",       display: "G",     keys: ["g"],                         label: "Open deck overview",     group: "Surfaces" },
  { id: "move-controller",     display: "B",     keys: ["b"],                         label: "Move controller",        group: "Presenter" },
  { id: "toggle-top-jumper",   display: "J",     keys: ["j"],                         label: "Toggle top jumper",      group: "Surfaces" },
  { id: "open-help",           display: "?",     keys: ["/", "?"],                    label: "Show keyboard shortcuts", group: "Presenter" },
  { id: "command-palette",     display: "⌘K",    keys: [],                            label: "Command palette",        group: "Presenter" },
  { id: "click-jump",          display: "Click N", keys: [],                          label: "Jump to slide N",        group: "Navigation" },
  { id: "toggle-camera",       display: "C",       keys: ["c"],                       label: "Toggle camera bubble",   group: "Camera" },
  { id: "cycle-camera-size",   display: "Shift+C", keys: [],                          label: "Cycle camera size",      group: "Camera" },
  { id: "cycle-camera-shape",  display: "O",       keys: ["o"],                       label: "Cycle camera shape",     group: "Camera" },
  { id: "nudge-camera",        display: "Shift+←→↑↓", keys: [],                       label: "Nudge camera position",  group: "Camera" },
  { id: "camera-pip",          display: "P",       keys: ["p"],                       label: "Picture-in-picture",     group: "Camera" },
  { id: "toggle-music",        display: "M",       keys: ["m"],                       label: "Toggle background music", group: "Presenter" },
  { id: "cycle-scene",         display: "S",       keys: ["s"],                       label: "Cycle scene preset",     group: "Presenter" },
  { id: "toggle-pointer",      display: "L",       keys: ["l"],                       label: "Toggle laser pointer",   group: "Annotate" },
  { id: "toggle-ink",          display: "K",       keys: ["k"],                       label: "Toggle ink (draw)",      group: "Annotate" },
  { id: "clear-ink",           display: "X",       keys: ["x"],                       label: "Clear ink on this slide", group: "Annotate" },
  { id: "ink-color",           display: "1-5",     keys: ["1","2","3","4","5"],       label: "Pick ink color",         group: "Annotate" },
  { id: "undo-stroke",         display: "⌘Z",      keys: [],                          label: "Undo last stroke",       group: "Annotate" },
  { id: "toggle-timer",        display: "T",       keys: ["t"],                       label: "Toggle timer overlay",   group: "Timer" },
  { id: "reset-timer",         display: "Shift+T", keys: [],                          label: "Reset timer",            group: "Timer" },
  { id: "toggle-rehearsal",    display: "R",       keys: ["r"],                       label: "Toggle rehearsal mode",  group: "Timer" },
  { id: "reset-rehearsal",     display: "Shift+R", keys: [],                          label: "Reset rehearsal data",   group: "Timer" },
  { id: "toggle-timer-run",    display: "Shift+Space", keys: [],                      label: "Pause / resume timer",   group: "Timer" },
  { id: "toggle-qr",           display: "Q",       keys: ["q"],                       label: "Toggle audience QR",     group: "Audience" },
  { id: "toggle-poll",         display: "V",       keys: ["v"],                       label: "Toggle live poll results", group: "Audience" },
  { id: "copy-share-link",     display: "Y",       keys: ["y"],                       label: "Copy share link",        group: "Audience" },
  { id: "toggle-focus-editor", display: "F",       keys: ["f"],                       label: "Edit focus regions",     group: "Presenter" },
  { id: "export-rehearsal",    display: "⌘E",      keys: [],                          label: "Export rehearsal report", group: "Timer" },
  { id: "export-annotations",  display: "⌘⇧E",     keys: [],                          label: "Export annotations",     group: "Annotate" },
  { id: "toggle-lint",         display: "⌘⇧L",     keys: [],                          label: "Toggle lint panel",      group: "Presenter" },
  { id: "toggle-notes",        display: "N",       keys: ["n"],                       label: "Toggle presenter notes", group: "Presenter" },
  { id: "esc-close-panel",     display: "Esc",     keys: [],                          label: "Close open panel or dialog", group: "Surfaces" },
];

export function matchesShortcut(event: KeyboardEvent, def: ShortcutDef): boolean {
  return def.keys.some((k) => k.toLowerCase() === event.key.toLowerCase());
}

/**
 * Step 26: find the first SHORTCUTS entry whose `keys` aliases match
 * `event.key`. Returns `undefined` when no plain-key binding applies
 * (e.g. modifier combos, mouse-only shortcuts, unmapped keys).
 */
export function matchShortcut(event: KeyboardEvent): ShortcutDef | undefined {
  return SHORTCUTS.find((def) => def.keys.length > 0 && matchesShortcut(event, def));
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
  { id: "cam-info",        display: "I",     keys: ["i"], label: "Show camera info / status", group: "Camera" },
  { id: "cam-soft-hide",   display: "Alt+M", keys: [],    label: "Soft-hide camera to tray",  group: "Camera" },
  { id: "cam-autoframe",   display: "Alt+F", keys: [],    label: "Toggle camera auto-frame",  group: "Camera" },
  { id: "cam-halo",        display: "H",     keys: ["h"], label: "Toggle camera halo",        group: "Camera" },
  { id: "cam-size-down",   display: "[",     keys: ["["], label: "Camera size step down",     group: "Camera" },
  { id: "cam-size-up",     display: "]",     keys: ["]"], label: "Camera size step up",       group: "Camera" },
  { id: "cam-fill-stage",  display: "1",     keys: ["1"], label: "Camera fill stage",         group: "Camera" },
];
