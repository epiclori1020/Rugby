# OnField Gotchas

Stand: 2026-07-06

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
| active | Verschobene Trainingstermine duerfen nicht nur per App-Link umgehaengt werden. | Bei Terminverschiebungen immer auch Markdown-Quellen, PDF-Inhalte, Dateinamen, App-`pdfRefs`, Library-Eintrag und Session-Timeline gegen interne Datums-/Progressionslogik pruefen; bei inhaltlichem Datumskonflikt neue Unterlagen bauen statt nur Links umzubenennen. |
| active | Signed-in UI-QA braucht expliziten Testzustand. | Ohne sichere Test-Auth oder Seed-State zeigt die echte App nur Locked-/Welcome-Zustaende. Fuer Screen-QA mit Daten einen lokalen Komponenten-Harness oder eine bewusst konfigurierte Test-Session nutzen und den Workaround im Abschlussbericht offen nennen. |
| active | Beta-QA darf stille Skips nicht als gruen werten. | Fuer externe Beta muss `qa:beta` Signed-in-, Public/Kiosk- und Remote-Testpfade entweder wirklich pruefen oder klar als blockiert abbrechen. Ein `skipped` in einem Beta-Gate ist kein Freigabesignal. |
| active | Lazy-Chunk-Fault-Injection kann durch Preload oder Cache wirkungslos sein. | Lazy-Error-QA vor normaler Screen-Navigation laufen lassen und bei bereits geladenen Chunks als best-effort dokumentieren; fuer harte Release-Gates einen Komponenten-Test oder gezielten Test-Fault-Harness nutzen. |
| active | Runtime-Memory-Lint-Fehler entwerten generated Memory als sicheren Kontext. | Wenn `.onfield-memory/scripts/lint.py --json` Fehler meldet, generated Knowledge und Hot Cache nicht als verlaessliche Grundlage nutzen, sondern zuerst Runtime-Memory-Privacy/Redaction bereinigen. |
| active | Runtime-Memory-Tests teilen generated Runtime-Ordner. | `.onfield-memory/tests/test_*.py` sequenziell ausfuehren, nicht parallel; die Tests resetten `captures`, `daily`, `knowledge`, `reports`, `tmp` und `state.json` und koennen sich sonst gegenseitig stoeren. |
| active | TTY-Credential-Eingabe kann Secrets sichtbar spiegeln. | Fuer Auth-/E2E-Runs mit bereitgestellten Credentials vor dem Einlesen `stty -echo` oder ein gleichwertiges sicheres Eingabemuster nutzen; falls ein Passwort sichtbar wurde, Rotation empfehlen und niemals in Dateien schreiben. |
| active | Lokaler Vite-Dev-/Preview-Server kann in der Codex-Sandbox mit `EPERM` blockieren. | Einmal direkt versuchen; bei Policy-Ablehnung keine indirekten Workarounds nutzen. Fuer Browser-/PWA-Smokes gezielt Eskalation anfordern oder den fehlenden Live-Check im Abschlussbericht klar benennen. |
| active | PWA-/Browser-Smokes koennen Erfolg ausgeben, aber wegen offener Browser-/Preview-Handles nicht beenden. | Bei E2E-/QA-Gates immer den echten Exit-Code pruefen, nicht nur die Erfolgsausgabe. Falls ein Puppeteer/Vite-Smoke haengt, Cleanup mit Timeout/Kill-Fallback haerten und `qa:local` erneut vollstaendig laufen lassen. |
| active | Der Supabase-Audit ist ein statischer Beta-Guard mit expliziter Tabellenliste. | Wenn neue dynamische Supabase-Tabellen, Public/Kiosk-Ausnahmen oder RLS-Patterns dazukommen, immer `app/field-hub/scripts/supabase-audit.mjs` und die zugehoerigen Tests mitpflegen; sonst kann der Audit falsche Sicherheit geben. |
| active | Code-Splitting kann feldkritische Flows versehentlich verlangsamen. | Bei Bundle-Arbeit zuerst nicht-feldkritische Bereiche wie Analyse, Bibliothek, Export, Einstellungen und Returner splitten. Check-in, Training, Nachbereitung, App-Shell, Sync und Public/Kiosk nur mit eigener PWA-/Offline-Risikoentscheidung anfassen. |
| active | OnField-Worktrees koennen parallele Content- oder PDF-Aenderungen enthalten. | Vor Abschluss `git status --short --untracked-files=all` und sprintbezogene `git diff -- ...` pruefen; fremde Content-/PDF-Aenderungen klar aus dem Sprint-Scope und aus spaeteren Commits heraushalten. |

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
