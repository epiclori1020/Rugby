---
name: onfield-pwa-accessibility-qa
description: Use when checking OnField PWA behavior, iPhone/iPad responsiveness, safe areas, install surfaces, offline behavior, accessibility, focus, contrast, or touch targets. Triggers: OnField PWA QA, OnField accessibility, iPhone QA, iPad QA, safe area, touch targets, offline QA, install polish.
---

# OnField PWA Accessibility QA

Use this skill for OnField PWA, responsive, and accessibility verification.

## Required Context

Read before QA:

1. `AGENTS.md`
2. `docs/field-hub/onfield_decision_log.md`
3. `docs/field-hub/onfield_current_state.md`
4. Roadmap Sprint 18 and Sprint 19 in `docs/superpowers/plans/2026-07-04-onfield-ux-branding-transformation-roadmap.md`
5. `docs/field-hub/onfield_pwa_accessibility_qa.md` if it exists.

## Workflow

1. Identify the route, screen, or state being checked.
2. Check iPhone small, iPhone large, iPad portrait, and iPad landscape when practical.
3. Check touch targets, safe areas, bottom bars, focus, contrast, loading, empty, error, offline, and pending-sync states.
4. Use Browser/Chrome/Simulator screenshots when practical.
5. Report findings with file/screen references and severity.

## Guardrails

- No feature may be iPad-only.
- Bottom bars and floating actions must respect the iPhone home indicator.
- Touch targets must be at least 44 x 44 px; field-critical actions should be 48-56 px high.
- Status must be text plus color and optional icon, never color alone.
- The app must not fall back to a generic browser offline error.
- Disabled actions need a visible reason.

## Done Definition

- Checked viewports/states are listed.
- Issues are grouped by severity.
- Verification commands or screenshots are documented.
- Remaining risks are explicit.
