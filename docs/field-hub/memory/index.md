# OnField Memory Index

Stand: 2026-07-04

## Zweck

Dieser Index ist der Context Router fuer OnField-Agenten. Er entscheidet, welche Dateien fuer welche Aufgabe gelesen werden. Ziel ist gezieltes Laden statt Kontext-Bloat.

## Immer Lesen

Vor OnField-Arbeit immer lesen:

1. `AGENTS.md`
2. `docs/field-hub/memory/index.md`
3. `docs/field-hub/onfield_current_state.md`
4. `docs/field-hub/onfield_decision_log.md`

Danach nur die fuer die Aufgabe relevanten Dateien laden.

## Routing-Tabelle

| Aufgabe | Zusaetzlich lesen | Nur bei Bedarf |
|---|---|---|
| Sprint/Roadmap planen oder umsetzen | `.agents/skills/onfield-roadmap-execution/SKILL.md`, relevante Sprint-Abschnitte in `docs/superpowers/plans/2026-07-04-onfield-ux-branding-transformation-roadmap.md` | Researches, wenn ein Sprint Research-Synthese verlangt |
| Memory-Arbeit | `docs/field-hub/onfield_memory_governance.md`, `docs/field-hub/memory/gotchas.md` | LUVI-Referenzdateien auf SSD nur lesend und nur fuer Musterabgleich |
| Produkt/IA | `docs/field-hub/2026-07-04_ux_design_roadmap_principles.md`, relevante Roadmap-Abschnitte | UX Research bei unklaren Guardrails |
| Brand/Designsystem | `.agents/skills/onfield-design-system/SKILL.md`, `docs/field-hub/2026-07-04_deep_research_branding_design_system.md` bis Brand-/Design-SSOTs existieren | Figma- oder Designsystem-Artefakte |
| Screen-Redesign | `.agents/skills/onfield-screen-redesign/SKILL.md`, relevante Screen-Dateien in `app/field-hub/src`, Designsystem-/Component-SSOTs sobald vorhanden | UX/Branding Research bei offenen Layout- oder Markenfragen |
| PWA/A11y/Responsive QA | `.agents/skills/onfield-pwa-accessibility-qa/SKILL.md`, PWA/A11y-SSOT sobald vorhanden | Browser-/Simulator-Checks, wenn UI betroffen ist |
| Codearbeit in `app/field-hub` | `.agents/skills/rugby-field-hub-implementation/SKILL.md`, betroffene Code- und Testdateien | Roadmap nur relevanter Sprint-Abschnitt |
| Supabase/Auth/Sync | Supabase Skill, relevante Setup-/Code-Dateien, Current State | Supabase Docs/MCP, wenn Schema/RLS/Auth geaendert wird |
| Rugby-Content/Training | relevante `plans/`, `templates/`, `research/` und Coaching-Dokumente | OnField-App-SSOTs nur, wenn App-Verhalten betroffen ist |

## Research-Regel

Die langen Research-Dateien sind Quellenmaterial, kein Standard-Pflichtkontext:

- `docs/field-hub/2026-07-04_deep_research_ux_ui_guardrails.md`
- `docs/field-hub/2026-07-04_deep_research_branding_design_system.md`

Agenten laden sie nur, wenn:

- ein Research-/SSOT-Sprint sie verlangt.
- eine Entscheidung nicht aus Current State, Decision Log oder SSOTs ableitbar ist.
- ein Design-, IA- oder UX-Guardrail verifiziert werden muss.

## Roadmap-Regel

Die komplette Roadmap wird nur gelesen, wenn Sprint-/Roadmap-Arbeit stattfindet. Fuer normale Code- oder UI-Arbeit reicht der relevante Sprint-Abschnitt plus die passenden SSOTs.

## Closeout-Regel

Am Ende jeder OnField-Aufgabe:

1. Memory Governance pruefen.
2. Current State, Decision Log oder Gotchas nur aktualisieren, wenn die Information qualifiziert.
3. Abschlussantwort nennt `Memory updated: <file>` oder `No memory update needed`.
