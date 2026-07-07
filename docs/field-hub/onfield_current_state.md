# OnField Current State

Letztes Update: 2026-07-07

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
| Navigation | Sprint 6 hat die App-Shell im Code auf `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr` umgestellt. Sprint 8 hat `Einheit` als echten Arbeitscontainer mit Session Header, Session-Auswahl, Check-in/Training/Nachbereitung-Subnavigation und gemeinsamen Kontextstatus umgesetzt. Sprint 14 hat `Mehr` als ruhige Utility-Zone fuer `Bibliothek`, `Export & Backup`, `Einstellungen` und `Returner` geschaerft. Sprint 24 hat das alte interne Tab-Modell durch kanonische Coach-Routen (`#/today`, `#/unit/...`, `#/more/...`) mit Legacy-Hash-Normalisierung und Back/Forward-Sync ersetzt. |
| Designsystem | Sprint 5 hat das erste Core Component Kit in Code, Repo-Dokumentation und Figma-Sheet angelegt. Sprint 25 hat priorisierte Action-Stellen auf bessere Disabled-/Loading-Semantik und `--of-*`-nahe Patterns gehaertet; screen-weite Migrationen folgen weiter gezielt. |
| PWA/Install | Sprint 7 hat Manifest-/Install-Metadaten, Brand-Surfaces und das eigene OnField Coach SVG/PNG-Icon-Set fuer PWA/iOS aktualisiert. Sprint 18 hat Offline-Navigation per App-Shell-Fallback, Settings-Display-Mode-Hinweise, sichtbare Disabled-Gruende und automatisierten PWA-Smoke fuer iPhone/iPad-Viewports ergaenzt. Sprint 19 hat eine Screen-by-Screen-QA-Matrix plus automatisierten Sprint-19-Visual-QA-Smoke fuer iPhone/iPad-Viewports ergaenzt. Sprint 20 hat die kontrollierte externe Beta-Readiness, PWA-Install-/QA-Kriterien und Native/SaaS-Entscheidungskriterien dokumentiert. Sprint 21 hat `qa:local` und `qa:beta` als harte QA-Gates ergaenzt; post-roadmap ist `qa:local` um maschinenlesbare Reports, Browser-Error-Fails und Returner in der Visual-Matrix gehaertet. Sprint 23 hat `npm run supabase:audit` als Supabase/Auth/RLS-Gate in beide QA-Gates eingebunden. Sprint 25 hat Medium-Viewport-QA (`744px`) und maskable PWA-Icons ergaenzt. Sprint 26 hat den finalen Beta-/Evidence-Closeout und die README-/Memory-Verweise aktualisiert. |
| iPhone | Hat in Sprint 6 die neue 5er-Bottom-Tab-Bar mit Safe-Area-Abstand erhalten; Unterbereiche bleiben erreichbar. |
| iPad | Hat in Sprint 6 die neue 5er-Sidebar plus Content-Struktur erhalten; Unterbereiche bleiben erreichbar. |
| Check-in | Sprint 9 ist umgesetzt: Check-in ist roster-first mit Listenzeilen, Ampel plus Textgrund, direkten Da/Nicht-da-Schnellaktionen und Detail-Sheet pro Spieler. Public/Kiosk, Reset, Legende, Mitnahmen und Notizen sind sekundaer erreichbar. |
| Training | Sprint 10 ist umgesetzt: Training ist live-block-first. Die aktuelle Phase ist sofort sichtbar; Start/Fortsetzen aktiviert erst Blockstatus, Capture und Live-Navigation. Die Athletenliste folgt direkt darunter, Quick Actions liegen im fokussierten Spieler-Sheet, Exposures/Timeline/Mapping/Varianten sind sekundaer erreichbar. |
| Nachbereitung | Sprint 11 ist umgesetzt: Nachbereitung ist queue-first mit Dauer oben, priorisierten Pflichtaufgaben, aktivem Detail-Schritt, `session_status` als Abschlussaufgabe und sekundaeren Bereichen fuer Exposures, Coach Review, Metrics, Exercise, Mini-Baseline und Spielerdetails. |
| Spieler | Sprint 12 ist umgesetzt: Spieler ist ein list-detail Athletenbereich. Die Liste bleibt zuerst, Profile starten mit aktuellem Status, letzter Teilnahme, aktuellen Limits, offenen Themen und kurzem Verlauf. Stammdaten, Consent, Foto-Status, Tests, Training, Load, Issues und Returner bleiben darunter bzw. in Detail-Tabs erreichbar. |
| Analyse | Sprint 13 ist umgesetzt: Analyse ist ein separater, ruhiger Auswertungsraum mit kompaktem Kontext, aktiven Filter-Chips, vier Coach-Fragen, Kernwerten und sekundaeren Detailpanels. Live-Erfassung, Check-in- und Trainingsaktionen bleiben ausserhalb der Analyse. |
| Mehr | Sprint 14 ist umgesetzt: Bibliothek ist Referenzbereich mit sichtbarem `Heute relevant`-Filter, Export & Backup trennt JSON-Backup, CSV-Tabellen und Import-Vorschau, und Einstellungen zeigen Sync-/Offline-/Backup-Zustaende mit coachnaher Sprache und sichtbaren Disabled-Gruenden. |
| Sync/Offline | Sprint 17 ist umgesetzt: Die App-Shell zeigt signed-in global einen kompakten Sync-Status mit Detailsheet, einheitlicher coachnaher Sprache, manueller Sync-Aktion, Backup-Hinweis und Public/Kiosk-Check-in-Detailgruppen. Background Sync bleibt PWA-best-effort und setzt iOS/Safari Background Sync nicht voraus. |
| Kiosk/Public | Sprint 15 ist umgesetzt: Public/Kiosk nutzen einen eigenen reduzierten Self-Check-in mit linearer Schrittfolge, Review vor Absenden, Abschlusszustand, Kiosk-Auto-Reset und ohne Coach-Notizen/Historie/Analyse. Public speichert keine lokale `submitted`-Marke mehr. |
| Brand-Surfaces | Sprint 7 hat eine wiederverwendbare `BrandSurface` fuer Auth, Welcome/Empty, Install, Public Check-in und Kiosk-Welcome eingefuehrt. Live-Coaching-Flows bleiben ohne Hero-Flaechen. |
| Sport-Konfiguration | Sprint 16 ist umgesetzt: `src/config/sports.ts` definiert eine kleine generische Config-Schicht, `src/config/onfieldRugby.ts` ist das einzige aktive Preset, `src/config/labels.ts` liefert erste UI-Labels, und bestehende Player-/Cluster-Exporte bleiben kompatibel. Erste Nutzung liegt in Spieler, Analyse, Training, Public Check-in und Kiosk Check-in. |

