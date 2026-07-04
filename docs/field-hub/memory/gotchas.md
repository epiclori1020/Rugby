# OnField Gotchas

Stand: 2026-07-04

Dieses Dokument speichert wiederkehrende Fehler, Fallen und konkrete Vermeidungsregeln fuer OnField-Agenten. Ein Gotcha gehoert nur hierher, wenn es zukuenftige Arbeit wahrscheinlich verbessert.

## Aktive Gotchas

| Status | Gotcha | Vermeidungsregel |
|---|---|---|
| active | iPhone darf nie Nebenansicht sein. | Jede Feature- und UI-Entscheidung muss iPhone/iPad-Paritaet pruefen. Unterschiede duerfen nur Layout, Navigation, Dichte und Sheet/Pane-Verhalten betreffen. |
| active | Memory darf kein Archiv werden. | Erst ueber `memory/index.md` routen, dann nur relevante Dateien lesen. Keine Chat-Protokolle oder langen Research-Passagen in Memory kopieren. |
| active | Medizinische Freigabe-Sprache ist riskant. | Keine Begriffe wie `cleared`, `fit`, `Return-to-play freigegeben` oder Diagnose-Sprache verwenden. Die App unterstuetzt Coaching-Entscheidungen, ersetzt aber keine medizinische Entscheidung. |
| active | Rugby darf nicht in generische OnField-Architektur eingebrannt werden. | Rugby-spezifische Begriffe gehoeren in OnField Rugby oder Content-Konfiguration, nicht in generische Komponenten- oder Produktlogik. |
| active | Hero/Marketing kann Live-Coaching stoeren. | Hero-Optik nur auf Brand-Surfaces wie Welcome, Login, Install, Empty Demo, Kiosk Welcome, Splash und Landing verwenden. Live-Flows bleiben ruhig und operativ. |
| active | Blinde Hook-/Memory-Automatik erzeugt falsches Vertrauen. | Hooks duerfen spaeter erinnern oder pruefen, aber nicht ohne Governance Memory schreiben. Sprint 0A aktiviert keine Hooks. |
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
