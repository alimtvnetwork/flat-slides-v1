import { useAnnotations } from "@/components/slides/annotations-store";
import { useChrome } from "@/components/slides/chrome-store";
import {
  AUTOFRAME_KEY,
  CIRCLE_KEY,
  HALO_KEY,
  MIN_KEY,
  PLATE_KEY,
  POS_KEY,
  SIZE_KEY,
} from "@/components/slides/usePresenterWebcam";
import type { DeckRuntimeMeta } from "@/components/slides/types";

const WEBCAM_KEYS = [POS_KEY, MIN_KEY, SIZE_KEY, HALO_KEY, CIRCLE_KEY, AUTOFRAME_KEY, PLATE_KEY] as const;

function readWebcamRuntime(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return Object.fromEntries(WEBCAM_KEYS.flatMap((key) => {
    const value = window.localStorage.getItem(key);
    return value === null ? [] : [[key, value]];
  }));
}

export function snapshotDeckRuntimeMeta(): DeckRuntimeMeta {
  const chrome = useChrome.getState();
  const annotations = useAnnotations.getState();
  return {
    chrome: { camera: chrome.camera, scene: chrome.scene },
    annotations: pickAnnotationRuntime(annotations),
    webcam: readWebcamRuntime(),
  };
}

function pickAnnotationRuntime(annotations: ReturnType<typeof useAnnotations.getState>) {
  const { mode, color, width, persistStrokes, strokes } = annotations;
  return { mode, color, width, persistStrokes, strokes };
}

export function restoreDeckRuntimeMeta(runtime?: DeckRuntimeMeta): boolean {
  if (!runtime) return false;
  const restored = [restoreChrome(runtime), restoreAnnotations(runtime), restoreWebcam(runtime)].some(Boolean);
  if (restored) console.info("[slides:runtime-meta] restored deck runtime metadata");
  return restored;
}

function restoreChrome(runtime: DeckRuntimeMeta) {
  if (!runtime.chrome) return false;
  if (runtime.chrome.camera) useChrome.getState().setCamera(runtime.chrome.camera);
  if (runtime.chrome.scene) useChrome.getState().setScene(runtime.chrome.scene);
  return Boolean(runtime.chrome.camera || runtime.chrome.scene);
}

function restoreAnnotations(runtime: DeckRuntimeMeta) {
  if (!runtime.annotations) return false;
  useAnnotations.setState(runtime.annotations);
  return true;
}

function restoreWebcam(runtime: DeckRuntimeMeta) {
  if (typeof window === "undefined" || !runtime.webcam) return false;
  try {
    for (const [key, value] of Object.entries(runtime.webcam)) window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn("[slides:runtime-meta] webcam metadata restore failed", error);
    return false;
  }
}