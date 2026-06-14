# Rugby Donau S&C Project Instructions

## Project Mission

This folder supports the development of a rugby-specific one-year strength and conditioning plan for Rugby Union Donau Wien.

The primary target group is not the old U18 concept anymore. The current focus is the U22 / development group: players who should be physically prepared for integration into the senior men's structure, especially Freibeuter, Korsaren, and eventually Piraten. Some senior or first-team players returning from injury may also be included, in coordination with medical/physio staff.

## Current Known Context

- Location: Rugby Union Donau Wien, Meiereistrasse 20, 1020 Wien.
- Main training slots: Tuesday and Thursday around 19:00.
- Planned start: mid-June 2026.
- Coach availability issue: Arwin is away for three weeks in August 2026.
- Main facilities:
  - Artificial turf field.
  - Grass field.
  - Small gym for approximately 10 athletes.
  - Dumbbells above 40 kg.
  - Sleds.
  - Pull-up bars.
  - Kettlebells.
  - Bands.
  - Medicine balls.
  - Battle ropes.
  - Plyo boxes.
  - Conditioning devices such as spinning bike, airbike, and ergometer.
- Main problem to solve: high injury rate since the senior side has been playing in the Czech league.
- Player context:
  - The squad should not be treated as a professional roster.
  - Most players likely study, work, or have other life commitments.
  - Training plans must account for limited recovery, inconsistent availability, stress, sleep, travel, exams, and work schedules.
  - Planning should use professional principles, but amateur/semi-pro implementation constraints.
- Main training goals:
  - Injury risk reduction.
  - Robustness for contact and collisions.
  - Strength development.
  - Speed and acceleration.
  - Power and explosiveness.
  - Change of direction and deceleration.
  - Repeated high-intensity ability.
  - Field and gym integration.
  - Objective testing and simple progress tracking.

## Planning Principles

- Treat rugby training as the priority sport exposure. S&C should support rugby, not compete with it.
- Separate macrocycle, mesocycle, microcycle, and individual session design.
- Account for off-season, pre-season, and in-season demands.
- Build a plan that works with two formal S&C exposures per week unless the club confirms additional individual sessions.
- Use position groups first, then individualize where practical:
  - Front row.
  - Locks.
  - Back row.
  - Halves.
  - Centres.
  - Back three.
- Consider broad forward/back differences, but avoid simplistic planning. Rugby positions differ in collision, set-piece, high-speed running, acceleration, body mass, and repeat-effort demands.
- Do not present medical return-to-play decisions as S&C decisions. For injured players, define reconditioning progressions and handoff points with physiotherapy/medical staff.
- Use evidence-informed planning, but keep implementation realistic for an Austrian club environment.

## Research Standards

When adding research notes:

- Prefer systematic reviews, governing body guidance, peer-reviewed papers, and official World Rugby/RFU resources.
- Capture the exact source URL and short reason why it matters.
- Distinguish between:
  - Match demands.
  - Injury epidemiology.
  - Contact-load guidance.
  - Testing and monitoring.
  - Periodization.
  - Position-specific requirements.
  - Return-to-play and reconditioning.
- Avoid copying large verbatim passages. Summarize in applied coaching language.

## Working Files

- `docs/00_project_context.md`: current project assumptions and constraints.
- `docs/01_research_metrics_and_planning_factors.md`: metrics and variables that future Deep Research should target.
- `docs/02_deep_research_prompts.md`: prompts for ChatGPT Pro Deep Research.
- `docs/03_data_to_request_from_club.md`: questions and data to collect from Rugby Union Donau Wien.
- `docs/06_master_synthesis.md`: central synthesis of project context, original concept, all current research outputs, and planning consequences.
- `docs/07_assumptions_and_placeholders.md`: planning assumptions and placeholders for data that will be collected during the first sessions.
- `docs/08_next_session_handover.md`: handover protocol for continuing the project in a fresh session.
- `docs/05_codex_workflow.md`: Codex-specific workflow, skill/playbook routing, and project process.
- `research/`: source notes and evidence summaries.
- `plans/`: annual plan, blocks, mesocycles, and final programming.
- `templates/`: testing sheets, session templates, monitoring forms, exercise pools, equipment plans, and module blocks.
- `codex/skills/`: project-local skill playbooks for research synthesis, annual planning, session programming, and safety review.
- `data/`: local data exports if the club provides them. Do not commit sensitive player data without explicit approval.

## Codex Workflow

Use the project workflow in `docs/05_codex_workflow.md`.

For recurring tasks, use the relevant project skill/playbook:

- Research synthesis: `codex/skills/rugby-snc-research-synthesis/SKILL.md`.
- Annual planning: `codex/skills/rugby-snc-annual-planning/SKILL.md`.
- Session programming: `codex/skills/rugby-snc-session-programming/SKILL.md`.
- Safety review: `codex/skills/rugby-snc-safety-review/SKILL.md`.

Do not create complex agent infrastructure before it has a clear use. Prefer a simple workflow:

1. gather or read context.
2. synthesize into project files.
3. produce a practical planning artifact.
4. run a safety/feasibility review.
5. list open club-data dependencies.

## Output Style

Use German for coaching documents unless the user asks otherwise. Keep documents practical, structured, and ready to use with coaches, players, and club staff.
