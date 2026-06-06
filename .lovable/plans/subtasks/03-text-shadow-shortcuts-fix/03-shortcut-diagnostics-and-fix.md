# Shortcut diagnostics and fix

**Slug:** shortcut-diagnostics-and-fix
**Status:** pending
**Created:** 2026-06-06
**Parent:** 03-text-shadow-shortcuts-fix

## Scope

Find why `I` and `F` still fail for the user and make the shortcut path reliable in the slide-first preview.

## Diagnostic path

- Inspect runtime console/session signals before editing.
- Confirm whether key events reach the slide root, document capture listener, and presenter action registry.
- Confirm no focused button/input guard or browser shortcut conflict blocks plain `I` and `F`.
- Confirm the controller action map and visible UI labels match the spec.

## Fix boundaries

Only adjust the shortcut dispatch/presenter layer needed for `I` camera and `F` present/fullscreen. Do not rework unrelated slide navigation, camera styling, or deck data.

## Verification

Add or update focused tests for plain `I`, lowercase `i`, plain `F`, uppercase `F`, and the visible Present button path, then manually validate in preview.