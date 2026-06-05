import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { useAudience } from "../audience-store";

/**
 * Full-screen "Join the audience" overlay. Rendered on top of the slide
 * stage so presenters can flash it open for a few seconds at the start of
 * a session or whenever they want everyone to scan in.
 *
 * The QR encodes the absolute audience URL — we generate it client-side
 * because `window.location.origin` is only known at runtime (and the
 * deployed origin differs from local dev).
 */
export function QrOverlay() {
  const visible = useAudience((s) => s.qrVisible);
  const setQr = useAudience((s) => s.setQr);
  const sessionId = useAudience((s) => s.sessionId);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState<string>("");

  useEffect(() => {
    if (!visible || typeof window === "undefined") return;
    const url = `${window.location.origin}/audience/${sessionId}`;
    setShortUrl(url.replace(/^https?:\/\//, ""));
    let cancelled = false;
    QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 1, width: 720, color: { dark: "#0a0a0a", light: "#ffffff" } })
      .then((d) => { if (!cancelled) setDataUrl(d); })
      .catch(() => { if (!cancelled) setDataUrl(null); });
    return () => { cancelled = true; };
  }, [visible, sessionId]);

  if (!visible) return null;

  return (
    <div
      data-print-hide
      data-presenter-frame-bound="true"
      className="fixed z-[80] flex items-center justify-center bg-black/85 backdrop-blur-md"
      onClick={() => setQr(false)}
      role="dialog"
      aria-label="Join the audience — scan to participate"
    >
      <div className="flex flex-col items-center gap-6 px-10 py-12 text-center text-white" onClick={(e) => e.stopPropagation()}>
        <div className="text-sm uppercase tracking-[0.3em] text-white/60">Scan to join</div>
        <div className="rounded-2xl bg-white p-4 shadow-2xl">
          {dataUrl ? (
            <img src={dataUrl} alt="QR code to join the audience session" width={420} height={420} />
          ) : (
            <div className="h-[420px] w-[420px] animate-pulse rounded-lg bg-neutral-100" />
          )}
        </div>
        <div className="font-mono text-3xl tracking-[0.4em] text-white">{sessionId}</div>
        <div className="max-w-[520px] break-all text-sm text-white/70">{shortUrl}</div>
        <button
          type="button"
          className="mt-2 rounded-full border border-white/30 px-5 py-2 text-sm text-white/80 transition hover:bg-white/10"
          onClick={() => setQr(false)}
        >
          Close (Q)
        </button>
      </div>
    </div>
  );
}