## Aktuelle massgebliche Dokumente

- Abgeschlossene Haupt-Roadmap 0A-20: `docs/superpowers/plans/2026-07-04-onfield-ux-branding-transformation-roadmap.md`
- Anschluss-Roadmap nach Abschluss-Audit: `docs/superpowers/plans/2026-07-06-onfield-post-roadmap-hardening.md`
- Product Brief: `docs/field-hub/onfield_product_brief.md`
- Brand Kit: `docs/field-hub/onfield_brand_kit.md`
- Tone of Voice: `docs/field-hub/onfield_tone_of_voice.md`
- Designsystem: `docs/field-hub/onfield_design_system.md`
- Token Sheet: `docs/field-hub/onfield_token_sheet.md`
- Component Inventory: `docs/field-hub/onfield_component_inventory.md`
- Sports Configuration Model: `docs/field-hub/onfield_sports_configuration_model.md`
- PWA/A11y QA: `docs/field-hub/onfield_pwa_accessibility_qa.md`
- Beta Readiness: `docs/field-hub/onfield_beta_readiness.md`
- Native/SaaS Decision Criteria: `docs/field-hub/onfield_native_saas_decision_criteria.md`
- LUVI Reuse Audit: `docs/field-hub/onfield_luvi_reuse_audit.md`
- Post-Roadmap Hardening Evidence: `docs/field-hub/2026-07-07_onfield_post_roadmap_hardening_evidence.md`
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
- Sprint 17 ist abgeschlossen: Sync, Backup und Offline-Kommunikation sind global vereinheitlicht. Der kompakte App-Shell-Status oeffnet ein Detailsheet mit offenen Bereichen, Public/Kiosk-Check-in-Konflikten, Backup-Status und manueller Sync-Aktion. Sync-Texte nutzen coachnahe Begriffe wie `lokal gespeichert`, `wartet auf Sync`, `zuletzt synchronisiert`, `Konflikt pruefen` und `offline`; rohe Queue-Begriffe bleiben aus der UI heraus.
- Sprint 18 ist abgeschlossen: PWA/Install und Accessibility Polish sind umgesetzt. Workbox nutzt einen Offline-App-Shell-Fallback, Settings zeigen Browser-/Home-Screen-Modus, Self-Check-in-Disabled-Actions haben sichtbare `aria-describedby`-Gruende, Legacy-Actions/PDF/Kiosk-Buttons teilen den sichtbaren Focus Ring, und `npm run test:e2e:pwa` prueft die iPhone-/iPad-Viewport-Matrix plus Offline-Fallback gegen den gebauten Preview.
- Sprint 19 ist abgeschlossen: Die Screen-by-Screen Full-Rollout-QA ist dokumentiert, `npm run test:e2e:sprint19` prueft die Sprint-19-Hauptscreens ueber iPhone-/iPad-Viewports, der signed-in Spielerbereich wurde mit Test-Credentials als Laufzeit-Env verifiziert, `npm run test:e2e:kiosk` verifiziert Remote-Kiosk-Submit mit temporaerem Seed und Cleanup, LUVI-Pattern wurden als QA-Referenz bewertet, alte englische Nachbereitungslabels wurden bereinigt, und medizinisch riskante Entscheidungs-/Freigabe-Sprache wurde aus sichtbarem App-Content ersetzt. Lazy-Error-UI ist zusaetzlich ueber einen deterministischen Boundary-Komponententest abgedeckt.
- Sprint 20 ist abgeschlossen: `onfield_beta_readiness.md` definiert den kontrollierten externen Beta-Rahmen fuer bis zu 10 Coach-Tester aus bis zu 3 Club-Kontexten, inklusive Install-, signed-in-, Public/Kiosk-, Offline-/Sync-, Datenschutz-/Safety- und Feedback-Triage-Kriterien. `onfield_native_saas_decision_criteria.md` legt fest, dass Native/Flutter/React Native und OnField Performance/SaaS erst nach Beta-Evidence bewertet werden. `onfield_luvi_reuse_audit.md` dokumentiert, welche LUVI-Patterns als Audit-/QA-/Privacy-Muster uebernommen oder bewusst nicht uebernommen werden.
- Sprint 21 ist abgeschlossen: `app/field-hub` hat `qa:local` als Entwicklungscheck und `qa:beta` als hartes Beta-Gate. `qa:beta` blockiert ohne `FIELD_HUB_E2E_EMAIL`, `FIELD_HUB_E2E_PASSWORD` und `FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION=1`; Sprint-19-Signed-in und Kiosk-Remote-Mutation koennen nicht mehr still als gruen geskippt werden. Die Sprint-19-QA- und Beta-Readiness-Doku enthalten die LUVI-QA-Audit-Uebernahme fuer Gate-, Evidence-, Cleanup- und Secret-Hygiene-Muster.
- Sprint 22 ist abgeschlossen: Runtime-Memory-Redaction ist fuer Env-Werte, Supabase-/API-Keys, Bearer/Auth-Tokens, URL-Keys, UUID/IP/prefixed Tokens, lange Token-Strings und sensible Payload-Werte gehaertet. Runtime-Lint meldet nur Pfad, Pattern-Typ, Anzahl und Schweregrad; keine Roh-Secrets in Lint-Output oder Reports. Runtime-Tests laufen ueber temporaere `ONFIELD_MEMORY_DIR`-Wurzeln und schuetzen die echte lokale Runtime. Runtime-Lint ist gruen, Warnungen wie `compile_pending` bleiben sichtbar.
- Sprint 23 ist abgeschlossen: Supabase-Beta-Defaults sind kontrolliert gesetzt (`enable_signup = false`, Email-Signup aus, Passwort-Mindestlaenge 12), `AuthPanel` bleibt per Regressionstest login-only, `npm run supabase:audit` prueft Auth-Defaults, bekannte RLS-/Policy-Abdeckung, Parent-Ownership bei bekannten Child-Write-Policies, erlaubte Public/Kiosk-`anon`-Ausnahmen und `service_role`-Drift, und der Audit laeuft in `qa:local` und `qa:beta`. Historische Backup-Child-Records ohne Spielerzuordnung bleiben lokal und erzeugen keinen Remote-Pending-Write.
- Sprint 24 ist abgeschlossen: OnField Coach nutzt ein kanonisches `AppRoute`-/Hash-Routingmodell fuer `Heute`, `Einheit`, `Spieler`, `Analyse` und `Mehr`; Legacy-Ziele wie `#/nachbereitung`, `#/bibliothek` und `#/einstellungen` bleiben kompatibel und werden beim Oeffnen normalisiert. Public Check-in bleibt separat unter `#/checkin/:token`. Browser Back/Forward und PWA-Smoke sind verifiziert.
- Sprint 25 ist abgeschlossen: Breakpoints sind auf `compact <600`, `medium 600-839`, `expanded >=840` gehaertet; PWA- und Visual-QA pruefen den Medium-Viewport `744px`; priorisierte Check-in-, Training-, Nachbereitung-, Spieler-, Export-, Returner- und Auth-Actions haben bessere sichtbare Disabled-Gruende oder Loading-Semantik; maskable PWA-Icons sind ergaenzt; sichtbare alte Kontrolltexte in Hauptflows wurden reduziert; LUVI ist im Reuse Audit als Sprint-25-QA-/A11y-Referenz dokumentiert.
- Sprint 26 ist abgeschlossen: App-README, Beta-Readiness, LUVI-Reuse-Audit, Post-Roadmap-Evidence und Memory Index/Current State sind auf den finalen Anschluss-Roadmap-Stand gebracht. Runtime-Memory-Lint ignoriert generierte `sha256`-Integritaetsfelder, scannt Payloads aber weiter auf Secrets.
- Die Anschluss-Roadmap `docs/superpowers/plans/2026-07-06-onfield-post-roadmap-hardening.md` ist fuer Sprint 21 bis Sprint 26 abgeschlossen. Phase A war beta-blockierend:
  - Sprint 21: Harte Beta-QA-Gates ist abgeschlossen.
  - Sprint 22: Runtime-Memory Privacy & Lint Fix ist abgeschlossen.
  - Sprint 23: Supabase/Auth/RLS Beta Guardrails ist abgeschlossen.
  Phase B war Qualitaets- und Struktur-Hardening:
  - Sprint 24: Coach-Routing & Navigation Refactor ist abgeschlossen.
  - Sprint 25: Designsystem, A11y & Responsive Hardening ist abgeschlossen.
  - Sprint 26: Final Cleanup, Evidence & Memory Closeout ist abgeschlossen.

