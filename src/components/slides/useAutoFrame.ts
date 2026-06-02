import { useEffect, useRef, useState } from "react";

/**
 * Auto-frame the camera feed by tracking the largest detected face and
 * centering it via a CSS `object-position` offset. Uses the experimental
 * `window.FaceDetector` (Chromium / Edge); on browsers without it the hook
 * is a graceful no-op and `supported` returns `false`.
 *
 * Apply the returned `objectPosition` to your <video> element:
 *   <video style={{ objectPosition: autoFrame.objectPosition }} />
 *
 * The hook samples ~4 fps; that's enough for slow head movements and
 * keeps CPU work negligible.
 */
export interface AutoFrameResult {
  /** True when FaceDetector is available AND `enabled` is true. */
  active: boolean;
  /** Whether the browser exposes FaceDetector. */
  supported: boolean;
  /** CSS `object-position` value: "50% 50%" when idle, biased toward face when tracking. */
  objectPosition: string;
}

interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FaceDetection {
  boundingBox: FaceBox;
}

// FaceDetector is non-standard; declare a minimal shape we can call.
declare global {
  interface Window {
    FaceDetector?: new (opts?: { fastMode?: boolean }) => {
      detect: (source: HTMLVideoElement) => Promise<FaceDetection[]>;
    };
  }
}

export function useAutoFrame(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
): AutoFrameResult {
  const [objectPosition, setObjectPosition] = useState("50% 50%");
  const [supported, setSupported] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported(typeof window.FaceDetector === "function");
  }, []);

  useEffect(() => {
    if (!enabled || !supported) return;
    const Ctor = window.FaceDetector;
    if (!Ctor) return;
    const detector = new Ctor({ fastMode: true });
    let cancelled = false;

    async function tick(ts: number) {
      if (cancelled) return;
      // Throttle to ~4 fps — face tracking doesn't need 60.
      if (ts - lastRef.current > 250) {
        lastRef.current = ts;
        const v = videoRef.current;
        if (v && v.readyState >= 2 && v.videoWidth > 0) {
          try {
            const faces = await detector.detect(v);
            if (!cancelled && faces.length > 0) {
              // Pick the largest face (closest to camera).
              const f = faces.reduce((a, b) =>
                a.boundingBox.width * a.boundingBox.height >
                b.boundingBox.width * b.boundingBox.height
                  ? a
                  : b,
              );
              const cx = (f.boundingBox.x + f.boundingBox.width / 2) / v.videoWidth;
              const cy = (f.boundingBox.y + f.boundingBox.height / 2) / v.videoHeight;
              // Invert and clamp so the face moves toward center: object-position
              // shifts the SOURCE inside the box, so push opposite of face center.
              const px = Math.round((1 - cx) * 100);
              const py = Math.round((1 - cy) * 100);
              setObjectPosition(`${clamp(px, 20, 80)}% ${clamp(py, 20, 80)}%`);
            }
          } catch {
            // Detection can throw on tab background / video stalls — ignore.
          }
        }
      }
      rafRef.current = window.requestAnimationFrame(tick);
    }
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, supported, videoRef]);

  return { active: enabled && supported, supported, objectPosition };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
