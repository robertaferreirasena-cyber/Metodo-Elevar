import type { AspectRatio } from "./CarouselTemplates";

/**
 * Returns scaling/safe-area helpers for Journaling layouts.
 * - 9:16 (Stories): inflate padding, reserve top/bottom safe zones, auto-shrink long text.
 * - 1:1 / 16:9: identity.
 */
export function getJournalScale(
  aspectRatio: AspectRatio,
  titleLen: number,
  bodyLen: number,
) {
  const isStories = aspectRatio === "9:16";

  // Padding multiplier (more breathing room on Stories)
  const padMul = isStories ? 1.4 : 1;

  // Safe-area as a fraction of HEIGHT reserved at top + bottom (Instagram UI overlap)
  const safeAreaFrac = isStories ? 0.08 : 0.02;

  // Auto-shrink very long copy so it doesn't overflow Stories crop.
  const titleMul =
    isStories && titleLen > 90 ? 0.78 :
    isStories && titleLen > 60 ? 0.88 :
    titleLen > 160 ? 0.78 :
    titleLen > 110 ? 0.86 :
    titleLen > 70 ? 0.94 : 1;

  const bodyMul =
    isStories && bodyLen > 220 ? 0.78 :
    isStories && bodyLen > 140 ? 0.88 :
    bodyLen > 320 ? 0.78 :
    bodyLen > 220 ? 0.85 :
    bodyLen > 140 ? 0.92 : 1;

  return { padMul, safeAreaFrac, titleMul, bodyMul, isStories };
}
