import { useEffect, useState } from "react";

import { SLIDES_EVENT_BUFFER_CAP, onSlidesEvent, type BufferedEvent } from "./telemetry";

const VISIBLE_EVENT_COUNT = 20;

function readEvents(): BufferedEvent[] {
  if (typeof window === "undefined") return [];
  return [...(window.__slidesEvents ?? [])].slice(-VISIBLE_EVENT_COUNT).reverse();
}

function eventSummary(event: BufferedEvent) {
  const { at: _at, type: _type, ...rest } = event;
  return JSON.stringify(rest);
}

function eventTime(event: BufferedEvent) {
  return new Date(event.at).toLocaleTimeString();
}

export function DevSlidesEventsPanel() {
  const [events, setEvents] = useState<BufferedEvent[]>(readEvents);
  const clearEvents = () => {
    window.__slidesEvents = [];
    setEvents([]);
  };

  useEffect(() => onSlidesEvent(() => setEvents(readEvents())), []);

  return (
    <details className="rounded bg-neutral-900 p-3 text-xs text-neutral-300">
      <summary className="cursor-pointer select-none text-neutral-200">slides:event buffer</summary>
      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-neutral-500">
        <span>{events.length} shown · cap {SLIDES_EVENT_BUFFER_CAP}</span>
        <button type="button" onClick={clearEvents} className="rounded bg-neutral-800 px-2 py-1 text-neutral-300 hover:bg-neutral-700">
          Clear
        </button>
      </div>
      <div className="mt-3 max-h-64 overflow-auto font-mono text-[11px] leading-relaxed">
        {events.length === 0 ? <p className="text-neutral-500">No events yet.</p> : null}
        {events.map((event) => (
          <div key={`${event.at}-${event.type}-${eventSummary(event)}`} className="grid grid-cols-[4.75rem_8rem_1fr] gap-2 border-t border-neutral-800 py-1">
            <span className="text-neutral-500">{eventTime(event)}</span>
            <span className="text-neutral-200">{event.type}</span>
            <span className="truncate text-neutral-400" title={eventSummary(event)}>{eventSummary(event)}</span>
          </div>
        ))}
      </div>
    </details>
  );
}