import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "active" | "tray" | "denied" | "error";

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
  const requestIdRef = useRef(0);

  const attach = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      void el.play().catch(() => {});
    }
  }, []);

  const hide = useCallback(() => {
    if (streamRef.current && status === "active") setStatus("tray");
  }, [status]);

  const close = useCallback(() => {
    requestIdRef.current += 1;
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
    if (status === "tray" && streamRef.current) {
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        void videoRef.current.play().catch(() => {});
      }
      setStatus("active");
      setErrorMessage(null);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage("Camera API unavailable in this browser.");
      return;
    }
    setStatus("requesting");
    setErrorMessage(null);
    const requestId = ++requestIdRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      if (requestId !== requestIdRef.current) {
        for (const t of stream.getTracks()) t.stop();
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play().catch(() => {});
      }
      setStatus("active");
    } catch (err) {
      const name = (err as DOMException)?.name ?? "";
      console.warn("[slides:camera] getUserMedia failed", { name, error: err });
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setStatus("denied");
        setErrorMessage("Camera permission denied. Enable it in your browser site settings.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setStatus("denied");
        setErrorMessage("No camera found on this device.");
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setStatus("error");
        setErrorMessage("Camera is already in use by another application.");
      } else if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
        setStatus("error");
        setErrorMessage("No camera matched the requested resolution.");
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

  return { status, errorMessage, start, hide, close, attach, togglePiP } as const;
}
