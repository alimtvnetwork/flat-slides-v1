import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { useChrome } from "./chrome-store";
import { downloadAnnotations } from "./exportAnnotations";
import { downloadRehearsalReport } from "./exportRehearsal";
import { useDeck } from "./store";
import type { Slide } from "./types";

type Action = { id: string; label: string; hint?: string; run: () => void };

interface Props {
  open: boolean;
  onClose: () => void;
  slides: Slide[];
  onOpenSettings?: () => void;
  onPresent?: () => void;
  onOpenLint?: () => void;
}

/** ⌘K / Ctrl+K command palette: jump to slide or run an action. */
export function CommandPalette({ open, onClose, slides, onOpenSettings, onPresent, onOpenLint }: Props) {
  const navigate = useNavigate();
  const deckTitle = useDeck((s) => s.deck.title);
  const toggleFocusEditor = useChrome((s) => s.toggleFocusEditor);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) { setQ(""); setActive(0); }
  }, [open]);

  const items = useMemo<Action[]>(() => {
    const acts: Action[] = [
      { id: "act-overview", label: "Go to overview", hint: "G", run: () => navigate({ to: "/slides" }) },
      ...(onPresent ? [{ id: "act-present", label: "Present (fullscreen)", hint: "F5", run: onPresent }] : []),
      ...(onOpenSettings ? [{ id: "act-settings", label: "Open settings", hint: "S", run: onOpenSettings }] : []),
      ...(onOpenLint ? [{ id: "act-lint", label: "Run deck linter", hint: "L", run: onOpenLint }] : []),
      { id: "act-focus", label: "Edit focus regions", hint: "F", run: toggleFocusEditor },
      { id: "act-export-rehearsal", label: "Export rehearsal report", hint: "⌘E", run: () => downloadRehearsalReport(deckTitle) },
      { id: "act-export-annotations", label: "Export annotations (JSON)", hint: "⌘⇧E", run: downloadAnnotations },
      { id: "act-export-pdf", label: "Export deck as PDF", hint: "↗",
        run: () => window.open("/slides/print?auto=1", "_blank", "noopener,noreferrer") },
      { id: "act-export-handout", label: "Export speaker handout (PDF)", hint: "↗",
        run: () => window.open("/slides/handout?auto=1", "_blank", "noopener,noreferrer") },
      { id: "act-export-handout-3up", label: "Export 3-up handout (PDF)", hint: "↗",
        run: () => window.open("/slides/handout-3up?auto=1", "_blank", "noopener,noreferrer") },
      { id: "act-open-guideline", label: "Open LLM JSON Guideline (spec)", hint: "↗",
        run: () => {
          const url = new URL("/docs/slides/spec/llm-json-guideline.md", window.location.origin).toString();
          window.open(url, "_blank", "noopener,noreferrer");
        } },
    ];
    const slideActs: Action[] = slides.map((s, i) => ({
      id: `slide-${s.id}`,
      label: `${i + 1}. ${s.title}`,
      hint: s.type,
      run: () => navigate({ to: "/slides/$slideId", params: { slideId: String(i + 1) } }),
    }));
    const all = [...acts, ...slideActs];
    if (!q.trim()) return all;
    const needle = q.toLowerCase();
    return all.filter((a) => a.label.toLowerCase().includes(needle));
  }, [q, slides, navigate, onOpenSettings, onPresent, onOpenLint, deckTitle, toggleFocusEditor]);

  useEffect(() => setActive(0), [q]);

  if (!open) return null;

  const choose = (i: number) => {
    const item = items[i];
    if (!item) return;
    onClose();
    item.run();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 pt-[12vh]"
      onClick={onClose}
      data-app-chrome
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[min(640px,92vw)] overflow-hidden rounded-xl bg-neutral-900 shadow-2xl ring-1 ring-neutral-700"
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            else if (e.key === "Enter") { e.preventDefault(); choose(active); }
            else if (e.key === "Escape") onClose();
          }}
          placeholder="Jump to slide or run a command…"
          className="w-full bg-transparent px-4 py-3 text-base text-white placeholder:text-neutral-500 outline-none"
        />
        <div className="max-h-[50vh] overflow-y-auto border-t border-neutral-800">
          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-neutral-500">No matches</div>
          ) : (
            items.map((it, i) => (
              <button
                key={it.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${
                  i === active ? "bg-neutral-800 text-white" : "text-neutral-300"
                }`}
              >
                <span className="truncate">{it.label}</span>
                {it.hint ? <span className="ml-3 shrink-0 text-xs text-neutral-500">{it.hint}</span> : null}
              </button>
            ))
          )}
        </div>
        <div className="border-t border-neutral-800 px-4 py-2 text-xs text-neutral-500">
          ↑↓ navigate · ↵ select · Esc close
        </div>
      </div>
    </div>
  );
}
