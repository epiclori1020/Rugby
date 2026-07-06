# OnField Decision Log

Stand: 2026-07-06

## Zweck

Dieses Dokument ist das dauerhafte Entscheidungsgedaechtnis fuer OnField. Es speichert Produkt-, Design-, Architektur- und Workflow-Entscheidungen, die kuenftige Agenten nicht neu interpretieren sollen.

## Aktive Kernentscheidungen

| Datum | Entscheidung | Begruendung | Status |
|---|---|---|---|
| 2026-07-04 | Die App wird unter der Marke **OnField** weitergefuehrt. | Der alte Name Rugby S&C Field Hub ist zu eng und wirkt weniger produktfaehig. | Aktiv |
| 2026-07-04 | Die aktuelle App heisst **OnField Coach**. | Der Name beschreibt den konkreten Coach-Workflow und bleibt offen fuer spaetere Produkte. | Aktiv |
| 2026-07-04 | **OnField Rugby** ist die erste sportartspezifische Konfiguration. | Rugby bleibt der reale Startkontext, soll aber nicht die Plattform begrenzen. | Aktiv |
| 2026-07-04 | **OnField Performance** ist die spaetere SaaS-/Plattformrichtung. | SaaS/App-Store-Optionen bleiben offen, ohne den Coach-MVP zu ueberladen. | Aktiv |
| 2026-07-04 | iPhone und iPad muessen fachlich dasselbe koennen. | Das iPhone darf kein abgespeckter Companion sein. Unterschied nur in Layout/Interaktion. | Aktiv |
| 2026-07-04 | PWA zuerst, Native spaeter pruefen. | Informationsarchitektur, UX, Designsystem und Feldtauglichkeit loesen mehr als ein Rewrite. | Aktiv |
| 2026-07-04 | Hauptnavigation soll auf `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr` reduziert werden. | Aktuell erzeugen zu viele gleichrangige Tabs Orientierungslosigkeit. | Aktiv |
| 2026-07-04 | `Check-in`, `Training`, `Nachbereitung` gehoeren unter `Einheit`. | Der Coach denkt in Ablauf: vorher, waehrenddessen, danach. | Aktiv |
| 2026-07-04 | Marketing-/Hero-Optik ist erlaubt, aber nur auf Brand-Surfaces. | Die Marke soll sichtbar sein, ohne Live-Coaching zu stoeren. | Aktiv |
| 2026-07-04 | Keine medizinische Diagnose- oder Return-to-Play-Freigabe-Sprache. | Die App unterstuetzt Coaching-Entscheidungen, ersetzt aber keine medizinische Entscheidung. | Aktiv |
| 2026-07-04 | Figma oder ein gleichwertiges Designsystem-Artefakt ist fuer Brand/Tokens/Komponenten empfohlen. | Das Design Kit soll wiederverwendbar sein und nicht nur aus CSS-Einzelfixes bestehen. | Aktiv |
| 2026-07-04 | Hooks werden vorbereitet, aber noch nicht aktiviert. | Skills und SSOTs sollten zuerst stabil sein; diese Entscheidung wurde durch Sprint 0C ersetzt. | superseded |
| 2026-07-04 | OnField bekommt Sprint 0A fuer ein schlankes LUVI-/Karpathy-inspiriertes Memory-System. | Memory soll nicht von Arwin manuell entschieden werden muessen, sondern Agenten durch Regeln, Context Routing und Closeout-Pruefungen fuehren. | Aktiv |
| 2026-07-04 | Memory wird als Context-Router gebaut, nicht als grosses Pflichtarchiv. | Das reduziert Kontextverbrauch und verhindert, dass Agenten Roadmap, Researches und alle SSOTs blind laden. | Aktiv |
| 2026-07-04 | Memory darf nicht blind vollautomatisch schreiben. | Automatische Hooks duerfen erinnern und pruefen; der Agent dokumentiert nach Governance-Regeln, damit kein Memory-Bloat entsteht. | Aktiv |
| 2026-07-04 | OnField Memory System v1 ist aktiv. | Sprint 0A hat Memory Governance, Memory Index, Gotchas und Skill-Closeout-Regeln eingefuehrt. | Aktiv |
| 2026-07-04 | Der Memory Index ist der primaere Context Router fuer OnField-Agenten. | Agenten sollen zuerst routen und danach nur relevante SSOTs, Researches, Skills und Code-Dateien laden. | Aktiv |
| 2026-07-04 | OnField Memory v1 richtet keine aktiven Hooks ein. | Hook-Automation wurde in Sprint 0C separat geprueft; diese Entscheidung wurde durch minimale passive Guardrails ersetzt. | superseded |
| 2026-07-04 | Sprint 0C wird als Hook Review & Automation Guardrails eingefuegt. | Die Roadmap soll selbsterklaerend zeigen, wann Hook-Automation geprueft wird und warum sie nicht Teil von Sprint 0A war. | Aktiv |
| 2026-07-04 | Sprint 1 wird zum Agenten-Setup Review & Finalisierungssprint. | Der Grossteil des Agenten-Setups ist durch Sprint 0A bereits erledigt; Sprint 1 soll nur noch Luecken und Widersprueche pruefen. | Aktiv |
| 2026-07-04 | Sprint 0B friert sieben OnField-SSOTs ein. | Product Brief, Brand Kit, Tone of Voice, Designsystem, Component Inventory, Sports Configuration und PWA/A11y QA reduzieren Research-Neuinterpretation. | Aktiv |
| 2026-07-04 | Nach Sprint 0B sind SSOTs der Standardkontext; Researches bleiben Quellenmaterial. | Agenten sollen zuerst kompakte Regeln lesen und lange Research-Dateien nur bei offenen Fragen laden. | Aktiv |
| 2026-07-04 | Field Graphite ist die v1-Farb- und Brand-Basis. | Die Palette passt zur ruhigen iPadOS Performance Console mit Field-Operations-DNA und bleibt sportlich ohne klinisch oder laut zu wirken. | Aktiv |
| 2026-07-04 | Komponenten werden sportartenuebergreifend benannt; OnField Rugby liefert Preset-Inhalte. | Das verhindert, dass Rugby-Begriffe dauerhaft in generische OnField-Architektur eingebrannt werden. | Aktiv |
| 2026-07-04 | Sprint 0C aktiviert minimale passive Codex-Hooks fuer OnField. | Stop/PreCompact erinnern an Memory-Closeout; PostToolUse prueft Diffs auf klare Secret-Leaks und warnt bei Safety-/Memory-Risiken. Hooks schreiben, loeschen oder ersetzen kein Memory. | Aktiv |
| 2026-07-04 | Sprint 0D aktiviert lokales Codex-first Runtime Memory fuer OnField. | Redigierte Captures, Daily Logs, Knowledge-Artikel, Hot Cache, Lint, Backups und Recovery reduzieren Vergessen, bleiben aber lokal/ignored und duerfen keine SSOTs automatisch ersetzen. | Aktiv |
| 2026-07-04 | Der automatische Runtime-Compiler ist deterministisch lokal statt `codex exec` aus Hooks. | Agentenprozesse aus Hooks waeren rekursions-, timeout- und trust-riskant. LLM-Kuration kann spaeter explizit ergaenzt werden; Hooks bleiben fail-open. | Aktiv |
| 2026-07-04 | Runtime-Memory-Arbeit bekommt einen eigenen FAQ-Artikel und Skill. | Zukuenftige Agenten brauchen einen klaren Einstieg, ohne Runtime-Regeln in alle OnField-Skills oder AGENTS.md zu duplizieren. | Aktiv |
| 2026-07-05 | OnField positioniert sich als **Field-ready coach operations for the training day**. | Die Deep Researches und die Claude-Kritik zeigen eine glaubwuerdige Luecke zwischen Enterprise/HPO, Hardware/Testing, Programming-first Tools und Fitness-Marketplaces. | Aktiv |
| 2026-07-05 | Der Sprint-3-Master-Claim lautet **Check in players. Run the session. Wrap the day.** | Der Claim deckt den gesamten Trainingstag ab und trennt OnField klar von reinen Pre-Session- oder Workout-Builder-Claims. | Aktiv |
| 2026-07-05 | OnField ist operations-first, nicht programming-first. | Die naechste Wettbewerbsnaehe liegt bei TeamBuildr, Bridge, Output und TrainHeroic; OnField muss sich ueber Trainingstag-Betrieb statt Workout-Erstellung abgrenzen. | Aktiv |
| 2026-07-05 | Oxblood ist Brand-/Editorial-Farbe und nie Status-, Alarm- oder Follow-up-Farbe. | In einem Feldtool wird Rot-nahe Farbe schnell als Alarm gelesen; Status braucht ein getrenntes funktionales System. | Aktiv |
| 2026-07-05 | Field-Operations-DNA lebt in Layout, IA und Session Flow, nicht als dekoratives Wallpaper. | Field-as-layout ist differenzierender und verhindert generische Sport-B2B-Tapete hinter KPI-Karten. | Aktiv |
| 2026-07-05 | Sprint-3-Research wird kuratiert in einer Synthese dokumentiert, nicht roh in Memory kopiert. | Memory bleibt Router und Entscheidungsgedaechtnis; lange Researches bleiben Quellenmaterial. | Aktiv |
| 2026-07-05 | OnField Code-Tokens nutzen den Prefix `--of-*`; `app/field-hub/src/design/tokens.css` ist die technische Token-Quelle. | Code, SSOT und Figma bleiben abgleichbar, ohne Figma zur Runtime-Quelle zu machen. Legacy-Aliase duerfen waehrend der Migration auf `--of-*` zeigen. | Aktiv |
| 2026-07-05 | Sprint 6 nutzt ein kompatibles Navigationsmodell: 5 Hauptbereiche als `AppSection`, bestehende Screens weiter als `HubTab`-Ziele. | So wird die neue IA umgesetzt, ohne bestehende Check-in-, Training-, Nachbereitung-, Bibliothek-, Export-, Einstellungen- und Returner-Screens in einem Shell-Sprint umzubauen. | Aktiv |
| 2026-07-05 | OnField Coach App-Icons werden als eigenes deterministisches SVG/PNG-Set gepflegt, nicht als Library-Icon oder Bild-KI-Produktionsasset. | Install-Icons muessen reproduzierbar, skalierbar und in kleinen Groessen klar sein; Bild-KI kann spaeter Inspiration liefern, ist aber keine Produktionsquelle fuer PWA-/iOS-Icons. | Aktiv |
| 2026-07-06 | Sprint 16 nutzt eine statische aktive `SportConfig` mit OnField Rugby als einzigem Runtime-Preset. | Das schafft eine kleine SSOT-Schicht im Code, ohne Runtime-Selector, zweite Sportart, Config-Engine, Datenmigration oder Supabase-Komplexitaet in den Coach-MVP zu ziehen. | Aktiv |
| 2026-07-06 | Native/Flutter/React Native und OnField Performance/SaaS werden erst nach kontrollierter Beta-Evidence neu bewertet. | Sprint 20 definiert Beta-Readiness und Entscheidungskriterien, damit Plattformentscheidungen nicht aus Bauchgefuehl oder LUVI-Wiederverwendungswuenschen entstehen. | Aktiv |
| 2026-07-06 | Die Sprints 0A-20 bleiben als abgeschlossene Haupt-Roadmap stehen; Audit-Restpunkte werden in einer separaten Anschluss-Roadmap geplant. | Eine separate Post-Roadmap verhindert, dass kuenftige Agenten die abgeschlossene UX-/Branding-Roadmap wieder als offen interpretieren. | Aktiv |
| 2026-07-06 | Phase A der Anschluss-Roadmap ist beta-blockierend. | Harte QA-Gates, Runtime-Memory-Privacy und Supabase/Auth-Guardrails muessen stimmen, bevor externe Coaches OnField Coach testen. | Aktiv |
| 2026-07-06 | `qa:beta` wird das harte technische Freigabe-Gate fuer externe Beta. | Beta-QA darf keine stillen Skips bei Signed-in-, Public/Kiosk- oder Remote-Testpfaden als gruen ausgeben. | Aktiv |
| 2026-07-06 | Runtime-Memory-Lint muss gruen sein, bevor generated Runtime Memory als hilfreicher Kontext gilt. | Runtime Memory ist nur lokales Roh-/Hilfsmaterial; Leak-Findings oder Lint-Fehler duerfen nicht als vertrauenswuerdiger Kontext behandelt werden. | Aktiv |

