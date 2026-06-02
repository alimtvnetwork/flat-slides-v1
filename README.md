# Slide System

A simple, flat-color slide presentation system.

## Status

📝 **Spec in progress** — gathering requirements. No implementation yet.

## Requirements (so far)

### Visual style
- **Flat color** aesthetic (no gradients, no heavy shadows on surfaces).
- Color palette: **TBD** — user will provide sample images of desired colors.

### Typography
- **Headings:** Ubuntu
- **Body text:** Poppins
- **Highlighted (bold) text:**
  - Yellowish color
  - Bold weight
  - Has a **text-shadow** effect

### Layout variants
The system should support **2–3 ways to display slide items**:
1. **Text on the left** (content on left side of the slide)
2. _TBD_
3. _TBD_

## Pending from user
- [ ] Color sample images (to be placed in repo root)
- [ ] Exact color values / palette
- [ ] Remaining layout variants (2nd and 3rd display styles)
- [ ] Slide content model (title, body, bullets, image, etc.)
- [ ] Navigation / presentation behavior (keyboard nav, fullscreen, thumbnails?)

## Notes
- Built on TanStack Start + React + Tailwind.
- Slides will render at fixed 1920×1080 and scale to fit (standard slide pattern).
- Bold/highlighted runs in text will be styled via a dedicated class so the
  yellow color + text-shadow apply consistently across all slide variants.
