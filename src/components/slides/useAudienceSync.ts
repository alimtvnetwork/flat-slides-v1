import { useEffect, useRef } from "react";

import { audienceChannelName, useAudience, type AudienceMessage } from "./audience-store";

/**
 * Presenter-side audience sync.
 *
 * Issue 021: previously, both the subscribe-effect and the publish-effect
 * had every arg in their dependency array, so each slide navigation
 * *closed and recreated* the BroadcastChannel + listener. That doesn't
 * leak in the GC sense, but it churns native handles, drops messages
 * that arrive mid-swap, and confuses test assertions about handle count.
 *
 * Fix: one channel per `sessionId`. The publish-effect reuses the
 * channel via a ref. Args read inside the message handler go through a
 * ref so the listener identity stays stable across renders.
 */
type SlideArgs = { slideIndex: number; slideId: string; stepNum: number; total: number; title?: string };

function presenterMessage(a: SlideArgs): AudienceMessage {
  return { type: "presenter:slide", slideIndex: a.slideIndex, slideId: a.slideId, stepNum: a.stepNum, total: a.total, title: a.title };
}

export function useAudienceSync(args: SlideArgs) {
  const sessionId = useAudience((s) => s.sessionId);
  const argsRef = useRef(args);
  argsRef.current = args;
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Channel lifecycle: one per sessionId.
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(audienceChannelName(sessionId));
    channelRef.current = ch;
    const onMessage = (event: MessageEvent<AudienceMessage>) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "audience:vote") {
        useAudience.getState().recordVote(msg.slideId, msg.voterId, msg.option, msg.optionCount);
        return;
      }
      if (msg.type === "audience:hello") {
        ch.postMessage(presenterMessage(argsRef.current));
      }
    };
    ch.addEventListener("message", onMessage);
    ch.postMessage(presenterMessage(argsRef.current));
    return () => {
      ch.removeEventListener("message", onMessage);
      ch.close();
      if (channelRef.current === ch) channelRef.current = null;
    };
  }, [sessionId]);

  // Publish slide changes over the existing channel.
  useEffect(() => {
    const ch = channelRef.current;
    if (!ch) return;
    ch.postMessage(presenterMessage(args));
  }, [args.slideIndex, args.slideId, args.stepNum, args.total, args.title]);
}
