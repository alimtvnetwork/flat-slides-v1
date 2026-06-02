import { AnimatePresence, motion } from "motion/react";
import type { CSSProperties } from "react";

import { Rich } from "./Rich";
import { SlideLayout } from "./SlideLayout";
import { getRegisteredSlideType } from "./registry";
import { getTheme, themeStyle } from "./themes";
import { useDeck } from "./store";
import { EmbedSlide } from "./widgets/EmbedSlide";
import { PollSlide } from "./widgets/PollSlide";
import { QaSlide } from "./widgets/QaSlide";
import type {
  BulletsSlideProps,
  CenterSlideProps,
  ImageSlideProps,
  LeftSlideProps,
  QuoteSlideProps,
  Slide,
  StepsSlideProps,
  TextPosition,
  TimelineSlideProps,
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
          <h1 className="slide-heading slide-title" style={{ fontWeight: 700 }}>
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
          style={{ color: "var(--slide-fg)", fontWeight: 700 }}
        >
          <Rich value={slide.heading} />
        </h1>
        {slide.subhead ? (
          <div className="slide-subtitle slide-heading mt-[36px]" style={{ fontWeight: 700 }}>
            <Rich value={slide.subhead} />
          </div>
        ) : null}
      </div>
    </SlideLayout>
  );
}

