import type { ReactNode } from "react";

export type SlideType =
  | "left" | "center" | "steps" | "timeline" | "quote" | "bullets" | "image"
  | "poll" | "qa" | "embed";

export type Highlight = { text: string; pill?: boolean };
/** Inline text can be a string or a Highlight chip. */
export type RichText = (string | Highlight)[];

/** 9-cell positioning grid for the slide body block. */
export type TextPosition =
  | "top-left"   | "top-center"    | "top-right"
  | "center-left"| "center"        | "center-right"
  | "bottom-left"| "bottom-center" | "bottom-right";

/**
 * A focus region targets a rectangle inside the 1920×1080 slide canvas.
 * The camera "zooms" so this rect fills the viewport (preserving aspect).
 */
export interface FocusRegion {
  /** Top-left x in 1920-px slide space. */
  x: number;
  /** Top-left y in 1080-px slide space. */
  y: number;
  /** Width in 1920-px slide space (must be > 0). */
  w: number;
  /** Height in 1080-px slide space (must be > 0). */
  h: number;
  /** Optional 1-based step the region binds to. Omit ⇒ all steps. */
  step?: number;
  /** Animation duration ms (default 700). */
  duration?: number;
  /** Optional label used in the editor/inspector. */
  label?: string;
}

export interface BaseSlide {
  id: string;
  type: SlideType;
  title: string;
  notes?: string;
  /** Per-slide background override (CSS color OR image URL). */
  background?: string;
  /** Per-slide theme override (theme.id). */
  themeId?: string;
  /** Text block alignment within the slide. Defaults vary by type. */
  align?: TextPosition;
  /** Optional padding in 1920x1080 pixels — default 120. */
  padding?: number;
  /** When false, the slide is skipped from linear navigation, jump, dot pagination, and the badge total. Defaults to true. */
  enabled?: boolean;
  /**
   * Optional authored display number shown in the badge & grid (e.g. "07").
   * When omitted, the linear position is used. Authored numbers do not affect
   * URLs (those remain 1-based linear positions).
   */
  number?: number;
  /**
   * Optional per-slide focus regions (Ken-Burns / "camera-zoom" into a rect).
   * Coordinates are in the 1920×1080 slide space. When `step` is set the
   * region activates on that 1-based step; otherwise it activates on every
   * step. The first matching region wins. Empty/undefined ⇒ full frame.
   */
  focus?: FocusRegion[];
}

export interface LeftSlideProps extends BaseSlide {
  type: "left";
  kicker?: string;
  heading: RichText;
  body?: RichText;
  media?: ReactNode | { src: string; alt?: string };
}

export interface CenterSlideProps extends BaseSlide {
  type: "center";
  heading: RichText;
  subhead?: RichText;
  display?: boolean;
}

export interface StepItem {
  /** Short name shown in the persistent step list (e.g. "Step 1", "Discover"). */
  label: string;
  /** Focus heading shown when this step is active. */
  title?: string;
  /** Detail text that changes with a fade when the active step changes. */
  detail: RichText;
}

export interface StepsSlideProps extends BaseSlide {
  type: "steps";
  heading: string;
  steps: StepItem[];
}

export interface TimelineItem {
  /** Short tag rendered under the pinpoint (e.g. "Q1", "Step 1"). */
  label: string;
  /** Bold heading shown in the centre when this item is focused. */
  title?: string;
  /** Detail paragraph shown centred when this item is focused. */
  detail?: RichText;
}

export interface TimelineSlideProps extends BaseSlide {
  type: "timeline";
  heading?: string;
  items: TimelineItem[];
}

export interface QuoteSlideProps extends BaseSlide {
  type: "quote";
  quote: RichText;
  attribution?: string;
}

export interface BulletsSlideProps extends BaseSlide {
  type: "bullets";
  heading: RichText;
  kicker?: string;
  bullets: RichText[];
}

export interface ImageSlideProps extends BaseSlide {
  type: "image";
  src: string;
  alt?: string;
  caption?: RichText;
  /** "cover" fills slide, "contain" letterboxes, "split" puts text beside. */
  fit?: "cover" | "contain" | "split";
  heading?: RichText;
}

export interface PollSlideProps extends BaseSlide {
  type: "poll";
  question: string;
  options: string[];
}

export interface QaSlideProps extends BaseSlide {
  type: "qa";
  prompt?: string;
}

export interface EmbedSlideProps extends BaseSlide {
  type: "embed";
  url: string;
  heading?: string;
  caption?: string;
  /** iframe `allow` attribute (defaults to "fullscreen"). */
  allow?: string;
}

export type Slide =
  | LeftSlideProps
  | CenterSlideProps
  | StepsSlideProps
  | TimelineSlideProps
  | QuoteSlideProps
  | BulletsSlideProps
  | ImageSlideProps
  | PollSlideProps
  | QaSlideProps
  | EmbedSlideProps;

/** Number of advance-able sub-steps for keyboard / URL step navigation. */
export function slideStepCount(slide: Slide): number {
  if (slide.type === "steps") return slide.steps.length;
  if (slide.type === "timeline") return slide.items.length;
  return 0;
}

/**
 * Display number for the badge / grid.
 *
 * Returns the authored `slide.number` when set, otherwise the 1-based linear
 * position. URLs always use linear positions — this helper only affects what
 * humans see (badge text, grid chips, recent-jumps).
 */
export function getDisplayNumber(slide: Slide, linearPosition: number): number {
  return typeof slide.number === "number" ? slide.number : linearPosition;
}

export type TransitionKind = "camera-zoom" | "morph" | "fade" | "eaten";

export interface DeckSettings {
  backgroundMode: "color" | "image";
  backgroundColor: string;
  backgroundImage?: string;
  darken: number; // 0-100
  blur: number;   // 0-20
  transition: TransitionKind;
  soundEnabled: boolean;
  volume: number; // 0-1
}

export interface DeckMusic {
  url: string;
  loop?: boolean;
  volume?: number; // initial 0..1
}

export interface Deck {
  id: string;
  title: string;
  /** Active theme id (see themes.ts). Per-slide themeId overrides this. */
  themeId?: string;
  slides: Slide[];
  settings: DeckSettings;
  /** Optional deck-level background music. Playback is presenter-local. */
  music?: DeckMusic;
  /** Schema version for migration. */
  version?: number;
}
