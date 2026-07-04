# OnField Decision Log

Stand: 2026-07-04

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
| 2026-07-04 | Hooks werden vorbereitet, aber noch nicht aktiviert. | Skills und SSOTs sollen zuerst stabil sein; aktive Hooks brauchen Trust/Review und Pflege. | Aktiv |
| 2026-07-04 | OnField bekommt Sprint 0A fuer ein schlankes LUVI-/Karpathy-inspiriertes Memory-System. | Memory soll nicht von Arwin manuell entschieden werden muessen, sondern Agenten durch Regeln, Context Routing und Closeout-Pruefungen fuehren. | Aktiv |
| 2026-07-04 | Memory wird als Context-Router gebaut, nicht als grosses Pflichtarchiv. | Das reduziert Kontextverbrauch und verhindert, dass Agenten Roadmap, Researches und alle SSOTs blind laden. | Aktiv |
| 2026-07-04 | Memory darf nicht blind vollautomatisch schreiben. | Automatische Hooks duerfen erinnern und pruefen; der Agent dokumentiert nach Governance-Regeln, damit kein Memory-Bloat entsteht. | Aktiv |

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
- Spieler/Athletenobjekte sind standardmaessig Listen/Rows, nicht Card-Walls.
- Status wird nie nur ueber Farbe kommuniziert.
- Agenten sollen zuerst gezielt Kontext routen und nur relevante SSOTs/Researches laden.
- Nach Sprint 0A braucht jede OnField-Aufgabe am Ende eine Memory-Closeout-Pruefung: Current State, Decision Log oder Gotchas aktualisieren, falls die Aufgabe kuenftige Sessions betrifft.

## Zurueckgestellte Entscheidungen

| Thema | Warum zurueckgestellt | Wann neu bewerten |
|---|---|---|
| Native App / Flutter / React Native | Ein Rewrite loest IA, UX und Designsystem nicht automatisch. | Nach externer Beta und stabiler PWA-UX. |
| Dark Mode | Erhoeht QA-Aufwand, bevor Light Mode und Tokens stabil sind. | Nach Kernflow-Redesign und QA. |
| Multi-Tenant SaaS, Billing, Organisationen | Nicht Teil des Coach-Operations-MVP. | In eigener OnField Performance Plattform-Roadmap. |
| Player Accounts / Player Portal | Erhoeht Auth-, Datenschutz- und Support-Komplexitaet. | Wenn Public/Kiosk-Flow validiert ist und Player-Modul klar definiert wurde. |
| Leaderboards, Feed, Social Features | Nicht Teil des aktuellen Coach-Operations-Kerns. | Spaeter als eigenes Engagement-Modul pruefen. |
| Aktive Codex Hooks | Memory Governance und Context Routing muessen zuerst stabil sein. | Nach Sprint 0A pruefen; zuerst hoechstens Stop-/PreCompact-Checks, keine blinde Memory-Automatik. |

## Verworfene Optionen

| Option | Warum nicht jetzt | Spaeter moeglich? |
|---|---|---|
| Grosse externe UI-Library als Hauptloesung | Risiko eines generischen SaaS-Looks und falscher Semantik. | Ja, wenn sie OnField-Tokens und Komponentenlogik sauber traegt. |
| Eigene Brand-Font fuer operativen UI-Text | Lesbarkeit, iOS-Naehe und Feldtauglichkeit sind wichtiger. | Ja, fuer Logo/Marketing sofort; fuer Display-UI erst nach Test. |
| Analysecharts in Live-Screens | Live-Coaching braucht Entscheidung und Handlung, nicht BI. | Analyse bleibt eigener Bereich. |
