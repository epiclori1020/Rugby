# OnField Post-Roadmap Hardening Evidence & Closeout

Stand: 2026-07-07

## Zweck

Dieses Dokument schliesst Sprint 21-26 der Post-Roadmap-Hardening-Roadmap dokumentarisch ab. Es sammelt die Beta-relevante Evidence, die LUVI-Wiederverwendungsentscheidung und die Memory-Closeout-Regeln fuer kuenftige OnField-Sessions.

Es ist keine juristische Datenschutzfreigabe, keine medizinische Freigabe und keine neue Produkt-Roadmap.

## Scope-Urteil

| Bereich | Urteil | Beleg |
|---|---|---|
| Phase A, Sprint 21-23 | Implementiert; externe Beta bleibt von frischem `qa:beta`-Pass abhaengig. | QA-Gates, Runtime-Memory-Hardening und Supabase/Auth/RLS-Audit sind dokumentiert und in den Gate-Kommandos verankert. |
| Phase B, Sprint 24-26 | Dokumentarisch und organisatorisch abgeschlossen. | Routing/PWA, A11y/Responsive und Sprint-26-Closeout-Doku sind auf den aktuellen Stand gebracht; frische Checks sind unten dokumentiert. |
| Externe Beta | Technisches Repo-Gate ist frisch bestanden; externe Beta ist organisatorisch noch nicht automatisch freigegeben. | Der Nachlauf am 2026-07-07 pruefte `qa:beta` vollstaendig mit Supabase-Audit, signed-in Visual-QA und Remote-Kiosk-Mutation. Remote-Dashboard-Handcheck, Credential-Rotation und Beta-Kommunikation bleiben Pflicht vor externer Nutzung. |
| Native/SaaS | Bewusst nicht vorgezogen. | OnField bleibt PWA-first; Native/SaaS wird erst nach Beta-Evidence neu bewertet. |

## LUVI-Wiederverwendungsurteil

| LUVI-Muster | Sprint-26-Entscheidung | OnField-Umsetzung |
|---|---|---|
| Evidence-/Inventory-Matrix | uebernehmen | Dieses Dokument und `onfield_luvi_reuse_audit.md` halten Quelle, Entscheidung, Begruendung und Folge fest. |
| Auth-/Consent-Audit-Evidence | anpassen | `qa:beta` muss echte signed-in und remote Pfade pruefen; keine neue Consent- oder Auth-Architektur. |
| Persistenz-/Resume-Auditformat | uebernehmen | Beta-Readiness dokumentiert Offline, Pending, Retry, Export und Wiederaufnahme als eigene Risiken. |
| Definition-of-Done-Gate-Schichtung | anpassen | OnField nutzt Typecheck, Lint, Tests, Build, `qa:local`, `qa:beta`, `supabase:audit` und Runtime-Memory-Lint. |
| A11y-/Touch-/Layout-Testdisziplin | uebernehmen als QA-Muster | Keine Flutter-Widgets; Pruefidee fuer Labels, Touch Targets, Loading/Disabled, Safe Areas und Keyboard-Clearance bleibt. |
| Privacy-/Incident-/Key-Rotation-Disziplin | anpassen | Beta-Hygiene ohne Enterprise-Runbook: keine Secrets speichern, geteilte Passwoerter rotieren, keine sensiblen Daten in Evidence. |
| Flutter-Code, Riverpod, GoRouter, Native Storage, SQLCipher, LUVI-Branding, Consumer-Health-Assets | nicht uebernehmen | Widerspricht Sprint-26-Scope, OnField PWA-first oder Field-Graphite-Designsystem. |

## Verification Log

## Nachlauf 2026-07-07

Dieser Nachlauf hat nach dem Abschluss-Audit zusaetzliche Guardrails umgesetzt:

- Supabase-Child-Write-Policies fuer `player_session_entries`, `progress_entries`, `baseline_entries` und `returner_entries` pruefen Parent-Ownership gegen `players` und `session_logs`.
- `npm run supabase:audit` erkennt jetzt bekannte Child-Policies ohne Parent-Ownership nicht mehr als ausreichend.
- `qa:local` schreibt redigierte maschinenlesbare Reports unter `.tmp/onfield-qa/`, PWA-Smoke bricht bei Browser-Errors ab, und Sprint-19-Visual-QA umfasst `Mehr / Returner`.
- Kiosk-E2E kann fuer Beta-nahe Runs mit `FIELD_HUB_E2E_REQUIRE_PREVIEW=1` nicht mehr auf den Vite-Dev-Server zurueckfallen.
- Runtime-Memory-Tests nutzen temporaere `ONFIELD_MEMORY_DIR`-Wurzeln und loeschen nicht mehr die echte lokale Runtime.
- Focus-Ring-Kontrast und ausgewaehlte Disabled-State-Semantik in Nachbereitung/Returner wurden gehaertet.
- Backup-Importe halten historische `progressEntries`, `baselineEntries` und `returnerEntries` mit `playerId: null` lokal und verhindern Remote-Pending-Writes fuer diese Records.

Aktuelle Evidence aus diesem Nachlauf:

