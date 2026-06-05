import { toast } from "sonner";

import { setDeckMusicPlaying } from "./deckMusicPlayer";

const TOAST_ID = "deck-music-autoplay";
const TOAST_MESSAGE = "Tap to enable music";
const TOAST_DURATION_MS = 10_000;
const GESTURE_EVENT = "pointerdown";

export function armAutoplayRetry(): () => void {
  toast.message(TOAST_MESSAGE, { id: TOAST_ID, duration: TOAST_DURATION_MS });
  const handler = createRetryHandler();
  window.addEventListener(GESTURE_EVENT, handler, { once: true });
  return () => disposeRetry(handler);
}

function createRetryHandler(): () => void {
  return () => {
    toast.dismiss(TOAST_ID);
    void setDeckMusicPlaying(true).catch((error) =>
      console.warn("Deck music retry failed", error),
    );
  };
}

function disposeRetry(handler: () => void): void {
  window.removeEventListener(GESTURE_EVENT, handler);
  toast.dismiss(TOAST_ID);
}
