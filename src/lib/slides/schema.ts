import { z } from "zod";

import { DEFAULT_MUSIC_VOLUME, MAX_MUSIC_VOLUME, MIN_MUSIC_VOLUME } from "./musicVolume";

/** Issue 011: cap any single image src (URL or base64 data: URL) at 4 MB. */
export const MAX_IMAGE_SRC_BYTES = 4_000_000;
export const ImageSrcSchema = z
  .string()
  .max(MAX_IMAGE_SRC_BYTES, `image src exceeds ${MAX_IMAGE_SRC_BYTES} bytes (use a hosted URL for large images)`)
  .refine(
    (s) => /^https?:\/\//i.test(s) || s.startsWith("data:"),
    "image src must be an http(s):// URL or a data: URL",
  );


/**
 * Zod schemas mirroring `src/components/slides/types.ts`.
 * Used by the JSON import path to validate untrusted input
 * (file picker, paste, LLM-generated decks).
 *
 * Keep in lockstep with types.ts. Any new slide type MUST be added in
 * BOTH places.
 */

export const HighlightSchema = z.object({
  text: z.string().refine((value) => value.trim().length > 0, "highlight text must not be blank"),
  pill: z.boolean().optional(),
});

export const RichTextSchema = z
  .array(z.union([
    z.string().refine((value) => value.trim().length > 0, "text segment must not be blank"),
    HighlightSchema,
  ]))
  .min(1)
  .refine(
    (segments) => segments.some((segment) => (
      typeof segment === "string" ? segment.trim().length > 0 : segment.text.trim().length > 0
    )),
    "rich text must contain visible content",
  );

export const TextPositionSchema = z.enum([
  "top-left", "top-center", "top-right",
  "center-left", "center", "center-right",
  "bottom-left", "bottom-center", "bottom-right",
]);

export const SlideSoundSchema = z.object({
  url: z.string().min(1).max(4096).optional(),
  volume: z.number().min(0).max(1).optional(),
  music: z
    .object({
      url: z.string().min(1).max(4096),
      loop: z.boolean().optional(),
      volume: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

const BaseSlideShape = {
  id: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, "id must be url-safe"),
  title: z.string().min(1).max(200),
  notes: z.string().max(4000).optional(),
  background: z.string().max(2048).optional(),
  themeId: z.string().max(64).optional(),
  align: TextPositionSchema.optional(),
  padding: z.number().min(0).max(400).optional(),
  enabled: z.boolean().optional(),
  /** Optional authored display number; defaults to linear position when omitted. */
  number: z.number().int().min(0).max(9999).optional(),
  budget: z.number().min(1).max(3600).optional(),
  decor: z.enum(["code", "none"]).optional(),
  sound: SlideSoundSchema.optional(),
  focus: z
    .array(z.object({
      x: z.number().min(-1920).max(1920),
      y: z.number().min(-1080).max(1080),
      w: z.number().min(1).max(3840),
      h: z.number().min(1).max(2160),
      step: z.number().int().min(1).max(32).optional(),
      duration: z.number().int().min(0).max(5000).optional(),
      label: z.string().max(80).optional(),
    }))
    .max(16)
    .optional(),
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
  steps: z.array(z.union([
    RichTextSchema,
    z.object({
      label: z.string().min(1).max(80),
      title: z.string().max(120).optional(),
      detail: RichTextSchema,
    }),
  ])).min(1).max(8).transform((steps) => steps.map((step, index) => (
    Array.isArray(step) ? { label: `Step ${index + 1}`, detail: step } : step
  ))),
});

export const TimelineItemSchema = z.object({
  label: z.string().min(1).max(80),
  title: z.string().max(120).optional(),
  detail: RichTextSchema.optional(),
});

export const TimelineSlideSchema = z.object({
  ...BaseSlideShape,
  type: z.literal("timeline"),
  heading: z.string().max(200).optional(),
  items: z.array(TimelineItemSchema).min(2).max(8),
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

export const PollSlideSchema = z.object({
  ...BaseSlideShape,
  type: z.literal("poll"),
  question: z.string().min(1).max(280),
  options: z.array(z.string().min(1).max(120)).min(2).max(8),
});

export const QaSlideSchema = z.object({
  ...BaseSlideShape,
  type: z.literal("qa"),
  prompt: z.string().max(200).optional(),
});

export const EmbedSlideSchema = z.object({
  ...BaseSlideShape,
  type: z.literal("embed"),
  url: z.string().url().startsWith("https://", "embed URL must be https"),
  heading: z.string().max(200).optional(),
  caption: z.string().max(400).optional(),
  allow: z.string().max(200).optional(),
});

export const SlideSchema = z.discriminatedUnion("type", [
  LeftSlideSchema,
  CenterSlideSchema,
  StepsSlideSchema,
  TimelineSlideSchema,
  QuoteSlideSchema,
  BulletsSlideSchema,
  ImageSlideSchema,
  PollSlideSchema,
  QaSlideSchema,
  EmbedSlideSchema,
]);

export const DeckSettingsSchema = z.object({
  backgroundMode: z.enum(["color", "image", "dark"]),
  backgroundColor: z.string().min(1).max(64),
  backgroundImage: z.string().max(4096).optional(),
  textColor: z.string().min(1).max(64).optional(),
  darken: z.number().min(0).max(100),
  blur: z.number().min(0).max(20),
  transition: z.enum(["fade", "camera-zoom"]),
  soundEnabled: z.boolean(),
  volume: z.number().min(0).max(1),
  musicVolume: z.number().min(MIN_MUSIC_VOLUME).max(MAX_MUSIC_VOLUME).default(DEFAULT_MUSIC_VOLUME),
});

export const DeckMusicSchema = z.object({
  url: z.string().min(1).max(4096),
  loop: z.boolean().optional(),
  volume: z.number().min(0).max(1).optional(),
});

export const DeckSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  title: z.string().min(1).max(200),
  themeId: z.string().max(64).optional(),
  version: z.number().int().min(1).optional(),
  slides: z.array(SlideSchema).min(1).max(200),
  settings: DeckSettingsSchema,
  music: DeckMusicSchema.optional(),
});

export type ParsedDeck = z.infer<typeof DeckSchema>;
export type ParsedSlide = z.infer<typeof SlideSchema>;
