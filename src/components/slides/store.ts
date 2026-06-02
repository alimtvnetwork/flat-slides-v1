import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DeckSchema } from "@/lib/slides/schema";

import { DEFAULT_THEME_ID } from "./themes";
import type { Deck, DeckSettings, Slide } from "./types";

const defaultSettings: DeckSettings = {
  backgroundMode: "color",
  backgroundColor: "#101010",
  darken: 0,
  blur: 0,
  transition: "camera-zoom",
  soundEnabled: true,
  volume: 0.6,
};

const seedSlides: Slide[] = [
  {
    id: "glasswing",
    type: "center",
    title: "Project Glasswing",
    display: true,
    heading: ["Project\nGlasswing"],
    align: "center",
  },
  {
    id: "think",
    type: "center",
    title: "Don't make me Think",
    heading: ["Don\u2019t make me"],
    subhead: [{ text: "Think", pill: true }],
    align: "center",
  },
  {
    id: "sajida",
    type: "left",
    title: "Sajida Proposal",
    kicker: "Proposal",
    heading: ["Sajida\nProposal"],
    align: "center-left",
    body: [
      "A short summary of the ",
      { text: "Sajida" },
      " engagement, scope, and the ",
      { text: "outcome" },
      " we are pitching.",
    ],
  },
  {
    id: "principles",
    type: "steps",
    title: "Five Principles",
    heading: "Five principles",
    steps: [
      ["Lead with the ", { text: "user" }],
      ["Default to ", { text: "motion" }],
      ["Reveal one ", { text: "idea" }, " per slide"],
      ["Highlight in ", { text: "yellow", pill: true }],
      ["Ship and ", { text: "iterate" }],
    ],
  },
  {
    id: "bullets-demo",
    type: "bullets",
    title: "Why JSON-first?",
    kicker: "Why",
    heading: ["Why ", { text: "JSON", pill: true }, "-first?"],
    align: "top-left",
    bullets: [
      ["Any ", { text: "LLM" }, " can author a deck"],
      ["Version-control the deck like code"],
      ["Import or export ", { text: "single slides" }],
    ],
  },
  {
    id: "quote",
    type: "quote",
    title: "Quote",
    quote: ["Animation is the ", { text: "priority" }, "."],
    attribution: "— Project brief",
  },
];

const defaultDeck: Deck = {
  id: "default",
  title: "Sample Deck",
  themeId: DEFAULT_THEME_ID,
  slides: seedSlides,
  settings: defaultSettings,
  version: 1,
};

function getUsablePersistedDeck(value: unknown): Pick<DeckStore, "deck" | "themeId"> | null {
  const state = value as Partial<DeckStore> | undefined;
  if (!state?.deck) return null;

  const parsed = DeckSchema.safeParse(state.deck);
  if (!parsed.success) return null;

  return {
    deck: parsed.data as Deck,
    themeId: state.themeId ?? parsed.data.themeId ?? DEFAULT_THEME_ID,
  };
}

export interface DeckStore {
  deck: Deck;
  themeId: string;
  lastVisitedSlideId?: string;
  setSettings: (patch: Partial<DeckSettings>) => void;
  setThemeId: (id: string) => void;
  setDeck: (deck: Deck) => void;
  /** Insert a single slide at `index` (defaults to end). */
  addSlide: (slide: Slide, index?: number) => void;
  /** Replace a slide by id; if missing, append. */
  upsertSlide: (slide: Slide) => void;
  removeSlide: (id: string) => void;
  setLastVisited: (id: string) => void;
  getSlideIndex: (id: string) => number;
}

export const useDeck = create<DeckStore>()(
  persist(
    (set, get) => ({
      deck: defaultDeck,
      themeId: DEFAULT_THEME_ID,
      setSettings: (patch) =>
        set((s) => ({ deck: { ...s.deck, settings: { ...s.deck.settings, ...patch } } })),
      setThemeId: (id) =>
        set((s) => ({ themeId: id, deck: { ...s.deck, themeId: id } })),
      setDeck: (deck) =>
        set(() => ({ deck, themeId: deck.themeId ?? DEFAULT_THEME_ID })),
      addSlide: (slide, index) =>
        set((s) => {
          const slides = [...s.deck.slides];
          const i = index ?? slides.length;
          slides.splice(i, 0, slide);
          return { deck: { ...s.deck, slides } };
        }),
      upsertSlide: (slide) =>
        set((s) => {
          const i = s.deck.slides.findIndex((x) => x.id === slide.id);
          const slides = [...s.deck.slides];
          if (i >= 0) slides[i] = slide;
          else slides.push(slide);
          return { deck: { ...s.deck, slides } };
        }),
      removeSlide: (id) =>
        set((s) => ({ deck: { ...s.deck, slides: s.deck.slides.filter((x) => x.id !== id) } })),
      setLastVisited: (id) => set({ lastVisitedSlideId: id }),
      getSlideIndex: (id) => get().deck.slides.findIndex((s) => s.id === id),
    }),
    {
      name: "slides-deck-v1",
      merge: (persisted, current) => {
        const usable = getUsablePersistedDeck(persisted);
        if (!usable) return current;
        return {
          ...current,
          deck: usable.deck,
          themeId: usable.themeId,
        };
      },
      // Persist only mutable user data — not transient UI state.
      partialize: (s) => ({ deck: s.deck, themeId: s.themeId }),
    },
  ),
);