| Check | Ergebnis | Hinweis |
|---|---|---|
| `npm run qa:local` | passed | Erster Sandbox-Lauf blockierte am lokalen Preview-Server; eskalierter Lauf passierte Supabase-Audit, Typecheck, Lint, 592 Tests, Build, PWA-Smoke und Sprint-19-Visual-QA. |
| `npm run qa:beta` | passed | Frischer Lauf nach Remote-Migration und Backup-Import-Fix pruefte Supabase-Audit, Typecheck, Lint, 593 Tests, Build, PWA-Smoke, signed-in Visual-QA und Remote-Kiosk-Mutation. |
| Remote-Supabase-Migration `20260707143000` | applied | `supabase db push` hat `20260707143000_harden_child_parent_ownership.sql` auf die verlinkte Remote-Datenbank angewendet; `supabase migration list` und `pg_policies`-Abfrage bestaetigten die aktiven Child-Write-Policies. |
| Backup-Import Null-Parent-Regel | passed | Historische Progress-/Baseline-/Returner-Records mit `playerId: null` bleiben lokal, werden als nicht pending behandelt und erzeugen keinen Remote-Sync-Write. |
| Signed-in Sprint-19-Visual-QA | passed | Temporäre Laufzeit-Credentials wurden via verdeckter STDIN-Eingabe genutzt, nicht in Dateien oder Reports geschrieben. |
| Runtime-Memory-Lint | passed with warning | `ok: true`; vorhandene Warnung `compile_pending` bleibt sichtbar und blockiert nicht. |

| Check | Kommando / Evidence | Ergebnis | Hinweis |
|---|---|---|---|
| Package-Scripts geprueft | `app/field-hub/package.json` | passed | Relevante Scripts vorhanden: `typecheck`, `lint`, `test`, `build`, `qa:local`, `qa:beta`, `supabase:audit`, PWA-/Kiosk-Smokes. |
| Runtime-Memory Setup | `python3 .onfield-memory/scripts/setup_check.py --json` | passed | Alle tracked Scripts und ignored Runtime-Ordner sind korrekt erkannt. |
| Runtime-Memory Python Compile | `python3 -m compileall .onfield-memory/scripts .onfield-memory/tests` | passed | Scripts und Tests kompilieren. |
| Runtime-Memory Compile | `python3 .onfield-memory/scripts/compile.py --force` | passed | Knowledge/Hot Cache wurden frisch kompiliert; generated Artefakte bleiben ignored. |
| Runtime-Memory Lint | `python3 .onfield-memory/scripts/lint.py --json` | passed | `ok: true`, `issue_count: 0`. |
| Runtime-Memory Test-Suite | temp-copy Lauf von `.onfield-memory/tests/test_*.py` | passed | `test_capture_flush.py`, `test_compile_index_hot.py`, `test_hooks_smoke.py`, `test_lint_recover.py` und `test_redact.py` liefen sequenziell ohne Live-Runtime-Reset. |
| App QA Local | `npm run qa:local` in `app/field-hub` | passed after sandbox retry | Erster Lauf scheiterte am lokalen Preview-Server in der Sandbox; eskalierter Lauf passierte Supabase-Audit, Typecheck, Lint, 590 Tests, Build, PWA-Smoke und Visual-QA. |
| App QA Beta | `npm run qa:beta` in `app/field-hub` | passed | Lief mit temporaeren Laufzeit-Credentials und `FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION=1`; signed-in Visual-QA und Remote-Kiosk-E2E wurden geprueft. |
| Non-gate Lazy Fault Injection | Report-Feld `lazyError` aus `e2e-sprint19-visual-qa.mjs` | skipped / not beta evidence | Bekannter best-effort-Check: Chunk war bereits geladen oder vorab geladen. Wird nicht als Beta-Freigabe-Evidence gewertet; die echten Beta-Pfade sind separat checked. |
| Git Artifact Check | `git status --short --untracked-files=all`, `git diff --check`, `git ls-files .onfield-memory/...` | passed | Nur Sprint-26-Dateien sind geaendert; keine generierten Runtime-Memory-Artefakte sind getrackt; Whitespace-Check ist sauber. |

## Credential-Hygiene

QA-Zugangsdaten duerfen nur temporaer zur Laufzeit genutzt werden. Sie werden nicht in Markdown, Code, `.env`, Screenshots, Shell-Beispielen, Logs oder Memory gespeichert.

Wenn ein Passwort in einem Chat geteilt wurde, muss es nach optischer QA rotiert oder per Reset neu gesetzt werden. Ein `service_role` Key wird fuer Sprint 26 nicht verlangt, gespeichert oder verwendet.

## Naechste Empfehlung

Die kontrollierte externe Beta kann vorbereitet werden. Vor dem ersten externen Test bleiben Remote-Dashboard-Handcheck, Credential-Rotation und Beta-Kommunikation ohne sensible Daten Pflicht.

Wenn `qa:beta` blockiert, geskippt oder nicht mit echten Laufzeit-Credentials laeuft, gilt die externe Beta als nicht freigegeben.
