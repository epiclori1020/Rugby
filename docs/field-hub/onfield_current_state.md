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
| Navigation | Sprint 6 hat die App-Shell im Code auf `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr` umgestellt. Sprint 8 hat `Einheit` als echten Arbeitscontainer mit Session Header, Session-Auswahl, Check-in/Training/Nachbereitung-Subnavigation und gemeinsamen Kontextstatus umgesetzt. `Mehr` fuehrt `Bibliothek`, `Export & Backup`, `Einstellungen`, `Returner`. |
| Designsystem | Sprint 5 hat das erste Core Component Kit in Code, Repo-Dokumentation und Figma-Sheet angelegt. Screen-weite Migrationen folgen spaeter. |
| PWA-Metadaten | Sprint 7 hat Manifest-/Install-Metadaten, Brand-Surfaces und das eigene OnField Coach SVG/PNG-Icon-Set fuer PWA/iOS aktualisiert. |
| iPhone | Hat in Sprint 6 die neue 5er-Bottom-Tab-Bar mit Safe-Area-Abstand erhalten; Unterbereiche bleiben erreichbar. |
| iPad | Hat in Sprint 6 die neue 5er-Sidebar plus Content-Struktur erhalten; Unterbereiche bleiben erreichbar. |
| Check-in | Sprint 9 ist umgesetzt: Check-in ist roster-first mit Listenzeilen, Ampel plus Textgrund, direkten Da/Nicht-da-Schnellaktionen und Detail-Sheet pro Spieler. Public/Kiosk, Reset, Legende, Mitnahmen und Notizen sind sekundaer erreichbar. |
| Training | Sprint 10 ist umgesetzt: Training ist live-block-first. Die aktuelle Phase ist sofort sichtbar; Start/Fortsetzen aktiviert erst Blockstatus, Capture und Live-Navigation. Die Athletenliste folgt direkt darunter, Quick Actions liegen im fokussierten Spieler-Sheet, Exposures/Timeline/Mapping/Varianten sind sekundaer erreichbar. |
| Nachbereitung | Sprint 11 ist umgesetzt: Nachbereitung ist queue-first mit Dauer oben, priorisierten Pflichtaufgaben, aktivem Detail-Schritt, `session_status` als Abschlussaufgabe und sekundaeren Bereichen fuer Exposures, Coach Review, Metrics, Exercise, Mini-Baseline und Spielerdetails. |
| Sync/Offline | Pending/Sync-Logik existiert, muss global ruhiger und einheitlicher kommuniziert werden. |
| Kiosk/Public | Separate Komponenten existieren und sollen als eigene reduzierte Experience weiterentwickelt werden. |
| Brand-Surfaces | Sprint 7 hat eine wiederverwendbare `BrandSurface` fuer Auth, Welcome/Empty, Install, Public Check-in und Kiosk-Welcome eingefuehrt. Live-Coaching-Flows bleiben ohne Hero-Flaechen. |
| Sport-Konfiguration | Sprint 0B hat das SSOT fuer generische Kernobjekte und OnField Rugby als ersten Preset erstellt. Code ist noch nicht extrahiert. |

## Aktuelle massgebliche Dokumente

