import { useEffect, useState } from "react";

/** Tracks whether the document is currently in Fullscreen mode and provides toggles. */
export function useFullscreen() {
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enter = async (target?: HTMLElement | null) => {
    try { await (target ?? document.documentElement).requestFullscreen(); } catch { /* ignore */ }
  };
  const exit = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* ignore */ }
  };
  const toggle = (target?: HTMLElement | null) => (isFs ? exit() : enter(target));

  return { isFs, enter, exit, toggle };
}
