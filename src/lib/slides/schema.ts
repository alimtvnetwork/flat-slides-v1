import { z } from "zod";

/**
 * Zod schemas mirroring `src/components/slides/types.ts`.
 * Used by the JSON import path to validate untrusted input
 * (file picker, paste, LLM-generated decks).
 *
 * Keep in lockstep with types.ts. Any new slide type MUST be added in
 * BOTH places.
 */

export const HighlightSchema = z.object({
  text: z.string().min(1),
  pill: z.boolean().optional(),
});

export const RichTextSchema = z.array(z.union([z.string(), HighlightSchema]));

export const TextPositionSchema = z.enum([
  "top-left", "top-center", "top-right",
  "center-left", "center", "center-right",
  "bottom-left", "bottom-center", "bottom-right",
]);

const BaseSlideShape = {
  id: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, "id must be url-safe"),
  title: z.string().min(1).max(200),
  notes: z.string().max(4000).optional(),
  background: z.string().max(2048).optional(),
  themeId: z.string().max(64).optional(),
  align: TextPositionSchema.optional(),
  padding: z.number().min(0).max(400).optional(),
};

export const LeftSlideSchema = z.object({
  ...BaseSlideShape,
  type: z.literal("left"),
  kicker: z.string().max(80).optional(),
  heading: RichTextSchema,
  body: RichTextSchema.optional(),
  media: z
    .object({ src: z.string().url().or(z.string().startsWith("data:")), alt: z.string().optional() })
    .optional(),
});

export const CenterSlideSchema = z.object({
  ...BaseSlideShape,
  type: z.literal("center"),
  heading: RichTextSchema,
  subhead: RichTextSchema.optional(),
  display: z.boolean().optional(),
});

export const StepsSlideSchema = z.object({
  ...BaseSlideShape,
  type: z.literal("steps"),
  heading: z.string().min(1).max(200),
  steps: z.array(RichTextSchema).min(1).max(8),
});

export const QuoteSlideSchema = z.object({
  ...BaseSlideShape,
  type: z.literal("quote"),
  quote: RichTextSchema,
  attribution: z.string().max(200).optional(),
});

export const BulletsSlideSchema = z.object({
  ...BaseSlideShape,
  type: z.literal("bullets"),
  heading: RichTextSchema,
  kicker: z.string().max(80).optional(),
  bullets: z.array(RichTextSchema).min(1).max(8),
});

export const ImageSlideSchema = z.object({
  ...BaseSlideShape,
  type: z.literal("image"),
  src: z.string().url().or(z.string().startsWith("data:")),
  alt: z.string().max(200).optional(),
  caption: RichTextSchema.optional(),
  fit: z.enum(["cover", "contain", "split"]).optional(),
  heading: RichTextSchema.optional(),
});

export const SlideSchema = z.discriminatedUnion("type", [
  LeftSlideSchema,
  CenterSlideSchema,
  StepsSlideSchema,
  QuoteSlideSchema,
  BulletsSlideSchema,
  ImageSlideSchema,
]);

export const DeckSettingsSchema = z.object({
  backgroundMode: z.enum(["color", "image"]),
  backgroundColor: z.string().min(1).max(64),
  backgroundImage: z.string().max(4096).optional(),
  darken: z.number().min(0).max(100),
  blur: z.number().min(0).max(20),
  transition: z.enum(["camera-zoom", "morph", "fade", "eaten"]),
  soundEnabled: z.boolean(),
  volume: z.number().min(0).max(1),
});

export const DeckSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  title: z.string().min(1).max(200),
  themeId: z.string().max(64).optional(),
  version: z.number().int().min(1).optional(),
  slides: z.array(SlideSchema).min(1).max(200),
  settings: DeckSettingsSchema,
});

export type ParsedDeck = z.infer<typeof DeckSchema>;
export type ParsedSlide = z.infer<typeof SlideSchema>;
