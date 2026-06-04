import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { RenderSlide } from "@/components/slides/RenderSlide";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { useDeck } from "@/components/slides/store";
import { slideStepCount } from "@/components/slides/types";

export const Route = createFileRoute("/slides/print")({
  head: () => ({
    meta: [
      { title: "Slides — Print / PDF" },
      { name: "description", content: "Print-ready stacked view of the deck." },
    ],
  }),
  component: SlidesPrintPage,
});

function SlidesPrintPage() {
  const slides = useDeck((s) => s.deck.slides).filter((s) => s.enabled !== false);

  // If the user lands here via the SettingsDrawer "Export as PDF" entry,
  // `?auto=1` triggers the browser print dialog once the layout settles.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auto") !== "1") return;
    const t = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="print-deck">
      <PrintInstructionNotice auto={isAutoPrintRequest()} />
      {slides.map((slide) => {
        // Show the final step of step-aware slides so reveals are visible in print.
        const lastStep = Math.max(0, slideStepCount(slide) - 1);
        return (
          <section key={slide.id} className="print-page" aria-label={slide.title}>
            <ScaledSlide>
              <RenderSlide slide={slide} step={lastStep} />
            </ScaledSlide>
          </section>
        );
      })}
    </main>
  );
}

function isAutoPrintRequest() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("auto") === "1";
}

function PrintInstructionNotice({ auto }: { auto: boolean }) {
  return (
    <aside className="print-notice" data-print-hide aria-live="polite">
      <strong>{auto ? "Print dialog opening…" : "Ready to export"}</strong>
      <span>{auto ? "Choose Save as PDF when your browser dialog appears." : "Press Cmd/Ctrl + P, then choose Save as PDF."}</span>
    </aside>
  );
}
