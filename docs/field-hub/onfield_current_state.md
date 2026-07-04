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
| Designsystem | Es gibt CSS-Variablen und viele bestehende UI-Muster, aber noch kein vollstaendiges OnField Token-/Komponenten-SSOT. |
| iPhone | Muss kuenftig vollen Funktionsumfang haben; Ziel ist Bottom Tab Bar plus Sheets/Stacks. |
| iPad | Soll Sidebar + Content + optional Detailpane nutzen. |
| Check-in | Hat bereits Ansaetze fuer Finder/Rows/Sheet, muss aber roster-first und sekundaer strukturierter werden. |
| Training | Hat Live-Session- und Exposure-Logik, muss aber staerker live-block-first werden. |
| Nachbereitung | `MissingValuesPanel` ist ein guter Anfang fuer Queue-first, aber noch nicht Hauptworkflow. |
| Sync/Offline | Pending/Sync-Logik existiert, muss global ruhiger und einheitlicher kommuniziert werden. |
| Kiosk/Public | Separate Komponenten existieren und sollen als eigene reduzierte Experience weiterentwickelt werden. |
| Sport-Konfiguration | Rugby ist faktisch hart im Produktkontext verankert; Ziel ist OnField Rugby als erster Preset mit spaeterer Multi-Sport-Faehigkeit. |

## Aktuelle massgebliche Dokumente

- Roadmap: `docs/superpowers/plans/2026-07-04-onfield-ux-branding-transformation-roadmap.md`
- UX Research: `docs/field-hub/2026-07-04_deep_research_ux_ui_guardrails.md`
- Branding Research: `docs/field-hub/2026-07-04_deep_research_branding_design_system.md`
- Roadmap-Prinzipien: `docs/field-hub/2026-07-04_ux_design_roadmap_principles.md`
- Decision Log: `docs/field-hub/onfield_decision_log.md`
- Agent Playbook: `docs/field-hub/onfield_ai_agent_playbook.md`

## Geplantes Memory-System

- OnField soll ein schlankes, LUVI-/Karpathy-inspiriertes Memory-System bekommen.
- Ziel ist nicht mehr Kontext, sondern besseres Context Routing: Agenten sollen nur die fuer ihre Aufgabe relevanten SSOTs, Researches und Skills laden.
- Sprint 0A ist dafuer vor den SSOT-Freeze gesetzt.
- Geplante Sprint-0A-Dateien:
  - `docs/field-hub/onfield_memory_governance.md`
  - `docs/field-hub/memory/index.md`
  - `docs/field-hub/memory/gotchas.md`
- `docs/field-hub/onfield_ai_agent_playbook.md` wurde bereits auf gezieltes Context Routing statt pauschales Roadmap-Voll-Laden umgestellt.
- Hooks sollen hoechstens als Absicherung dienen, z.B. fuer Stop-/PreCompact-Memory-Checks. Sie duerfen nicht blind unkontrollierte Memories schreiben.

## Naechste empfohlene Schritte

1. Sprint 0A planen/umsetzen: Memory Governance, Memory Index, Gotchas und Memory-Closeout-Regeln fuer Skills.
2. Danach Sprint 0B aus der OnField-Roadmap vervollstaendigen: SSOTs fuer Product Brief, Brand Kit, Tone of Voice, Designsystem, Component Inventory, Sports Configuration und PWA/A11y QA erstellen.
3. Danach Sprint 2 angehen: IA-Spezifikation fuer `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr` ausarbeiten.
4. Danach App Shell planen/implementieren, bevor einzelne Screens gross umgebaut werden.

## Offene Risiken

| Risiko | Auswirkung | Naechster Schritt |
|---|---|---|
| Alte Navigation bleibt zu lange bestehen. | Neue Marke wirkt weiterhin wie altes Dashboard. | IA-Sprint priorisieren. |
| Designsystem wird nur in CSS gebaut. | Spaetere Agenten und ggf. Figma/Native-Arbeit verlieren Orientierung. | Figma oder gleichwertiges Designsystem-Artefakt ab Sprint 3-5 erstellen. |
| iPhone wird wieder als Nebenansicht behandelt. | Externe Nutzung und App-Store-Perspektive werden geschwaecht. | iPhone-Paritaet in jedem Sprint pruefen. |
| Rugby bleibt zu stark in generischer Architektur. | Multi-Sport-Faehigkeit wird spaeter teuer. | Sport-Konfiguration schrittweise extrahieren. |
| Memory wird als Archiv statt Router gebaut. | Agenten laden zu viel Kontext und das System wird traege. | Sprint 0A muss Context Routing und Memory-Governance vor SSOT-Freeze klaeren. |
| Aktive Hooks kommen zu frueh. | Agentenworkflow wird schwerer wartbar. | Hooks erst nach klarer Memory-Governance vorbereiten oder aktivieren. |