- Roadmap: `docs/superpowers/plans/2026-07-04-onfield-ux-branding-transformation-roadmap.md`
- Product Brief: `docs/field-hub/onfield_product_brief.md`
- Brand Kit: `docs/field-hub/onfield_brand_kit.md`
- Tone of Voice: `docs/field-hub/onfield_tone_of_voice.md`
- Designsystem: `docs/field-hub/onfield_design_system.md`
- Token Sheet: `docs/field-hub/onfield_token_sheet.md`
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
- Sprint 4 ist abgeschlossen: `app/field-hub/src/design/tokens.css` ist die technische Token-Quelle fuer Field Graphite, `docs/field-hub/onfield_token_sheet.md` dokumentiert die Token-Map und das bestehende Figma Brand Board hat eine Sprint-4-Token-Sheet-Seite.
- Sprint 5 ist abgeschlossen: Das Core Component Kit liegt unter `app/field-hub/src/components/ui/` und `app/field-hub/src/components/onfield/`, ist durch fokussierte Komponententests abgedeckt, im Component Inventory gemappt und im Figma Brand Board als `Sprint 5 Core Component Kit` gespiegelt.
- Sprint 6 ist abgeschlossen: App Shell und Navigation nutzen im Code die neue 5er-Hauptnavigation; bestehende Screens bleiben ueber kompatibles `HubTab`-Mapping erreichbar.
- Sprint 7 ist abgeschlossen: Auth, Today-Empty/Welcome, Settings-Install, Public Check-in und Kiosk-Welcome nutzen OnField Brand-Surfaces; PWA/iOS-Icons sind als eigenes OnField Coach SVG/PNG-Set aktualisiert.
- Sprint 8 ist abgeschlossen: `Einheit` besitzt jetzt den gemeinsamen Session-Workspace fuer Check-in, Training und Nachbereitung. Die Child-Screens sind nur eingebettet und noch nicht final roster-/live-/queue-first umgebaut.
- Sprint 9 ist abgeschlossen: Check-in wurde roster-first umgebaut; die alte Kartenwand ist durch scannbare Roster-Zeilen mit Statusgrund und 1-2 Quick Actions ersetzt.
- Sprint 10 ist abgeschlossen: Training wurde live-block-first umgebaut; die aktuelle Phase ist auch vor `Training starten` sichtbar, Spieleraktionen sind fokussiert statt permanente Button-Wand, und Exposures/Mapping/Timeline sind sekundaere Panels.
- Sprint 11 ist abgeschlossen: Nachbereitung wurde als echte Aufgabenqueue umgesetzt; Dauer steht einmal oben, Pflichtwerte/Abschluss/sekundaere Aufgaben sind priorisiert, und iPhone/iPad behalten denselben fachlichen Funktionsumfang.

## Naechste empfohlene Schritte

1. Sprint 12 angehen: Spieler/Athletenbereich und sportartenuebergreifende Profile.
2. Danach Roadmap-Reihenfolge beibehalten und die Sprint-5-Komponenten schrittweise in Screen-Sprints nutzen.

## Offene Risiken

| Risiko | Auswirkung | Naechster Schritt |
|---|---|---|
| Spielerbereich ist noch nicht auf den naechsten Roadmap-Scope umgebaut. | Nach Check-in, Training und Nachbereitung ist der Athletenbereich der naechste zentrale Live-/Profilbereich mit potenzieller Legacy-Dichte. | In Sprint 12 Spieler/Athletenbereich und sportartenuebergreifende Profile gezielt migrieren, ohne spaetere Features vorzuziehen. |
| Core Components sind noch nicht screen-weit ausgerollt. | Das Kit existiert, aber viele Screens nutzen weiterhin Legacy-Klassen und Inline-Muster. | In den naechsten Screen-Sprints gezielt migrieren, ohne Sprint-6-IA vorzuziehen. |
| iPhone wird wieder als Nebenansicht behandelt. | Externe Nutzung und App-Store-Perspektive werden geschwaecht. | iPhone-Paritaet in jedem Sprint pruefen. |
| Rugby bleibt im Code zu stark in generischer Architektur. | Multi-Sport-Faehigkeit wird spaeter teuer. | Sport-Konfiguration schrittweise extrahieren. |
| Memory wird als Archiv statt Router genutzt. | Agenten laden zu viel Kontext und das System wird traege. | Memory Governance und Index in jeder OnField-Session beachten. |
| Hook-Automatik erzeugt falsche Sicherheit. | Agenten verlassen sich auf Runtime Memory statt Memory Governance. | Sprint 0D-Runtime bleibt lokal/ignored, fail-open und unterhalb von AGENTS, Decision Log, Current State und SSOTs; Sprint 1 hat die Agentenregeln darauf synchronisiert. |
