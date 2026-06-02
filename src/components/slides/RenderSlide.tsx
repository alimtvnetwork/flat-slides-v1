import type { CSSProperties } from "react";

import { Rich } from "./Rich";
import { SlideLayout } from "./SlideLayout";
import { getTheme, themeStyle } from "./themes";
import { useDeck } from "./store";
import type {
  BulletsSlideProps,
  CenterSlideProps,
  ImageSlideProps,
  LeftSlideProps,
  QuoteSlideProps,
  Slide,
  StepsSlideProps,
  TextPosition,
} from "./types";

/** Map a 9-cell TextPosition to Tailwind/flex alignment styles. */
function positionStyle(pos: TextPosition | undefined, padding = 120): CSSProperties {
  const [v = "center", h = "center"] = (pos ?? "center").split("-") as [string, string];
  const justify = v === "top" ? "flex-start" : v === "bottom" ? "flex-end" : "center";
  const items = h === "left" ? "flex-start" : h === "right" ? "flex-end" : "center";
  const textAlign = (h === "center" ? "center" : h) as CSSProperties["textAlign"];
  return {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: justify,
    alignItems: items,
    textAlign,
    padding,
  };
}

function ThemeWrap({ slide, children }: { slide: Slide; children: React.ReactNode }) {
  const deckThemeId = useDeck((s) => s.deck.themeId);
  const theme = getTheme(slide.themeId ?? deckThemeId);
  return <div style={themeStyle(theme)}>{children}</div>;
}

function LeftSlide({ slide }: { slide: LeftSlideProps }) {
  const media = slide.media;
  return (
    <SlideLayout background={slide.background}>
      <div className="absolute inset-0 flex items-center" style={{ padding: slide.padding ?? 0 }}>
        <div
          className={media ? "w-[48%] pl-[120px] pr-[40px]" : "w-full px-[120px]"}
          style={{ textAlign: slide.align?.endsWith("right") ? "right" : "left" }}
        >
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
        {media ? (
          <div className="w-[52%] flex items-center justify-center pr-[80px]">
            {typeof media === "object" && "src" in media ? (
              <img
                src={media.src}
                alt={media.alt ?? ""}
                className="max-h-[760px] max-w-[760px] rounded-[36px] object-cover shadow-2xl"
              />
            ) : (
              media
            )}
          </div>
        ) : null}
      </div>
    </SlideLayout>
  );
}

function CenterSlide({ slide }: { slide: CenterSlideProps }) {
  return (
    <SlideLayout background={slide.background}>
      <div style={positionStyle(slide.align ?? "center", slide.padding ?? 120)}>
        <h1
          className={`${slide.display ? "slide-display slide-title-lg" : "slide-heading slide-title"}`}
          style={{ color: "var(--slide-fg)", fontWeight: slide.display ? 400 : 600 }}
        >
          <Rich value={slide.heading} />
        </h1>
        {slide.subhead ? (
          <div className="slide-subtitle slide-heading mt-[36px]" style={{ fontWeight: 600 }}>
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
        <h2
          className="slide-heading slide-subtitle mb-[60px]"
          style={{ color: "var(--slide-muted)" }}
        >
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
      <div
        className="slide-chrome absolute right-[60px] bottom-[44px]"
        style={{ color: "var(--slide-muted)" }}
      >
        Step {visible + 1} / {slide.steps.length}
      </div>
    </SlideLayout>
  );
}

function QuoteSlide({ slide }: { slide: QuoteSlideProps }) {
  return (
    <SlideLayout background={slide.background}>
      <div style={positionStyle(slide.align ?? "center", slide.padding ?? 160)}>
        <p className="slide-display" style={{ fontSize: 120, lineHeight: 1.1 }}>
          &ldquo;<Rich value={slide.quote} />&rdquo;
        </p>
        {slide.attribution ? (
          <div
            className="slide-caption slide-body-font mt-[40px]"
            style={{ color: "var(--slide-muted)" }}
          >
            {slide.attribution}
          </div>
        ) : null}
      </div>
    </SlideLayout>
  );
}

function BulletsSlide({ slide }: { slide: BulletsSlideProps }) {
  return (
    <SlideLayout background={slide.background}>
      <div style={positionStyle(slide.align ?? "center-left", slide.padding ?? 120)}>
        {slide.kicker ? (
          <div className="slide-kicker mb-[20px]" style={{ color: "var(--slide-muted)" }}>
            {slide.kicker}
          </div>
        ) : null}
        <h1 className="slide-heading slide-title mb-[48px]" style={{ fontWeight: 600 }}>
          <Rich value={slide.heading} />
        </h1>
        <ul className="flex flex-col gap-[24px]" style={{ maxWidth: 1400 }}>
          {slide.bullets.map((b, i) => (
            <li key={i} className="slide-body-lg slide-body-font flex items-baseline gap-[20px]">
              <span
                aria-hidden
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: "var(--slide-hl)",
                  display: "inline-block",
                  flexShrink: 0,
                  transform: "translateY(-6px)",
                }}
              />
              <span>
                <Rich value={b} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </SlideLayout>
  );
}

function ImageSlide({ slide }: { slide: ImageSlideProps }) {
  const fit = slide.fit ?? "cover";
  if (fit === "split") {
    return (
      <SlideLayout background={slide.background}>
        <div className="absolute inset-0 flex">
          <div className="w-1/2 flex flex-col justify-center px-[120px]">
            {slide.heading ? (
              <h1 className="slide-heading slide-title mb-[28px]" style={{ fontWeight: 600 }}>
                <Rich value={slide.heading} />
              </h1>
            ) : null}
            {slide.caption ? (
              <p className="slide-body" style={{ maxWidth: 760 }}>
                <Rich value={slide.caption} />
              </p>
            ) : null}
          </div>
          <div className="w-1/2 relative">
            <img src={slide.src} alt={slide.alt ?? ""} className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div>
      </SlideLayout>
    );
  }
  return (
    <SlideLayout background={slide.background}>
      <img
        src={slide.src}
        alt={slide.alt ?? ""}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: fit,
          background: "#000",
        }}
      />
      {slide.caption ? (
        <div
          className="slide-caption absolute left-[60px] bottom-[44px] rounded-md px-[20px] py-[12px]"
          style={{ background: "rgba(0,0,0,0.55)", color: "#fff", maxWidth: 1200 }}
        >
          <Rich value={slide.caption} />
        </div>
      ) : null}
    </SlideLayout>
  );
}

/** Single entrypoint — picks the right component for the slide.type. */
export function RenderSlide({ slide, step = 0 }: { slide: Slide; step?: number }) {
  let body: React.ReactNode;
  switch (slide.type) {
    case "left":
      body = <LeftSlide slide={slide} />;
      break;
    case "center":
      body = <CenterSlide slide={slide} />;
      break;
    case "steps":
      body = <StepsSlide slide={slide} step={step} />;
      break;
    case "quote":
      body = <QuoteSlide slide={slide} />;
      break;
    case "bullets":
      body = <BulletsSlide slide={slide} />;
      break;
    case "image":
      body = <ImageSlide slide={slide} />;
      break;
  }
  return <ThemeWrap slide={slide}>{body}</ThemeWrap>;
}
