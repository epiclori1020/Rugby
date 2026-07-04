---
name: onfield-design-system
description: Use when creating, editing, or reviewing OnField branding, tokens, component kit, Figma/design-system artifacts, visual QA, or UI consistency. Triggers: OnField design system, OnField brand kit, OnField tokens, Figma, design kit, component kit, visual redesign.
---

# OnField Design System

Use this skill for OnField brand, tokens, components, and design-system work.

## Required Context

Read before design-system changes:

1. `AGENTS.md`
2. `docs/field-hub/memory/index.md`
3. `docs/field-hub/onfield_current_state.md`
4. `docs/field-hub/onfield_decision_log.md`
5. Relevant design-system SSOTs or, until they exist, `docs/field-hub/2026-07-04_deep_research_branding_design_system.md`
6. Roadmap Sprint 3, Sprint 4, and Sprint 5 if the task changes roadmap scope.

If SSOT files exist, prefer them over re-reading the full research:

- `docs/field-hub/onfield_brand_kit.md`
- `docs/field-hub/onfield_tone_of_voice.md`
- `docs/field-hub/onfield_design_system.md`
- `docs/field-hub/onfield_component_inventory.md`

## Workflow

1. Identify whether the task is brand, token, component, or visual-QA work.
2. Confirm the relevant OnField design territory: quiet iPadOS performance console with field-operations DNA.
3. Reuse existing tokens/components before creating new ones.
4. If creating design artifacts, use Figma or a documented equivalent.
5. Verify iPhone and iPad behavior for any UI-facing change.

## Guardrails

- No random colors, radii, spacing, or shadows outside the token system.
- Operational UI uses system font unless a later tested display-font decision exists.
- Brand/Hero surfaces are allowed for welcome, login, install, app icon/splash, landing, empty demo, and kiosk welcome.
- Live coaching surfaces stay quiet and operational.
- Cards are not the default structure; prefer rows, lists, panels, sheets, and queues.
- Status never relies on color alone.

## Done Definition

- Brand/tokens/components are documented or linked to their SSOT.
- Figma or equivalent design artifact is updated when relevant.
- iPhone/iPad implications are addressed.
- Accessibility and touch-target risks are noted.

## Memory Closeout

Before the final response:

1. Check whether `docs/field-hub/onfield_current_state.md` needs an update.
2. Check whether `docs/field-hub/onfield_decision_log.md` needs an update for a durable decision.
3. Check whether `docs/field-hub/memory/gotchas.md` needs an update for a repeatable lesson or trap.
4. Update only the matching memory file when `docs/field-hub/onfield_memory_governance.md` says the information qualifies.
5. In the final response, state one of:
   - `Memory updated: <file>`
   - `No memory update needed`
