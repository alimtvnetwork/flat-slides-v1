import { Palette } from "lucide-react";

import { useDeck } from "@/components/slides/store";
import { DEFAULT_THEME_ID, THEMES } from "@/components/slides/themes";
import { cn } from "@/lib/utils";

/**
 * Inline theme picker chip for the controller pill.
 * Click cycles to the next built-in theme; right-click cycles backwards.
 */
export function ThemeChip() {
  const themeId = useDeck((s) => s.themeId);
  const setThemeId = useDeck((s) => s.setThemeId);
  const active = THEMES.find((t) => t.id === (themeId ?? DEFAULT_THEME_ID)) ?? THEMES[0];

  function step(dir: 1 | -1) {
    const i = THEMES.findIndex((t) => t.id === active.id);
    const next = THEMES[(i + dir + THEMES.length) % THEMES.length];
    setThemeId(next.id);
  }

  return (
    <button
      type="button"
      onClick={() => step(1)}
      onContextMenu={(e) => { e.preventDefault(); step(-1); }}
      aria-label={`Theme: ${active.name}. Click to cycle.`}
      title={`Theme: ${active.name} — click to cycle (right-click to reverse)`}
      className={cn(
        "app-focusable inline-flex items-center gap-1.5 h-7 px-2 rounded-md",
        "text-[11px] font-medium text-[color:var(--ctrl-fg)] hover:bg-white/10 transition-colors",
      )}
    >
      <Palette size={13} />
      <span
        aria-hidden
        className="inline-block h-3 w-3 rounded-full ring-1 ring-white/30"
        style={{ background: active.bg }}
      />
      <span
        aria-hidden
        className="inline-block h-3 w-3 rounded-full ring-1 ring-black/30"
        style={{ background: active.hl }}
      />
    </button>
  );
}