function StepsSlide({ slide, step }: { slide: StepsSlideProps; step: number }) {
  const focus = Math.max(0, Math.min(step, slide.steps.length - 1));
  const focused = slide.steps[focus];
  return (
    <SlideLayout background={slide.background}>
      <div className="absolute inset-0 grid grid-cols-[520px_minmax(0,1fr)] gap-[70px] pl-[380px] pr-[260px] pt-[110px] pb-[110px]">
        <div className="min-w-0">
        <h2
          className="slide-heading slide-subtitle mb-[52px]"
          style={{ color: "var(--slide-muted)" }}
        >
          {slide.heading}
        </h2>
        <ol className="flex flex-col gap-[24px]">
          {slide.steps.map((s, i) => {
            const isFocus = i === focus;
            return (
              <li
                key={i}
                className="slide-body slide-body-font flex items-start gap-[24px]"
                style={{
                  opacity: isFocus ? 1 : 0.68,
                  transform: isFocus ? "translateX(12px)" : "translateX(0)",
                  transition: "opacity 350ms ease, transform 350ms ease, color 350ms ease",
                  color: isFocus ? "var(--slide-fg)" : "color-mix(in oklab, var(--slide-fg) 64%, var(--slide-muted))",
                }}
              >
                <span
                  className="slide-heading"
                  style={{ color: isFocus ? "var(--slide-hl)" : "color-mix(in oklab, var(--slide-fg) 54%, var(--slide-muted))", fontWeight: 700, minWidth: 72 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block slide-caption" style={{ color: "inherit" }}>{s.label}</span>
                  {s.title ? <span className="block" style={{ fontWeight: isFocus ? 700 : 500 }}>{s.title}</span> : null}
                </span>
              </li>
            );
          })}
        </ol>
        </div>
        <div className="min-w-0 flex items-center justify-center text-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={focus}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "100%", maxWidth: 700, overflowWrap: "break-word" }}
            >
              <div className="slide-kicker slide-heading mb-[22px]" style={{ color: "var(--slide-hl)" }}>
                {focused?.label ?? ""}
              </div>
              <div
                className="slide-heading"
                style={{
                  color: "var(--slide-fg)",
                  fontSize: 72,
                  lineHeight: 1.05,
                  letterSpacing: 0,
                  textWrap: "balance",
                  overflowWrap: "anywhere",
                }}
              >
                {focused?.title ?? ""}
              </div>
              {focused?.detail ? (
                <div className="slide-body slide-body-font mx-auto mt-[30px]" style={{ color: "var(--slide-muted)", maxWidth: 700 }}>
                  <Rich value={focused.detail} />
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div
        className="slide-chrome absolute right-[60px] bottom-[44px]"
        style={{ color: "var(--slide-muted)" }}
      >
        Step {focus + 1} / {slide.steps.length}
      </div>
    </SlideLayout>
  );
}

function TimelineSlide({ slide, step }: { slide: TimelineSlideProps; step: number }) {
  const items = slide.items;
  const focus = Math.max(0, Math.min(step, items.length - 1));
  const focused = items[focus];

  const railY = 780;
  const railLeft = 240;
  const railRight = 1680;
  const railWidth = railRight - railLeft;
  const railTop = railY - 2;
  const lastIdx = Math.max(1, items.length - 1);
  const xFor = (i: number) =>
    items.length === 1 ? (railLeft + railRight) / 2 : railLeft + (railWidth * i) / lastIdx;
  const progressWidth = items.length === 1 ? 0 : (railWidth * focus) / lastIdx;

  return (
    <SlideLayout background={slide.background}>
      {slide.heading ? (
        <div
          className="slide-kicker absolute left-[120px] top-[100px]"
          style={{ color: "var(--slide-muted)" }}
        >
          {slide.heading}
        </div>
      ) : null}

      <div
        className="absolute left-1/2 -translate-x-1/2 text-center"
        style={{ top: 205, width: 1320 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={focus}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflowWrap: "break-word" }}
          >
            <div className="slide-kicker slide-heading mb-[22px]" style={{ color: "var(--slide-hl)" }}>
              {focused?.label ?? ""}
            </div>
            <div
              className="slide-heading"
              style={{
                color: "var(--slide-fg)",
                fontSize: 72,
                lineHeight: 1.05,
                letterSpacing: 0,
                textWrap: "balance",
                overflowWrap: "anywhere",
              }}
            >
              {focused?.title ?? ""}
            </div>
            {focused?.detail ? (
              <div
                className="slide-body slide-body-font mx-auto mt-[28px]"
                style={{ color: "var(--slide-muted)", maxWidth: 1100 }}
              >
                <Rich value={focused.detail} />
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="absolute"
        style={{
          left: railLeft,
          top: railTop,
          width: railWidth,
          height: 4,
          borderRadius: 2,
          background: "color-mix(in oklab, var(--slide-muted) 25%, transparent)",
        }}
      />
      <div
        className="absolute"
        style={{
          left: railLeft,
          top: railTop,
          width: progressWidth,
          height: 4,
          borderRadius: 2,
          background: "var(--slide-hl)",
          transition: "width 450ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />

      {items.map((it, i) => {
        const cx = xFor(i);
        const isFocus = i === focus;
        const isDone = i < focus;
        const size = isFocus ? 28 : 18;
        return (
          <div key={i}>
            {isFocus ? (
              <div
                className="absolute"
                style={{
                  left: cx - 22,
                  top: railY - 22,
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "color-mix(in oklab, var(--slide-hl) 35%, transparent)",
                  transition: "all 350ms ease",
                }}
              />
            ) : null}
            <div
              className="absolute"
              style={{
                left: cx - size / 2,
                top: railY - size / 2,
                width: size,
                height: size,
                borderRadius: "50%",
                background: isDone || isFocus ? "var(--slide-hl)" : "transparent",
                border:
                  isDone || isFocus
                    ? "none"
                    : "2px solid color-mix(in oklab, var(--slide-muted) 70%, transparent)",
                transition: "all 350ms ease",
              }}
            />
            <div
              className="slide-body-font absolute text-center"
              style={{
                left: cx - 140,
                top: railY + 28,
                width: 280,
                color: isFocus ? "var(--slide-fg)" : "color-mix(in oklab, var(--slide-fg) 58%, var(--slide-muted))",
                opacity: isFocus ? 1 : 0.55,
                transition: "opacity 350ms ease, color 350ms ease",
              }}
            >
              <div className="slide-caption" style={{ fontWeight: isFocus ? 700 : 500 }}>
                {it.label}
              </div>
              {it.title ? (
                <div
                  className="slide-caption mt-[6px]"
                  style={{
                    fontSize: 20,
                    opacity: isFocus ? 0.9 : 0.7,
                    color: "color-mix(in oklab, var(--slide-fg) 70%, var(--slide-muted))",
                  }}
                >
                  {it.title}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      <div
        className="slide-chrome absolute right-[60px] bottom-[44px]"
        style={{ color: "var(--slide-muted)" }}
      >
        Step {focus + 1} / {items.length}
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
        <h1 className="slide-heading slide-title mb-[48px]" style={{ fontWeight: 700 }}>
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
              <h1 className="slide-heading slide-title mb-[28px]" style={{ fontWeight: 700 }}>
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
    case "left":    body = <LeftSlide slide={slide} />; break;
    case "center":  body = <CenterSlide slide={slide} />; break;
    case "steps":   body = <StepsSlide slide={slide} step={step} />; break;
    case "timeline": body = <TimelineSlide slide={slide} step={step} />; break;
    case "quote":   body = <QuoteSlide slide={slide} />; break;
    case "bullets": body = <BulletsSlide slide={slide} />; break;
    case "image":   body = <ImageSlide slide={slide} />; break;
    case "poll":    body = <PollSlide slide={slide} />; break;
    case "qa":      body = <QaSlide slide={slide} />; break;
    case "embed":   body = <EmbedSlide slide={slide} />; break;
    default: {
      // Plugin registry fallback (step 333).
      const Custom = getRegisteredSlideType((slide as { type: string }).type);
      body = Custom ? <Custom slide={slide} step={step} /> : (
        <SlideLayout><div className="absolute inset-0 grid place-items-center slide-body">
          Unknown slide type: {(slide as { type: string }).type}
        </div></SlideLayout>
      );
    }
  }
  return <ThemeWrap slide={slide}>{body}</ThemeWrap>;
}
