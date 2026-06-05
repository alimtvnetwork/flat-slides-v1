export const INSPECTOR_STARTED_AT_STORAGE_KEY = "riseup.inspector.startedAt";

export function readPersistedInspectorStartedAt(): number | null {
  if (typeof window === "undefined") return null;
  try {
    return parseTimestamp(window.localStorage.getItem(INSPECTOR_STARTED_AT_STORAGE_KEY));
  } catch (error) {
    console.error("Failed to read inspector timer start", error);
    return null;
  }
}

export function persistInspectorStartedAt(value: number | null): void {
  if (typeof window === "undefined") return;
  try {
    writeInspectorStartedAt(value);
  } catch (error) {
    console.error("Failed to persist inspector timer start", error);
  }
}

function parseTimestamp(value: string | null): number | null {
  if (!value) return null;
  const timestamp = Number.parseInt(value, 10);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function writeInspectorStartedAt(value: number | null): void {
  if (value === null) window.localStorage.removeItem(INSPECTOR_STARTED_AT_STORAGE_KEY);
  else window.localStorage.setItem(INSPECTOR_STARTED_AT_STORAGE_KEY, String(value));
}
