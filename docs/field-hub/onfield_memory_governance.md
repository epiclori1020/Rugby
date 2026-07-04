# OnField Memory Governance

Stand: 2026-07-04

## Zweck

Dieses Dokument definiert, wann OnField-Agenten Memory lesen, schreiben, ersetzen oder bewusst nicht aktualisieren. Memory soll Kontext sparen, wiederkehrende Fehler verhindern und Entscheidungen stabil halten. Memory ist kein Chat-Archiv.

## Grundsatz

OnField Memory ist ein Router plus kuratiertes Wissen:

- Der Memory Index entscheidet, welche Dateien ein Agent fuer eine Aufgabe laden soll.
- Current State beschreibt den aktuellen Zustand kurz und wird ersetzt, nicht endlos erweitert.
- Decision Log speichert dauerhafte Entscheidungen mit Begruendung.
- Gotchas speichern wiederkehrende Fehler, Fallen und harte Lessons Learned.

## Memory-Typen

| Datei | Zweck | Update-Stil |
|---|---|---|
| `docs/field-hub/memory/index.md` | Context Router fuer Agenten | gezielt erweitern, kurz halten |
| `docs/field-hub/onfield_current_state.md` | aktueller Produkt-, App-, Roadmap- und Risiko-Stand | ersetzen und verdichten |
| `docs/field-hub/onfield_decision_log.md` | dauerhafte Produkt-, Design-, Architektur- und Workflow-Entscheidungen | neue Entscheidungen mit Datum ergaenzen |
| `docs/field-hub/memory/gotchas.md` | wiederkehrende Fehler und konkrete Vermeidungsregeln | nur bei wiederholbarem Nutzen ergaenzen |

## Wann Memory Aktualisiert Wird

Aktualisiere Memory, wenn mindestens einer dieser Punkte zutrifft:

- Produktname, Markenarchitektur, Positionierung oder Plattformrichtung wurde entschieden.
- Roadmap, Sprint-Reihenfolge, Sprint-Scope oder naechster Schritt wurde geaendert.
- App-Architektur, Navigation, Informationsarchitektur oder Sport-Konfiguration wurde entschieden.
- Ein SSOT, Skill, Agentenworkflow oder Hook-Konzept wurde erstellt oder relevant geaendert.
- Ein Sprint wurde abgeschlossen oder sein Status hat sich geaendert.
- `onfield_current_state.md` ist veraltet oder beschreibt den Zustand falsch.
- Eine wiederkehrende Falle wurde gefunden, die zukuenftige Agenten vermeiden sollen.
- Eine fruehere Entscheidung wurde ersetzt, zurueckgestellt oder als obsolet markiert.

## Wann Keine Memory Aktualisiert Wird

Schreibe keine Memory fuer:

- reine Formatierungen.
- kleine Codefixes ohne Langzeitwirkung.
- normale Testlaeufe oder Build-Ausgaben.
- rohe Command-Outputs.
- temporaere Ideen ohne Entscheidung.
- Chat-Zusammenfassungen ohne kuenftigen Nutzen.
- Fakten, die direkt und eindeutig aus dem Code ersichtlich sind.
- einmalige Praeferenzen, die nicht als Produktentscheidung bestaetigt wurden.

## Lifecycle

Nutze diese Statusbegriffe fuer Entscheidungen oder Gotchas:

- `active`: gilt aktuell.
- `superseded`: wurde durch eine neuere Entscheidung ersetzt.
- `obsolete`: nicht mehr relevant und nicht mehr handlungsleitend.

Obsolete Informationen sollen nicht aktiv geladen werden. Wenn sie als Historie wichtig bleiben, markiere sie klar statt sie still stehen zu lassen.

## Anti-Bloat-Regeln

- Memory muss kuenftige Arbeit konkret besser machen.
- Keine langen Researches in Memory kopieren.
- Keine Chat-Protokolle speichern.
- Current State kurz halten und bei Aenderungen verdichten.
- Gotchas nur eintragen, wenn sie wiederholbar, riskant oder bereits aufgetreten sind.
- Der Memory Index darf routen, aber keine zweite Roadmap werden.
- Agenten laden zuerst den Router und danach nur die relevanten Dateien.

## Memory Closeout

Jede OnField-Aufgabe endet mit dieser Pruefung:

1. Muss `docs/field-hub/onfield_current_state.md` aktualisiert werden?
2. Wurde eine dauerhafte Entscheidung getroffen, die in `docs/field-hub/onfield_decision_log.md` gehoert?
3. Wurde ein wiederholbares Risiko oder eine Falle entdeckt, die in `docs/field-hub/memory/gotchas.md` gehoert?
4. Qualifiziert die Information nach den Regeln in diesem Dokument?
5. Abschlussantwort nennt `Memory updated: <file>` oder `No memory update needed`.

## Hook-Policy

Sprint 0A richtet keine aktiven Hooks ein.

Nicht erstellen:

- `.codex/hooks.json`
- `.claude/settings.local.json`
- `.claude/memory`
- Hook-Scripts
- automatische Session-Capture- oder Compile-Pipeline

Wenn eine lokale ignored `.claude/settings.local.json` bereits existiert, bleibt sie unberuehrt. Sie ist keine OnField-Memory-Runtime und gehoert nicht in Git.

Spaetere Hooks duerfen erinnern oder pruefen, aber nicht blind Memory schreiben. Stop-/PreCompact-Checks sind Kandidaten fuer einen spaeteren Sprint, wenn Governance und Skills stabil sind.

## LUVI-Bezug

Von LUVI uebernehmen wir fuer OnField v1:

- Routing vor Vollkontext.
- Governance vor Automation.
- klare Trennung von Current State, Decisions und Gotchas.
- Memory-Closeout am Ende von Agentenarbeit.
- Index als Einstieg fuer Menschen und Agenten.

Nicht uebernehmen fuer OnField v1:

- komplette `.claude/memory` Script-Suite.
- Runtime Daily Logs.
- automatische Knowledge Compilation.
- Archon-Integration.
- lokale Hook-/Session-Capture-Pipeline.
- grosse agentenspezifische Memory-Struktur auf Vorrat.
