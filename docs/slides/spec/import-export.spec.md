# Import / Export Runtime Metadata

## Contract

Deck exports include static slide JSON plus optional presenter runtime metadata:

```json
{
  "meta": {
    "exportedAt": "2026-06-06T00:00:00.000Z",
    "runtime": {
      "chrome": { "camera": {}, "scene": "normal" },
      "annotations": { "strokes": {} },
      "webcam": { "riseup.webcam.pos": "{\"x\":12,\"y\":34}" }
    }
  }
}
```

## Rules

- `slides`, `settings`, `themeId`, and `music` remain the canonical deck payload.
- `meta.runtime` is optional; older decks without it must still import.
- `chrome` snapshots the camera bubble preferences and scene only.
- `annotations` snapshots ink state keyed by slide id.
- `webcam` snapshots only the known `riseup.webcam.*` local preference keys.
- Import restores runtime metadata when present and logs `[slides:runtime-meta] restored deck runtime metadata`.

## Import surfaces

Two file-pickers live in **Settings → Import / Export**
(`src/components/slides/SettingsDrawer.tsx`):

- **Import deck** → `handleImportDeck` → `parseDeckJson` (Zod `DeckSchema`) →
  `useDeck.setDeck(deck)`. Replaces the entire current deck, clears
  annotations, restores runtime meta, and navigates to slide 1.
- **Import slide** → `handleImportSlide` → `parseSlideJson` → `upsertSlide`.
  Adds or replaces a single slide by `id` inside the current deck.

Both pickers accept `.json` only and reject invalid payloads with a toast plus
a "Copy full error" action. Older deck JSON without `meta.runtime` is accepted.

## Storage location (where imported decks live)

Imported decks are **not** uploaded to any server. They are persisted
client-side in the browser via the `zustand/persist` middleware:

| Layer | Key | Scope | Cleared by |
| --- | --- | --- | --- |
| `localStorage` | `slides-deck-v1` | per-browser, per-origin | DevTools / "Reset deck" / browser site-data clear |
| `localStorage` | `slides-deck-settings-v1` | settings mirror | "Reset deck" |
| `localStorage` | `riseup.annotations.*`, `riseup.webcam.*`, `riseup.chrome.*` | runtime meta restored from `meta.runtime` | per-key, on next import or manual clear |

Implication: import is **device-local**. A deck imported in Chrome is not
visible in Safari, an incognito window, or another machine. To share a deck,
re-export the JSON and import it on the target device. No cloud sync exists
yet (tracked separately).

The persistence key is owned by `src/components/slides/store.ts` (see the
`persist({ name: "slides-deck-v1", partialize: ... })` block). If the schema
version bumps, change `name` (e.g. `slides-deck-v2`) so stale payloads are
ignored rather than crash-loading.

## Multi-slide reference

A full multi-slide example (17 slides, every supported `type`) lives at
[`./sample-deck.json`](./sample-deck.json) and is linked from
[`./llm-json-guideline.md`](./llm-json-guideline.md) §12. Settings →
"Load spec sample" loads it in one click for QA.