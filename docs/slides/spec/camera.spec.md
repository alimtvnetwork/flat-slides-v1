# Camera overlay spec

## Shape contract

The presenter camera shape is driven by `chrome.camera.shape`, not component
props. Production rendering supports exactly these free-camera radii:

- `circle` → `9999px`
- `squircle` → `38% / 34%` plus the squircle mask/plates
- `rect` → `18px`

`stage-fill` ignores the free-camera shape radius and renders square to the
scaled 1920×1080 slide frame.

## Regression lock

`src/components/slides/controls/CameraBubble.shape.test.tsx` must set
`useChrome.camera.shape` and render `<CameraBubble />` without shape props.