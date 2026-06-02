import { useAnnotations, type InkStroke } from "../annotations-store";
import { useChrome } from "../chrome-store";
import { useDeck } from "../store";

/**
 * Export all per-slide ink strokes as a JSON file. Coordinates are already
 * in 1920×1080 slide space (see AnnotationLayer's viewBox), so the dump is
 * resolution-independent and safe to replay on any future canvas.
 *
 * SVG export is intentionally omitted for now — JSON round-trips the data
 * losslessly and is what a future "import annotations" path would consume.
 */
export function downloadAnnotations() {
  const { strokes } = useAnnotations.getState();
  const deck = useDeck.getState().deck;
  const payload = {
    deckId: deck.id,
    deckTitle: deck.title,
    exportedAt: new Date().toISOString(),
    canvas: { width: 1920, height: 1080 },
    annotations: Object.entries(strokes).map(([slideId, list]) => ({
      slideId,
      strokes: (list as InkStroke[]).map((s) => ({
        color: s.color,
        width: s.width,
        points: s.points,
      })),
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `annotations-${deck.id}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  useChrome.getState().flashToast("Annotations exported");
}
