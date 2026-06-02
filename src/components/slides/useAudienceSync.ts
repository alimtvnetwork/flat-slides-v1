import { useEffect } from "react";

import { audienceChannelName, useAudience, type AudienceMessage } from "./audience-store";

/**
 * Presenter-side: subscribe to the session BroadcastChannel and merge
 * incoming audience votes into the local audience store. Also publishes
 * the current slide so freshly-joined audience tabs land in sync.
 *
 * BroadcastChannel is intentionally chosen over a server-backed pub/sub:
 * the audience and presenter must be on the same origin (they are — both
 * are the published app), and same-origin tabs/windows participate
 * automatically with zero infra. The fallback hatch for cross-network
 * polls is a deferred B10 item.
 */
export function useAudienceSync(args: { slideIndex: number; slideId: string; stepNum: number; total: number; title?: string }) {
  const sessionId = useAudience((s) => s.sessionId);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(audienceChannelName(sessionId));
    const onMessage = (event: MessageEvent<AudienceMessage>) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "audience:vote") {
        useAudience.getState().recordVote(msg.slideId, msg.voterId, msg.option, msg.optionCount);
      } else if (msg.type === "audience:hello") {
        // Re-broadcast current slide so the new joiner catches up.
        ch.postMessage({
          type: "presenter:slide",
          slideIndex: args.slideIndex,
          slideId: args.slideId,
          stepNum: args.stepNum,
          total: args.total,
          title: args.title,
        } satisfies AudienceMessage);
      }
    };
    ch.addEventListener("message", onMessage);
    return () => {
      ch.removeEventListener("message", onMessage);
      ch.close();
    };
  }, [sessionId, args.slideIndex, args.slideId, args.stepNum, args.total, args.title]);

  // Publish presenter slide changes as a one-shot effect.
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(audienceChannelName(sessionId));
    ch.postMessage({
      type: "presenter:slide",
      slideIndex: args.slideIndex,
      slideId: args.slideId,
      stepNum: args.stepNum,
      total: args.total,
      title: args.title,
    } satisfies AudienceMessage);
    ch.close();
  }, [sessionId, args.slideIndex, args.slideId, args.stepNum, args.total, args.title]);
}
