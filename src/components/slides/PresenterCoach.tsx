import { useEffect, useMemo, useRef, useState } from "react";

const FILLERS = ["um", "uh", "like", "you know", "basically", "actually", "literally", "sort of", "kind of", "right"];

type SR = typeof window extends { SpeechRecognition: infer T } ? T : never;
interface SRInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getRecognition(): SRInstance | null {
  const W = window as unknown as { SpeechRecognition?: new () => SRInstance; webkitSpeechRecognition?: new () => SRInstance };
  const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

/** AI Presenter Coach (step 338) — Web Speech API + on-device analysis. */
export function PresenterCoach({ open, onClose }: Props) {
  const [supported, setSupported] = useState(true);
  const [running, setRunning] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const recogRef = useRef<SRInstance | null>(null);

  useEffect(() => {
    if (!open) return;
    if (!recogRef.current) {
      const r = getRecognition();
      if (!r) { setSupported(false); return; }
      r.continuous = true;
      r.interimResults = true;
      r.lang = "en-US";
      r.onresult = (e) => {
        let final = "";
        let live = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          const txt = res[0].transcript;
          if (res.isFinal) final += txt + " "; else live += txt;
        }
        if (final) setTranscript((t) => (t + final).slice(-4000));
        setInterim(live);
      };
      r.onend = () => { if (running) { try { r.start(); } catch { /* ignore */ } } };
      recogRef.current = r;
    }
  }, [open, running]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  const toggle = () => {
    const r = recogRef.current;
    if (!r) return;
    if (running) { r.stop(); setRunning(false); }
    else {
      setTranscript(""); setInterim(""); setStartedAt(Date.now()); setNow(Date.now());
      try { r.start(); setRunning(true); } catch { /* ignore */ }
    }
  };

  const stats = useMemo(() => {
    const text = transcript.toLowerCase();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const elapsedMin = startedAt ? Math.max(0.05, (now - startedAt) / 60000) : 1;
    const wpm = Math.round(wordCount / elapsedMin);
    const fillerCounts: Record<string, number> = {};
    let fillerTotal = 0;
    for (const f of FILLERS) {
      const re = new RegExp(`\\b${f.replace(/ /g, "\\s+")}\\b`, "g");
      const m = text.match(re);
      const n = m ? m.length : 0;
      if (n) fillerCounts[f] = n;
      fillerTotal += n;
    }
    const fillerRate = wordCount ? Math.round((fillerTotal / wordCount) * 1000) / 10 : 0;
    return { wordCount, wpm, fillerCounts, fillerTotal, fillerRate };
  }, [transcript, startedAt, now]);

  if (!open) return null;

  const paceColor = stats.wpm < 110 ? "text-amber-300" : stats.wpm > 180 ? "text-red-400" : "text-emerald-400";
  const paceLabel = stats.wpm < 110 ? "slow" : stats.wpm > 180 ? "fast" : "good";

  return (
    <div className="fixed z-[58] flex items-end justify-center bg-black/40 p-6" data-presenter-frame-bound="true" data-app-chrome onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[min(720px,calc(var(--presenter-frame-width)_-_32px),96vw)] rounded-xl bg-neutral-900 p-4 text-sm text-neutral-200 ring-1 ring-neutral-700"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="font-semibold text-neutral-100">Presenter coach</span>
          <button onClick={onClose} className="opacity-60 hover:opacity-100">×</button>
        </div>

        {!supported ? (
          <p className="text-amber-300">
            Web Speech API is not available in this browser. Use Chrome or Edge for live coaching.
          </p>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-3 gap-3 text-center">
              <div className="rounded bg-neutral-800 p-2">
                <div className="text-xs opacity-60">Words</div>
                <div className="text-lg font-mono text-white">{stats.wordCount}</div>
              </div>
              <div className="rounded bg-neutral-800 p-2">
                <div className="text-xs opacity-60">Pace (wpm)</div>
                <div className={`text-lg font-mono ${paceColor}`}>{stats.wpm} <span className="text-xs">{paceLabel}</span></div>
              </div>
              <div className="rounded bg-neutral-800 p-2">
                <div className="text-xs opacity-60">Fillers</div>
                <div className="text-lg font-mono text-white">{stats.fillerTotal} <span className="text-xs opacity-60">({stats.fillerRate}%)</span></div>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-1 text-xs">
              {Object.entries(stats.fillerCounts).map(([w, n]) => (
                <span key={w} className="rounded bg-red-500/15 px-2 py-0.5 text-red-300">{w} × {n}</span>
              ))}
              {Object.keys(stats.fillerCounts).length === 0 && stats.wordCount > 20 ? (
                <span className="text-emerald-400">No filler words detected.</span>
              ) : null}
            </div>

            <div className="mb-3 max-h-32 overflow-y-auto rounded bg-neutral-950 p-2 text-xs leading-relaxed text-neutral-300">
              {transcript || <span className="opacity-50">Transcript will appear here…</span>}
              <span className="opacity-50"> {interim}</span>
            </div>

            <button
              onClick={toggle}
              className={`w-full rounded px-3 py-2 font-semibold ${running ? "bg-red-500 text-white" : "bg-amber-400 text-neutral-900 hover:bg-amber-300"}`}
            >
              {running ? "■ Stop coaching" : "● Start coaching (mic)"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
