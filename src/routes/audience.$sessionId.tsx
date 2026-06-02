import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { audienceChannelName, type AudienceMessage } from "@/components/slides/audience-store";
import { useDeck } from "@/components/slides/store";

/**
 * Audience-facing route. Lightweight on purpose — attendees join from a
 * phone, so we render a single-column view: session id, the current slide
 * title pushed by the presenter, and (for poll slides) vote buttons that
 * post to the shared BroadcastChannel.
 *
 * No deck rendering, no fullscreen API, no auth — attendees just need to
 * see "you joined session X, currently on slide N" and vote.
 */
export const Route = createFileRoute("/audience/$sessionId")({
  head: ({ params }) => ({
    meta: [
      { title: `Audience · ${params.sessionId}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AudiencePage,
});

const VOTER_KEY = "slides-audience-voter";

function getVoterId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = localStorage.getItem(VOTER_KEY);
    if (existing) return existing;
  } catch { /* ignore */ }
  const id = (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : `v_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  try { localStorage.setItem(VOTER_KEY, id); } catch { /* ignore */ }
  return id;
}

function AudiencePage() {
  const { sessionId } = Route.useParams();
  const deck = useDeck((s) => s.deck);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [presenter, setPresenter] = useState<{
    slideIndex: number; slideId: string; stepNum: number; total: number; title?: string;
  } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const voterId = useMemo(() => getVoterId(), []);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(audienceChannelName(sessionId));
    channelRef.current = ch;
    const onMessage = (event: MessageEvent<AudienceMessage>) => {
      const msg = event.data;
      if (msg?.type === "presenter:slide") {
        setPresenter({ slideIndex: msg.slideIndex, slideId: msg.slideId, stepNum: msg.stepNum, total: msg.total, title: msg.title });
        setPicked(null); // reset vote state when presenter advances
      }
    };
    ch.addEventListener("message", onMessage);
    // Announce ourselves so presenter re-broadcasts current slide.
    ch.postMessage({ type: "audience:hello", voterId } satisfies AudienceMessage);
    return () => {
      ch.removeEventListener("message", onMessage);
      ch.close();
      channelRef.current = null;
    };
  }, [sessionId, voterId]);

  const currentSlide = presenter
    ? deck.slides.find((s) => s.id === presenter.slideId)
    : undefined;
  const isPoll = currentSlide?.type === "poll";

  const vote = (option: number) => {
    if (!isPoll || !currentSlide || picked !== null) return;
    setPicked(option);
    channelRef.current?.postMessage({
      type: "audience:vote",
      slideId: currentSlide.id,
      option,
      optionCount: currentSlide.options.length,
      voterId,
    } satisfies AudienceMessage);
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-neutral-950 px-6 py-12 text-white">
      <header className="mb-10 flex w-full max-w-md flex-col items-center gap-2 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Audience session</p>
        <h1 className="font-mono text-3xl tracking-[0.4em]">{sessionId}</h1>
      </header>

      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        {!presenter ? (
          <p className="text-center text-sm text-white/60">
            Waiting for the presenter to advance to a slide…
          </p>
        ) : (
          <>
            <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/40">
              Slide {presenter.slideIndex} / {presenter.total}
            </div>
            <h2 className="mb-6 text-xl font-semibold">{presenter.title ?? currentSlide?.title ?? "Untitled"}</h2>

            {isPoll && currentSlide ? (
              <div>
                <p className="mb-3 text-sm text-white/70">{currentSlide.question}</p>
                <ul className="flex flex-col gap-2">
                  {currentSlide.options.map((opt, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => vote(i)}
                        disabled={picked !== null}
                        className={
                          "w-full rounded-xl border px-4 py-3 text-left text-sm transition " +
                          (picked === i
                            ? "border-white/80 bg-white/20"
                            : picked === null
                              ? "border-white/15 bg-white/5 hover:bg-white/10"
                              : "cursor-not-allowed border-white/10 bg-white/[0.03] text-white/40")
                        }
                      >
                        {opt}
                      </button>
                    </li>
                  ))}
                </ul>
                {picked !== null && (
                  <p className="mt-4 text-center text-xs text-white/60">Thanks — your vote was sent.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/50">No interactive element on this slide.</p>
            )}
          </>
        )}
      </section>

      <footer className="mt-8 text-[11px] text-white/30">
        Same-network device only · votes round-trip via BroadcastChannel
      </footer>
    </main>
  );
}
