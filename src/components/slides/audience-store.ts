import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Audience surfaces store (presenter-side).
 *
 * Tracks a stable per-deck session id so QR / share links remain valid
 * across reloads, and accumulates poll votes received via the
 * `useAudienceSync` BroadcastChannel listener.
 *
 * Vote dedupe: each audience device generates a stable `voterId` (also
 * persisted, audience-side). We keep a Set of voterIds per slide so a
 * device voting twice does not inflate counts. Counts are recomputed
 * from the voter→option map; storing it (not just totals) means we can
 * still correctly handle vote-changes if we later allow that.
 */

const SESSION_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeSessionId(len = 6) {
  let s = "";
  const bytes = new Uint8Array(len);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) crypto.getRandomValues(bytes);
  else for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
  for (let i = 0; i < len; i++) s += SESSION_ALPHABET[bytes[i] % SESSION_ALPHABET.length];
  return s;
}

export interface PollTally {
  /** voterId → option index */
  voters: Record<string, number>;
  /** option index → count (derived; cached for cheap reads) */
  counts: number[];
}

export interface AudienceStore {
  sessionId: string;
  /** Whether the QR/join overlay is shown over the slide. Persisted off. */
  qrVisible: boolean;
  /** Whether the poll-results overlay is shown on poll slides. */
  resultsVisible: boolean;
  /** slideId → tally. Ephemeral; cleared on resetSession. */
  polls: Record<string, PollTally>;

  toggleQr: () => void;
  setQr: (v: boolean) => void;
  toggleResults: () => void;
  setResults: (v: boolean) => void;
  recordVote: (slideId: string, voterId: string, option: number, optionCount: number) => void;
  clearPoll: (slideId: string) => void;
  resetSession: () => void;
}

export const useAudience = create<AudienceStore>()(
  persist(
    (set) => ({
      sessionId: makeSessionId(),
      qrVisible: false,
      resultsVisible: true,
      polls: {},
      toggleQr: () => set((s) => ({ qrVisible: !s.qrVisible })),
      setQr: (v) => set({ qrVisible: v }),
      toggleResults: () => set((s) => ({ resultsVisible: !s.resultsVisible })),
      setResults: (v) => set({ resultsVisible: v }),
      recordVote: (slideId, voterId, option, optionCount) =>
        set((s) => {
          if (option < 0 || option >= optionCount) return s;
          const prev = s.polls[slideId] ?? { voters: {}, counts: Array(optionCount).fill(0) };
          // Normalize stale tally length if option list changed.
          const counts = prev.counts.length === optionCount
            ? [...prev.counts]
            : Array(optionCount).fill(0);
          const previousVote = prev.voters[voterId];
          if (previousVote === option) return s;
          if (typeof previousVote === "number" && previousVote >= 0 && previousVote < counts.length) {
            counts[previousVote] = Math.max(0, counts[previousVote] - 1);
          }
          counts[option] = (counts[option] ?? 0) + 1;
          return {
            polls: {
              ...s.polls,
              [slideId]: { voters: { ...prev.voters, [voterId]: option }, counts },
            },
          };
        }),
      clearPoll: (slideId) =>
        set((s) => {
          const next = { ...s.polls };
          delete next[slideId];
          return { polls: next };
        }),
      resetSession: () => set({ sessionId: makeSessionId(), polls: {} }),
    }),
    {
      name: "slides-audience-v1",
      // Don't persist the QR overlay state — always re-open intentionally.
      partialize: (s) => ({ sessionId: s.sessionId, resultsVisible: s.resultsVisible, polls: s.polls }),
    },
  ),
);

/** Stable channel name shared by presenter + audience tabs. */
export const audienceChannelName = (sessionId: string) => `slides-audience-${sessionId}`;

export type AudienceMessage =
  | { type: "presenter:slide"; slideIndex: number; slideId: string; stepNum: number; total: number; title?: string }
  | { type: "audience:vote"; slideId: string; option: number; optionCount: number; voterId: string }
  | { type: "audience:hello"; voterId: string };
