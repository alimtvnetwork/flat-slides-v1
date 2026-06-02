import type { ReactNode } from "react";

export type SlideType = "left" | "center" | "steps" | "quote";

export type Highlight = { text: string; pill?: boolean };
/** Inline text can be a string or a Highlight chip. */
export type RichText = (string | Highlight)[];

export interface BaseSlide {
  id: string;
  type: SlideType;
  title: string;
  notes?: string;
  background?: string; // overrides deck default
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
  display?: boolean; // use serif display font
}

export interface StepsSlideProps extends BaseSlide {
  type: "steps";
  heading: string;
  steps: RichText[]; // up to 5
}

export interface QuoteSlideProps extends BaseSlide {
  type: "quote";
  quote: RichText;
  attribution?: string;
}

export type Slide = LeftSlideProps | CenterSlideProps | StepsSlideProps | QuoteSlideProps;

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

export interface Deck {
  id: string;
  title: string;
  slides: Slide[];
  settings: DeckSettings;
}