## Naechste empfohlene Schritte

1. Kontrollierte externe Beta nach `docs/field-hub/onfield_beta_readiness.md` vorbereiten; der frische echte `qa:beta` vom 2026-07-07 ist gruen, muss aber bei weiteren Beta-relevanten Code-/DB-Aenderungen erneut laufen.
2. Vor dem ersten externen Test Remote-Supabase-Dashboard-Settings manuell pruefen und Credential-Hygiene sicherstellen; im Chat oder Terminal sichtbar gewordene Passwoerter rotieren.
3. Native/SaaS-Fragen erst anhand der Sprint-20-Entscheidungskriterien und echter Beta-Evidence neu bewerten.

## Offene Risiken

| Risiko | Auswirkung | Naechster Schritt |
|---|---|---|
| Remote-Supabase-Auth-Settings koennen von lokalen Beta-Defaults abweichen. | Lokaler Audit und frischer `qa:beta` sind gruen, aber das gehostete Dashboard muss vor externer Beta dieselbe kontrollierte Account-Strategie abbilden. | Vor externer Beta Remote-Dashboard manuell pruefen. |
| QA-Credentials koennen durch Chat- oder Terminal-Weitergabe kompromittiert sein. | Ein technisch erfolgreicher Login-Test ersetzt keine Secret-Hygiene. | Credentials nur temporaer zur Laufzeit nutzen, nicht speichern, und sichtbar gewordene Passwoerter nach QA rotieren. |
| Core Components sind noch nicht screen-weit ausgerollt. | Das Kit existiert, aber viele Screens nutzen weiterhin Legacy-Klassen und Inline-Muster. | In den naechsten Screen-Sprints gezielt migrieren, ohne Sprint-6-IA vorzuziehen. |
| iPhone wird wieder als Nebenansicht behandelt. | Externe Nutzung und App-Store-Perspektive werden geschwaecht. | iPhone-Paritaet in jedem Sprint pruefen. |
| Rugby bleibt teilweise noch in bestehenden Screens und Content hart verdrahtet. | Spaetere Sport-Presets brauchen weitere Extraktion und fachliche Validierung. | Nach Sprint 16 nur gezielt in geplanten Refactor-Sprints weiter extrahieren; keine zweite Sportart nebenbei einfuehren. |
| Memory wird als Archiv statt Router genutzt. | Agenten laden zu viel Kontext und das System wird traege. | Memory Governance und Index in jeder OnField-Session beachten. |
| Hook-Automatik erzeugt falsche Sicherheit. | Agenten verlassen sich auf Runtime Memory statt Memory Governance. | Sprint 0D-Runtime bleibt lokal/ignored, fail-open und unterhalb von AGENTS, Decision Log, Current State und SSOTs; Sprint 1 hat die Agentenregeln darauf synchronisiert. |
