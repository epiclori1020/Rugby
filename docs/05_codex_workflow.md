# Codex Workflow fuer Rugby Donau S&C

Dieses Dokument definiert, wie Codex in diesem Projekt arbeiten soll. Es ergaenzt `AGENTS.md`.

## Was bereits umgesetzt ist

- Projektweite Instruktionen in `AGENTS.md`.
- Researches 1-8 als Rohtexte unter `research/raw/`.
- Gepruefte Research-Zusammenfassungen unter `research/`.
- Planungsframeworks unter `plans/`.
- Templates unter `templates/`.
- Uebergabe-Protokoll fuer Folgesessions unter `docs/08_next_session_handover.md`.
- Projektlokale Skill-Playbooks unter `codex/skills/`.

## Codex-Customization Stack

### 1. AGENTS.md

Rolle:

- Projektgedaechtnis und Standardregeln.
- Wird bei zukuenftigen Codex-Sessions als wichtigste lokale Orientierung genutzt.

Inhalt:

- Zielgruppe.
- Trainingskontext.
- Planungsprinzipien.
- Research-Standard.
- relevante Arbeitsdateien.

### 2. Projekt-Skills / Playbooks

Rolle:

- Wiederholbare Arbeitsablaeufe.
- In diesem Projekt liegen sie unter `codex/skills/`.

Hinweis:

- Falls eine Codex-Version projektlokale Skills automatisch aus `.agents/skills` oder einem aehnlichen Pfad laden kann, koennen diese Playbooks spaeter dorthin kopiert werden.
- Bis dahin dienen sie als explizit referenzierbare Skill-Dateien.

### 3. Subagents / parallele Arbeitsstraenge

Rolle:

- Nur sinnvoll bei klar trennbaren Aufgaben.

Geeignete Arbeitsstraenge:

- Research-Synthese.
- Testing/Monitoring.
- Periodisierung.
- Positionsmodule.
- Injury/Returner Safety Review.

Regel:

- Keine parallelen Agenten ohne klares Ziel und Abgleich am Ende.
- Jede parallele Analyse muss in eine Datei oder eine konkrete Entscheidung muenden.

### 4. MCP / externe Tools

Rolle:

- Nur nutzen, wenn ein echter externer Kontext noetig ist.

Fuer dieses Projekt relevant:

- Browser/Web: aktuelle Rugby-, World-Rugby- oder Vereinsinformationen pruefen.
- GitHub: nur falls der Ordner spaeter ein Repo wird.
- Documents/Spreadsheets: falls aus den Planungsdateien PDF, DOCX oder Tabellen entstehen sollen.

### 5. Review-Schleife

Jeder groessere Output soll eine kurze Review-Schleife haben:

- Passt es zu 2x/Woche?
- Passt es zum Amateur-/Semi-Pro-Kontext?
- Ist es positionsspezifisch genug?
- Ist es nicht zu komplex?
- Sind Injury-/Concussion-/Returner-Grenzen korrekt?
- Welche Annahmen sind noch offen?

## Standard-Workflow ab jetzt

1. `AGENTS.md` und `docs/08_next_session_handover.md` lesen.
2. `docs/06_master_synthesis.md` und `plans/00_planning_principles_from_research.md` als Hauptbasis nutzen.
3. Baseline-Testprotokoll finalisieren.
4. Makrozyklus-Entwurf bauen.
5. Mesozyklen definieren.
6. Erste 4-6 Wochen programmieren.
7. Safety Review gegen Injury-/Returner-Framework.
8. Verein-/Coach-Version erstellen.

## Dateirollen

- `research/`: Evidenz und gepruefte Research-Auswertung.
- `plans/`: Planungsentscheidungen und Frameworks.
- `templates/`: nutzbare Vorlagen fuer Testing, Monitoring, Returner.
- `docs/`: Kontext, Workflow, Fragen an Verein.
- `codex/skills/`: projektlokale Skill-Playbooks.

## Wann welcher Skill genutzt wird

- Researches zusammenfassen oder neue Evidenz verwerten:
  - `codex/skills/rugby-snc-research-synthesis/SKILL.md`

- Jahresplan, Makrozyklus, Mesozyklen:
  - `codex/skills/rugby-snc-annual-planning/SKILL.md`

- konkrete Dienstag/Donnerstag-Sessions:
  - `codex/skills/rugby-snc-session-programming/SKILL.md`

- Verletzungs-, Returner-, Concussion- und Belastungssicherheitscheck:
  - `codex/skills/rugby-snc-safety-review/SKILL.md`

## Wichtige Grenzen

- Codex ersetzt keine medizinische Freigabe.
- Codex soll keine Spielerdiagnosen speichern.
- Sensible Spieler-/Gesundheitsdaten nur mit expliziter Freigabe dokumentieren.
- Jahresplan bleibt vorlaeufig, bis Vereinsdaten und Spielkalender vorliegen.
