# OnField Current State

Letztes Update: 2026-07-04

## Aktueller Produktname

- Hauptmarke: OnField.
- Aktuelle App: OnField Coach.
- Erster Sport-Preset: OnField Rugby.
- Spaetere Plattformrichtung: OnField Performance.

## Technischer Ort

- App-Code: `app/field-hub`.
- Framework: Vite + React + TypeScript.
- Offline/PWA: Vite PWA, IndexedDB/Dexie, Pending-Write-Logik.
- Sync/Auth: Supabase Client vorhanden; Supabase bleibt schlank und clientseitig.
- Bestehender App-Skill: `.agents/skills/rugby-field-hub-implementation/SKILL.md`, jetzt auf OnField erweitert.
- Neue OnField-Skills:
  - `.agents/skills/onfield-roadmap-execution/SKILL.md`
  - `.agents/skills/onfield-design-system/SKILL.md`
  - `.agents/skills/onfield-screen-redesign/SKILL.md`
  - `.agents/skills/onfield-pwa-accessibility-qa/SKILL.md`

## Aktueller App-Zustand

| Bereich | Stand |
|---|---|
| Navigation | App hat aktuell noch die alte breite Tab-Struktur mit vielen Hauptbereichen. Ziel ist `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr`. |
| Designsystem | Sprint 0B hat Brand-, Token- und Komponenten-SSOTs erstellt. Code und Figma/Designartefakte sind noch nicht angepasst. |
| iPhone | Muss kuenftig vollen Funktionsumfang haben; Ziel ist Bottom Tab Bar plus Sheets/Stacks. |
| iPad | Soll Sidebar + Content + optional Detailpane nutzen. |
| Check-in | Hat bereits Ansaetze fuer Finder/Rows/Sheet, muss aber roster-first und sekundaer strukturierter werden. |
| Training | Hat Live-Session- und Exposure-Logik, muss aber staerker live-block-first werden. |
| Nachbereitung | `MissingValuesPanel` ist ein guter Anfang fuer Queue-first, aber noch nicht Hauptworkflow. |
| Sync/Offline | Pending/Sync-Logik existiert, muss global ruhiger und einheitlicher kommuniziert werden. |
| Kiosk/Public | Separate Komponenten existieren und sollen als eigene reduzierte Experience weiterentwickelt werden. |
| Sport-Konfiguration | Sprint 0B hat das SSOT fuer generische Kernobjekte und OnField Rugby als ersten Preset erstellt. Code ist noch nicht extrahiert. |

## Aktuelle massgebliche Dokumente

- Roadmap: `docs/superpowers/plans/2026-07-04-onfield-ux-branding-transformation-roadmap.md`
- Product Brief: `docs/field-hub/onfield_product_brief.md`
- Brand Kit: `docs/field-hub/onfield_brand_kit.md`
- Tone of Voice: `docs/field-hub/onfield_tone_of_voice.md`
- Designsystem: `docs/field-hub/onfield_design_system.md`
- Component Inventory: `docs/field-hub/onfield_component_inventory.md`
- Sports Configuration Model: `docs/field-hub/onfield_sports_configuration_model.md`
- PWA/A11y QA: `docs/field-hub/onfield_pwa_accessibility_qa.md`
- UX Research: `docs/field-hub/2026-07-04_deep_research_ux_ui_guardrails.md`
- Branding Research: `docs/field-hub/2026-07-04_deep_research_branding_design_system.md`
- Roadmap-Prinzipien: `docs/field-hub/2026-07-04_ux_design_roadmap_principles.md`
- Decision Log: `docs/field-hub/onfield_decision_log.md`
- Agent Playbook: `docs/field-hub/onfield_ai_agent_playbook.md`
- Memory Governance: `docs/field-hub/onfield_memory_governance.md`
- Memory Index: `docs/field-hub/memory/index.md`
- Gotchas: `docs/field-hub/memory/gotchas.md`

## Aktives Memory-System

- OnField nutzt ein schlankes, LUVI-/Karpathy-inspiriertes Memory-System v1.
- Ziel ist nicht mehr Kontext, sondern besseres Context Routing: Agenten sollen nur die fuer ihre Aufgabe relevanten SSOTs, Researches und Skills laden.
- Sprint 0A ist abgeschlossen.
- Sprint 0B ist abgeschlossen: Product Brief, Brand Kit, Tone of Voice, Designsystem, Component Inventory, Sports Configuration und PWA/A11y QA existieren als SSOTs.
- Aktive Memory-Dateien:
  - `docs/field-hub/onfield_memory_governance.md`
  - `docs/field-hub/memory/index.md`
  - `docs/field-hub/memory/gotchas.md`
- `docs/field-hub/onfield_ai_agent_playbook.md` wurde auf gezieltes Context Routing und SSOT-first nach Sprint 0B umgestellt.
- Die OnField-Skills enthalten Memory-Closeout-Regeln:
  - `.agents/skills/rugby-field-hub-implementation/SKILL.md`
  - `.agents/skills/onfield-roadmap-execution/SKILL.md`
  - `.agents/skills/onfield-design-system/SKILL.md`
  - `.agents/skills/onfield-screen-redesign/SKILL.md`
  - `.agents/skills/onfield-pwa-accessibility-qa/SKILL.md`
- Hooks sind nicht aktiv. Sie bleiben ein spaeterer Pruefpunkt.

## Naechste empfohlene Schritte

1. Sprint 0C durchfuehren: Hook Review & Automation Guardrails, ohne blinde Memory-Automatik.
2. Danach Sprint 1 als Agenten-Setup Review & Finalisierung ausfuehren.
3. Danach Sprint 2 angehen: IA-Spezifikation fuer `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr` ausarbeiten.
4. Danach App Shell planen/implementieren, bevor einzelne Screens gross umgebaut werden.

## Offene Risiken

| Risiko | Auswirkung | Naechster Schritt |
|---|---|---|
| Alte Navigation bleibt zu lange bestehen. | Neue Marke wirkt weiterhin wie altes Dashboard. | IA-Sprint priorisieren. |
| Designsystem bleibt nur dokumentiert. | Code, Figma/Designartefakt und SSOT koennen auseinanderlaufen. | Figma oder gleichwertiges Designsystem-Artefakt ab Sprint 3-5 erstellen und Tokens im Code mappen. |
| iPhone wird wieder als Nebenansicht behandelt. | Externe Nutzung und App-Store-Perspektive werden geschwaecht. | iPhone-Paritaet in jedem Sprint pruefen. |
| Rugby bleibt im Code zu stark in generischer Architektur. | Multi-Sport-Faehigkeit wird spaeter teuer. | Sport-Konfiguration schrittweise extrahieren. |
| Memory wird als Archiv statt Router genutzt. | Agenten laden zu viel Kontext und das System wird traege. | Memory Governance und Index in jeder OnField-Session beachten. |
| Aktive Hooks kommen zu frueh. | Agentenworkflow wird schwerer wartbar. | Hooks erst in Sprint 0C pruefen; Sprint 0A hat keine aktiven Hooks eingerichtet. |
