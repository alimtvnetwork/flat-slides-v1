import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RenderSlide } from "@/components/slides/RenderSlide";
import { ScaledSlide } from "@/components/slides/ScaledSlide";
import { useDeck } from "@/components/slides/store";
import { slideStepCount, type Slide } from "@/components/slides/types";

export const Route = createFileRoute("/slides/handout-3up")({
  head: () => ({
    meta: [
      { title: "Slides — 3-up handout" },
      {
        name: "description",
        content: "Compact printable speaker handout with three slides per page.",
      },
    ],
  }),
  component: SlidesHandoutThreeUpPage,
});

function SlidesHandoutThreeUpPage() {
  const slides = useDeck((s) => s.deck.slides).filter((s) => s.enabled !== false);
  const pages = chunkSlides(slides, 3);
  const [autoPrint, setAutoPrint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const shouldAutoPrint = params.get("auto") === "1";
    setAutoPrint(shouldAutoPrint);
    if (!shouldAutoPrint) return;
    const t = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="handout-threeup-deck">
      <HandoutThreeUpInstructionNotice auto={autoPrint} />
      {pages.map((pageSlides, pageIndex) => (
        <section
          key={pageSlides.map((slide) => slide.id).join("-") || pageIndex}
          className="handout-threeup-page"
          aria-label={`3-up handout page ${pageIndex + 1}`}
        >
          {[0, 1, 2].map((slotIndex) => {
            const slide = pageSlides[slotIndex];
            const slideIndex = pageIndex * 3 + slotIndex;
            return slide ? (
              <HandoutThreeUpRow key={slide.id} slide={slide} slideIndex={slideIndex} />
            ) : (
              <div key={`empty-${slotIndex}`} className="handout-threeup-row is-empty" aria-hidden="true" />
            );
          })}
        </section>
      ))}
    </main>
  );
}

function HandoutThreeUpRow({ slide, slideIndex }: { slide: Slide; slideIndex: number }) {
  const lastStep = Math.max(0, slideStepCount(slide) - 1);
  const notes = slide.notes?.trim() ?? "";

  return (
    <article className="handout-threeup-row" aria-label={`Slide ${slideIndex + 1}: ${slide.title ?? slide.id}`}>
      <div className="handout-threeup-thumb">
        <ScaledSlide>
          <RenderSlide slide={slide} step={lastStep} />
        </ScaledSlide>
      </div>
      <aside className="handout-threeup-notes" aria-label="Speaker notes">
        <header className="handout-threeup-notes-header">
          <span className="handout-slide-no">Slide {slideIndex + 1}</span>
          {slide.title ? <span className="handout-slide-title">{slide.title}</span> : null}
        </header>
        {notes ? (
          <p className="handout-threeup-notes-body">{notes}</p>
        ) : (
          <p className="handout-threeup-notes-empty">Notes</p>
        )}
        <div className="handout-threeup-lines" aria-hidden="true" />
      </aside>
    </article>
  );
}

function HandoutThreeUpInstructionNotice({ auto }: { auto: boolean }) {
  return (
    <aside className="print-notice" data-print-hide aria-live="polite">
      <strong>{auto ? "Print dialog opening…" : "Ready to export 3-up handout"}</strong>
      <span>
        {auto
          ? "Choose Save as PDF when your browser dialog appears."
          : "Press Cmd/Ctrl + P, then choose Save as PDF."}
      </span>
    </aside>
  );
}

function chunkSlides(slides: Slide[], size: number) {
  const chunks: Slide[][] = [];
  for (let i = 0; i < slides.length; i += size) chunks.push(slides.slice(i, i + size));
  return chunks;
}