import { AlertCircle, AlertTriangle, CheckCircle2, ClipboardCopy, Filter, ListTree, X } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { LINT_RULES, countIssues, lintDeck } from "./lint";
import type { Deck } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  deck: Deck;
}

/** Side panel listing lint issues for the deck. */
export function LintPanel({ open, onClose, deck }: Props) {
  const [showRules, setShowRules] = useState(false);
  const [filter, setFilter] = useState<"all" | "error" | "warn">("all");
  const [groupBySlide, setGroupBySlide] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!open) return null;
  const all = lintDeck(deck);
  const { errors, warns } = countIssues(all);
  const issues = filter === "all" ? all : all.filter((i) => i.severity === filter);

  const groups = groupBySlide
    ? Array.from(
        issues.reduce((m, iss) => {
          const k = `${iss.slideIndex}::${iss.slideTitle || iss.slideId}`;
          (m.get(k) ?? m.set(k, []).get(k))!.push(iss);
          return m;
        }, new Map<string, typeof issues>()),
      )
    : null;

  return (
    <div className="fixed inset-0 z-[55] flex justify-end bg-black/50" data-app-chrome onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="h-full w-[min(420px,92vw)] overflow-y-auto bg-neutral-950 p-5 text-neutral-200 ring-1 ring-neutral-800"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Deck linter</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(JSON.stringify(issues, null, 2));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  /* clipboard blocked — silently ignore */
                }
              }}
              className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300 hover:bg-neutral-700"
              title="Copy filtered issues as JSON"
            >
              {copied ? "Copied ✓" : "Copy as JSON"}
            </button>
            <button onClick={onClose} className="text-sm opacity-70 hover:opacity-100">Close</button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`rounded px-2 py-0.5 ${filter === "all" ? "bg-neutral-700 text-white" : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"}`}
          >
            All ({all.length})
          </button>
          <button
            onClick={() => setFilter("error")}
            className={`rounded px-2 py-0.5 ${filter === "error" ? "bg-red-500/30 text-red-200" : "bg-red-500/10 text-red-300 hover:bg-red-500/20"}`}
          >
            {errors} errors
          </button>
          <button
            onClick={() => setFilter("warn")}
            className={`rounded px-2 py-0.5 ${filter === "warn" ? "bg-amber-500/30 text-amber-200" : "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"}`}
          >
            {warns} warnings
          </button>
          <button
            onClick={() => setGroupBySlide((v) => !v)}
            className={`ml-auto rounded px-2 py-0.5 ${groupBySlide ? "bg-neutral-700 text-white" : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"}`}
          >
            {groupBySlide ? "Flat" : "Group"}
          </button>
          <button
            onClick={() => setShowRules((v) => !v)}
            className="rounded bg-neutral-800 px-2 py-0.5 text-neutral-300 hover:bg-neutral-700"
          >
            {showRules ? "Hide" : "Rules"} ({LINT_RULES.length})
          </button>
        </div>

        {showRules && (
          <div className="mb-4 rounded-md bg-neutral-900 p-3 ring-1 ring-neutral-800">
            <p className="mb-2 text-xs text-neutral-400">All {LINT_RULES.length} rules:</p>
            <ul className="space-y-1 text-xs">
              {LINT_RULES.map((r) => (
                <li key={r.id} className="flex gap-2">
                  <span className={`w-10 shrink-0 uppercase ${r.severity === "error" ? "text-red-400" : "text-amber-400"}`}>
                    {r.severity}
                  </span>
                  <code className="text-neutral-300">{r.id}</code>
                  <span className="text-neutral-500">— {r.summary}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {issues.length === 0 ? (
          <p className="text-sm text-emerald-400">✓ No issues match the current filter.</p>
        ) : groups ? (
          <div className="space-y-3">
            {groups.map(([key, list]) => {
              const first = list[0];
              return (
                <div key={key} className="rounded-md bg-neutral-900 p-3 ring-1 ring-neutral-800">
                  <Link
                    to="/slides/$slideId"
                    params={{ slideId: String(first.slideIndex + 1) }}
                    onClick={onClose}
                    className="mb-2 block text-sm font-medium text-white hover:underline"
                  >
                    {first.slideIndex + 1}. {first.slideTitle || first.slideId} ({list.length})
                  </Link>
                  <ul className="space-y-1.5 text-xs">
                    {list.map((iss, i) => (
                      <li key={i}>
                        <span className={`mr-2 uppercase ${iss.severity === "error" ? "text-red-400" : "text-amber-400"}`}>
                          {iss.severity}
                        </span>
                        <code className="text-neutral-400">{iss.rule}</code>
                        <span className="ml-2 text-neutral-300">{iss.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
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
