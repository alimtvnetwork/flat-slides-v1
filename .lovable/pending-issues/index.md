# pending-issues index

## Active: Slide settings / fullscreen / camera repair

1. **Unify background rendering**
   - Create one slide background pipeline that applies theme defaults, deck settings, per-slide background, image mode, darken, and blur consistently.
   - Acceptance: Settings background color works on the visible slide; image mode has a usable image URL path; per-slide overrides are predictable.

2. **Wire darken + blur controls**
   - Render the darken overlay and blur effect from `deck.settings.darken` and `deck.settings.blur`.
   - Acceptance: moving the sliders visibly changes the slide canvas in normal and fullscreen modes.

3. **Separate transition zoom from camera/focus zoom**
   - Prevent deck-level slide transition zoom from stacking with `CameraStage` focus zoom.
   - Prefer fade/morph for slide-to-slide movement; reserve camera/focus zoom for authored focus regions.
   - Acceptance: fullscreen navigation does not visually escape the slide frame.

4. **Fix step focus indexing**
   - Pass 1-based step numbers to `CameraStage` / `getActiveFocusRegion` consistently.
   - Acceptance: focus region with `step: 1` activates on URL `/slides/N/1`, `step: 2` on `/slides/N/2`, etc.

5. **Harden fullscreen stage clipping**
   - Ensure the fixed fullscreen shell, slide stage, transition layer, and camera layer all clip to the intended viewport without layout shifts.
   - Acceptance: next/prev in fullscreen cannot push content outside the visible fullscreen section.

6. **Add proposal example with right-side image**
   - Add or update a proposal sample slide with `media` on the right-hand side.
   - Acceptance: example deck visibly demonstrates proposal text + right-side image.

7. **Add camera-friendly proposal/focus example**
   - Add focus regions to the proposal/image example or a companion slide to prove camera targeting.
   - Acceptance: camera/focus movement lands on the intended image/text regions.

8. **Document final decision after implementation**
   - Update `.lovable/memory/diagnostics/01-slide-settings-fullscreen-camera-rca.md` with the actual fix and validation result.
   - Acceptance: memory contains root cause, implemented remedy, and any remaining caveats.
