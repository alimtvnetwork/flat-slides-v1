/**
 * Single source of truth for keyboard shortcuts.
 * Consumed by `useKeyboardShortcuts` (the handler) AND
 * `KeyboardShortcutsDialog` (the `/` help popup).
 */

export type ShortcutGroup = "Navigation" | "Steps" | "Surfaces" | "Presenter" | "Camera" | "Annotate" | "Timer" | "Audience";

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
  { display: "C",       keys: ["c"],                       label: "Toggle camera bubble",   group: "Camera" },
  { display: "Shift+C", keys: [],                          label: "Cycle camera size",      group: "Camera" },
  { display: "Shift+←→↑↓", keys: [],                       label: "Nudge camera position",  group: "Camera" },
  { display: "P",       keys: ["p"],                       label: "Picture-in-picture",     group: "Camera" },
  { display: "M",       keys: ["m"],                       label: "Toggle background music", group: "Presenter" },
  { display: "S",       keys: ["s"],                       label: "Cycle scene preset",     group: "Presenter" },
  { display: "L",       keys: ["l"],                       label: "Toggle laser pointer",   group: "Annotate" },
  { display: "K",       keys: ["k"],                       label: "Toggle ink (draw)",      group: "Annotate" },
  { display: "X",       keys: ["x"],                       label: "Clear ink on this slide", group: "Annotate" },
  { display: "1-5",     keys: ["1","2","3","4","5"],       label: "Pick ink color",         group: "Annotate" },
  { display: "⌘Z",      keys: [],                          label: "Undo last stroke",       group: "Annotate" },
  { display: "T",       keys: ["t"],                       label: "Toggle timer overlay",   group: "Timer" },
  { display: "Shift+T", keys: [],                          label: "Reset timer",            group: "Timer" },
  { display: "R",       keys: ["r"],                       label: "Toggle rehearsal mode",  group: "Timer" },
  { display: "Shift+R", keys: [],                          label: "Reset rehearsal data",   group: "Timer" },
  { display: "Shift+Space", keys: [],                      label: "Pause / resume timer",   group: "Timer" },
  { display: "Q",       keys: ["q"],                       label: "Toggle audience QR",     group: "Audience" },
  { display: "V",       keys: ["v"],                       label: "Toggle live poll results", group: "Audience" },
  { display: "Y",       keys: ["y"],                       label: "Copy share link",        group: "Audience" },
];

export function matchesShortcut(event: KeyboardEvent, def: ShortcutDef): boolean {
  return def.keys.some((k) => k.toLowerCase() === event.key.toLowerCase());
}
