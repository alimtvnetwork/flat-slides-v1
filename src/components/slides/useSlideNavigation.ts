import { useNavigate, useLocation } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

import { triggerClick, triggerZoom } from "./audio";
import { useDeck } from "./store";
import { slideStepCount, type Slide } from "./types";

export type NavDirection = "forward" | "backward";

/**
 * Source of truth for slide navigation.
 *
 * - `linearSlides` is the deck filtered by `enabled !== false`.
 * - URL contract: `/slides/$slideId(/$step)` where `$slideId` is the 1-based
 *   position in `linearSlides`. (See `mem://index.md` — 1-based.)
 * - All navigate() calls preserve the current query string.
 * - jump()/goTo() play exactly one `click` cue.
 */
export function useSlideNavigation() {
  const slides = useDeck((s) => s.deck.slides);
  const navigate = useNavigate();
  const location = useLocation();

  const linearSlides = useMemo<Slide[]>(
    () => slides.filter((s) => s.enabled !== false),
    [slides],
  );
  const total = linearSlides.length;

  const search = (location.search ?? "") as string;

  const goTo = useCallback(
    (linearPosition: number, _dir: NavDirection = "forward", step?: number) => {
      if (total === 0) return;
      const clamped = Math.max(1, Math.min(total, linearPosition));
      const slide = linearSlides[clamped - 1];
      if (!slide) return;
      if (step && step > 1) triggerZoom(); else triggerClick();
      if (step && step > 1 && slideStepCount(slide) >= step) {
        navigate({
          to: "/slides/$slideId/$step",
          params: { slideId: String(clamped), step: String(step) },
          search: search as never,
        });
      } else {
        navigate({
          to: "/slides/$slideId",
          params: { slideId: String(clamped) },
          search: search as never,
        });
      }
    },
    [linearSlides, total, navigate, search],
  );

  const next = useCallback(
    (current: number) => {
      if (current < total) goTo(current + 1, "forward");
    },
    [goTo, total],
  );

  const prev = useCallback(
    (current: number) => {
      if (current > 1) goTo(current - 1, "backward");
    },
    [goTo, total],
  );

  const jump = useCallback(
    (linearPosition: number) => {
      goTo(linearPosition);
    },
    [goTo],
  );

  return { linearSlides, total, goTo, next, prev, jump };
}
