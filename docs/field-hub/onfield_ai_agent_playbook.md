# OnField AI Agent Playbook

Stand: 2026-07-04

## Zweck

Dieses Playbook beschreibt, wie KI-Agenten OnField-Arbeit vorbereiten, ausfuehren und pruefen sollen. Es ist kein Ersatz fuer die Roadmap, sondern eine kurze Arbeitsanweisung fuer wiederkehrende Agentenarbeit.

## Standard-Kontext und Context Routing

Vor OnField-App-Arbeit immer lesen:

1. `AGENTS.md`
2. `.agents/skills/rugby-field-hub-implementation/SKILL.md`
3. `docs/field-hub/onfield_decision_log.md`
4. `docs/field-hub/onfield_current_state.md`

Wenn Sprint 0A umgesetzt ist, zusaetzlich zuerst den Memory Index lesen:

- `docs/field-hub/memory/index.md`

Wenn der Memory Index noch nicht existiert, gilt als Fallback:

- Roadmap-/Sprintarbeit: relevante Abschnitte aus `docs/superpowers/plans/2026-07-04-onfield-ux-branding-transformation-roadmap.md` lesen.
- Produkt-/IA-Arbeit: relevante Roadmap-Abschnitte und `docs/field-hub/2026-07-04_ux_design_roadmap_principles.md` lesen.
- Design-/Brand-Arbeit: Branding-Research nur bei Bedarf lesen; spaeter bevorzugt Brand Kit und Designsystem-SSOT.
- UX-/Workflow-Arbeit: UX-Research nur bei Bedarf lesen; spaeter bevorzugt Product Brief, Component Inventory und passende Sprint-SSOTs.
- Codearbeit: zusaetzlich die betroffenen Dateien in `app/field-hub/src` lesen.

Je nach Aufgabe zusaetzlich passenden Skill laden:

- Roadmap-Sprintarbeit: `.agents/skills/onfield-roadmap-execution/SKILL.md`
- Designsystem/Brand/Tokens: `.agents/skills/onfield-design-system/SKILL.md`
- Screen-Umbau: `.agents/skills/onfield-screen-redesign/SKILL.md`
- PWA/A11y/Responsive QA: `.agents/skills/onfield-pwa-accessibility-qa/SKILL.md`

## Arbeitsregeln

- Ziel und Sprint-Scope zuerst restaten.
- Nur relevante SSOTs laden; nicht jede Research-Datei pauschal neu interpretieren.
- Keine spaeteren Sprints nebenbei umsetzen.
- iPhone und iPad immer gemeinsam denken.
- OnField-Naming verwenden.
- Keine medizinische Diagnose- oder Freigabe-Sprache.
- Keine realen sensiblen Spielerdaten committen.
- UI-Arbeit immer mit Designsystem/Token-Logik begruenden.

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

## Hook-Vorbereitung

Aktive Hooks werden jetzt noch nicht eingerichtet.

Spaetere Hook-Kandidaten:

- Secret-/Service-Role-Key-Check.
- Erinnerung, bei OnField-Code relevante Skills zu laden.
- Check auf verbotene medizinische Freigabe-Sprache.
- Check auf neue unkommentierte Hex-Farben im UI-Code.
- Stop-Hook mit kurzer Handover-Zusammenfassung.

Aktivierung erst, wenn:

- SSOTs existieren.
- Skills stabil sind.
- erste OnField-Sprints umgesetzt wurden.
- Hook-Vertrauen/Review bewusst erfolgt ist.

## Abschlussbericht pro Agentenlauf

Jeder Agentenlauf soll am Ende nennen:

- geaenderte Dateien.
- durchgefuehrte Verifikation.
- nicht ausgefuehrte Tests mit Grund.
- offene Risiken.
- naechster sinnvoller Schritt.
