# Rugby S&C Field Hub

Sprint-10-Stand fuer Arwins persoenliches Rugby Donau S&C Coach-Dashboard.

## Lokale Kommandos

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Der Dev-Server nutzt Vite. Lokal ist die URL typischerweise `http://127.0.0.1:5173/`
oder `http://localhost:5173/`.

## Sprint-1-Scope

- Vite + React + TypeScript.
- App-Shell mit Startscreen `Heute`.
- Hauptnavigation: Heute, Spieler, Check-in, Training, Nachbereitung, Returner, Bibliothek, Export.
- PWA-Grundlagen mit `vite-plugin-pwa`.
- Sichtbarer Sync-Status-Platzhalter.
- Versuch von `navigator.storage.persist()` beim ersten Start.
- Hinweis, die App auf iPad/iPhone zum Home-Bildschirm hinzuzufuegen.
- Supabase `.env.example` vorbereitet.

## Sprint-2-Scope

- Handgepflegte statische Content-Struktur unter `src/content/`.
- KW25 Dienstag und Donnerstag als detaillierte `SessionDefinition`-Eintraege.
- KW26-31 als kompakte Session-Karten aus den aktiven One-Page Field Cards.
- Heute-Dashboard nutzt die statischen Sessions und zeigt die naechste Einheit.
- Bibliothek mit Kategorien:
  - Coach-Skript.
  - Spieler-Briefing.
  - Detail-Briefing.
  - Varianten.
  - Exercise Mapping.
  - Consent/Datenschutz.
  - PDFs.
- Aktive PDFs liegen als Fallback unter `public/library/`.

Wichtig: Die Hauptansicht bleibt App-UI/HTML. PDFs sind Backup, Ausdruck oder
iPad-Nachschlagewerk. Archiv-PDFs sind nicht als aktive Workflows eingebaut.

## Sprint-3-Scope

