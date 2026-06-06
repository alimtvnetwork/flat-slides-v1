import { AnimatePresence, motion } from "motion/react";
import type { CSSProperties } from "react";

import { Rich } from "./Rich";
import { SlideLayout } from "./SlideLayout";
import { CodeJourneyDecor, shouldAutoEnableCodeDecor } from "./decor/CodeJourneyDecor";
import { getRegisteredSlideType } from "./registry";
import {
  DARK_PRESET_BG,
  DARK_PRESET_FG,
  DARK_PRESET_MUTED,
  clampBackgroundBlurPx,
  clampDarkenPercent,
  resolveBackgroundLayerStyle,
  resolveSlideBackground,
  resolveSlideBgVariable,
} from "./slideBackground";
import { getTheme, themeStyle } from "./themes";
import { useDeck } from "./store";
import { useHydratedDeckSettings } from "./useHydratedDeckSettings";
import { useReducedMotion } from "./useReducedMotion";
import { useSlideNavigation } from "./useSlideNavigation";
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

function applyDarkPresetTokens(style: Record<string, string>): void {
  style["--slide-bg"] = DARK_PRESET_BG;
  style["--slide-fg"] = DARK_PRESET_FG;
  style["--slide-muted"] = DARK_PRESET_MUTED;
  style["--slide-text-shadow"] = "none";
}

function ThemeWrap({ slide, children }: { slide: Slide; children: React.ReactNode }) {
  const deckThemeId = useDeck((s) => s.deck.themeId);
  const settings = useHydratedDeckSettings();
  const theme = getTheme(slide.themeId ?? deckThemeId);
  const style: React.CSSProperties = { ...themeStyle(theme), position: "absolute", inset: 0 };
  const background = resolveSlideBackground(slide, settings);
  const darken = clampDarkenPercent(settings.darken);
  const blur = clampBackgroundBlurPx(settings.blur);
  const styleRecord = style as Record<string, string>;
  styleRecord["--slide-bg"] = resolveSlideBgVariable(background);
  styleRecord["--slide-content-bg"] = "transparent";
  if (settings.backgroundMode === "dark") applyDarkPresetTokens(styleRecord);
  if (settings.textColor) {
    styleRecord["--slide-fg"] = settings.textColor;
    styleRecord["--slide-muted"] = `color-mix(in oklab, ${settings.textColor} 70%, transparent)`;
    styleRecord.color = settings.textColor;
  }
  const bgStyle = resolveBackgroundLayerStyle(background, theme, blur);
  return (
    <div style={style}>
      <div className="absolute inset-0" aria-hidden data-slide-bg-layer style={bgStyle} />
      {darken > 0 ? (
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{ background: `rgba(0,0,0,${darken / 100})` }}
        />
      ) : null}
      <div className="absolute inset-0">{children}</div>
    </div>
  );
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
            {(typeof media === "object" && media !== null && "src" in media) || (typeof media === "string" && media.includes("://")) ? (
              <img
                src={typeof media === "string" ? media : media.src}
                alt={typeof media === "string" ? "" : media.alt ?? ""}
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
  const headingText = Array.isArray(slide.heading)
    ? slide.heading.map((p) => (typeof p === "string" ? p : p.text)).join(" ")
    : "";
  const showDecor =
    slide.decor === "code" ||
    (slide.decor !== "none" && shouldAutoEnableCodeDecor(headingText));
  return (
    <SlideLayout background={slide.background}>
      {showDecor ? <CodeJourneyDecor /> : null}
      <div style={positionStyle(slide.align ?? "center", slide.padding ?? 120)}>
        <h1
          className={`${slide.display ? "slide-display slide-title-lg" : "slide-heading slide-title"} relative z-[1]`}
          style={{ color: "var(--slide-fg)", fontWeight: 700 }}
        >
          <Rich value={slide.heading} />
        </h1>
        {slide.subhead ? (
          <div className="slide-subtitle slide-heading mt-[36px] relative z-[1]" style={{ fontWeight: 700 }}>
            <Rich value={slide.subhead} />
          </div>
        ) : null}
      </div>
    </SlideLayout>
  );
}

/** Resolve a click-to-jump handler for step rows on `steps`/`timeline` slides. */
function useStepJump(slide: Slide) {
  const slides = useDeck((s) => s.deck.slides);
  const { goTo } = useSlideNavigation();
  const linearIndex = slides.filter((s) => s.enabled !== false).findIndex((s) => s.id === slide.id);
  return (stepIndex: number) => {
    if (linearIndex < 0) return;
    goTo(linearIndex + 1, "forward", stepIndex + 1);
  };
}

function StepsSlide({ slide, step }: { slide: StepsSlideProps; step: number }) {
  const focus = Math.max(0, Math.min(step, slide.steps.length - 1));
  const focused = slide.steps[focus];
  const jumpToStep = useStepJump(slide);
  const reducedMotion = useReducedMotion();
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
                role="button"
                tabIndex={0}
                onClick={() => jumpToStep(i)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jumpToStep(i); } }}
                className="slide-body slide-body-font flex items-start gap-[24px] cursor-pointer rounded-[14px] px-[12px] py-[8px] -mx-[12px] -my-[8px] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--slide-hl)]"
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
        <div className="min-w-0 relative flex items-center justify-center text-center" style={{ minHeight: 360 }}>
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={focus}
              data-testid="step-detail-pane"
              initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
              transition={{
                opacity: { duration: reducedMotion ? 0 : 0.18, ease: "easeOut" },
                y: { duration: reducedMotion ? 0 : 0.22, ease: "easeOut" },
              }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                x: "-50%",
                y: "-50%",
                width: "100%",
                maxWidth: 700,
                overflowWrap: "break-word",
              }}
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
        className="slide-chrome absolute left-[60px] bottom-[44px]"
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
  const jumpToStep = useStepJump(slide);
  const reducedMotion = useReducedMotion();

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
        style={{ top: 205, width: 1320, height: 460, position: "absolute" }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={focus}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.45, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
              overflowWrap: "break-word",
            }}
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
            <button
              type="button"
              aria-label={`Jump to ${it.label}`}
              onClick={() => jumpToStep(i)}
              className="absolute cursor-pointer rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--slide-hl)]"
              style={{
                left: cx - 140,
                top: railY - 40,
                width: 280,
                height: 180,
                background: "transparent",
                border: "none",
              }}
            />
          </div>
        );
      })}

      <div
        className="slide-chrome absolute left-[60px] bottom-[44px]"
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
