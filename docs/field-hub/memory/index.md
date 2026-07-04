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
| Memory-Arbeit | `docs/field-hub/onfield_memory_governance.md`, `docs/field-hub/memory/gotchas.md` | lokale Runtime Knowledge in `.onfield-memory/knowledge/index.md` nur on-demand; LUVI-Referenzdateien auf SSD nur lesend und nur fuer Musterabgleich |
| Runtime-Memory-Arbeit | `.agents/skills/onfield-runtime-memory/SKILL.md`, `docs/field-hub/onfield_runtime_memory_faq.md`, `.onfield-memory/README.md` | relevante `.onfield-memory/scripts/` und `.onfield-memory/tests/` nur fuer den betroffenen Subbereich |
| Produkt/IA | `docs/field-hub/onfield_product_brief.md`, `docs/field-hub/onfield_sports_configuration_model.md`, relevante Roadmap-Abschnitte | `docs/field-hub/2026-07-04_ux_design_roadmap_principles.md`, UX Research bei unklaren Guardrails |
| Brand/Designsystem | `.agents/skills/onfield-design-system/SKILL.md`, `docs/field-hub/onfield_brand_kit.md`, `docs/field-hub/onfield_tone_of_voice.md`, `docs/field-hub/onfield_design_system.md`, `docs/field-hub/onfield_component_inventory.md` | Branding Research oder Figma-/Designsystem-Artefakte bei offenen Fragen |
| Screen-Redesign | `.agents/skills/onfield-screen-redesign/SKILL.md`, relevante Screen-Dateien in `app/field-hub/src`, `docs/field-hub/onfield_design_system.md`, `docs/field-hub/onfield_component_inventory.md` | UX/Branding Research bei offenen Layout- oder Markenfragen |
| PWA/A11y/Responsive QA | `.agents/skills/onfield-pwa-accessibility-qa/SKILL.md`, `docs/field-hub/onfield_pwa_accessibility_qa.md` | Browser-/Simulator-Checks, wenn UI betroffen ist |
| Codearbeit in `app/field-hub` | `.agents/skills/rugby-field-hub-implementation/SKILL.md`, betroffene Code- und Testdateien, relevante OnField-SSOTs | Roadmap nur relevanter Sprint-Abschnitt |
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

Nach Sprint 0B gelten diese SSOTs als primaere Arbeitsgrundlage:

- `docs/field-hub/onfield_product_brief.md`
- `docs/field-hub/onfield_brand_kit.md`
- `docs/field-hub/onfield_tone_of_voice.md`
- `docs/field-hub/onfield_design_system.md`
- `docs/field-hub/onfield_component_inventory.md`
- `docs/field-hub/onfield_sports_configuration_model.md`
- `docs/field-hub/onfield_pwa_accessibility_qa.md`

## Lokale Runtime Memory

Sprint 0D ergaenzt ein lokales, ignored Runtime-Memory unter `.onfield-memory/`.

- `knowledge/hot.md` darf bei SessionStart als kleiner Hot Cache angezeigt werden.
- `knowledge/index.md` ist nur on-demand Kontext fuer Memory-Arbeit oder wiederkehrende Workflow-Fragen.
- `daily/`, `captures/`, `reports/`, `backups/` und `orphans/` sind lokales Rohmaterial und keine SSOTs.
- Runtime Memory steht unter AGENTS, Decision Log, Current State und OnField-SSOTs.
- Agenten laden nicht automatisch alle generierten Knowledge-Artikel.
- Details stehen in `docs/field-hub/onfield_runtime_memory_faq.md`.

## Roadmap-Regel

Die komplette Roadmap wird nur gelesen, wenn Sprint-/Roadmap-Arbeit stattfindet. Fuer normale Code- oder UI-Arbeit reicht der relevante Sprint-Abschnitt plus die passenden SSOTs.

## Closeout-Regel

Am Ende jeder OnField-Aufgabe:

1. Memory Governance pruefen.
2. Current State, Decision Log oder Gotchas nur aktualisieren, wenn die Information qualifiziert.
3. Abschlussantwort nennt `Memory updated: <file>` oder `No memory update needed`.
