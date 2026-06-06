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
    id: "snow",
    name: "Snow (pure white)",
    bg: "#000000",
    fg: "#ffffff",
    muted: "#b8b8b8",
    hl: "#ffffff",
    hlInk: "#000000",
    fontHeading: '"Ubuntu", system-ui, sans-serif',
    fontBody: '"Poppins", system-ui, sans-serif',
    fontDisplay: '"Ubuntu", system-ui, sans-serif',
  },
  {
    id: "midnight",
    name: "Midnight",
    bg: "#101010",
    fg: "#ffffff",
    muted: "#b8b8b8",
    hl: "#ffd83a",
    hlInk: "#1a1100",
    fontHeading: '"Ubuntu", system-ui, sans-serif',
    fontBody: '"Poppins", system-ui, sans-serif',
    fontDisplay: '"Ubuntu", system-ui, sans-serif',
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
    fontDisplay: '"Ubuntu", system-ui, sans-serif',
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
    fontDisplay: '"Ubuntu", system-ui, sans-serif',
  },
  {
    // High-contrast theme tuned for exported PDFs / paper printouts.
    id: "print",
    name: "Print (high-contrast)",
    bg: "#ffffff",
    fg: "#000000",
    muted: "#444444",
    hl: "#000000",
    hlInk: "#ffffff",
    fontHeading: '"Ubuntu", system-ui, sans-serif',
    fontBody: '"Poppins", system-ui, sans-serif',
    fontDisplay: '"Ubuntu", system-ui, sans-serif',
  },
];

export const DEFAULT_THEME_ID = "snow";

// Tiny memo — themes are immutable so a Map lookup beats a linear scan when
// every slide / every render asks for the same id.
const THEME_INDEX: Map<string | undefined, Theme> = new Map();
for (const t of THEMES) THEME_INDEX.set(t.id, t);

// User-imported custom themes are persisted in localStorage under
// `riseup.themes.custom` by ./customThemes. We read it inline here to keep
// this module free of import cycles (themes.ts → customThemes.ts → themes.ts
// would TDZ this file's exports).
const CUSTOM_KEY = "riseup.themes.custom";
function readCustomThemes(): Theme[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as Theme[];
  } catch {
    return [];
  }
}

/** Built-ins + user-imported custom themes. */
export function getAllThemes(): Theme[] {
  const extras = readCustomThemes();
  return extras.length ? [...THEMES, ...extras] : THEMES;
}

export function getTheme(id: string | undefined): Theme {
  if (id && THEME_INDEX.has(id)) return THEME_INDEX.get(id)!;
  const custom = readCustomThemes().find((t) => t.id === id);
  return custom ?? THEMES[0];
}

/** Lightweight `{id, name}` list — for pickers/UI that doesn't need full colors. */
export function listThemes(): Array<{ id: string; name: string }> {
  return getAllThemes().map((t) => ({ id: t.id, name: t.name }));
}

/** Relative perceived brightness 0..1 from a #rrggbb / #rgb hex. */
function hexLuma(hex: string): number {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(f.slice(0, 2), 16) || 0;
  const g = parseInt(f.slice(2, 4), 16) || 0;
  const b = parseInt(f.slice(4, 6), 16) || 0;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Inline style block injecting the theme CSS variables into a slide container. */
export function themeStyle(theme: Theme): React.CSSProperties {
  // Apply the legibility ink-drop only when fg is lighter than bg
  // (light text on dark surface). Dark-on-light themes look muddy with it.
  const lightOnDark = hexLuma(theme.fg) > hexLuma(theme.bg);
  const textShadow = lightOnDark ? "rgb(0 0 0) 1px 0.7px 0px" : "none";
  return {
    ["--slide-bg" as string]: theme.bg,
    ["--slide-fg" as string]: theme.fg,
    ["--slide-muted" as string]: theme.muted,
    ["--slide-hl" as string]: theme.hl,
    ["--slide-hl-ink" as string]: theme.hlInk,
    ["--slide-font-heading" as string]: theme.fontHeading,
    ["--slide-font-body" as string]: theme.fontBody,
    ["--slide-font-display" as string]: theme.fontDisplay,
    ["--slide-text-shadow" as string]: textShadow,
  };
}