## Markenarchitektur

- **OnField**: Hauptmarke.
- **OnField Coach**: aktuelle Coach-App.
- **OnField Performance**: spaetere SaaS-/Produktplattform.
- **OnField Rugby**: erste sportartspezifische Auspraegung.

## Produkt-Guardrails

- iPhone/iPad-Paritaet ist verpflichtend.
- PWA-first bleibt die technische Richtung fuer den aktuellen Umbau.
- Multi-Sport-Faehigkeit wird mitgedacht; Rugby ist erster Preset, nicht die Grenze.
- Keine medizinische Diagnose- oder Freigabe-Sprache.
- Hero/Marketing gehoert auf Brand-Surfaces, nicht in Live-Coaching-Screens.
- Live-Screens bleiben ruhig, operativ und feldtauglich.
- OnField ist field-ready coach operations fuer den Trainingstag.
- OnField grenzt sich auch von programming-first Coach-Tools ab.
- Oxblood ist kein Status- oder Alarmton.
- Field-DNA ist Struktur, nicht Wallpaper.
- Spieler/Athletenobjekte sind standardmaessig Listen/Rows, nicht Card-Walls.
- Status wird nie nur ueber Farbe kommuniziert.
- Agenten sollen zuerst gezielt Kontext routen und nur relevante SSOTs/Researches laden.
- Nach Sprint 0B sind die neuen OnField-SSOTs primaere Arbeitsgrundlage fuer Produkt, Brand, Copy, Designsystem, Komponenten, Sport-Konfiguration und PWA/A11y QA.
- Nach Sprint 4 ist `app/field-hub/src/design/tokens.css` die technische Wahrheit fuer OnField Theme Tokens; Figma Token Sheets sind visuelle Referenz und Uebergabeartefakt.
- Nach Sprint 7 ist das OnField Coach App-Icon ein eigenes deterministisches SVG/PNG-Asset-Set; keine Library- oder Bild-KI-Quelle ist die Produktionsbasis.
- Nach Sprint 0A braucht jede OnField-Aufgabe am Ende eine Memory-Closeout-Pruefung: Current State, Decision Log oder Gotchas aktualisieren, falls die Aufgabe kuenftige Sessions betrifft.
- Externe Beta startet erst nach Abschluss der beta-blockierenden Phase A der Anschluss-Roadmap.
- `qa:beta` darf nur dann als gruen gelten, wenn die dafuer vorgesehenen Auth-, Signed-in- und Kiosk-/Public-Pfade wirklich geprueft wurden.

