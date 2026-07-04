# OnField AI Agent Playbook

Stand: 2026-07-04

## Zweck

Dieses Playbook beschreibt, wie KI-Agenten OnField-Arbeit vorbereiten, ausfuehren und pruefen sollen. Es ist kein Ersatz fuer die Roadmap, sondern eine kurze Arbeitsanweisung fuer wiederkehrende Agentenarbeit.

## Standard-Kontext und Context Routing

Vor OnField-App-Arbeit immer lesen:

1. `AGENTS.md`
2. `docs/field-hub/memory/index.md`
3. `docs/field-hub/onfield_decision_log.md`
4. `docs/field-hub/onfield_current_state.md`

Danach nur die fuer die Aufgabe relevanten Dateien laden. Der Memory Index ist der primaere Context Router.

Wenn der Memory Index in einer alten Branch-/Session-Situation fehlt, gilt als Fallback:

- Roadmap-/Sprintarbeit: relevante Abschnitte aus `docs/superpowers/plans/2026-07-04-onfield-ux-branding-transformation-roadmap.md` lesen.
- Produkt-/IA-Arbeit: `docs/field-hub/onfield_product_brief.md`, `docs/field-hub/onfield_sports_configuration_model.md` und relevante Roadmap-Abschnitte lesen.
- Design-/Brand-Arbeit: `docs/field-hub/onfield_brand_kit.md`, `docs/field-hub/onfield_tone_of_voice.md`, `docs/field-hub/onfield_design_system.md` und `docs/field-hub/onfield_component_inventory.md` lesen.
- UX-/Workflow-Arbeit: `docs/field-hub/onfield_product_brief.md`, `docs/field-hub/onfield_component_inventory.md` und passende Sprint-SSOTs lesen.
- PWA/A11y-Arbeit: `docs/field-hub/onfield_pwa_accessibility_qa.md` lesen.
- Codearbeit: zusaetzlich die betroffenen Dateien in `app/field-hub/src` lesen.

Die langen Research-Dateien bleiben Quellenmaterial:

- `docs/field-hub/2026-07-04_deep_research_ux_ui_guardrails.md`
- `docs/field-hub/2026-07-04_deep_research_branding_design_system.md`

Sie werden nur geladen, wenn eine Frage nicht aus den SSOTs, dem Current State oder dem Decision Log ableitbar ist.

Je nach Aufgabe zusaetzlich passenden Skill laden:

- Code/App-Arbeit: `.agents/skills/rugby-field-hub-implementation/SKILL.md`
- Roadmap-Sprintarbeit: `.agents/skills/onfield-roadmap-execution/SKILL.md`
- Designsystem/Brand/Tokens: `.agents/skills/onfield-design-system/SKILL.md`
- Screen-Umbau: `.agents/skills/onfield-screen-redesign/SKILL.md`
- PWA/A11y/Responsive QA: `.agents/skills/onfield-pwa-accessibility-qa/SKILL.md`
- Runtime-Memory-Arbeit: `.agents/skills/onfield-runtime-memory/SKILL.md`

## Arbeitsregeln

- Ziel und Sprint-Scope zuerst restaten.
- Nur relevante SSOTs laden; nicht jede Research-Datei pauschal neu interpretieren.
- Keine spaeteren Sprints nebenbei umsetzen.
- iPhone und iPad immer gemeinsam denken.
- OnField-Naming verwenden.
- Keine medizinische Diagnose- oder Freigabe-Sprache.
- Keine realen sensiblen Spielerdaten committen.
- UI-Arbeit immer mit Designsystem/Token-Logik begruenden.
- Nach jeder OnField-Aufgabe Memory-Closeout durchfuehren.

## SSOT-Routing nach Sprint 0B

| Aufgabe | Primaere SSOTs |
|---|---|
| Produkt, Positionierung, MVP-Grenzen | `onfield_product_brief.md` |
| Brand, App-Icon, Install-/Marketing-Surfaces | `onfield_brand_kit.md`, `onfield_tone_of_voice.md` |
| Copy, Safety, Sync, Fehler, Empty/Disabled States | `onfield_tone_of_voice.md` |
| Tokens, Layout, Status, Accessibility-Regeln | `onfield_design_system.md` |
| Komponentenwahl und Screen-Muster | `onfield_component_inventory.md` |
| Rugby vs. generische Architektur | `onfield_sports_configuration_model.md` |
| iPhone/iPad/PWA/A11y/Offline QA | `onfield_pwa_accessibility_qa.md` |

