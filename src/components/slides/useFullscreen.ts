import { useEffect, useState } from "react";

function blurActiveElement() {
  if (typeof document === "undefined") return;
  const blur = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body && active !== document.documentElement) {
      active.blur();
    }
  };
  blur();
  requestAnimationFrame(blur);
}

/** Tracks whether the document is currently in Fullscreen mode and provides toggles. */
export function useFullscreen() {
  const [isFs, setIsFs] = useState(() => (typeof document === "undefined" ? false : Boolean(document.fullscreenElement)));

  useEffect(() => {
    const onChange = () => {
      setIsFs(Boolean(document.fullscreenElement));
      blurActiveElement();
    };
    onChange();
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enter = async (target?: HTMLElement | null) => {
    try {
      await (target ?? document.documentElement).requestFullscreen();
      blurActiveElement();
    } catch { /* ignore */ }
  };
  const exit = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      blurActiveElement();
    } catch { /* ignore */ }
  };
  const toggle = (target?: HTMLElement | null) => (isFs ? exit() : enter(target));

  return { isFs, enter, exit, toggle };
}
