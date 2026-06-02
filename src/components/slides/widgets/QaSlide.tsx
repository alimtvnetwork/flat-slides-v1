import { useEffect, useState } from "react";

import { SlideLayout } from "../SlideLayout";
import type { QaSlideProps } from "../types";

const KEY = (id: string) => `glasswing-qa:${id}`;
type Question = { id: string; text: string; upvotes: number; at: number };

/** Audience Q&A widget — local-room demo (per-browser localStorage). */
export function QaSlide({ slide }: { slide: QaSlideProps }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY(slide.id));
      if (raw) setQuestions(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [slide.id]);

  const persist = (q: Question[]) => {
    setQuestions(q);
    try { localStorage.setItem(KEY(slide.id), JSON.stringify(q)); } catch { /* ignore */ }
  };

  const submit = () => {
    const text = draft.trim().slice(0, 240);
    if (!text) return;
    persist([{ id: crypto.randomUUID(), text, upvotes: 0, at: Date.now() }, ...questions]);
    setDraft("");
  };

  const upvote = (id: string) => {
    persist(questions.map((q) => (q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q)));
  };

  const sorted = [...questions].sort((a, b) => b.upvotes - a.upvotes || b.at - a.at).slice(0, 6);

  return (
    <SlideLayout background={slide.background}>
      <div className="absolute inset-0 flex flex-col px-[120px] py-[100px]">
        <div className="slide-kicker mb-[20px]" style={{ color: "var(--slide-muted)" }}>Audience Q&amp;A</div>
        <h1 className="slide-heading slide-title mb-[40px]" style={{ fontWeight: 700 }}>
          {slide.prompt ?? "Ask anything"}
        </h1>

        <div className="flex gap-[16px] mb-[40px]" style={{ maxWidth: 1400 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Type a question…"
            maxLength={240}
            className="flex-1 rounded-xl px-[24px] py-[20px] slide-body outline-none"
            style={{ background: "rgba(255,255,255,0.08)", color: "var(--slide-fg)" }}
          />
          <button
            onClick={submit}
            className="rounded-xl px-[32px] slide-body font-semibold"
            style={{ background: "var(--slide-hl)", color: "var(--slide-hl-ink, #000)" }}
          >
            Send
          </button>
        </div>

        <ul className="flex flex-col gap-[16px] overflow-hidden" style={{ maxWidth: 1400 }}>
          {sorted.length === 0 ? (
            <li className="slide-body" style={{ color: "var(--slide-muted)" }}>No questions yet.</li>
          ) : sorted.map((q) => (
            <li
              key={q.id}
              className="flex items-center gap-[20px] rounded-xl px-[24px] py-[18px]"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <button
                onClick={() => upvote(q.id)}
                className="flex flex-col items-center justify-center rounded-lg px-[16px] py-[8px]"
                style={{ background: "rgba(255,255,255,0.08)", minWidth: 64 }}
                title="Upvote"
              >
                <span className="slide-chrome">▲</span>
                <span className="slide-chrome tabular-nums">{q.upvotes}</span>
              </button>
              <span className="slide-body flex-1">{q.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </SlideLayout>
  );
}