## Memory Closeout

Vor der finalen Antwort pruefen:

1. Muss `docs/field-hub/onfield_current_state.md` aktualisiert werden?
2. Muss `docs/field-hub/onfield_decision_log.md` fuer eine dauerhafte Entscheidung aktualisiert werden?
3. Muss `docs/field-hub/memory/gotchas.md` fuer eine wiederholbare Falle oder Lesson aktualisiert werden?
4. Aktualisiere nur die passende Memory-Datei, wenn `docs/field-hub/onfield_memory_governance.md` die Information qualifiziert.
5. In der finalen Antwort eine der folgenden Zeilen nennen:
   - `Memory updated: <file>`
   - `No memory update needed`

## Empfohlene Tool-Nutzung

- Figma Plugin/MCP: Designsystem, Brand Board, Komponenten, Mockups.
- Browser/Chrome DevTools: visuelle QA, Responsive Checks, DOM/CSS-Inspektion.
- Supabase Skill/MCP: Auth, Schema, RLS, Sync, Migrationen.
- GitHub Plugin/Connector: Issues, PRs, Reviews, CI.
- Vercel Plugin/Connector: Preview Deployments und Deployment-QA.
- OpenAI Docs Skill/MCP: aktuelle OpenAI-/Codex-Dokumentation.

## Subagents und Worktrees

- Subagents sind sinnvoll fuer read-heavy Aufgaben: Inventar, QA-Audit, Test-Sichtung, Research-Synthese.
- Parallele schreibende UI-Umbauten vermeiden, weil Konflikte wahrscheinlich sind.
- Worktrees sind sinnvoll, wenn mehrere Sprint-Aufgaben parallel laufen sollen.

## Aktive Hook- und Runtime-Memory-Regeln

Sprint 0C aktiviert minimale passive Codex-Hooks in `.codex/hooks.json`. Sprint 0D ergaenzt lokales Runtime Memory unter `.onfield-memory/`.

Aktive Checks:

- `SessionStart` zeigt nur den kleinen Hot Cache aus `.onfield-memory/knowledge/hot.md`, falls vorhanden.
- `Stop` und `PreCompact` capturen redigiertes lokales Rohmaterial, schreiben Daily Logs, triggern throttled Compile/Index/Lint und erinnern weiter an Memory-Closeout.
- `PostToolUse` nach Schreibaktionen prueft Diffs auf klare Secret-Leaks.
- Safety- und Memory-State-Hinweise warnen, ohne den Agenten zu ersetzen.

Regeln:

- Runtime Memory ist lokal, ignored und nicht kanonisch.
- Hooks duerfen `.onfield-memory/` verwalten, aber keine OnField-SSOTs, keinen Current State, keinen Decision Log und keine Roadmap automatisch ersetzen.
- Agenten laden generierte Knowledge-Artikel nur on-demand ueber den Memory Index.
- Klare Secret-Muster duerfen blockieren.
- Safety-/Memory-Hinweise sind Warnungen und muessen vom Agenten bewertet werden.
- Falls Codex beim ersten Hook-Lauf Trust/Approval verlangt: Hook bewusst pruefen und bestaetigen, nicht `--dangerously-bypass-hook-trust` nutzen.
- Weitere Hooks nur nach wiederholbarem Nutzen und neuer Entscheidung ergaenzen.
- Fuer Details und Standardchecks: `docs/field-hub/onfield_runtime_memory_faq.md`.

## Abschlussbericht pro Agentenlauf

Jeder Agentenlauf soll am Ende nennen:

- geaenderte Dateien.
- durchgefuehrte Verifikation.
- Memory updated / no memory update needed.
- nicht ausgefuehrte Tests mit Grund.
- offene Risiken.
- naechster sinnvoller Schritt.
