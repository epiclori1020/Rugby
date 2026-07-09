# OnField Decision Log

Stand: 2026-07-08

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
| 2026-07-05 | Sprint 6 nutzt ein kompatibles Navigationsmodell: 5 Hauptbereiche als `AppSection`, bestehende Screens weiter als `HubTab`-Ziele. | So wird die neue IA umgesetzt, ohne bestehende Check-in-, Training-, Nachbereitung-, Bibliothek-, Export-, Einstellungen- und Returner-Screens in einem Shell-Sprint umzubauen. Diese Uebergangsentscheidung wurde durch Sprint 24 abgeloest. | superseded |
| 2026-07-07 | OnField Coach nutzt kanonische Coach-Hash-Routen mit Legacy-Adaptern statt des alten internen Tab-Modells. | Deep Links, Browser Back/Forward, PWA-Verhalten und spaetere App-Store-/SaaS-Reife brauchen stabile technische Routen; Domain-Quellen mit alten Zielen werden nur am App-Rand uebersetzt. | Aktiv |
| 2026-07-05 | OnField Coach App-Icons werden als eigenes deterministisches SVG/PNG-Set gepflegt, nicht als Library-Icon oder Bild-KI-Produktionsasset. | Install-Icons muessen reproduzierbar, skalierbar und in kleinen Groessen klar sein; Bild-KI kann spaeter Inspiration liefern, ist aber keine Produktionsquelle fuer PWA-/iOS-Icons. | Aktiv |
| 2026-07-06 | Sprint 16 nutzt eine statische aktive `SportConfig` mit OnField Rugby als einzigem Runtime-Preset. | Das schafft eine kleine SSOT-Schicht im Code, ohne Runtime-Selector, zweite Sportart, Config-Engine, Datenmigration oder Supabase-Komplexitaet in den Coach-MVP zu ziehen. | Aktiv |
| 2026-07-06 | Native/Flutter/React Native und OnField Performance/SaaS werden erst nach kontrollierter Beta-Evidence neu bewertet. | Sprint 20 definiert Beta-Readiness und Entscheidungskriterien, damit Plattformentscheidungen nicht aus Bauchgefuehl oder LUVI-Wiederverwendungswuenschen entstehen. | Aktiv |
| 2026-07-06 | Die Sprints 0A-20 bleiben als abgeschlossene Haupt-Roadmap stehen; Audit-Restpunkte werden in einer separaten Anschluss-Roadmap geplant. | Eine separate Post-Roadmap verhindert, dass kuenftige Agenten die abgeschlossene UX-/Branding-Roadmap wieder als offen interpretieren. | Aktiv |
| 2026-07-06 | Phase A der Anschluss-Roadmap ist beta-blockierend. | Harte QA-Gates, Runtime-Memory-Privacy und Supabase/Auth-Guardrails muessen stimmen, bevor externe Coaches OnField Coach testen. | Aktiv |
| 2026-07-06 | `qa:beta` wird das harte technische Freigabe-Gate fuer externe Beta. | Beta-QA darf keine stillen Skips bei Signed-in-, Public/Kiosk- oder Remote-Testpfaden als gruen ausgeben. | Aktiv |
| 2026-07-06 | Runtime-Memory-Lint muss gruen sein, bevor generated Runtime Memory als hilfreicher Kontext gilt. | Runtime Memory ist nur lokales Roh-/Hilfsmaterial; Leak-Findings oder Lint-Fehler duerfen nicht als vertrauenswuerdiger Kontext behandelt werden. | Aktiv |
| 2026-07-06 | `npm run supabase:audit` ist Teil von `qa:local` und `qa:beta`. | Supabase/Auth/RLS-Drift, unerwartete `anon`-Oberflaechen und `service_role`-Risiken sollen Beta-Gates blockieren, bevor externe Coaches testen. | Aktiv |
| 2026-07-07 | Supabase-Child-Writes muessen bekannte Parent-Ownership pruefen. | `auth.uid() = user_id` allein verhindert nicht, dass ein Child-Record auf fremde `players` oder `session_logs` zeigt; bekannte Child-Insert-/Update-Policies und der statische Audit pruefen diese Beziehungen jetzt explizit. | Aktiv |
| 2026-07-07 | Historische Backup-Child-Records ohne Spielerzuordnung bleiben lokal und werden nicht remote gesynct. | `progressEntries`, `baselineEntries` und `returnerEntries` mit `playerId: null` koennen aus alten/anonymisierten Backups stammen; Remote-RLS braucht aber gueltige Parent-Ownership. Die MVP-Regel erhaelt diese Daten lokal, verhindert aber neue Pending-Writes. | Aktiv |
| 2026-07-07 | Beta-/Local-QA-Evidence wird maschinenlesbar und redigiert unter `.tmp/onfield-qa/` geschrieben. | Freigabeentscheidungen sollen nicht von Konsolen-Gefuehl abhaengen; Reports bleiben ignored, enthalten keine Credential-Werte und dokumentieren checked/failed/blocked Steps. | Aktiv |
| 2026-07-07 | Runtime-Memory-Tests nutzen temporaere `ONFIELD_MEMORY_DIR`-Wurzeln. | Tests duerfen die echte lokale `.onfield-memory`-Runtime nicht loeschen oder verfaelschen; die Produkt-Runtime bleibt der Default, isolierte Testwurzeln sind explizit. | Aktiv |
| 2026-07-08 | OnField geht in einen echten Design-/Branding-Redesign-Zyklus, nicht weitere CSS-Einzel-Anpassung. | Nutzer ist mit dem inkrementell angepassten Ist-Zustand unzufrieden; der Live-Audit (`2026-07-08_onfield_design_audit_live.md`) zeigt Execution-Drift (Code implementiert das eigene Designsystem nicht: keine Typo-Tokens, ~55/59 Weights 800–900, Card-Walls statt row-first, mehrere konkurrierende Primaeraktionen) plus fehlende Signature-Craft. | Aktiv |
| 2026-07-08 | Redesign-Leitlinie: Route A "Execute + Elevate Field Graphite" / "Heritage Field Instrument" ist die aktive Redesign-Richtung. Das dokumentierte Designsystem wird umgesetzt statt neu erfunden, plus erlaubte Premium-Hebel (Typo-Skala + max. 3 Gewichte, tabular „Scoreboard"-Numerals, Display-Headline-Font nach Test, Dark/Field-Mode, Oxblood-Signature auf Brand-Surfaces, Field-as-layout, row-first). | Nutzer bestaetigt explizit echten Redesign-/UX-/UI-Qualitaetsanspruch statt MVP-like Weiterarbeit. Strategie/Spec (Field Graphite, Calm Intensity, operations-first) bleiben gut; Differenzierung entsteht aus Craft + Signature, nicht aus Neon. Live-Screens bleiben ruhig. | Aktiv |
| 2026-07-08 | Dark/Field-Mode wird als Teil des Redesign-Zyklus vorgezogen. | Die zurueckgestellte Dark-Mode-Entscheidung nannte „nach Kernflow-Redesign" als Trigger; der beginnt jetzt. Sonnenlicht-Feldtauglichkeit macht ihn produktrelevant. | Aktiv (Umsetzung an Redesign-Route gekoppelt) |
| 2026-07-08 | Die Redesign-v2-Serie wird als eigene Roadmap R1-R10 geplant. | Die abgeschlossenen Sprints 0A-26 werden nicht wiedereroeffnet; `docs/superpowers/plans/2026-07-08-onfield-redesign-v2-heritage-field-instrument.md` schneidet das Redesign in mergebare Sprints mit Fundament zuerst, P0-Sicherheit frueh und "Squad heute" als erstem sichtbaren Leit-Screen. | Aktiv |
| 2026-07-08 | Sichtbare Redesign-Sprints brauchen ein Redesign Integrity Gate. | Damit die Umsetzung nicht wieder bei leichten UI-/CSS-Anpassungen stehen bleibt, muessen sichtbare Redesign-PRs Vorher/Nachher-Screenshots, UX-Intent, Pattern-Audit, Token-/Typo-Audit, Copy-/Trust-Audit und passende QA-Gates liefern. R7 wird in R7A-R7D umgesetzt, nicht als Big-Bang-Kernflow-PR. | Aktiv |
| 2026-07-08 | Figma ist die primaere visuelle Referenz fuer Redesign-v2; Bild-KI ist nur fuer Brand-/Rasterassets erlaubt. | Codex kann Figma ueber MCP fuer Frames, Prototypen, Design-to-Code-Kontext, Screenshots und Evidence nutzen. Codex hat eine eingebaute `image_gen`-Faehigkeit; ein dediziertes Nano-Banana-Plugin ist in der aktuellen Umgebung nicht verfuegbar. Externe Nano-Banana/Gemini-Image-Outputs koennen als importierte Brand-Assets dienen, aber operative UI wird in Figma/Code mit Tokens und Komponenten gebaut. | Aktiv |

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
- Supabase/Auth/RLS-Drift wird ueber `npm run supabase:audit` lokal und in den QA-Gates blockiert; Remote-Dashboard-Settings muessen vor externer Beta manuell dieselbe kontrollierte Account-Strategie abbilden.

## Zurueckgestellte Entscheidungen

| Thema | Warum zurueckgestellt | Wann neu bewerten |
|---|---|---|
| Native App / Flutter / React Native | Ein Rewrite loest IA, UX und Designsystem nicht automatisch. | Nach externer Beta und stabiler PWA-UX. |
| Dark Mode | Nicht mehr zurueckgestellt; durch die Entscheidung vom 2026-07-08 als Dark "Field Mode" in den Redesign-Zyklus vorgezogen. | Umsetzung in Redesign-v2 R1/R8/R9 nach `docs/superpowers/plans/2026-07-08-onfield-redesign-v2-heritage-field-instrument.md`. |
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
