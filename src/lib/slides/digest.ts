import type { Deck } from "@/components/slides/types";
import { lintDeck } from "@/components/slides/lint";

export interface SessionStats {
  startedAt: number;
  endedAt: number;
  durationSec: number;
  slidesViewed: number;
  reactions: number;
}

/** Generate a Markdown session digest (step 340 — analytics email body). */
export function generateDigest(deck: Deck, stats: SessionStats): string {
  const mm = Math.floor(stats.durationSec / 60);
  const ss = stats.durationSec % 60;
  const lint = lintDeck(deck);
  const errors = lint.filter((l) => l.severity === "error").length;
  const startDate = new Date(stats.startedAt).toLocaleString();

  return [
    `# Session digest — ${deck.title}`,
    ``,
    `**When:** ${startDate}`,
    `**Duration:** ${mm}m ${ss}s`,
    `**Slides:** ${deck.slides.length} total · ${stats.slidesViewed} viewed`,
    `**Reactions:** ${stats.reactions}`,
    ``,
    `## Pacing`,
    ``,
    `Average ${(stats.durationSec / Math.max(1, stats.slidesViewed)).toFixed(1)}s per slide.`,
    ``,
    `## Deck health`,
    ``,
    `- ${errors} errors`,
    `- ${lint.length - errors} warnings`,
    ...(lint.length === 0 ? [`- ✓ Clean`] : lint.slice(0, 10).map((l) => `- **${l.slideTitle}** — ${l.rule}: ${l.message}`)),
    ``,
    `---`,
    ``,
    `_Generated locally by Glasswing. To send these digests automatically over email after each live session, enable Lovable Cloud and email infrastructure._`,
    ``,
  ].join("\n");
}

export function downloadDigest(deck: Deck, stats: SessionStats) {
  const md = generateDigest(deck, stats);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${deck.id}-session-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
