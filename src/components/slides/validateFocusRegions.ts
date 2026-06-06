import { slideStepCount, type FocusRegion, type Slide } from "./types";

/**
 * Issue 024: validate that every authored focus region binds to a real step
 * (or is unbound on a non-step slide). Returns a list of human-readable
 * errors; an empty array means the slide's focus regions are coherent.
 */
export function validateFocusRegions(slide: Slide): string[] {
  const regions: FocusRegion[] | undefined = slide.focus;
  if (!regions || regions.length === 0) return [];
  const errors: string[] = [];
  const stepCount = slideStepCount(slide);
  regions.forEach((region, i) => {
    const where = `slide "${slide.id}" focus[${i}]`;
    if (region.w <= 0 || region.h <= 0) {
      errors.push(`${where}: width and height must be > 0 (got w=${region.w}, h=${region.h})`);
    }
    if (region.step === undefined) {
      if (stepCount > 0) errors.push(`${where}: unbound region not allowed on a step-aware slide (set "step": 1..${stepCount})`);
      return;
    }
    if (!Number.isInteger(region.step) || region.step <= 0) {
      errors.push(`${where}: step must be a positive integer (got ${region.step})`);
      return;
    }
    if (stepCount > 0 && region.step > stepCount) {
      errors.push(`${where}: step ${region.step} exceeds slide step count (${stepCount})`);
    }
  });
  return errors;
}
