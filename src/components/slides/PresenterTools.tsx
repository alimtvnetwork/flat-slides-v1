import { useEffect, useRef, useState } from "react";

import { downloadDigest } from "@/lib/slides/digest";

import { PresenterCoach } from "./PresenterCoach";
import type { Deck } from "./types";

const EMOJIS = ["👏", "❤️", "🔥", "😂", "🎯"];

/** Floating reaction emojis (local overlay, no backend). */
function Reactions({ trigger }: { trigger: number; }) {
  const [items, setItems] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (trigger < 0) return;
    const emoji = EMOJIS[trigger] ?? "👏";
    const id = ++idRef.current;
    const x = 20 + Math.random() * 60;
    setItems((prev) => [...prev, { id, emoji, x }]);
    const t = setTimeout(() => setItems((p) => p.filter((i) => i.id !== id)), 2400);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div
      className="pointer-events-none fixed z-40"
      data-presenter-frame-bound="true"
      data-app-chrome
    >
      {items.map((i) => (
        <span
          key={i.id}
          className="absolute bottom-0 text-4xl animate-[reactionRise_2.4s_ease-out_forwards]"
          style={{ left: `${i.x}%` }}
        >
          {i.emoji}
        </span>
      ))}
      <style>{`
        @keyframes reactionRise {
          0% { transform: translateY(0); opacity: 0; }
          15% { opacity: 1; transform: translateY(-20px); }
          100% { transform: translateY(-260px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

interface Props {
  /** Target total deck time in minutes (rehearsal pacing). */
  targetMinutes?: number;
  /** Current slide index for pacing math. */
  index: number;
  total: number;
  deck: Deck;
}

/** Presenter tools: rehearsal timer + reactions + AI coach + session digest. */
export function PresenterTools({ targetMinutes = 10, index, total, deck }: Props) {
  const [open, setOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [target, setTarget] = useState(targetMinutes);
  const [reactionTrigger, setReactionTrigger] = useState(-1);
  const reactCountRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const viewedRef = useRef<Set<number>>(new Set());

  useEffect(() => { viewedRef.current.add(index); }, [index]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 5 && (e.ctrlKey || e.metaKey || e.altKey)) {
        e.preventDefault();
        reactCountRef.current += 1;
        setReactionTrigger(n - 1);
        // re-arm so repeated presses fire
        setTimeout(() => setReactionTrigger((r) => (r === n - 1 ? -1 : r)), 50);
      }
      if (e.key.toLowerCase() === "t" && !e.metaKey && !e.ctrlKey && !e.altKey) setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  // pacing: where should we be vs where we are
  const targetSec = target * 60;
  const expectedSlide = total > 0 ? Math.min(total, Math.floor((elapsed / targetSec) * total) + 1) : 1;
  const drift = (index + 1) - expectedSlide; // + ahead, - behind
  const driftColor = drift >= 1 ? "text-emerald-400" : drift <= -1 ? "text-red-400" : "text-amber-300";
  const driftLabel = drift === 0 ? "on pace" : drift > 0 ? `+${drift} ahead` : `${drift} behind`;

  return (
    <>
      <Reactions trigger={reactionTrigger} />
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          data-presenter-frame-anchor="bottom-right"
          style={{ ["--presenter-safe-inset" as string]: "80px" }}
          className="fixed z-40 rounded-full bg-neutral-900/90 px-3 py-1.5 text-xs text-neutral-200 ring-1 ring-neutral-700 hover:bg-neutral-800"
          data-app-chrome
          title="Presenter tools (T)"
        >
          ⏱ {mm}:{ss}
        </button>
      ) : (
        <div
          data-presenter-frame-anchor="bottom-right"
          style={{ ["--presenter-safe-inset" as string]: "80px" }}
          className="fixed z-40 w-64 rounded-lg bg-neutral-900/95 p-3 text-xs text-neutral-200 ring-1 ring-neutral-700"
          data-app-chrome
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-neutral-100">Presenter tools</span>
            <button onClick={() => setOpen(false)} className="opacity-60 hover:opacity-100">×</button>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-lg text-white">{mm}:{ss}</span>
            <span className={`font-medium ${driftColor}`}>{driftLabel}</span>
          </div>

          <div className="mb-2 flex gap-1">
            <button
              onClick={() => {
                setRunning((r) => {
                  if (!r && startedAtRef.current === null) startedAtRef.current = Date.now();
                  return !r;
                });
              }}
              className="flex-1 rounded bg-amber-400 px-2 py-1 font-semibold text-neutral-900 hover:bg-amber-300"
            >
              {running ? "Pause" : "Start"}
            </button>
            <button
              onClick={() => { setRunning(false); setElapsed(0); startedAtRef.current = null; viewedRef.current = new Set([index]); }}
              className="rounded bg-neutral-800 px-2 py-1 hover:bg-neutral-700"
            >
              Reset
            </button>
          </div>


          <label className="mb-2 flex items-center justify-between gap-2">
            <span className="opacity-70">Target (min)</span>
            <input
              type="number"
              min={1}
              max={120}
              value={target}
              onChange={(e) => setTarget(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded bg-neutral-800 px-2 py-0.5 text-right tabular-nums text-white outline-none ring-1 ring-neutral-700"
            />
          </label>

          <div className="mt-3 border-t border-neutral-800 pt-2">
            <div className="mb-1 opacity-70">Reactions ({reactCountRef.current})</div>
            <div className="flex gap-1">
              {EMOJIS.map((e, i) => (
                <button
                  key={e}
                  onClick={() => {
                    reactCountRef.current += 1;
                    setReactionTrigger(i);
                    setTimeout(() => setReactionTrigger((r) => (r === i ? -1 : r)), 50);
                  }}
                  className="flex-1 rounded bg-neutral-800 py-1 text-lg hover:bg-neutral-700"
                  title={`${i + 1}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="mt-1 text-[10px] opacity-50">⌘/Ctrl + 1–5 to react</div>
          </div>
        </div>
      )}
    </>
  );
}
