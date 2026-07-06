# OnField Current State

Letztes Update: 2026-07-06

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
| Navigation | Sprint 6 hat die App-Shell im Code auf `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr` umgestellt. Sprint 8 hat `Einheit` als echten Arbeitscontainer mit Session Header, Session-Auswahl, Check-in/Training/Nachbereitung-Subnavigation und gemeinsamen Kontextstatus umgesetzt. Sprint 14 hat `Mehr` als ruhige Utility-Zone fuer `Bibliothek`, `Export & Backup`, `Einstellungen` und `Returner` geschaerft. |
| Designsystem | Sprint 5 hat das erste Core Component Kit in Code, Repo-Dokumentation und Figma-Sheet angelegt. Screen-weite Migrationen folgen spaeter. |
| PWA/Install | Sprint 7 hat Manifest-/Install-Metadaten, Brand-Surfaces und das eigene OnField Coach SVG/PNG-Icon-Set fuer PWA/iOS aktualisiert. Sprint 18 hat Offline-Navigation per App-Shell-Fallback, Settings-Display-Mode-Hinweise, sichtbare Disabled-Gruende und automatisierten PWA-Smoke fuer iPhone/iPad-Viewports ergaenzt. Sprint 19 hat eine Screen-by-Screen-QA-Matrix plus automatisierten Sprint-19-Visual-QA-Smoke fuer iPhone/iPad-Viewports ergaenzt. |
| iPhone | Hat in Sprint 6 die neue 5er-Bottom-Tab-Bar mit Safe-Area-Abstand erhalten; Unterbereiche bleiben erreichbar. |
| iPad | Hat in Sprint 6 die neue 5er-Sidebar plus Content-Struktur erhalten; Unterbereiche bleiben erreichbar. |
| Check-in | Sprint 9 ist umgesetzt: Check-in ist roster-first mit Listenzeilen, Ampel plus Textgrund, direkten Da/Nicht-da-Schnellaktionen und Detail-Sheet pro Spieler. Public/Kiosk, Reset, Legende, Mitnahmen und Notizen sind sekundaer erreichbar. |
| Training | Sprint 10 ist umgesetzt: Training ist live-block-first. Die aktuelle Phase ist sofort sichtbar; Start/Fortsetzen aktiviert erst Blockstatus, Capture und Live-Navigation. Die Athletenliste folgt direkt darunter, Quick Actions liegen im fokussierten Spieler-Sheet, Exposures/Timeline/Mapping/Varianten sind sekundaer erreichbar. |
| Nachbereitung | Sprint 11 ist umgesetzt: Nachbereitung ist queue-first mit Dauer oben, priorisierten Pflichtaufgaben, aktivem Detail-Schritt, `session_status` als Abschlussaufgabe und sekundaeren Bereichen fuer Exposures, Coach Review, Metrics, Exercise, Mini-Baseline und Spielerdetails. |
| Spieler | Sprint 12 ist umgesetzt: Spieler ist ein list-detail Athletenbereich. Die Liste bleibt zuerst, Profile starten mit aktuellem Status, letzter Teilnahme, aktuellen Limits, offenen Themen und kurzem Verlauf. Stammdaten, Consent, Foto-Status, Tests, Training, Load, Issues und Returner bleiben darunter bzw. in Detail-Tabs erreichbar. |
| Analyse | Sprint 13 ist umgesetzt: Analyse ist ein separater, ruhiger Auswertungsraum mit kompaktem Kontext, aktiven Filter-Chips, vier Coach-Fragen, Kernwerten und sekundaeren Detailpanels. Live-Erfassung, Check-in- und Trainingsaktionen bleiben ausserhalb der Analyse. |
| Mehr | Sprint 14 ist umgesetzt: Bibliothek ist Referenzbereich mit sichtbarem `Heute relevant`-Filter, Export & Backup trennt JSON-Backup, CSV-Tabellen und Import-Vorschau, und Einstellungen zeigen Sync-/Offline-/Backup-Zustaende mit coachnaher Sprache und sichtbaren Disabled-Gruenden. |
| Sync/Offline | Sprint 17 ist umgesetzt: Die App-Shell zeigt signed-in global einen kompakten Sync-Status mit Detailsheet, einheitlicher coachnaher Sprache, manueller Retry-Aktion, Backup-Hinweis und Public/Kiosk-Check-in-Detailgruppen. Background Sync bleibt PWA-best-effort und setzt iOS/Safari Background Sync nicht voraus. |
| Kiosk/Public | Sprint 15 ist umgesetzt: Public/Kiosk nutzen einen eigenen reduzierten Self-Check-in mit linearer Schrittfolge, Review vor Absenden, Abschlusszustand, Kiosk-Auto-Reset und ohne Coach-Notizen/Historie/Analyse. Public speichert keine lokale `submitted`-Marke mehr. |
| Brand-Surfaces | Sprint 7 hat eine wiederverwendbare `BrandSurface` fuer Auth, Welcome/Empty, Install, Public Check-in und Kiosk-Welcome eingefuehrt. Live-Coaching-Flows bleiben ohne Hero-Flaechen. |
| Sport-Konfiguration | Sprint 16 ist umgesetzt: `src/config/sports.ts` definiert eine kleine generische Config-Schicht, `src/config/onfieldRugby.ts` ist das einzige aktive Preset, `src/config/labels.ts` liefert erste UI-Labels, und bestehende Player-/Cluster-Exporte bleiben kompatibel. Erste Nutzung liegt in Spieler, Analyse, Training, Public Check-in und Kiosk Check-in. |

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
- Sprint 19 Visual QA: `docs/field-hub/2026-07-06_onfield_sprint19_visual_qa.md`
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
- Sprint 12 ist abgeschlossen: `Spieler` ist roster-/list-first, Profil-Detail oeffnet auf iPhone als Sheet und auf iPad als Pane, und das Profil startet arbeitsrelevant mit Status, Teilnahme, Limits, offenen Themen und kurzem Verlauf. OnField Rugby bleibt als erster Preset sichtbar, ohne eine Config-Engine oder Supabase-Migration einzufuehren.
- Sprint 13 ist abgeschlossen: `Analyse` ist ein eigener Auswertungsraum fuer Beobachten, Modifizieren, Progression und Rueckmeldung. Die Ansicht nutzt bestehende lokale Daten, verzichtet auf Live-Quick-Actions und behaelt iPhone/iPad-Funktionsparitaet.
- Sprint 14 ist abgeschlossen: `Mehr` ist als Utility-Zone geschaerft. Bibliothek/Export/Einstellungen bleiben Unterbereiche, Backup/Sync-Sprache ist coachnah, Import laeuft ueber Vorschau und explizite Bestaetigung, und das Figma Brand Board enthaelt den Frame `Sprint 14 Mehr Utility Zone`.
- Sprint 15 ist abgeschlossen: Public/Kiosk Check-in ist eine reduzierte eigene Experience. `SelfCheckInFlow` fuehrt linear durch Name, Readiness, Alltag, Schmerz, Veraenderung, Review und Abschluss; Kiosk setzt nach Abschluss automatisch zurueck, Public bleibt manuell wiederverwendbar.
- Sprint 16 ist abgeschlossen: Eine kleine statische Sport-Konfiguration ist im Code verankert. OnField Rugby ist weiterhin das einzige aktive Preset; es gibt keinen Runtime-Selector, keine zweite Sportart, keine Datenmigration und keine Supabase-Aenderung.
- Sprint 17 ist abgeschlossen: Sync, Backup und Offline-Kommunikation sind global vereinheitlicht. Der kompakte App-Shell-Status oeffnet ein Detailsheet mit offenen Bereichen, Public/Kiosk-Check-in-Konflikten, Backup-Status und manueller Retry-Aktion. Sync-Texte nutzen coachnahe Begriffe wie `lokal gespeichert`, `wartet auf Sync`, `zuletzt synchronisiert`, `Konflikt pruefen` und `offline`; rohe Queue-Begriffe bleiben aus der UI heraus.
- Sprint 18 ist abgeschlossen: PWA/Install und Accessibility Polish sind umgesetzt. Workbox nutzt einen Offline-App-Shell-Fallback, Settings zeigen Browser-/Home-Screen-Modus, Self-Check-in-Disabled-Actions haben sichtbare `aria-describedby`-Gruende, Legacy-Actions/PDF/Kiosk-Buttons teilen den sichtbaren Focus Ring, und `npm run test:e2e:pwa` prueft die iPhone-/iPad-Viewport-Matrix plus Offline-Fallback gegen den gebauten Preview.
- Sprint 19 ist abgeschlossen: Die Screen-by-Screen Full-Rollout-QA ist dokumentiert, `npm run test:e2e:sprint19` prueft die Sprint-19-Hauptscreens ueber iPhone-/iPad-Viewports, der signed-in Spielerbereich wurde mit Test-Credentials als Laufzeit-Env verifiziert, `npm run test:e2e:kiosk` verifiziert Remote-Kiosk-Submit mit temporaerem Seed und Cleanup, LUVI-Pattern wurden als QA-Referenz bewertet, alte englische Nachbereitungslabels wurden bereinigt, und medizinisch riskante Entscheidungs-/Freigabe-Sprache wurde aus sichtbarem App-Content ersetzt. Lazy-Error-UI ist zusaetzlich ueber einen deterministischen Boundary-Komponententest abgedeckt.

