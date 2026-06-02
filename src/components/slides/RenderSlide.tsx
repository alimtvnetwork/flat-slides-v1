import { Rich } from "./Rich";
import { SlideLayout } from "./SlideLayout";
import type {
  CenterSlideProps,
  LeftSlideProps,
  QuoteSlideProps,
  Slide,
  StepsSlideProps,
} from "./types";

function LeftSlide({ slide }: { slide: LeftSlideProps }) {
  const media = slide.media;
  return (
    <SlideLayout background={slide.background}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-[48%] pl-[120px] pr-[40px]">
          {slide.kicker ? (
            <div className="slide-kicker mb-[28px]" style={{ color: "var(--slide-muted)" }}>
              {slide.kicker}
            </div>
          ) : null}
          <h1 className="slide-heading slide-title" style={{ fontWeight: 300 }}>
            <Rich value={slide.heading} />
          </h1>
          {slide.body ? (
            <p className="slide-body mt-[40px]" style={{ maxWidth: 820 }}>
              <Rich value={slide.body} />
            </p>
          ) : null}
        </div>
        <div className="w-[52%] flex items-center justify-center pr-[80px]">
          {media && typeof media === "object" && "src" in media ? (
            <img
              src={media.src}
              alt={media.alt ?? ""}
              className="max-h-[760px] max-w-[760px] rounded-[36px] object-cover shadow-2xl"
            />
          ) : (
            media
          )}
        </div>
      </div>
    </SlideLayout>
  );
}

function CenterSlide({ slide }: { slide: CenterSlideProps }) {
  return (
    <SlideLayout background={slide.background}>
      <div className="flex h-full w-full flex-col items-center justify-center gap-[36px] px-[120px] text-center">
        <h1
          className={`${slide.display ? "slide-display slide-title-lg" : "slide-heading slide-title"}`}
          style={{ color: "var(--slide-fg)", fontWeight: slide.display ? 400 : 600 }}
        >
          <Rich value={slide.heading} />
        </h1>
        {slide.subhead ? (
          <div className="slide-subtitle slide-heading" style={{ fontWeight: 600 }}>
            <Rich value={slide.subhead} />
          </div>
        ) : null}
      </div>
    </SlideLayout>
  );
}

function StepsSlide({ slide, step }: { slide: StepsSlideProps; step: number }) {
  const visible = Math.max(0, Math.min(step, slide.steps.length - 1));
  return (
    <SlideLayout background={slide.background}>
      <div className="absolute inset-0 flex flex-col px-[120px] pt-[120px]">
        <h2 className="slide-heading slide-subtitle mb-[60px]" style={{ color: "var(--slide-muted)" }}>
          {slide.heading}
        </h2>
        <ol className="flex flex-col gap-[36px]">
          {slide.steps.map((s, i) => {
            const isVisible = i <= visible;
            return (
              <li
                key={i}
                className="slide-body-lg slide-body-font flex items-baseline gap-[28px]"
                style={{
                  opacity: isVisible ? 1 : 0.12,
                  transform: isVisible ? "translateX(0)" : "translateX(-16px)",
                  transition: "opacity 350ms ease, transform 350ms ease",
                }}
              >
                <span
                  className="slide-heading"
                  style={{ color: "var(--slide-hl)", fontWeight: 700, minWidth: 80 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <Rich value={s} />
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="slide-chrome absolute right-[60px] bottom-[44px]" style={{ color: "var(--slide-muted)" }}>
        Step {visible + 1} / {slide.steps.length}
      </div>
    </SlideLayout>
  );
}

function QuoteSlide({ slide }: { slide: QuoteSlideProps }) {
  return (
    <SlideLayout background={slide.background}>
      <div className="flex h-full w-full flex-col items-center justify-center gap-[40px] px-[160px] text-center">
        <p className="slide-display" style={{ fontSize: 120, lineHeight: 1.1 }}>
          &ldquo;<Rich value={slide.quote} />&rdquo;
        </p>
        {slide.attribution ? (
          <div className="slide-caption slide-body-font" style={{ color: "var(--slide-muted)" }}>
            {slide.attribution}
          </div>
        ) : null}
      </div>
    </SlideLayout>
  );
}

/** Single entrypoint — picks the right component for the slide.type. */
export function RenderSlide({ slide, step = 0 }: { slide: Slide; step?: number }) {
  switch (slide.type) {
    case "left":
      return <LeftSlide slide={slide} />;
    case "center":
      return <CenterSlide slide={slide} />;
    case "steps":
      return <StepsSlide slide={slide} step={step} />;
    case "quote":
      return <QuoteSlide slide={slide} />;
  }
}
