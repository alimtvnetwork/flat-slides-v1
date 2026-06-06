# 33 — Next Task v5 (repeat-request version refresh)

## Files and signals read before selecting work

- `.lovable/coding-guidelines.md` present; `spec/coding-guidelines/` and `.lovable/seo-guidelines.md` absent.
- `.lovable/memory/index.md` — slide URLs 1-based, slide parent routes must render `<Outlet />`, default transition is fade, step-aware slides use `slideStepCount`, `.hl` must not glow.
- `.lovable/plan.md` — active 10-step repair plan unchanged.
- `.lovable/prompts/32-next-task.md` — prior prompt already preserved the active repair order.
- Dev-server logs — no actionable runtime stack trace.

## Root cause

The next-task artifact was already aligned at prompt 32 / version 1.51.0, and no product implementation landed afterward — this request only needs a fresh saved prompt and version marker, not a different task order.

## Next 3 Steps — exactly 3

### Step 1 — Reproduce and repair fullscreen persistence across navigation
- **Reasoning:** `.lovable/plan.md` names fullscreen persistence as the first active failure. `src/components/slides/useSlideNavigation.ts` virtualizes route changes only while native `document.fullscreenElement` exists, so app-presentation mode can still remount on slide advance.
- **Time:** ~70 min.
- **Unblocks:** Stable presenter shell for all step-animation and visual-rule repairs.

### Step 2 — Reproduce and repair slide-4 step 2→3 black-frame transition
- **Reasoning:** `.lovable/plan.md` names slide-4 step transition as the second failure. `src/components/slides/RenderSlide.tsx` has a persistent `StepDetailPane`, but the black frame must be traced to keys/background/remount before patching.
- **Time:** ~65 min.
- **Unblocks:** Smooth step/timeline navigation under the no-zoom motion contract.

### Step 3 — Lock visual rules and regression coverage
- **Reasoning:** `.lovable/plan.md` requires true-white default text, exact highlight shadow, and tests. `.hl-pill` in `src/styles.css` still has a box-shadow path; skipping leaves the forbidden glow.
- **Time:** ~60 min.
- **Unblocks:** Honest closure of the active repair plan and return to Plan 06.

## Remaining items after those 3

- Plan steps 9-10: focused regression tests and issue-tracker updates (`spec/issues/001`, `002`, README, `.lovable/pending-issues/index.md`).
- Plan 06 Phases A–G remain pending until the repair plan closes.
