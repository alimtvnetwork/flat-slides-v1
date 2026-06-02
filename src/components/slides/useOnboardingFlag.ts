import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "slides.onboarding.v1.seen";

/**
 * First-run flag for the onboarding coachmark. Persisted to localStorage so
 * we only show it once per browser. Presenter-local — never exported.
 */
export function useOnboardingFlag() {
  const [seen, setSeen] = useState<boolean>(true); // assume seen during SSR

  useEffect(() => {
    try {
      setSeen(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setSeen(true);
    }
  }, []);

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore (private mode, quota, etc.)
    }
    setSeen(true);
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setSeen(false);
  }, []);

  return { seen, markSeen, reset };
}
