/**
 * Built-in slide themes. Add a new entry here to expose it in the picker
 * AND make it importable via JSON (theme.id).
 *
 * A theme controls colors + fonts only. Layout/positioning is per-slide.
 */
export interface Theme {
  id: string;
  name: string;
  bg: string;          // base slide background
  fg: string;          // primary text
  muted: string;       // secondary text
  hl: string;          // inline highlight color (.hl text + .hl-pill bg)
  hlInk: string;       // text color inside a .hl-pill chip
  fontHeading: string;
  fontBody: string;
  fontDisplay: string;
}

export const THEMES: Theme[] = [
  {
    id: "midnight",
    name: "Midnight",
    bg: "#101010",
    fg: "#f4ecd8",
    muted: "#9c958a",
    hl: "#ffd83a",
    hlInk: "#1a1100",
    fontHeading: '"Ubuntu", system-ui, sans-serif',
    fontBody: '"Poppins", system-ui, sans-serif',
    fontDisplay: '"Instrument Serif", "Ubuntu", serif',
  },
  {
    id: "paper",
    name: "Paper",
    bg: "#f5f0e6",
    fg: "#1a1a1a",
    muted: "#615a4f",
    hl: "#1d4ed8",
    hlInk: "#f5f0e6",
    fontHeading: '"Ubuntu", system-ui, sans-serif',
    fontBody: '"Poppins", system-ui, sans-serif',
    fontDisplay: '"Instrument Serif", "Ubuntu", serif',
  },
  {
    id: "sunset",
    name: "Sunset",
    bg: "#1b0d1f",
    fg: "#ffeaf0",
    muted: "#c89aa6",
    hl: "#ff7a59",
    hlInk: "#1b0d1f",
    fontHeading: '"Ubuntu", system-ui, sans-serif',
    fontBody: '"Poppins", system-ui, sans-serif',
    fontDisplay: '"Instrument Serif", "Ubuntu", serif',
  },
];

export const DEFAULT_THEME_ID = "midnight";

export function getTheme(id: string | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Inline style block injecting the theme CSS variables into a slide container. */
export function themeStyle(theme: Theme): React.CSSProperties {
  return {
    ["--slide-bg" as string]: theme.bg,
    ["--slide-fg" as string]: theme.fg,
    ["--slide-muted" as string]: theme.muted,
    ["--slide-hl" as string]: theme.hl,
    ["--slide-hl-ink" as string]: theme.hlInk,
    ["--slide-font-heading" as string]: theme.fontHeading,
    ["--slide-font-body" as string]: theme.fontBody,
    ["--slide-font-display" as string]: theme.fontDisplay,
  };
}
