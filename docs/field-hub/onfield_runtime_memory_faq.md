# OnField Runtime Memory FAQ

Stand: 2026-07-04

## Zweck

Das OnField Runtime Memory ist ein lokales, Codex-first Arbeitsgedaechtnis fuer wiederkehrende Agentenarbeit. Es soll verhindern, dass wichtige Session-Erkenntnisse verloren gehen, ohne alle Memories in jede Session zu laden.

Es ist kein Produktfeature, kein Cloud-Speicher und kein SSOT.

## Autoritaetshierarchie

1. `AGENTS.md`
2. `docs/field-hub/onfield_decision_log.md`
3. `docs/field-hub/onfield_current_state.md`
4. OnField-SSOTs
5. `.onfield-memory/knowledge/`
6. `.onfield-memory/daily/`
7. `.onfield-memory/captures/`

Wenn Runtime Memory einem SSOT widerspricht, gilt der SSOT.

## Was Wird Automatisch Gemacht?

- `SessionStart` zeigt nur `.onfield-memory/knowledge/hot.md`, wenn vorhanden.
- `Stop` und `PreCompact` capturen redigiertes lokales Rohmaterial.
- Captures werden in lokale Daily Logs geschrieben.
- Der lokale Compiler erzeugt deterministische Knowledge-Artikel, Index und Hot Cache.
- Lint/Health prueft Struktur, Leaks, Index Drift und pending Compile.
- Backups, Orphans und Recovery bleiben lokal.

## Was Wird Nicht Automatisch Gemacht?

- Keine SSOTs ersetzen.
- Kein `onfield_current_state.md` automatisch schreiben.
- Kein `onfield_decision_log.md` automatisch entscheiden.
- Keine Roadmap automatisch aendern.
- Keine echten Secrets speichern.
- Keine sensiblen Spieler- oder Gesundheitsdaten bewusst sammeln.
- Keine Claude-Hooks ohne eigene Entscheidung aktivieren.
- Keine LLM-/Codex-Subprozesse aus Hooks starten.

## Wichtige Pfade

| Pfad | Zweck | Git |
|---|---|---|
| `.onfield-memory/config.json` | Runtime-Konfiguration | tracked |
| `.onfield-memory/scripts/` | Capture, Redaction, Compile, Lint, Recovery | tracked |
| `.onfield-memory/tests/` | Runtime-Tests | tracked |
| `.onfield-memory/captures/` | redigierte Capture-JSONs | ignored |
| `.onfield-memory/daily/` | lokale Daily Logs | ignored |
| `.onfield-memory/knowledge/` | generierte Knowledge, Index, Hot Cache | ignored |
| `.onfield-memory/reports/` | Lint, Setup, Hook-Reports, SSOT-Vorschlaege | ignored |
| `.onfield-memory/backups/` | Knowledge-Backups | ignored |
| `.onfield-memory/orphans/` | ungueltige Captures | ignored |
| `.onfield-memory/tmp/` | temporaere Runtime-Arbeitsdateien | ignored |
| `.onfield-memory/state.json` | lokaler Runtime-State | ignored |

## Wann Nutzt Ein Agent Das?

Nutze den Skill `.agents/skills/onfield-runtime-memory/SKILL.md`, wenn du:

- Runtime Memory debuggen, erweitern oder auditieren sollst.
- Hook-Verhalten fuer `SessionStart`, `Stop` oder `PreCompact` pruefst.
- Redaction, Daily Logs, Compile, Index, Hot Cache, Lint oder Recovery aenderst.
- wissen willst, ob generierte Knowledge in einen SSOT uebernommen werden soll.

## Standard-Checks

```bash
python3 -m compileall .onfield-memory/scripts .onfield-memory/tests
python3 .onfield-memory/tests/test_redact.py
python3 .onfield-memory/tests/test_capture_flush.py
python3 .onfield-memory/tests/test_compile_index_hot.py
python3 .onfield-memory/tests/test_lint_recover.py
python3 .onfield-memory/tests/test_hooks_smoke.py
python3 -m json.tool .codex/hooks.json
python3 -m json.tool .onfield-memory/config.json
python3 .onfield-memory/scripts/setup_check.py --json
python3 .onfield-memory/scripts/lint.py --json
git diff --check
```

Wenn Tests lokale Runtime-Artefakte erzeugen, duerfen diese danach entfernt werden:

```bash
rm -rf .onfield-memory/captures .onfield-memory/daily .onfield-memory/knowledge .onfield-memory/backups .onfield-memory/orphans .onfield-memory/reports .onfield-memory/tmp .onfield-memory/state.json .onfield-memory/scripts/__pycache__ .onfield-memory/tests/__pycache__
```

## Umgang Mit Generated Knowledge

Generated Knowledge ist nur ein Hinweis. Ein Agent darf daraus eine Memory-Closeout-Entscheidung ableiten, muss aber selbst pruefen:

- gehoert es in Current State?
- gehoert es in Decision Log?
- gehoert es in Gotchas?
- oder bleibt es nur lokales Rohmaterial?

`reports/ssot-proposals.md` ist ein Vorschlagskorb, kein automatisches Update.

## Bekannte Grenzen

- Der Compiler ist bewusst deterministisch und lokal, nicht LLM-kuratiert.
- Redaction ist ein Sicherheitsnetz, kein vollstaendiges Datenschutzmodell.
- Runtime Memory ist fuer Single-Developer local-first optimiert.
- Team-Sync, Cloud-Memory, Vector Search und Claude-Hook-Paritaet sind spaetere Entscheidungen.
