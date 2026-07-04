---
name: onfield-roadmap-execution
description: Use when executing or reviewing a sprint from the OnField UX, branding, or app transformation roadmap. Triggers: OnField roadmap, OnField sprint, OnField implementation plan, OnField transformation, execute OnField plan.
---

# OnField Roadmap Execution

Use this skill when working from the OnField sprint roadmap.

## Required Context

Read before changing files:

1. `AGENTS.md`
2. `docs/superpowers/plans/2026-07-04-onfield-ux-branding-transformation-roadmap.md`
3. `docs/field-hub/onfield_decision_log.md`
4. `docs/field-hub/onfield_current_state.md`
5. Relevant SSOT or source files for the specific sprint.

## Workflow

1. Restate the exact sprint or task goal.
2. Name the sprint scope and what is out of scope.
3. Load only the relevant SSOTs and source files.
4. Implement or review only the requested sprint scope.
5. Run the relevant verification for the touched files.
6. Summarize changed files, verification, and open risks.

## Guardrails

- Do not implement future sprints while working on the current sprint.
- Use OnField naming consistently.
- Maintain iPhone/iPad feature parity.
- Preserve PWA-first direction unless the user explicitly changes it.
- Do not introduce medical diagnosis or return-to-play clearance language.
- Do not commit real sensitive player data.
- Keep large roadmap details in SSOT docs, not in `AGENTS.md`.

## Done Definition

- The sprint goal is handled within scope.
- Required OnField context was loaded.
- Verification was run or clearly marked as not applicable.
- Open risks and follow-ups are listed.
