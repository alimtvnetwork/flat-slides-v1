import { createFileRoute, redirect } from "@tanstack/react-router";

// Root route — slides-first. See:
//   .lovable/spec/commands/01-slides-first-preview.md
//   .lovable/memory/diagnostics/03-root-not-slides-first-rca.md
// Marketing landing moved to /about (src/routes/about.tsx).
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/slides/$slideId", params: { slideId: "1" } });
  },
  head: () => ({
    meta: [
      { title: "Glasswing — Slides" },
      { name: "description", content: "JSON-driven slide deck. Present, inspect, export." },
      { property: "og:title", content: "Glasswing Slides" },
      { property: "og:description", content: "JSON-driven slide deck." },
    ],
  }),
  component: () => null,
});
