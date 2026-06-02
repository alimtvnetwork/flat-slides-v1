import { create } from "zustand";

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
    background: "#101010",
  },
  {
    id: "think",
    type: "center",
    title: "Don't make me Think",
    heading: ["Don\u2019t make me"],
    subhead: [{ text: "Think", pill: true }],
    background: "#000000",
  },
  {
    id: "sajida",
    type: "left",
    title: "Sajida Proposal",
    background: "#1d1d1d",
    kicker: "Proposal",
    heading: ["Sajida\nProposal"],
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
    id: "quote",
    type: "quote",
    title: "Quote",
    quote: ["Animation is the ", { text: "priority" }, "."],
    attribution: "— Project brief",
  },
];

interface DeckStore {
  deck: Deck;
  setSettings: (patch: Partial<DeckSettings>) => void;
  getSlideIndex: (id: string) => number;
}

export const useDeck = create<DeckStore>((set, get) => ({
  deck: {
    id: "default",
    title: "Sample Deck",
    slides: seedSlides,
    settings: defaultSettings,
  },
  setSettings: (patch) =>
    set((s) => ({ deck: { ...s.deck, settings: { ...s.deck.settings, ...patch } } })),
  getSlideIndex: (id) => get().deck.slides.findIndex((s) => s.id === id),
}));
