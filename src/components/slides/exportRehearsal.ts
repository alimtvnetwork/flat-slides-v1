import { useChrome } from "../chrome-store";
import { useTimer } from "../timer-store";

/**
 * Download trigger for a rehearsal-mode session: dumps total + per-slide
 * dwell times as JSON so a presenter can compare runs over time.
 *
 * Kept as a pure command (not a permanent overlay) — the presenter triggers
 * it from the command palette or the rehearsal toast. No UI of its own.
 */
export function downloadRehearsalReport(deckTitle?: string) {
  const data = useTimer.getState().exportRehearsal();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date(data.recordedAt).toISOString().replace(/[:.]/g, "-");
  const slug = (deckTitle ?? "deck").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "deck";
  a.href = url;
  a.download = `rehearsal-${slug}-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  useChrome.getState().flashToast("Rehearsal report downloaded");
}
