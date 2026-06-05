import { useEffect, useState } from "react";

import { useChrome } from "./chrome-store";
import { formatDuration } from "./timer-store";

const TIMER_TICK_MS = 500;

export function useInspectorTimer() {
  const startedAt = useChrome((state) => state.inspectorTimerStartedAt);
  const pausedAt = useChrome((state) => state.inspectorTimerPausedAt);
  const pausedMs = useChrome((state) => state.inspectorTimerPausedMs);
  const ensureStarted = useChrome((state) => state.ensureInspectorTimerStarted);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => ensureStarted(Date.now()), [ensureStarted]);
  useEffect(() => startTimerTick(setNow), []);

  const elapsedMs = getInspectorElapsedMs({ startedAt, pausedAt, pausedMs, now });
  return { timerLabel: formatDuration(elapsedMs), isTimerPaused: pausedAt !== null };
}

function startTimerTick(setNow: (value: number) => void) {
  const timer = window.setInterval(() => setNow(Date.now()), TIMER_TICK_MS);
  return () => window.clearInterval(timer);
}

function getInspectorElapsedMs(input: {
  startedAt: number | null;
  pausedAt: number | null;
  pausedMs: number;
  now: number;
}) {
  if (input.startedAt === null) return 0;
  const end = input.pausedAt ?? input.now;
  return Math.max(0, end - input.startedAt - input.pausedMs);
}