# Rugby S&C Field Hub

Stand: 14. Juni 2026

Dieser Ordner ist der Planungs- und spaetere Implementierungsbereich fuer eine kleine App, die Arwin beim S&C-Training von Rugby Union Donau Wien organisatorisch entlasten soll.

Wichtig: Der App-Code liegt inzwischen unter `app/field-hub/`. Neue Codex-Sessions sollen zuerst diese Datei, `app/ROADMAP.md`, `app/field-hub/README.md`, `app/field-hub/QA_SPRINT_10.md` und `docs/08_next_session_handover.md` lesen, bevor sie weitere App-Arbeit planen oder umsetzen.

## Produktziel

Die App ist kein Spielerportal und keine reine PDF-Ablage. Sie soll Arwins persoenliches Training-Operations-Dashboard sein:

- vor dem Training: heutige Einheit, Briefing, offene Warnungen, Material, erwartete Spieler.
- waehrend des Trainings: Check-in, Anwesenheit, Ampel, Varianten, schnelle Beobachtungen.
- nach dem Training: sRPE, Pain/Issue, E2-Entscheidung, Progression, Follow-ups.
- zwischen Einheiten: Carry-over von Warnungen, Returner-Caps, Consent-Status und naechsten Aufgaben.

Der Kern ist: Spieler werden einmal angelegt und danach wiedererkannt. Daten werden einmal erfasst und dann in Spielerprofil, Einheit, Progression und Follow-up zusammengefuehrt.

## Aktuelle Architekturentscheidung

MVP:

- Frontend: React + TypeScript + Vite.
- App-Form: installierbare PWA fuer iPad und iPhone.
- Sync-Wahrheit: Supabase Postgres mit Supabase Auth und Row Level Security.
- Offline-Schicht: IndexedDB, bevorzugt ueber Dexie, als lokaler Cache und Offline-Queue.
- Server: kein eigener Server im MVP; Supabase ist die verwaltete Backend-/Sync-Schicht.
- Sync: iPad und iPhone sollen dieselben Daten sehen, sobald beide online synchronisieren koennen.
- Hauptgeraet am Feld: iPad; iPhone kann dieselben Daten nutzen, sobald Sync abgeschlossen ist.
- Export: JSON/CSV fuer Backup und Weiterverarbeitung.

Spaeter optional:

- weitere Rollen fuer zweite Coaches, Physio oder Vereinsstaff.
- Realtime-Updates, falls mehrere Personen gleichzeitig arbeiten.
- Storage im MVP nur fuer private Spielerprofilfotos nach Foto-Erlaubnis. Keine medizinischen Dokumente, keine freien Datei-Uploads.

## Sicherheit und Datenschutz im MVP

Pragmatische Best Practice, kein Over-Engineering:

- Dynamische Trainingsdaten liegen in Supabase und zusaetzlich lokal im IndexedDB-Cache.
- Supabase Auth wird genutzt, damit iPad und iPhone demselben Nutzer zugeordnet sind.
- RLS muss auf allen dynamischen Tabellen aktiv sein.
- Keine Spieler-Accounts.
- Keine Spieler-Logins.
- Keine eigenen Server-Secrets im Frontend; kein `service_role` Key im Client.
- Spielerfotos liegen nur in einem privaten Supabase-Storage-Bucket mit Policies, nicht public.
- Keine Drittanbieter-Analytics.
- Kein Speichern von Diagnosen oder Arztbriefen.
- Consent nur als Status pro Spieler: vorhanden / offen / unklar.
- Foto-Erlaubnis nur als Status pro Spieler: nicht gefragt / erlaubt / abgelehnt.
- Medizinische Freigaben werden nicht durch die App getroffen.
- Concussion, Kopf-/Nacken-/neurologische Red Flags und akute Instabilitaet fuehren zu Stop/medizinischer Klaerung, nicht zu einer App-Alternative.

## Pflichtquellen fuer eine neue Codex-Session

Vor Implementierung lesen:

- `AGENTS.md`
- `docs/05_codex_workflow.md`
- `docs/08_next_session_handover.md`
- `print_pdfs/00_manifest.txt`
- `app/ROADMAP.md`
- `app/CODEX_SETUP_AUDIT.md`
- `app/SUPABASE_SETUP_GUIDE.md`

Fuer Inhalte und Datenmodell:

- `templates/unit_1_simplified_player_checkin_values_2026-06-16.md`
- `templates/progression_tracker_field_compact.md`
- `templates/returner_tracking_template.md`
- `templates/monitoring_template.md`
- `templates/session_variants_abcd_quick_card.md`
- `templates/exercise_pool_offseason_mapping.md`
- `templates/unit_1_slim_consent_2026-06-16.md`
- `templates/kw25_coach_script_2026-06-16_18.md`
- `plans/offseason_coach_sheets/KW25_tuesday_training_plan_clear_2026-06-16.md`
- `plans/offseason_coach_sheets/KW25_thursday_training_plan_clear_2026-06-18.md`
- `plans/offseason_coach_sheets/kw25_27_one_page_field_cards.md`
- `plans/offseason_coach_sheets/kw28_31_one_page_field_cards.md`

## Inhaltliche Quellenlogik

Die App soll primaer aus den Markdown-Quellen gespeist werden, nicht aus den PDFs. PDFs bleiben als Backup/Export in der Bibliothek.

Aktive PDF- und Quellenzuordnung steht in:

- `print_pdfs/00_manifest.txt`

Die erste App-Version soll nur aktive und naechst relevante Unterlagen nutzen. Archivdateien unter `99_alt_backup_referenz_nicht_parallel_aktiv` duerfen nicht als aktive Workflows eingebaut werden.

Fuer den MVP soll die neue Codex-Session die wichtigsten Inhalte bewusst manuell in einfache TypeScript-/JSON-Strukturen uebertragen. Kein komplexer Markdown-Parser, keine automatische PDF-Extraktion und keine Content-Pipeline, solange die statischen KW25-31-Inhalte nicht real zu schwer zu pflegen werden.

## Backup-Logik im MVP

Da der MVP Supabase-Sync nutzt, ist die zentrale Datenbank die Hauptsicherung gegen Geraete-Drift. Export bleibt trotzdem Pflicht als einfache zusaetzliche Sicherung und fuer Weiterverarbeitung.

Pflicht:

- Nach jeder abgeschlossenen Einheit soll die App einen Export-Hinweis anzeigen.
- Exportformat: vollstaendiges JSON-Backup plus CSV fuer Check-ins, Progression und Baseline/Testwerte.
- Die App soll sichtbar anzeigen, wann zuletzt exportiert wurde.
- Die App soll sichtbar anzeigen, ob lokale Aenderungen noch nicht mit Supabase synchronisiert sind.
- Bei Offline-Nutzung am Feld werden Eingaben lokal gespeichert und spaeter synchronisiert.

## Implementierungsort

Wenn der Nutzer spaeter Gruenlicht fuer Code gibt, soll die App unter diesem Ordner entstehen, bevorzugt:

- `app/field-hub/`

Die Planungsdateien `app/README.md` und `app/ROADMAP.md` bleiben als Projektbriefing erhalten.