## Zurueckgestellte Entscheidungen

| Thema | Warum zurueckgestellt | Wann neu bewerten |
|---|---|---|
| Native App / Flutter / React Native | Ein Rewrite loest IA, UX und Designsystem nicht automatisch. | Nach externer Beta und stabiler PWA-UX. |
| Dark Mode | Erhoeht QA-Aufwand, bevor Light Mode und Tokens stabil sind. | Nach Kernflow-Redesign und QA. |
| Multi-Tenant SaaS, Billing, Organisationen | Nicht Teil des Coach-Operations-MVP. | In eigener OnField Performance Plattform-Roadmap. |
| Player Accounts / Player Portal | Erhoeht Auth-, Datenschutz- und Support-Komplexitaet. | Wenn Public/Kiosk-Flow validiert ist und Player-Modul klar definiert wurde. |
| Leaderboards, Feed, Social Features | Nicht Teil des aktuellen Coach-Operations-Kerns. | Spaeter als eigenes Engagement-Modul pruefen. |
| Weitere Codex Hooks | Zusaetzliche Hook-Automatik kann den Workflow bremsen oder falsche Sicherheit erzeugen. | Erst nach wiederholten konkreten Fehlern erweitern; Sprint 0D erlaubt nur lokale fail-open Runtime Memory unter `.onfield-memory/`, keine SSOT-Automation. |

## Verworfene Optionen

| Option | Warum nicht jetzt | Spaeter moeglich? |
|---|---|---|
| Grosse externe UI-Library als Hauptloesung | Risiko eines generischen SaaS-Looks und falscher Semantik. | Ja, wenn sie OnField-Tokens und Komponentenlogik sauber traegt. |
| Eigene Brand-Font fuer operativen UI-Text | Lesbarkeit, iOS-Naehe und Feldtauglichkeit sind wichtiger. | Ja, fuer Logo/Marketing sofort; fuer Display-UI erst nach Test. |
| Analysecharts in Live-Screens | Live-Coaching braucht Entscheidung und Handlung, nicht BI. | Analyse bleibt eigener Bereich. |
