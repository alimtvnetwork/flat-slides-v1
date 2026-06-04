import { useEffect, useState } from "react";

import { useFullscreen } from "@/components/slides/useFullscreen";

/**
 * When the slide URL carries `?present=1` (set by the embedded-preview
 * fallback in `openPresenterWindow`), show a single full-bleed "Start
 * presentation" button. requestFullscreen() requires a user gesture, so we
 * cannot auto-trigger it on load — one click satisfies the gesture
 * requirement and we strip the param so refreshes don't reprompt.
 */
export function PresenterAutoStart() {
  const { enter, isFs } = useFullscreen();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setArmed(params.get("present") === "1");
  }, []);

  useEffect(() => {
    if (!isFs || !armed) return;
    // Once we're actually fullscreen, clean the URL.
    const url = new URL(window.location.href);
    url.searchParams.delete("present");
    window.history.replaceState({}, "", url.toString());
    setArmed(false);
  }, [isFs, armed]);

  if (!armed || isFs) return null;

  return (
    <div
      data-print-hide="true"
      role="dialog"
      aria-label="Start presentation"
      style={{ position: "fixed", inset: 0, zIndex: 9999 }}
      className="flex items-center justify-center bg-background/90 backdrop-blur"
    >
      <button
        type="button"
        autoFocus
        onClick={() => {
          void enter();
        }}
        className="rounded-full bg-primary px-8 py-4 text-lg font-medium text-primary-foreground shadow-2xl transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/40"
      >
        Start presentation
      </button>
    </div>
  );
}
