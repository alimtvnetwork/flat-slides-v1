import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RenderSlide } from "@/components/slides/RenderSlide";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { DEFAULT_EXPORT_PAPER, parseExportPaper, type ExportPaper } from "@/components/slides/exportPaper";
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
  const location = useLocation();
  const [autoPrint, setAutoPrint] = useState(false);
  const [paper, setPaper] = useState<ExportPaper>(DEFAULT_EXPORT_PAPER);

  // If the user lands here via the SettingsDrawer "Export as PDF" entry,
  // `?auto=1` triggers the browser print dialog once the layout settles.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(location.searchStr);
    const shouldAutoPrint = params.get("auto") === "1";
    setPaper(parseExportPaper(params));
    setAutoPrint(shouldAutoPrint);
    if (!shouldAutoPrint) return;
    const t = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(t);
  }, [location.searchStr]);

  return (
    <main className="print-deck" data-paper={paper}>
      <PrintInstructionNotice auto={autoPrint} />
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

function PrintInstructionNotice({ auto }: { auto: boolean }) {
  return (
    <aside className="print-notice" data-print-hide aria-live="polite">
      <strong>{auto ? "Print dialog opening…" : "Ready to export"}</strong>
      <span>{auto ? "Choose Save as PDF when your browser dialog appears." : "Press Cmd/Ctrl + P, then choose Save as PDF."}</span>
    </aside>
  );
}
