import { Link, createFileRoute } from "@tanstack/react-router";

import specText from "../../slides/README-LLM.md?raw";

export const Route = createFileRoute("/slides/spec")({
  head: () => ({
    meta: [
      { title: "Slides JSON Spec — Glasswing" },
      { name: "description", content: "Complete JSON authoring spec for Glasswing slide decks." },
    ],
  }),
  component: SlidesSpecPage,
});

function SlidesSpecPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Glasswing</p>
            <h1 className="text-3xl font-semibold tracking-tight">Slide JSON spec</h1>
          </div>
          <Link
            to="/slides"
            className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            ← Back to deck
          </Link>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-5 text-sm leading-6 text-foreground whitespace-pre-wrap">
          {specText}
        </pre>
      </div>
    </main>
  );
}