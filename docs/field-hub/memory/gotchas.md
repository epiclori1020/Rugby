# OnField Gotchas

Stand: 2026-07-05

Dieses Dokument speichert wiederkehrende Fehler, Fallen und konkrete Vermeidungsregeln fuer OnField-Agenten. Ein Gotcha gehoert nur hierher, wenn es zukuenftige Arbeit wahrscheinlich verbessert.

## Aktive Gotchas

| Status | Gotcha | Vermeidungsregel |
|---|---|---|
| active | iPhone darf nie Nebenansicht sein. | Jede Feature- und UI-Entscheidung muss iPhone/iPad-Paritaet pruefen. Unterschiede duerfen nur Layout, Navigation, Dichte und Sheet/Pane-Verhalten betreffen. |
| active | Memory darf kein Archiv werden. | Erst ueber `memory/index.md` routen, dann nur relevante Dateien lesen. Keine Chat-Protokolle oder langen Research-Passagen in Memory kopieren. |
| active | Medizinische Freigabe-Sprache ist riskant. | Keine Begriffe wie `cleared`, `fit`, `Return-to-play freigegeben` oder Diagnose-Sprache verwenden. Die App unterstuetzt Coaching-Entscheidungen, ersetzt aber keine medizinische Entscheidung. |
| active | Rugby darf nicht in generische OnField-Architektur eingebrannt werden. | Rugby-spezifische Begriffe gehoeren in OnField Rugby oder Content-Konfiguration, nicht in generische Komponenten- oder Produktlogik. |
| active | Hero/Marketing kann Live-Coaching stoeren. | Hero-Optik nur auf Brand-Surfaces wie Welcome, Login, Install, Empty Demo, Kiosk Welcome, Splash und Landing verwenden. Live-Flows bleiben ruhig und operativ. |
| active | Oxblood driftet leicht in Status- oder Alarmbedeutung. | Oxblood nur fuer Brand-/Editorial-Surfaces nutzen. Warning, Danger, Follow-up und Attention muessen ein getrenntes funktionales Statussystem nutzen. |
| active | Alte Field-Hub-Sprintnummern koennen OnField-Roadmap-Scope verwirren. | Fuer OnField-UX/Branding-Sprints gilt die Roadmap `docs/superpowers/plans/2026-07-04-onfield-ux-branding-transformation-roadmap.md`; alte MVP-Sprinttexte in `app/field-hub/README.md` duerfen den aktuellen Sprint-Scope nicht ueberschreiben. |
| active | Figma-Top-Level-Metadaten koennen Seiten unvollstaendig listen. | Bei Figma-Handoff-Pruefungen nicht nur `get_metadata` ohne `nodeId` nutzen. Zusaetzlich bekannte Page/Node-IDs oder `use_figma` mit `page.loadAsync()` pruefen, bevor Doku als falsch bewertet oder Artefakte dupliziert werden. |
| active | Blinde Hook-/Memory-Automatik erzeugt falsches Vertrauen. | Sprint 0D-Runtime darf nur lokale ignored Captures, Daily Logs, Knowledge, Reports, Backups, Orphans, Tmp-Dateien und State verwalten. Current State, Decision Log, Roadmap und SSOTs bleiben manuelle Memory-Closeout-Entscheidungen des Agenten. |
| active | Runtime-Redaction ist kein Datenschutzmodell. | E-Mails, Telefonnummern, Geburtsdaten, Secrets und Clearance-Wording werden redigiert/markiert, aber Agenten duerfen keine sensiblen Spieler- oder Gesundheitsdaten bewusst in Memory-Kontext einspeisen. |
| active | Lokale ignored Claude-Konfiguration kann existieren. | Eine vorhandene `.claude/settings.local.json` nicht als OnField-Runtime werten und nicht bearbeiten oder committen. Tracked Codex-Hooks und `.onfield-memory`-Scripts/Config aus Sprint 0C/0D sind erlaubt; generierte Runtime-Outputs bleiben ignored. |
| active | PDFs und kopierte Researches koennen Whitespace-Warnungen erzeugen. | PDFs nicht mechanisch formatieren, weil PDF-Strukturen beschaedigt werden koennen. Research-Markdown nur gezielt bereinigen, wenn es keine Quellenstruktur zerstoert. |

## Wann Neue Gotchas Hinzukommen

Nur ergaenzen, wenn:

- der Fehler wahrscheinlich wieder passiert.
- die Vermeidungsregel konkret und kurz ist.
- der Eintrag zukuenftige Agentenarbeit sicherer macht.

Nicht ergaenzen fuer:

- einmalige Geschmacksfragen.
- normale Todo-Listen.
- rohe Test- oder Command-Ausgaben.
- Details, die direkt im Code offensichtlich sind.
