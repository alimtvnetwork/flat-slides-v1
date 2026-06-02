import { useEffect, useState } from "react";

import { SlideLayout } from "../SlideLayout";
import type { PollSlideProps } from "../types";

const KEY = (id: string) => `glasswing-poll:${id}`;

/** Live polling widget — local-room demo (per-browser localStorage). */
export function PollSlide({ slide }: { slide: PollSlideProps }) {
  const [votes, setVotes] = useState<number[]>(() => slide.options.map(() => 0));
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY(slide.id));
      if (raw) {
        const parsed = JSON.parse(raw) as { votes: number[]; picked: number | null };
        if (Array.isArray(parsed.votes) && parsed.votes.length === slide.options.length) {
          setVotes(parsed.votes);
          setPicked(parsed.picked);
        }
      }
    } catch { /* ignore */ }
  }, [slide.id, slide.options.length]);

  const vote = (i: number) => {
    if (picked !== null) return;
    const next = [...votes];
    next[i] = (next[i] ?? 0) + 1;
    setVotes(next);
    setPicked(i);
    try { localStorage.setItem(KEY(slide.id), JSON.stringify({ votes: next, picked: i })); } catch { /* ignore */ }
  };

  const total = votes.reduce((a, b) => a + b, 0) || 1;

  return (
    <SlideLayout background={slide.background}>
      <div className="absolute inset-0 flex flex-col px-[120px] py-[100px]">
        <div className="slide-kicker mb-[20px]" style={{ color: "var(--slide-muted)" }}>Live poll</div>
        <h1 className="slide-heading slide-title mb-[60px]" style={{ fontWeight: 700 }}>{slide.question}</h1>
        <div className="flex flex-col gap-[24px]" style={{ maxWidth: 1400 }}>
          {slide.options.map((opt: string, i: number) => {
            const count = votes[i] ?? 0;
            const pct = Math.round((count / total) * 100);
            const isMine = picked === i;
            return (
              <button
                key={i}
                onClick={() => vote(i)}
                disabled={picked !== null}
                className="relative overflow-hidden rounded-2xl px-[36px] py-[28px] text-left transition"
                style={{
                  background: "var(--slide-bg-muted, rgba(255,255,255,0.08))",
                  border: `2px solid ${isMine ? "var(--slide-hl)" : "transparent"}`,
                  cursor: picked === null ? "pointer" : "default",
                }}
              >
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${pct}%`,
                    background: "var(--slide-hl)",
                    opacity: 0.18,
                    transition: "width 400ms ease",
                  }}
                />
                <div className="relative flex items-center justify-between">
                  <span className="slide-body-lg">{opt}</span>
                  <span className="slide-body" style={{ color: "var(--slide-muted)", minWidth: 120, textAlign: "right" }}>
                    {pct}% · {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="slide-chrome mt-auto pt-[40px]" style={{ color: "var(--slide-muted)" }}>
          {picked === null ? "Tap an option to vote" : "Thanks — your vote was recorded"}
        </div>
      </div>
    </SlideLayout>
  );
}