## Naechste empfohlene Schritte

1. Sprint 20 angehen: Externe Beta Readiness und Plattform-Entscheidungsvorbereitung.
2. Roadmap-Reihenfolge beibehalten und keine weiteren Sport-Presets vorziehen.

## Offene Risiken

| Risiko | Auswirkung | Naechster Schritt |
|---|---|---|
| Core Components sind noch nicht screen-weit ausgerollt. | Das Kit existiert, aber viele Screens nutzen weiterhin Legacy-Klassen und Inline-Muster. | In den naechsten Screen-Sprints gezielt migrieren, ohne Sprint-6-IA vorzuziehen. |
| iPhone wird wieder als Nebenansicht behandelt. | Externe Nutzung und App-Store-Perspektive werden geschwaecht. | iPhone-Paritaet in jedem Sprint pruefen. |
| Rugby bleibt teilweise noch in bestehenden Screens und Content hart verdrahtet. | Spaetere Sport-Presets brauchen weitere Extraktion und fachliche Validierung. | Nach Sprint 16 nur gezielt in geplanten Refactor-Sprints weiter extrahieren; keine zweite Sportart nebenbei einfuehren. |
| Memory wird als Archiv statt Router genutzt. | Agenten laden zu viel Kontext und das System wird traege. | Memory Governance und Index in jeder OnField-Session beachten. |
| Hook-Automatik erzeugt falsche Sicherheit. | Agenten verlassen sich auf Runtime Memory statt Memory Governance. | Sprint 0D-Runtime bleibt lokal/ignored, fail-open und unterhalb von AGENTS, Decision Log, Current State und SSOTs; Sprint 1 hat die Agentenregeln darauf synchronisiert. |
