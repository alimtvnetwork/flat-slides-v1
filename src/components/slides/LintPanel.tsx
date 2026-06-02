import { Link } from "@tanstack/react-router";

import { lintDeck } from "./lint";
import type { Deck } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  deck: Deck;
}

/** Side panel listing lint issues for the deck. */
export function LintPanel({ open, onClose, deck }: Props) {
  if (!open) return null;
  const issues = lintDeck(deck);
  const errors = issues.filter((i) => i.severity === "error").length;
  const warns = issues.length - errors;

  return (
    <div className="fixed inset-0 z-[55] flex justify-end bg-black/50" data-app-chrome onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="h-full w-[min(420px,92vw)] overflow-y-auto bg-neutral-950 p-5 text-neutral-200 ring-1 ring-neutral-800"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Deck linter</h2>
          <button onClick={onClose} className="text-sm opacity-70 hover:opacity-100">Close</button>
        </div>

        <div className="mb-4 flex gap-2 text-xs">
          <span className="rounded bg-red-500/15 px-2 py-0.5 text-red-300">{errors} errors</span>
          <span className="rounded bg-amber-500/15 px-2 py-0.5 text-amber-300">{warns} warnings</span>
        </div>

        {issues.length === 0 ? (
          <p className="text-sm text-emerald-400">✓ No issues. Deck looks clean.</p>
        ) : (
          <ul className="space-y-2">
            {issues.map((iss, i) => (
              <li key={i} className="rounded-md bg-neutral-900 p-3 text-sm ring-1 ring-neutral-800">
                <div className="mb-1 flex items-center justify-between">
                  <Link
                    to="/slides/$slideId"
                    params={{ slideId: String(iss.slideIndex + 1) }}
                    onClick={onClose}
                    className="font-medium text-white hover:underline"
                  >
                    {iss.slideIndex + 1}. {iss.slideTitle || iss.slideId}
                  </Link>
                  <span
                    className={`text-[10px] uppercase tracking-wider ${
                      iss.severity === "error" ? "text-red-400" : "text-amber-400"
                    }`}
                  >
                    {iss.severity}
                  </span>
                </div>
                <div className="text-xs text-neutral-400">{iss.rule}</div>
                <div className="mt-1 text-neutral-300">{iss.message}</div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
