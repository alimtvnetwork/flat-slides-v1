import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "active" | "denied" | "error";

/**
 * Webcam capture state machine. Presenter-local — the stream is never
 * exported or serialized into the deck JSON. Call `start()` from a user
 * gesture (button click) so browsers honour the getUserMedia permission.
 */
export function useCamera() {
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const attach = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      void el.play().catch(() => {});
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  const start = useCallback(async () => {
    if (status === "requesting" || status === "active") return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage("Camera API unavailable in this browser.");
      return;
    }
    setStatus("requesting");
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play().catch(() => {});
      }
      setStatus("active");
    } catch (err) {
      const name = (err as DOMException)?.name ?? "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setStatus("denied");
        setErrorMessage("Camera permission denied.");
      } else {
        setStatus("error");
        setErrorMessage((err as Error)?.message ?? "Unable to start camera.");
      }
    }
  }, [status]);

  useEffect(() => () => {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
  }, []);

  const togglePiP = useCallback(async () => {
    const el = videoRef.current;
    if (!el || status !== "active") return;
    try {
      const anyDoc = document as Document & { pictureInPictureElement?: Element | null; exitPictureInPicture?: () => Promise<void> };
      const anyVid = el as HTMLVideoElement & { requestPictureInPicture?: () => Promise<unknown> };
      if (anyDoc.pictureInPictureElement) {
        await anyDoc.exitPictureInPicture?.();
      } else if (anyVid.requestPictureInPicture) {
        await anyVid.requestPictureInPicture();
      }
    } catch {
      /* user-gesture / unsupported — silent */
    }
  }, [status]);

  return { status, errorMessage, start, stop, attach, togglePiP } as const;
}
