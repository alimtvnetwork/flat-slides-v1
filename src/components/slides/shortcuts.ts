/**
 * Single source of truth for keyboard shortcuts.
 * Consumed by `useKeyboardShortcuts` (the handler) AND
 * `KeyboardShortcutsDialog` (the `/` help popup).
 */

export type ShortcutGroup = "Navigation" | "Steps" | "Surfaces" | "Presenter" | "Camera";

export interface ShortcutDef {
  /** Display key (e.g. "←", "Space", "F"). */
  display: string;
  /** Aliases matched against KeyboardEvent.key (case-insensitive). */
  keys: string[];
  label: string;
  group: ShortcutGroup;
}

export const SHORTCUTS: ShortcutDef[] = [
  { display: "←",     keys: ["ArrowLeft"],                 label: "Previous slide or step", group: "Navigation" },
  { display: "→",     keys: ["ArrowRight", " ", "Enter"],  label: "Next slide or step",     group: "Navigation" },
  { display: "Esc",   keys: ["Escape"],                    label: "Exit fullscreen",        group: "Navigation" },
  { display: "F5",    keys: ["F5"],                        label: "Toggle fullscreen",      group: "Presenter" },
  { display: "G",     keys: ["g"],                         label: "Open deck overview",     group: "Surfaces" },
  { display: "J",     keys: ["j"],                         label: "Toggle top jumper",      group: "Surfaces" },
  { display: "?",     keys: ["/", "?"],                    label: "Show keyboard shortcuts", group: "Presenter" },
  { display: "⌘K",    keys: [],                            label: "Command palette",        group: "Presenter" },
  { display: "Click N", keys: [],                          label: "Jump to slide N",        group: "Navigation" },
];

export function matchesShortcut(event: KeyboardEvent, def: ShortcutDef): boolean {
  return def.keys.some((k) => k.toLowerCase() === event.key.toLowerCase());
}
