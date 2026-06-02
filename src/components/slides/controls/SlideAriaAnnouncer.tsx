import { useEffect, useState } from "react";

/**
 * Polite ARIA live region that announces the current slide / step to screen
 * readers when navigation changes. Visually hidden.
 */
export function SlideAriaAnnouncer({
  current,
  total,
  step,
  stepCount,
  title,
}: {
  current: number;
  total: number;
  step?: number;
  stepCount?: number;
  title?: string;
}) {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const stepPart =
      step && stepCount && stepCount > 1 ? `, step ${step} of ${stepCount}` : "";
    setMsg(
      `Slide ${current} of ${total}${stepPart}${title ? `: ${title}` : ""}`,
    );
  }, [current, total, step, stepCount, title]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      data-print-hide="true"
    >
      {msg}
    </div>
  );
}
