import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Braces,
  FileJson,
  Github,
  Keyboard,
  Layers,
  Palette,
  Presentation,
  Terminal,
  Zap,
} from "lucide-react";
import { useCallback, useEffect } from "react";

import { PresenterFallbackLink } from "@/components/slides/controls/PresenterFallbackLink";
import { HOME_PRESENT_SLIDE_ID, getHomePresentUrl, openHomePresenterWindow, shouldNavigateHomeAfterPresent } from "@/components/slides/home-present";
import { enterFullscreen, reportFullscreenFailure } from "@/components/slides/useFullscreen";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Glasswing — JSON-driven slide system" },
      {
        name: "description",
        content:
          "A JSON-driven slide presentation system with themes, transitions, and full import/export.",
      },
      { property: "og:title", content: "Glasswing Slides" },
      {
        property: "og:description",
        content:
          "Author decks in JSON. Any LLM can write a deck — see /slides/README-LLM.md.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const presentDeck = useCallback(async () => {
    const result = await enterFullscreen(null, { openPresenterWindow: openHomePresenterWindow });
    reportFullscreenFailure(result, { fallbackUrl: getHomePresentUrl(window.location.origin) });
    if (!shouldNavigateHomeAfterPresent(result)) return;
    await navigate({ to: "/slides/$slideId", params: { slideId: HOME_PRESENT_SLIDE_ID }, search: { present: 1 } as never });
  }, [navigate]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "F5") return;
      event.preventDefault();
      void presentDeck();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [presentDeck]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-black px-6 text-center text-white">
      <div className="flex items-center gap-3 text-white/70">
        <Terminal className="h-5 w-5" aria-hidden />
        <span className="font-mono text-xs uppercase tracking-[0.3em]">
          dev · json · llm-ready
        </span>
        <Braces className="h-5 w-5" aria-hidden />
      </div>

      <div>
        <h1 className="font-[Instrument_Serif] text-6xl tracking-tight text-white md:text-8xl">
          Glasswing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-white/80">
          A JSON-driven slide system. Three themes, six layouts, four transitions.
          Author with any LLM — import, edit, present, export.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => void presentDeck()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Presentation className="h-4 w-4" aria-hidden />
          Present deck
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
        <Link
          to="/slides"
          className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-2.5 text-sm text-white hover:border-white/60"
        >
          <Layers className="h-4 w-4" aria-hidden />
          Open deck
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          to="/slides/spec"
          className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-2.5 text-sm text-white hover:border-white/60"
        >
          <FileJson className="h-4 w-4" aria-hidden />
          JSON spec
        </Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-2.5 text-sm text-white hover:border-white/60"
        >
          <Github className="h-4 w-4" aria-hidden />
          Source
        </a>
      </div>

      <div className="grid max-w-3xl grid-cols-2 gap-4 text-left text-sm text-white/70 md:grid-cols-4">
        <Feature icon={<Layers className="h-4 w-4" />} label="6 layouts" />
        <Feature icon={<Palette className="h-4 w-4" />} label="3 themes + Snow" />
        <Feature icon={<Zap className="h-4 w-4" />} label="4 transitions" />
        <Feature icon={<Keyboard className="h-4 w-4" />} label="Keyboard-driven" />
      </div>

      <div className="flex items-center gap-2 text-xs text-white/60">
        <Keyboard className="h-3.5 w-3.5" aria-hidden />
        <span>
          <kbd>→</kbd> next · <kbd>F5</kbd> present · <kbd>G</kbd> overview · <kbd>S</kbd> settings
        </span>
      </div>
      <PresenterFallbackLink />
    </main>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-white/15 bg-white/[0.03] px-3 py-2 text-white">
      <span className="text-white">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
