---
name: onfield-screen-redesign
description: Use when redesigning or reviewing an OnField screen, view, workflow, or responsive layout. Triggers: OnField screen redesign, redesign Heute, redesign Einheit, redesign Check-in, redesign Training, redesign Nachbereitung, redesign Spieler, redesign Analyse, redesign Mehr.
---

# OnField Screen Redesign

Use this skill for screen-by-screen rollout of the OnField UX and design system.

## Required Context

Read before screen work:

1. `AGENTS.md`
2. `docs/field-hub/memory/index.md`
3. `docs/field-hub/onfield_current_state.md`
4. `docs/field-hub/onfield_decision_log.md`
5. Relevant design-system SSOTs if they exist.
6. Relevant sprint section from `docs/superpowers/plans/2026-07-04-onfield-ux-branding-transformation-roadmap.md`.
7. The current screen component and its tests under `app/field-hub/src`.

## Workflow

1. State the screen's primary job and primary action.
2. State the iPhone and iPad layouts.
3. Identify what must move to sheet, detail pane, accordion, or `Mehr`.
4. Reuse OnField components and tokens.
5. Define empty, loading, error, disabled, offline, and pending-sync behavior when relevant.
6. Verify with tests and visual checks when practical.

## Guardrails

- iPhone must keep full feature parity with iPad.
- Live screens do not show analysis charts.
- Check-in is roster/list-first.
- Training is live-block-first.
- Nachbereitung is queue-first.
- Player/Athlete records are rows/lists by default, not large card walls.
- Each screen has one dominant primary action above the fold.
- Medical/safety copy must not imply diagnosis or clearance.

## Done Definition

- The screen follows its roadmap role.
- iPhone and iPad behavior is documented.
- Relevant tests are updated or verified.
- Visual risks and remaining inconsistencies are listed.

## Memory Closeout

Before the final response:

1. Check whether `docs/field-hub/onfield_current_state.md` needs an update.
2. Check whether `docs/field-hub/onfield_decision_log.md` needs an update for a durable decision.
3. Check whether `docs/field-hub/memory/gotchas.md` needs an update for a repeatable lesson or trap.
4. Update only the matching memory file when `docs/field-hub/onfield_memory_governance.md` says the information qualifies.
5. In the final response, state one of:
   - `Memory updated: <file>`
   - `No memory update needed`