- Supabase Client mit `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Coach-Login mit Email + Passwort, Logout und sichtbarem Auth-/Sessionstatus.
- Ohne Coach-Login werden keine dynamischen Spieler-Daten aus Supabase geladen.
- Supabase CLI-Struktur unter `../../supabase/`.
- Migration `../../supabase/migrations/20260613192159_sprint_3_foundation.sql` fuer:
  - `players`
  - `session_logs`
  - `player_session_entries`
  - `progress_entries`
  - `baseline_entries`
  - `returner_entries`
  - RLS und eigene-Zeilen-Policies fuer alle dynamischen Tabellen.
  - privaten Storage-Bucket `player-photos` mit Policies fuer eigene `{user_id}`-Pfade.
- Dexie/IndexedDB-Grundlage fuer lokalen Spieler-Cache und Pending-Write-Queue.
- Spieler-Tab mit Liste, Anlegen, Bearbeiten, Deaktivieren, Position, Cluster, Consent,
  Returner-Status und Foto-Erlaubnis.
- Optionales Profilfoto nur bei Foto-Erlaubnis `allowed`.
- Export-Tab mit JSON-Export fuer Spieler-Stammdaten.
- Sync-Status zeigt online/offline, synced/pending/error, Pending Count und letzten Sync.

## Sprint-4-Scope

- Check-in-Tab nutzt aktive Spieler aus Sprint 3; Spieler muessen nicht neu geschrieben werden.
- Die aktuelle Einheit kann in Heute und Check-in manuell ausgewaehlt werden; die Auswahl bleibt nach Reload erhalten.
- Pro Spieler erfassbar: Anwesenheit, Readiness 1-5, Life-Flag, Schmerzscore, Schmerzort,
  Returner-Status, Safety-Flag, auffaelliges Laufbild und kurze Coach-Notiz.
- Ampel-Vorschlag ist regelbasiert und bleibt Coach-Entscheidung:
  - Gruen bei Schmerz 0-2 und keinen relevanten Flags.
  - Gelb bei Schmerz 3-4, niedriger Readiness, Life-Flag, Returner/offen oder Vorwarnung.
  - Rot bei Schmerz >4, Kopf/Nacken/neurologischem Flag, akuter Instabilitaet,
    auffaelligem Laufbild oder mindestens zwei gelben Flags.
- Harmlose Life-Flag-Texte wie `nein`, `ok` oder `nichts` triggern nicht mehr automatisch Gelb.
- Manuelle Ampel-Korrektur ist im Check-in direkt moeglich; finale Ampel, Vorschlag und
  Coach-Korrektur-Status werden lokal gespeichert.
- Dexie speichert `session_logs` und `player_session_entries` lokal und queued Pending-Writes.
- Reines Laden von Heute/Check-in erzeugt keinen lokalen `session_log` mehr; eine Session wird
  erst beim ersten echten Check-in-Speichern angelegt.
- Supabase-Sync nutzt weiter die Sprint-3-Tabellen und ergaenzt per Migration
  `traffic_light_suggestion` und `traffic_light_was_manual`; keine Edge Functions, kein Realtime.
- Heute-Dashboard zeigt aktive oder zuletzt anwesende Spieler, Anwesenheit, Check-in-Pending und offene
  Gelb/Rot/Returner-Hinweise aus lokalen Vor-Einheiten.
- Check-in-Save-/Sync-Fehler werden sichtbar angezeigt.
- `npm test` nutzt Vitest fuer die Ampel-Fachlogik und Repository-/Dexie-Regressionslogik.

### Sprint 4 Nachbesserung

Die Nachbesserung verhindert Phantom-Session-Logs beim reinen Laden, ergaenzt die persistierte
manuelle Session-Auswahl, sortiert Spieler aus der letzten vorherigen Einheit als `Zuletzt dabei`
nach vorne und speichert Ampel-Vorschlag plus Coach-Korrektur als Audit-Metadaten.

Wichtig: Die Migration `../../supabase/migrations/20260613230725_add_player_session_traffic_audit.sql`
wurde am 14. Juni 2026 remote auf `rugby-snc-field-hub` angewendet. `supabase db push --dry-run`
meldete danach `Remote database is up to date`; die Spalten `traffic_light_suggestion` und
`traffic_light_was_manual` wurden in `public.player_session_entries` geprueft.

## Sprint-5-Scope

- Training-Tab ersetzt den Platzhalter durch eine echte iPad-first Trainingsansicht.
- Die aktuell gewaehlte Einheit zeigt die komplette Timeline mit Zeit, Block, Arbeit, Dosis und Dokumentationshinweis.
- Varianten A+/A/B/C/D sind als Schnellkarten eingebaut.
- Exercise-Mapping ist handgepflegt aus den aktiven Quellen verfuegbar; keine Markdown-/PDF-Parser-Pipeline.
- Spieler-spezifische Quick Actions:
  - C-Variante.
  - D/stop/klaeren.
  - kein Sprint.
  - kein Conditioning.
  - kein schweres Heben.
  - Physio/Medical.
- Training-Beobachtungen pro Spieler werden auf `player_session_entries.observation` gespeichert.
- A+/A/B/C/D wird als `training_variant` auf `player_session_entries` gespeichert.
- Kontaktindex und Speed-Exposure werden auf dem bestehenden `session_logs`-Datensatz gespeichert.
- Reines Laden der Training-Ansicht erzeugt weiterhin keine Phantom-Session; ein `session_log` entsteht erst beim Speichern einer echten Trainingsnotiz oder Spieleranpassung.
- Supabase-Sync nutzt weiter die bestehende Dexie-/Pending-Queue; keine Edge Functions, kein Realtime, keine Spieler-Accounts.

## Sprint-6-Scope

- Nachbereitung-Tab ersetzt den Platzhalter durch eine echte iPad-first Arbeitsansicht.
- Pro Spieler erfassbar: sRPE 0-10, Pain/Issue nach Training, E2-Entscheidung und naechster Schritt.
- Einheitsebene: Dauer, Gruppengroesse, Coach Review und Status `completed`.
- sRPE-Load wird lokal berechnet und aus Supabase als generated column `session_load` gelesen; die App upsertet diese Spalte nicht.
- Progressionsdaten werden in `progress_entries` gespeichert:
  - Hauptuebung.
  - Last.
  - Reps.
  - RPE.
  - Power/Sprint.
  - Conditioning.
  - Progressionsnotiz.
- E2-/Progressions-/Post-Pain-Hinweise werden in Heute, Check-in und Training als Carry-over sichtbar.
- Dexie Version 3 ergaenzt `progressEntries`; Pending-Queue und Sync-Status zaehlen `progress_entries` mit.
- Automatisierte Tests decken sRPE-Load, Progressionsvorschlag, Follow-up-Ableitung, Progression-Repository, Post-Session-Mapping, Dauer-Neuberechnung und parallele Session-Log-Erstellung ab.
- Audit-Nachbesserung: Wenn die Session-Dauer nach bereits gesetztem sRPE geaendert wird, werden betroffene lokale Spieler-Loads neu berechnet und erneut zur Synchronisation vorgemerkt.
- Sprint 6 braucht keinen Datenbank-Push: `supabase db push --dry-run` meldete am 14. Juni 2026 `Remote database is up to date`.

Noch nicht enthalten: Returner-Cap-Verwaltung, Export-/Import-Erweiterung,
automatische Markdown-/PDF-Parser.

## Sprint-7-Scope

- Returner-Tab ersetzt den Platzhalter durch eine echte Arbeitsansicht.
- Pro Returner erfassbar:
  - aktuelle Stufe.
  - Medical/Physio-Kontakt-Notiz.
  - Speed-Cap.
  - COD/Decel-Cap.
  - Conditioning-Cap.
  - Kontakt-Cap.
  - heute erlaubt.
  - geplante Caps.
  - tatsaechlich absolviert.
  - Symptome im Training.
  - naechster Morgen.
  - Entscheidung: bleiben, steigern, reduzieren, rueckmelden.
- Pro Returner zeigt die App einen kompakten lokalen Verlauf der letzten Eintraege.
- Red-Flag-Liste ist sichtbar; Concussion-/RTP-Grenze bleibt medizinisch.
- Unklare Symptom-/naechster-Morgen-Notizen werden konservativ als Rueckmelde-Hinweis behandelt; explizit harmlose Eintraege bleiben unauffaellig.
- Latest Returner Caps erscheinen in Check-in und Training als Carry-over-Hinweis.
- Dexie Version 4 ergaenzt `returnerEntries`; Pending-Queue und Sync-Status zaehlen `returner_entries` mit.
- Keine neue Supabase-Migration noetig: `returner_entries` existiert bereits in `../../supabase/migrations/20260613192159_sprint_3_foundation.sql`.

## Sprint-8-Scope

- Nachbereitung ergaenzt eine optionale Mini-Baseline-/Re-Check-Erfassung.
- Pro Spieler erfassbar:
  - Broad Jump in cm.
  - Seated Med-Ball Chest Pass in m.
  - Med-Ball-Gewicht in kg.
  - 30 m als spaeter/optional markiertes Feld.
  - kurze Notiz ohne Diagnose.
- Leere Baseline-Felder bleiben optional; ungueltige oder negative Zahlen werden lokal abgewiesen.
- Reines Laden der Nachbereitung erzeugt weiterhin keinen Phantom-Session-Log; ein `session_log` entsteht erst beim Speichern eines echten Baseline-Werts oder einer Notiz.
- Pro Spieler und Session gibt es genau einen aktiven Baseline-Eintrag; spaetere Eingaben aktualisieren statt zu duplizieren.
- Spielerprofile zeigen die letzten Testwerte pro Spieler read-only an, sortiert nach Session-Datum.
- Dexie Version 5 ergaenzt `baselineEntries`; Pending-Queue und globaler Sync-Status zaehlen `baseline_entries` separat und nicht doppelt mit Check-in.
- Keine neue Supabase-Migration noetig: `baseline_entries` existiert bereits in `../../supabase/migrations/20260613192159_sprint_3_foundation.sql`.

Noch nicht enthalten: Export-/Import-Erweiterung,
automatische Markdown-/PDF-Parser, Realtime, Edge Functions oder Spieler-Accounts.

## Sprint-9-Scope

- Globaler Sync-Status zeigt online/offline, synced/pending/error, Pending Count, letzten Sync und eine kurze Konfliktwarnung.
- Manuelle Sync-Aktion `Jetzt synchronisieren` nutzt einen gemeinsamen Sync-Orchestrator.
- Pending Queue bleibt retry-faehig; Error-Records mit Pending Write werden vor Retry wieder auf `pending` gesetzt.
- Konflikt-MVP ist dokumentiert: `client_updated_at` / last-write-wins, kein Feld-Merge.
- Export-Tab ist Backup-Zentrale:
  - komplettes JSON-Backup fuer Spieler, Einheiten, Check-ins/Nachbereitung, Progression, Baseline und Returner.
  - JSON-Import mit Vorschau, Warnung vor Ueberschreibungen/Duplikaten und Merge ohne automatische Loeschung.
  - CSV Spieler.
  - CSV Check-ins.
  - CSV Progression.
  - CSV Baseline/Testwerte.
- `letzter Export` wird lokal pro Coach-User gespeichert.
- Nach abgeschlossener Einheit erscheint ein Backup-Hinweis, wenn seitdem kein Export erstellt wurde.
- Backup-Hinweis ist wegklickbar, aber nicht dauerhaft versteckt.
- Security-Check dokumentiert in `SECURITY_CHECK.md`: RLS aktiv, keine `service_role` Secrets, keine Diagnosen/Arztbriefe.

Weiterhin nicht enthalten: Realtime, Edge Functions, Spieler-Accounts, automatische Markdown-/PDF-Parser-Pipeline oder medizinische Diagnosefelder.

## Sprint-10-Scope

- PWA-/Apple-Installationspfade nutzen PNG-Icons:
  - `public/pwa-192x192.png`
  - `public/pwa-512x512.png`
  - `public/apple-touch-icon.png`
- Aktive PDF-Bibliothek wird im Service-Worker-Precache beruecksichtigt, damit die Bibliothek nach PWA-Cache-Aufbau offline verfuegbar sein kann.
- Persistenz-Hinweis erklaert die Sprint-10-Schutzlinie:
  - Home-Screen-PWA fuer stabilere iOS-Nutzung.
  - Supabase-Sync fuer Geraetewechsel.
  - regelmaessiger JSON-Export als Backup gegen Datenverlust oder Geraete-Drift.
- Responsive Hauptnavigation behaelt auch bei icons-only Darstellung stabile Accessible Names.
- QA-Matrix liegt in `QA_SPRINT_10.md`.
- Keine neue Supabase-Migration, keine Edge Functions, kein Realtime, keine Spieler-Accounts und keine automatische Markdown-/PDF-Parser-Pipeline.

Weiterhin offen fuer echte Geraeteabnahme: physische iPad-/iPhone-Home-Screen-PWA, Coach-Login, Offline-Eingabe, Pending-Queue-Retry, iPad-zu-iPhone- und iPhone-zu-iPad-Sync mit freigegebenen Testdaten.

## Sprint-11-Readiness

Die App ist code-seitig als Sprint-1-bis-10-MVP gebaut. Fuer die praktische Nutzung am Dienstag, 16. Juni 2026, liegt die Betriebs- und Abnahme-Checkliste in:

- `SPRINT_11_TUESDAY_READINESS.md`

Sprint 11 umfasst GitHub/Versionierung, HTTPS-Deploy, Supabase-Coach-Account, PWA-Installation auf echten iPad/iPhone-Geraeten, echten Sync-/Offline-Test, Spieler-Startliste, Export-Backup und Print-Fallbacks.

## Sprint-2-Quellen

- `templates/kw25_coach_script_2026-06-16_18.md`
- `plans/offseason_coach_sheets/KW25_tuesday_training_plan_clear_2026-06-16.md`
- `plans/offseason_coach_sheets/KW25_thursday_training_plan_clear_2026-06-18.md`
- `plans/offseason_coach_sheets/kw25_27_one_page_field_cards.md`
- `plans/offseason_coach_sheets/kw28_31_one_page_field_cards.md`
- `templates/session_variants_abcd_quick_card.md`
- `templates/exercise_pool_offseason_mapping.md`
- `templates/unit_1_slim_consent_2026-06-16.md`
- `templates/unit_1_player_briefing_2026-06-16.md`
- `templates/unit_1_coach_briefing_detailed_2026-06-16.md`
- `print_pdfs/00_manifest.txt`

## Supabase

Die App nutzt im Browser nur diese Variablen:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Wenn noch kein Supabase-Projekt existiert:

1. `https://supabase.com/dashboard` oeffnen.
2. Projekt `rugby-snc-field-hub` erstellen, bevorzugt in Europa.
3. DB-Passwort nur im Passwortmanager speichern.
4. Project URL und Publishable Key in eine lokale `app/field-hub/.env` eintragen.
5. Coach-User fuer Arwin in Supabase Auth anlegen.
6. Migration erst nach bewusster Freigabe anwenden, z. B. lokal mit `supabase db reset`
   oder spaeter remote mit `supabase db push`.

Keine echten Secrets committen. Niemals einen `service_role` Key, ein Datenbankpasswort
oder private Keys in `.env`, Code oder Chat kopieren.

## iPad/iPhone-Persistenz

Die App fragt beim ersten Start `navigator.storage.persist()` an und zeigt das Ergebnis.
Auf iPad/iPhone sollte die PWA zum Home-Bildschirm hinzugefuegt werden. Sobald Export
existiert, bleibt vor laengeren Pausen ein JSON-Backup Pflicht.
