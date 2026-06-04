import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RenderSlide } from "@/components/slides/RenderSlide";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { DEFAULT_EXPORT_PAPER, parseExportPaper, type ExportPaper } from "@/components/slides/exportPaper";
import { useDeck } from "@/components/slides/store";
import { slideStepCount } from "@/components/slides/types";

export const Route = createFileRoute("/slides/handout")({
  head: () => ({
    meta: [
      { title: "Slides — Speaker handout" },
      {
        name: "description",
        content: "Printable speaker handout: one slide per page with notes underneath.",
      },
    ],
  }),
  component: SlidesHandoutPage,
});

function SlidesHandoutPage() {
  const slides = useDeck((s) => s.deck.slides).filter((s) => s.enabled !== false);
  const location = useLocation();
  const [autoPrint, setAutoPrint] = useState(false);
  const [paper, setPaper] = useState<ExportPaper>(DEFAULT_EXPORT_PAPER);

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
    <main className="handout-deck" data-paper={paper}>
      <HandoutInstructionNotice auto={autoPrint} />
      {slides.map((slide, i) => {
        const lastStep = Math.max(0, slideStepCount(slide) - 1);
        const notes = slide.notes?.trim() ?? "";
        return (
          <section
            key={slide.id}
            className="handout-page"
            aria-label={`Slide ${i + 1}: ${slide.title ?? slide.id}`}
          >
            <div className="handout-thumb">
              <ScaledSlide>
                <RenderSlide slide={slide} step={lastStep} />
              </ScaledSlide>
            </div>
            <aside className="handout-notes" aria-label="Speaker notes">
              <header className="handout-notes-header">
                <span className="handout-slide-no">Slide {i + 1}</span>
                {slide.title ? <span className="handout-slide-title">{slide.title}</span> : null}
              </header>
              {notes ? (
                <p className="handout-notes-body">{notes}</p>
              ) : (
                <p className="handout-notes-empty">No speaker notes for this slide.</p>
              )}
            </aside>
          </section>
        );
      })}
    </main>
  );
}

function HandoutInstructionNotice({ auto }: { auto: boolean }) {
  return (
    <aside className="print-notice" data-print-hide aria-live="polite">
      <strong>{auto ? "Print dialog opening…" : "Ready to export handout"}</strong>
      <span>
        {auto
          ? "Choose Save as PDF when your browser dialog appears."
          : "Press Cmd/Ctrl + P, then choose Save as PDF."}
      </span>
    </aside>
  );
}
