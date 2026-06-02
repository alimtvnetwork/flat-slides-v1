import type { ComponentType } from "react";

import type { Slide } from "./types";

/**
 * Plugin registry for custom slide types (step 333).
 *
 * Built-in types (left/center/steps/quote/bullets/image/poll/qa/embed) are
 * dispatched directly inside RenderSlide. Third-party / app-specific types
 * register here and RenderSlide falls through to the registry for any
 * unknown `slide.type`.
 *
 * Security model:
 *  - Registered components receive a typed `slide` prop only — no global
 *    deck mutation surface is exposed.
 *  - JSON-imported decks are Zod-validated. Unknown `type` values are
 *    rejected at import time, so a registered type ALSO needs its Zod
 *    schema added to `src/lib/slides/schema.ts` to be importable.
 *  - Registration is module-scoped; no runtime `eval` or string→component.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SlideComponent<S extends Slide = any> = ComponentType<{ slide: S; step: number }>;

const registry = new Map<string, SlideComponent>();

export function registerSlideType<S extends Slide>(type: string, component: SlideComponent<S>) {
  registry.set(type, component as SlideComponent);
}

export function getRegisteredSlideType(type: string): SlideComponent | undefined {
  return registry.get(type);
}

export function listRegisteredSlideTypes(): string[] {
  return Array.from(registry.keys());
}
