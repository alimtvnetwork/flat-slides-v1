import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
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
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-950 px-6 text-center text-neutral-100">
      <div>
        <h1 className="font-[Instrument_Serif] text-6xl md:text-8xl tracking-tight">
          Glasswing
        </h1>
        <p className="mt-4 max-w-xl text-neutral-400">
          A JSON-driven slide system. Three themes, six layouts, four transitions.
          Author with any LLM — import, edit, present, export.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/slides"
          className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-200"
        >
          Open deck →
        </Link>
        <Link
          to="/slides/spec"
          className="rounded-md border border-neutral-700 px-5 py-2.5 text-sm text-neutral-200 hover:border-neutral-500"
        >
          JSON spec
        </Link>
      </div>
      <div className="text-xs text-neutral-500">
        Keyboard: <kbd>→</kbd> next · <kbd>F5</kbd> present · <kbd>G</kbd> overview · <kbd>S</kbd> settings
      </div>
    </main>
  );
}
