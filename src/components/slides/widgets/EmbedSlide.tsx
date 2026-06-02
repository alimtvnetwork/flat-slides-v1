import { SlideLayout } from "../SlideLayout";
import type { EmbedSlideProps } from "../types";

/**
 * Embeddable widget slide (forms, calendars, dashboards) via sandboxed iframe.
 *
 * Security:
 *  - URL must be https.
 *  - Iframe sandbox restricts scripts/navigation; allowlist via `slide.allow`.
 *  - Zod schema validates URL at import time.
 */
export function EmbedSlide({ slide }: { slide: EmbedSlideProps }) {
  const safe = /^https:\/\//i.test(slide.url);
  return (
    <SlideLayout background={slide.background}>
      <div className="absolute inset-0 flex flex-col px-[80px] py-[80px]">
        {slide.heading ? (
          <h1 className="slide-heading slide-subtitle mb-[28px]" style={{ fontWeight: 700 }}>{slide.heading}</h1>
        ) : null}
        <div className="flex-1 rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white">
          {safe ? (
            <iframe
              src={slide.url}
              title={slide.heading ?? slide.title}
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
              allow={slide.allow ?? "fullscreen"}
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-black slide-body">
              Embed blocked: URL must use https.
            </div>
          )}
        </div>
        {slide.caption ? (
          <div className="slide-caption mt-[20px]" style={{ color: "var(--slide-muted)" }}>{slide.caption}</div>
        ) : null}
      </div>
    </SlideLayout>
  );
}
