# OnField Current State

Letztes Update: 2026-07-05

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
  - `.agents/skills/onfield-runtime-memory/SKILL.md`

## Aktueller App-Zustand

| Bereich | Stand |
|---|---|
| Navigation | Sprint 2 hat die IA-Spezifikation fuer `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr` im Product Brief ergaenzt. App-Code hat aktuell noch die alte breite 10-Tab-Struktur. |
| Designsystem | Sprint 3 hat Brand Kit, Tone of Voice, Research-Synthese und Figma Brand Board fuer OnField Brand Foundation erstellt. Code-Tokens und Komponenten sind noch nicht angepasst. |
| PWA-Metadaten | Sprint 3 hat Manifest, HTML-Titel und iOS-App-Titel auf OnField Coach vorbereitet. Sichtbare App-Shell-Texte sind noch nicht umgebaut. |
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
- Sprint 3 Research-Synthese: `docs/field-hub/2026-07-05_onfield_brand_competitive_research_synthesis.md`
- Sprint 3 Figma Brand Board: `https://www.figma.com/design/BBaL4jQKLHeOC7tP5lajdW`
- Runtime Memory FAQ: `docs/field-hub/onfield_runtime_memory_faq.md`
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
  - `.agents/skills/onfield-runtime-memory/SKILL.md`
- Sprint 0C hat minimale passive Codex-Hooks aktiviert.
- Sprint 0D hat lokales Runtime Memory unter `.onfield-memory/` aktiviert:
  - `SessionStart` zeigt nur einen kleinen Hot Cache.
  - `Stop` und `PreCompact` capturen redigiertes Rohmaterial, schreiben lokale Daily Logs und triggern throttled Compile/Index/Lint.
  - `PostToolUse` prueft Schreibaktionen weiter auf klare Secret-Leaks und warnt bei Safety-/Memory-Risiken.
  - Runtime Memory ist lokal/ignored und darf keine SSOTs, keinen Decision Log, keinen Current State und keine Roadmap automatisch ersetzen.
- Sprint 1 ist abgeschlossen: Agenten-Setup, Roadmap-Sprinttext, Skill-/Runtime-Hinweise, Agent Playbook und Memory-Gotchas sind auf Sprint 0C/0D synchronisiert.
- Sprint 2 ist abgeschlossen: Product Brief und Component Inventory spezifizieren die neue IA, alte/neue Tab-Mappings, iPhone/iPad-Zugriff, Back/Close-Verhalten und spaetere Code-Migrationspunkte. App-Code wurde in Sprint 2 nicht umgebaut.
- Sprint 3 ist abgeschlossen: OnField Brand Foundation, Marketing-/Hero-System, Research-Synthese, Figma Brand Board und PWA-Metadaten wurden umgesetzt. Sichtbare Live-Coaching-UI blieb bewusst unveraendert.

## Naechste empfohlene Schritte

1. Sprint 4 angehen: Design Tokens und Theme Foundation.
2. Danach Roadmap-Reihenfolge beibehalten: Core Component Kit, dann App Shell und Navigation implementieren.

## Offene Risiken

| Risiko | Auswirkung | Naechster Schritt |
|---|---|---|
| Alte Navigation bleibt zu lange bestehen. | Neue Marke wirkt weiterhin wie altes Dashboard. | App-Shell-Sprint nach Brand-/Komponenten-Foundation umsetzen. |
| Designsystem bleibt nur dokumentiert. | Code, Figma/Designartefakt und SSOT koennen auseinanderlaufen. | Sprint 4 Tokens im Code mappen und Figma/SSOT synchron halten. |
| iPhone wird wieder als Nebenansicht behandelt. | Externe Nutzung und App-Store-Perspektive werden geschwaecht. | iPhone-Paritaet in jedem Sprint pruefen. |
| Rugby bleibt im Code zu stark in generischer Architektur. | Multi-Sport-Faehigkeit wird spaeter teuer. | Sport-Konfiguration schrittweise extrahieren. |
| Memory wird als Archiv statt Router genutzt. | Agenten laden zu viel Kontext und das System wird traege. | Memory Governance und Index in jeder OnField-Session beachten. |
| Hook-Automatik erzeugt falsche Sicherheit. | Agenten verlassen sich auf Runtime Memory statt Memory Governance. | Sprint 0D-Runtime bleibt lokal/ignored, fail-open und unterhalb von AGENTS, Decision Log, Current State und SSOTs; Sprint 1 hat die Agentenregeln darauf synchronisiert. |
