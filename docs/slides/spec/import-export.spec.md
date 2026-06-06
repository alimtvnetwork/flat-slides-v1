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