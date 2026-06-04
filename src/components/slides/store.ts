import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DeckSchema } from "@/lib/slides/schema";
import { DECK_SCHEMA_VERSION } from "@/lib/slides/version";

import { useChrome } from "./chrome-store";
import { emitSlidesEvent } from "./telemetry";
import { DEFAULT_THEME_ID } from "./themes";
import type { Deck, DeckSettings, Slide } from "./types";

const defaultSettings: DeckSettings = {
  backgroundMode: "color",
  backgroundColor: "#101010",
  darken: 0,
  blur: 0,
  transition: "fade",
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
    id: "sajida-visual",
    type: "left",
    title: "Sajida — Foundation Snapshot",
    kicker: "Foundation",
    heading: ["A ", { text: "foundation" }, "\nbuilt on impact"],
    align: "center-left",
    body: [
      "Sajida Foundation runs ",
      { text: "health, education", pill: false },
      " and ",
      { text: "livelihood" },
      " programs across Bangladesh — reaching millions through community-led work.",
    ],
    media: {
      src: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80&auto=format&fit=crop",
      alt: "Community gathering",
    },
  },
  {
    id: "principles",
    type: "steps",
    title: "Five Principles",
    heading: "Five principles",
    steps: [
      { label: "Principle 1", title: "Lead with the user", detail: ["Lead with the ", { text: "user" }, " before anything else."] },
      { label: "Principle 2", title: "Default to motion", detail: ["Use ", { text: "motion" }, " to guide attention, not distract."] },
      { label: "Principle 3", title: "One idea per step", detail: ["Reveal one ", { text: "idea" }, " at a time with clear focus."] },
      { label: "Principle 4", title: "Highlight deliberately", detail: ["Use ", { text: "yellow", pill: true }, " only for the current emphasis."] },
      { label: "Principle 5", title: "Ship and iterate", detail: ["Ship, learn, and ", { text: "iterate" }, " quickly."] },
    ],
  },
  {
    id: "roadmap",
    type: "timeline",
    title: "2026 Roadmap",
    heading: "Roadmap",
    items: [
      { label: "Q1", title: "Discovery", detail: ["Interview ", { text: "20 customers" }, " to validate the problem."] },
      { label: "Q2", title: "Prototype", detail: ["Validate the ", { text: "core flow" }, " with design partners."] },
      { label: "Q3", title: "Beta", detail: ["Ship to ", { text: "design partners" }, " and iterate weekly."] },
      { label: "Q4", title: "GA", detail: ["Public launch with ", { text: "full pricing" }, "."] },
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
  {
    id: "focus-demo",
    type: "steps",
    title: "Focus Regions Demo",
    heading: "Camera focus regions",
    steps: [
      { label: "Step 1", title: "Overview", detail: ["Start with the ", { text: "full canvas" }, " — no zoom."] },
      { label: "Step 2", title: "Zoom top-left", detail: ["Camera frames the ", { text: "label column" }, "."] },
      { label: "Step 3", title: "Zoom focus card", detail: ["Camera frames the ", { text: "focus content" }, " on the right."] },
    ],
    focus: [
      { step: 2, x: 80, y: 180, w: 760, h: 640, duration: 700, label: "Label column" },
      { step: 3, x: 880, y: 200, w: 960, h: 680, duration: 700, label: "Focus card" },
    ],
  },
];

const defaultDeck: Deck = {
  id: "default",
  title: "Sample Deck",
  themeId: DEFAULT_THEME_ID,
  slides: seedSlides,
  settings: defaultSettings,
  version: DECK_SCHEMA_VERSION,
};

export function forceFadeTransition(deck: Deck): Deck {
  if (deck.settings.transition === "fade" || deck.settings.transition === "camera-zoom") return deck;
  return { ...deck, settings: { ...deck.settings, transition: "fade" } };
}

function getUsablePersistedDeck(value: unknown): Pick<DeckStore, "deck" | "themeId"> | null {
  const state = value as Partial<DeckStore> | undefined;
  if (!state?.deck) return null;

  const parsed = DeckSchema.safeParse(state.deck);
  if (!parsed.success) return null;
  if ((parsed.data.version ?? 1) !== DECK_SCHEMA_VERSION) return null;

  return {
    deck: forceFadeTransition(parsed.data as Deck),
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
  resetDeck: () => void;
  setLastVisited: (id: string) => void;
  getSlideIndex: (id: string) => number;
}

export const useDeck = create<DeckStore>()(
  persist(
    (set, get) => ({
      deck: defaultDeck,
      themeId: DEFAULT_THEME_ID,
      setSettings: (patch) =>
        set((s) => ({ deck: forceFadeTransition({ ...s.deck, settings: { ...s.deck.settings, ...patch } }) })),
      setThemeId: (id) => {
        set((s) => ({ themeId: id, deck: { ...s.deck, themeId: id } }));
        // Remember the user's most-recent theme choice so future scratch decks
        // / resetDeck start with it. chrome-store has no dep on store, so this
        // direct import is cycle-safe.
        useChrome.getState().setLastUsedThemeId(id);
        emitSlidesEvent({ type: "theme-change", themeId: id });
      },
      setDeck: (deck) =>
        set(() => {
          const safeDeck = forceFadeTransition(deck);
          emitSlidesEvent({
            type: "deck-load",
            slideCount: safeDeck.slides.length,
            deckId: safeDeck.id,
            title: safeDeck.title,
          });
          return { deck: safeDeck, themeId: safeDeck.themeId ?? DEFAULT_THEME_ID };
        }),
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
      resetDeck: () => {
        const preferred = useChrome.getState().lastUsedThemeId ?? DEFAULT_THEME_ID;
        set({ deck: { ...defaultDeck, themeId: preferred }, themeId: preferred });
      },
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
