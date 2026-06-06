# 27 — Next Task v5 (post-1.45.0)

## Status read

- Plan 05 closed in 1.45.0. Plan 06 is the only pending plan (181 lines, 100 steps, Phases A–G).
- Last bump prompt 26 named: typography addendum, ellipsis-pagination spec, Ubuntu Bold snapshot test. None of the three have landed yet — only planning/closure work shipped in 1.45.0.
- Coding guidelines: none under `.lovable/coding-guidelines.md` or `spec/coding-guidelines/` — skip silently.

## Next 3 Steps — exactly 3

### Step 1 — Plan 06 Step 4: Ubuntu-everywhere typography addendum
- **Reasoning:** Issue 05 + command 05 set the project rule that every header resolves to Ubuntu Bold. The 1.44.0 fix to `RenderSlide.tsx` + `.slide-title-lg` is code-only — the rule is not yet written into `spec/old-slides/21-slides-system/llm/10-typography.md`. Without the spec, Phase D authors writing 35 new slide-type renderers will reintroduce Poppins-on-header regressions, and the Core memory line can't cite a source. Skipping this re-opens the exact bug we just closed.
- **Time:** ~45 min (10 min read existing typography spec, 20 min draft addendum with anti-pattern + token table, 10 min memory index Core line, 5 min verify).
- **Unblocks:** Step 2 (snapshot test can cite the spec), Phase D type author checklist.

### Step 2 — Plan 06 Step 24: Ubuntu Bold computed-style snapshot test
- **Reasoning:** Code-only fix in 1.44.0 has zero regression coverage. The single line `font-weight: 400` in `.slide-title-lg` is exactly how the bug entered originally; nothing prevents the next CSS edit from doing it again. A Vitest + jsdom test that mounts `RenderSlide` for a title slide and asserts `getComputedStyle(titleEl).fontFamily` starts with `Ubuntu` + `fontWeight === '700'` is the minimum correct lock. Must land before Phase D begins, not after.
- **Time:** ~40 min (10 min wire jsdom + load `src/styles.css` via `@testing-library/react`, 20 min write + run test, 10 min CI smoke).
- **Unblocks:** Safe authoring of all 35 Phase D type renderers; closes the loop on issue 05.

### Step 3 — Plan 06 Steps 5+6: Ellipsis-pagination spec + threshold setting
- **Reasoning:** Command 06 is the second standing user ask still un-spec'd. SS-03 subtask exists but no `spec/old-slides/27-slides-number/03-ellipsis-pagination.md` yet. Phase C implementation cannot start without the visual contract (which slides collapse into `…`, click behaviour, `riseup.controller.ellipsisThreshold` default 15 / range 6–100). Doing 5+6 together is one spec doc, not two — efficient to batch.
- **Time:** ~50 min (15 min ASCII visual examples for 8/15/30/100-slide decks, 20 min behaviour table + edge cases, 10 min threshold setting block, 5 min cross-link from SS-03).
- **Unblocks:** Plan 06 Phase C (controller ellipsis) implementation; SS-02 white-balance-in-controller layout decisions.

## Remaining items (full picture after the 3 above)

**Plan 06 Phase A — Spec & RCA (Steps 1–20):**
- ✅ Step 1 (read commands), Step 2 (Ubuntu RCA — done via 1.44.0 fix), Step 3 (Ubuntu font weights loaded — verified earlier).
- ⬜ Step 4 (typography addendum — Step 1 above).
- ⬜ Steps 5–6 (ellipsis spec + threshold — Step 3 above).
- ⬜ Step 7 (new-slide-types catalog `spec/old-slides/26-slide-definitions/00-new-types-catalog.md`).
- ⬜ Step 8 (35 stub spec files, one per new slide type).
- ⬜ Step 9 (themes catalog addendum to `07-theme-system.md`).
- ⬜ Step 10 (palette doc `assets/icons/colors-themes/Palette.md` citing 3 sample images).
- ⬜ Step 11 (LLM guideline outline `docs/slides/spec/llm-json-guideline.outline.md`).
- ⬜ Step 12 (Teams JSON shape — TeamRoster + TeamSpotlight).
- ⬜ Step 13 (schema extensions in `src/lib/slides/schema.ts`, spec-only).
- ⬜ Steps 14–20 (media unions, variety-guard, launcher download spec, `docs/*` mirror, e2e/unit coverage plan, memory-index updates, gap-check).

**Plan 06 Phase B — Themes (Steps 21–35):** all pending. Extract palettes from `assets/samples/0{1,2,3}.{webp,jpg}`, add 3 new themes to `src/themes/`, wire into theme picker.

**Plan 06 Phase C — Controller ellipsis + white-balance (Steps 36–50):** all pending. Implement `DotPagination` ellipsis mode, fold SS-02 white-balance slider into `ControllerOverflowMenu`, update parity test.

**Plan 06 Phase D — New slide type renderers (Steps 51–85):** all pending. 35 renderers under `src/components/slides/types/`, each with Vitest + computed-style assertion that headers resolve to Ubuntu Bold.

**Plan 06 Phase E — LLM guideline rewrite (Steps 86–92):** all pending. Rewrite `docs/slides/spec/llm-json-guideline.md` end-to-end, include Teams section, expose as downloadable in launcher.

**Plan 06 Phase F — Launcher download + sample-deck refresh (Steps 93–97):** all pending.

**Plan 06 Phase G — Close-out (Steps 98–100):** parity tests green, move plan to `completed/`, update memory index.

**Step 24** (snapshot test) is being pulled forward to Step 2 above because it gates Phase D safely; Phase A keeps its original numbering, Step 24 just lands early.

## Version + housekeeping done this turn

- `package.json` → `1.46.0`
- `README.md` pinned to `1.46.0`
- `CHANGELOG.md` adds 1.46.0 entry (planning-only triage, no code change)
- `.lovable/prompts/index.md` latest pointer → `27-next-task.md`
- Saved this prompt as `.lovable/prompts/27-next-task.md`
