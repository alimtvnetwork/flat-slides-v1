import type { CSSProperties } from "react";

import type { Theme } from "./themes";
import type { DeckSettings, Slide } from "./types";

const IMAGE_FILE_RE = /\.(png|jpe?g|webp|gif|svg)($|\?)/i;
const TRANSPARENT_BACKGROUND = "transparent";
const CSS_URL_PREFIX = "url(";
const MAX_DARKEN_PERCENT = 100;
const MAX_BACKGROUND_BLUR_PX = 20;

export const DARK_PRESET_BG = "#0a0a0a";
export const DARK_PRESET_FG = "#ffffff";
export const DARK_PRESET_MUTED = "#a3a3a3";

type BackgroundSettings = Pick<DeckSettings, "backgroundMode" | "backgroundColor" | "backgroundImage">;

export type ResolvedSlideBackground = {
  color?: string;
  image?: string;
  hasColorOverride?: boolean;
};

export function clampDarkenPercent(value: number | undefined): number {
  return Math.max(0, Math.min(MAX_DARKEN_PERCENT, value ?? 0));
}

export function clampBackgroundBlurPx(value: number | undefined): number {
  return Math.max(0, Math.min(MAX_BACKGROUND_BLUR_PX, value ?? 0));
}

export function resolveSlideBgVariable(background: ResolvedSlideBackground): string {
  if (background.hasColorOverride && background.color) return background.color;
  return TRANSPARENT_BACKGROUND;
}

export function resolveSlideBackground(slide: Slide, settings: BackgroundSettings): ResolvedSlideBackground {
  if (settings.backgroundMode === "dark") return colorOverride(DARK_PRESET_BG);
  if (settings.backgroundMode === "color" && settings.backgroundColor) return colorOverride(settings.backgroundColor);
  if (settings.backgroundMode === "image") return resolveImageMode(slide.background, settings);
  return resolveAuthoredBackground(slide.background);
}

export function resolveBackgroundLayerStyle(
  background: ResolvedSlideBackground,
  theme: Theme,
  blur: number,
): CSSProperties {
  const filter = blur > 0 ? `blur(${blur}px)` : undefined;
  if (background.image) return { ...imageStyle(background.image), filter };
  return { background: background.color ?? theme.bg, filter };
}

function colorOverride(color: string): ResolvedSlideBackground {
  return { color, hasColorOverride: true };
}

function resolveImageMode(background: string | undefined, settings: BackgroundSettings): ResolvedSlideBackground {
  if (settings.backgroundImage) return { image: settings.backgroundImage };
  const authored = resolveAuthoredBackground(background);
  if (authored.color || authored.image) return authored;
  if (settings.backgroundColor) return { color: settings.backgroundColor };
  return {};
}

function resolveAuthoredBackground(background: string | undefined): ResolvedSlideBackground {
  if (!background) return {};
  if (background.startsWith(CSS_URL_PREFIX)) return { image: trimCssUrl(background) };
  if (isImageLikeBackground(background)) return { image: background };
  return { color: background };
}

function trimCssUrl(value: string): string {
  return value.slice(CSS_URL_PREFIX.length, -1).replace(/^['"]|['"]$/g, "");
}

function isImageLikeBackground(value: string): boolean {
  return value.includes("://") || value.startsWith("/") || IMAGE_FILE_RE.test(value);
}

function imageStyle(image: string): CSSProperties {
  return { backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" };
}