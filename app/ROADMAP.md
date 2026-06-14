# Roadmap: Rugby S&C Field Hub

Stand: 14. Juni 2026

Ziel dieses Dokuments: Eine neue Codex-Session soll dieses Vorhaben ohne erneute Grundsatzanalyse umsetzen koennen. Diese Roadmap kombiniert die lokale Ordneranalyse, die bisherige App-Recherche und die mit Claude-Code abgestimmten Punkte, soweit sie sinnvoll und nicht over-engineered sind.

## 1. Kurzdefinition

Die App soll Arwins persoenliches Training-Operations-Dashboard fuer Rugby Union Donau Wien werden. Sie ersetzt nicht das Coaching und nicht die medizinische Freigabe, aber sie reduziert Zettelwirtschaft, fuehrt Daten zusammen und erinnert an relevante Entscheidungen.

Nicht bauen:

- kein Spielerportal.
- keine native App im ersten Schritt.
- kein App-Store-Prozess.
- kein eigener Server im MVP.
- keine digitale medizinische Akte.
- keine digitale Unterschrift als MVP-Pflicht.
- keine komplexen Analytics oder KI-Entscheidungen.

Bauen:

- installierbare PWA fuer iPad/iPhone.
- lokale Spieler-Stammdaten.
- optionale Spielerprofilfotos nach ausdruecklicher Foto-Erlaubnis.
- Check-in, Anwesenheit, Ampel, Returner, Progression und Nachbereitung.
- automatischer Carry-over von Einheit zu Einheit.
- Bibliothek fuer Coach-Skript, Varianten, Exercise Pool, Briefing und PDFs.
- Supabase-Sync fuer iPad und iPhone.
- IndexedDB-Cache und Offline-Queue fuer Feldnutzung ohne stabiles Internet.
- Export/Backup.

## 2. Research- und Entscheidungsbasis

Lokale Projektbasis:

- `print_pdfs/00_manifest.txt`: aktive PDF-/Markdown-Zuordnung.
- `templates/unit_1_simplified_player_checkin_values_2026-06-16.md`: Check-in, Beobachtung, sRPE, E2, Mini-Baseline.
- `templates/progression_tracker_field_compact.md`: Hauptuebung, Last, Reps, RPE, Power/Sprint, Conditioning, sRPE, naechster Schritt.
- `templates/returner_tracking_template.md`: Returner-Caps fuer Speed, COD/Decel, Conditioning und Kontakt.
- `templates/monitoring_template.md`: Pre-/Post-Session-Fragen, Kontaktindex, Speed-Exposures, Ampel.
- `templates/session_variants_abcd_quick_card.md`: A+/A/B/C/D-Entscheidungslogik.
- `templates/exercise_pool_offseason_mapping.md`: konkrete Uebungsalternativen und Regressionen.
- `plans/offseason_coach_sheets/`: aktive Trainingstage KW25-31.

Externe Research-Basis:

- MDN PWA: Eine PWA nutzt Webtechnologien, kann installierbar und offlinefaehig sein und aus einem Codebase mehrere Geraete bedienen. Quelle: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- MDN IndexedDB: IndexedDB ist fuer strukturierte lokale Browserdaten geeignet, inklusive groesserer Datenmengen und Blob/File-Daten. Quelle: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- Vite Guide: Vite bietet ein schnelles React/TypeScript-Setup fuer moderne Frontend-Apps. Quelle: https://vite.dev/guide/
- Apple Safari HTML Reference: iOS-Web-Apps koennen ueber Home Screen app-aehnlich laufen, wenn die passenden Meta-Tags gesetzt sind. Quelle: https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html
- Supabase Auth: Authentifizierung und Autorisierung; Auth-Tokens koennen mit RLS row-by-row Zugriff auf Daten steuern. Quelle: https://supabase.com/docs/guides/auth
- Supabase RLS: Bei Browser-Zugriff auf Supabase muessen Tabellen in exposed schemas mit Row Level Security geschuetzt werden. Quelle: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Local Development: lokale Entwicklung mit CLI/Docker ermoeglicht lokale Postgres/Auth-Entwicklung, Migrationen und Tests ohne Produktionsdaten. Quelle: https://supabase.com/docs/guides/local-development
- Supabase Storage: Datei-Buckets fuer Bilder/Dateien mit RLS-basierten Zugriffskontrollen. Quelle: https://supabase.com/docs/guides/storage
- Supabase Storage Access Control: Storage-Uploads/Reads muessen ueber Policies auf `storage.objects` eingeschraenkt werden; fuer Upsert sind INSERT, SELECT und UPDATE relevant. Quelle: https://supabase.com/docs/guides/storage/security/access-control

Architekturentscheidung:

- MVP wird sync-first mit Offline-Fallback.
- Kein eigener Server; Supabase ist die verwaltete Backend-/Sync-Schicht.
- Supabase Auth + Postgres + RLS sind Teil des MVP.
- React + TypeScript + Vite.
- IndexedDB/Dexie bleibt fuer Offline-Cache und ausstehende lokale Aenderungen.
- Supabase ist die kanonische Datenquelle fuer dynamische Spieler-/Sessiondaten.
- Supabase Storage wird nur fuer private Spielerprofilfotos genutzt, wenn Foto-Erlaubnis dokumentiert ist; keine medizinischen Dokumente, keine allgemeinen Datei-Uploads.
- CSV/JSON Export fuer Backup und Austausch.
- Statische Trainingsinhalte fuer den MVP manuell als TypeScript-/JSON-Daten strukturieren; keine automatische Markdown-/PDF-Parser-Pipeline bauen, solange der Pflegeaufwand klein bleibt.

## 3. Produktprinzipien

1. Einmal eintragen, ueberall sehen.
   - Spielername wird einmal angelegt.
   - Danach erscheinen Check-in, Verlauf, Returner, Progression und Consent im Spielerprofil.
   - iPad und iPhone synchronisieren ueber denselben Supabase-Account.

2. Heute zuerst.
   - Die Startansicht muss die naechste relevante Einheit zeigen.
   - Arwin soll auf dem Platz nicht suchen muessen.

3. Touch-first.
   - Grosse Buttons, schnelle Auswahl, wenig Tippen.
   - Wichtige Eingaben muessen mit Daumen/Stift am iPad funktionieren.

4. Regelbasiert statt KI.
   - Ampel, Carry-over, E2 und Returner-Hinweise werden ueber einfache Regeln vorgeschlagen.
   - Arwin kann alles ueberschreiben.

5. Safety-Grenzen bleiben konservativ.
   - Die App darf keine medizinische Freigabe simulieren.
   - Red Flags fuehren zu Stop/Klaerung.

6. Offline muss funktionieren.
   - Die erste nutzbare Version darf nicht davon abhaengen, dass am Platz Internet stabil ist.
   - Offline-Eingaben werden lokal zwischengespeichert und spaeter synchronisiert.

7. PDF ist Backup, nicht Haupt-UI.
   - Markdown-/strukturierte Inhalte werden als App-Ansichten dargestellt.
   - PDFs liegen in der Bibliothek als Referenz/Export.

8. Sync sichtbar machen.
   - Die App muss zeigen, ob Daten synchronisiert, offline oder ausstehend sind.
   - Der Nutzer darf nie raten muessen, ob iPad und iPhone denselben Stand haben.

## 4. Informationsarchitektur

### 4.1 Heute

Zweck: Vor dem Training sofort wissen, was heute zaehlt.

Inhalte:

- naechste Einheit automatisch aus Datum/Sessions bestimmen.
- Hauptziel der Einheit.
- Zeitplan.
- Start-Briefing / Coach-Skript.
- Material-Check.
- offene Warnungen aus letzter Einheit.
- erwartete Spieler.
- schnelle Buttons: Check-in, Training, Varianten, Nachbereitung, Bibliothek.

### 4.2 Spieler

Zweck: Spieler muessen dauerhaft erkannt werden.

Inhalte:

- Spieler anlegen/bearbeiten.
- Name, Position, Cluster.
- optionales Profilfoto mit Foto-Erlaubnis-Status.
- aktiv/inaktiv.
- Consent-Status.
- letzter Ampelstatus.
- Returner-Status.
- kurze Historie: letzte Einheiten, Schmerz/Issue, sRPE, E2, Progression.

### 4.3 Check-in

Zweck: Vor und zu Beginn der Einheit schnell erfassen, wer wie belastbar ist.

Inhalte:

- Anwesenheit.
- Readiness 1-5.
- Life-Flag: Schlaf/Stress/Muskelkater auffaellig.
- Schmerz/Ort.
- Returner ja/nein/offen.
- automatisch vorgeschlagene Ampel.
- manuelle Ampel-Korrektur.
- E2-/Limit-Hinweise aus letzter Einheit sichtbar.

### 4.4 Training

Zweck: Waehrend der Einheit coachen, ohne Papier zu suchen.

Inhalte:

- aktueller Zeitblock.
- Uebungen und Coaching-Fokus.
- Varianten A+/A/B/C/D.
- Exercise-Mapping.
- schnelle Beobachtung pro Spieler.
- Limit setzen: kein Sprint, kein Conditioning, kein schweres Heben, Physio klaeren.
- Kontaktindex und Speed-Exposure coachseitig loggen.

### 4.5 Nachbereitung

Zweck: Direkt nach der Einheit die entscheidenden Informationen sichern.

Inhalte:

- sRPE pro Spieler.
- Pain/Issue nach Training.
- Hauptuebung, Last, Reps, RPE.
- Power/Testwerte wenn relevant.
- Conditioning erledigt/gestrichen.
- E2-Entscheidung fuer naechste Einheit.
- Coach Review: Follow-ups, gekuerzte Inhalte, organisatorische Probleme.

### 4.6 Returner

Zweck: Returner nicht in normalen Plan hineinrutschen lassen.

Inhalte:

- Spieler mit Returner-Status.
- aktuelle Caps: Speed, COD/Decel, Conditioning, Kontakt.
- heutige erlaubte Inhalte.
- tatsaechlich absolviert.
- Symptome im Training.
- naechster Morgen.
- Entscheidung: bleiben, steigern, reduzieren, rueckmelden.
- Red-Flag-Liste.

### 4.7 Bibliothek

Zweck: Alle Unterlagen schnell finden, aber nicht als Hauptworkflow.

Inhalte:

- Coach-Skript.
- Spieler-Briefing.
- Detail-Briefing.
- Variantenkarte.
- Exercise Pool Mapping.
- Consent/Datenschutz.
- aktive PDFs fuer KW25-31.
- Archiv nur optional, klar getrennt und nicht als aktive Vorlage.

### 4.8 Export/Backup

Zweck: Datenverlust vermeiden und Weiterverarbeitung ermoeglichen.

Inhalte:

- kompletter JSON-Export.
- CSV-Export fuer Check-ins.
- CSV-Export fuer Progression.
- CSV-Export fuer Testwerte.
- Import aus JSON-Backup.

### 4.9 Sync-Status

Zweck: Drift zwischen iPad und iPhone sichtbar verhindern.

Inhalte:

- Status: online / offline / synchronisiert / Aenderungen ausstehend / Sync-Fehler.
- letzter erfolgreicher Sync.
- manuelle Sync-Aktion.
- Liste ausstehender lokaler Aenderungen.
- Hinweis, wenn eine Einheit lokal abgeschlossen wurde, aber noch nicht in Supabase angekommen ist.

## 5. Datenmodell fuer den MVP

Die folgenden Entitaeten reichen fuer den MVP. Dynamische Daten liegen in Supabase und werden lokal in IndexedDB gespiegelt. Keine komplexere Datenbanklogik einbauen, solange diese Struktur nicht real scheitert.

Alle dynamischen Tabellen brauchen:

- `id`
- `user_id`
- `created_at`
- `updated_at`
- `deleted_at` fuer Soft Deletes
- `client_updated_at` fuer Offline-Aenderungen
- `sync_status` lokal: synced / pending / error
- RLS-Policy: Nutzer darf nur eigene Zeilen lesen/schreiben.

### Player

- `id`
- `user_id`
- `name`
- `position`
- `cluster`: CF / HY / SB / offen
- `active`
- `consentStatus`: vorhanden / offen / unklar
- `photoConsentStatus`: not_asked / allowed / denied
- `photoPath`: Supabase Storage Pfad oder null
- `photoUpdatedAt`
- `returnerStatus`: nein / ja / offen
- `notes`
- `createdAt`
- `updatedAt`

### SessionDefinition

Statische Daten aus den Planungsdateien.

- `id`
- `date`
- `kw`
- `title`
- `type`: training / baseline / recheck / transition
- `primarySource`
- `pdfRefs`
- `goals`
- `timeline`
- `materials`
- `coachScriptRefs`
- `libraryRefs`

### SessionLog

Eine konkrete durchgefuehrte Einheit.

- `id`
- `user_id`
- `sessionDefinitionId`
- `date`
- `status`: planned / in_progress / completed
- `coach`
- `groupSize`
- `weatherOrHeatNote`
- `planChanged`
- `durationMinutes`
- `contactIndex`
- `speedExposureNote`
- `coachReview`
- `createdAt`
- `updatedAt`

### PlayerSessionEntry

Die wichtigste Tabelle. Sie verbindet Spieler und Einheit.

- `id`
- `user_id`
- `sessionLogId`
- `playerId`
- `present`
- `readiness`
- `lifeFlag`
- `painScore`
- `painLocation`
- `returnerFlag`
- `trafficLight`: green / yellow / red
- `limits`: kein_sprint / kein_cond / kein_schweres_heben / physio / klaeren
- `observation`
- `sessionRpe`
- `durationMinutes`
- `sessionLoad`: automatisch aus `sessionRpe * durationMinutes`, wenn beide Werte vorhanden sind
- `postPainScore`
- `postPainLocation`
- `e2Decision`: normal / C / D / kein_sprint / kein_cond / physio
- `nextStep`: steigern / halten / reduzieren / klaeren

### ProgressEntry

- `id`
- `user_id`
- `playerId`
- `sessionLogId`
- `mainExercise`
- `load`
- `reps`
- `rpe`
- `powerOrSprint`
- `conditioning`
- `note`

### BaselineEntry

- `id`
- `user_id`
- `playerId`
- `sessionLogId`
- `broadJumpCm`
- `medBallChestPassM`
- `medBallWeightKg`
- `sprint30m`
- `note`

Hinweis: 30 m bleibt fuer KW25 nicht aktiv verpflichtend. Feld kann existieren, aber UI muss klar zeigen: spaeter / optional / nicht erzwingen.

### ReturnerEntry

- `id`
- `user_id`
- `playerId`
- `sessionLogId`
- `medicalContactNote`
- `currentStage`
- `speedCap`
- `codDecelCap`
- `conditioningCap`
- `contactCap`
- `allowedToday`
- `plannedCaps`
- `completed`
- `symptomsDuring`
- `nextMorning`
- `decision`: bleiben / steigern / reduzieren / rueckmelden

### AppSettings

- `userId`
- `primaryDeviceNote`
- `backupReminderEnabled`
- `lastExportAt`
- `lastBackupPromptAt`
- `lastSuccessfulSyncAt`
- `appVersion`

## 6. Pflichtlogik

### 6.1 Ampel-Vorschlag

Gruen-Vorschlag:

- Schmerz 0-2/10.
- keine relevanten Flags.
- Readiness akzeptabel.
- kein aktiver Returner-Konflikt.

Gelb-Vorschlag:

- Schmerz 3-4/10.
- moderater Life-Flag.
- Returner oder unklarer Status.
- auffaellige Technik/Bewegung aus letzter Einheit.

Rot-Vorschlag:

- neuer Schmerz >4/10.
- Kopf-/Nackensymptome.
- neurologische Symptome.
- veraendertes Laufbild mit Risiko.
- akute Instabilitaet.
- zwei oder mehr relevante gelbe Flags.

Die App darf nur vorschlagen. Arwin entscheidet final im Coaching-Kontext.

### 6.2 Carry-over

Beim Start einer neuen Einheit:

- letzte Anwesenheit vorladen.
- Spieler mit letzter Ampel Gelb/Rot markieren.
- letzte Limits anzeigen.
- letzte E2-Entscheidung anzeigen.
- Returner-Caps anzeigen.
- offene Follow-ups auf Heute-Dashboard zeigen.

Beispiele:

- Dienstag: `E2 = C` -> Donnerstag: Spieler erscheint mit Hinweis "reduziert starten".
- Dienstag: `kein Sprint` -> Donnerstag: Hinweis "Sprint/COD pruefen, nicht automatisch freigeben".
- Returner mit Kontakt-Cap -> Training-Ansicht zeigt Contact-Prep nur falls Cap es erlaubt.

### 6.3 Progressionsregel

Aus `progression_tracker_field_compact.md`:

- Ziel-RPE getroffen, Technik sauber, keine Schmerzreaktion -> steigern oder gleiche Last besser bewegen.
- RPE deutlich zu hoch -> halten oder reduzieren.
- Gelb oder verpasst -> nicht steigern.
- Schmerz steigt -> Muster regressieren und Follow-up notieren.

### 6.4 Safety-Regeln

Pflicht:

- Bei Concussion-Verdacht: sofort raus, kein Same-Day-Return, medizinischer Prozess.
- Bei Kopf-/Nacken-/neurologischen Symptomen: keine Bike-/Iso-Alternative als automatische Empfehlung; medizinisch klaeren.
- Bei akuter Instabilitaet oder starkem neuem Schmerz: kein normales Training.
- Returner bekommen keine App-Freigabe, sondern Caps und Dokumentation.

### 6.5 Supabase-Sync

Pflicht:

- Supabase Auth ist erforderlich, bevor dynamische Daten synchronisiert werden.
- Jede dynamische Tabelle hat `user_id` und RLS.
- Der Client nutzt nur publishable/anon-safe Keys, nie `service_role`.
- Lokale Offline-Aenderungen bekommen `sync_status = pending`.
- Sobald wieder online, werden pending Aenderungen nach Supabase geschrieben.
- Nach erfolgreichem Sync wird `lastSuccessfulSyncAt` aktualisiert.
- Bei Konflikten gilt fuer den MVP: spaeteres `client_updated_at` gewinnt, aber die App zeigt eine Sync-Warnung, wenn ein Datensatz auf zwei Geraeten offline veraendert wurde.
- Soft Deletes nutzen `deleted_at`, damit Offline-Loeschungen sauber synchronisiert werden.

## 7. Sprint-Roadmap

Die Sprints sind bewusst klein. Eine neue Codex-Session soll sie nacheinander abarbeiten und nach jedem Sprint testen. Weil iPad und iPhone keinen Drift haben sollen, ist Supabase-Sync jetzt Teil des MVP. Wenn Zeit knapp ist, zuerst Sprint 0-5 fertigstellen; Sprint 6-9 machen die App fachlich und organisatorisch deutlich wertvoller.

### Sprint 0: Orientierung und Implementierungsentscheidung

Ziel:

Die neue Session versteht Kontext, Quellen, MVP-Grenzen und erstellt noch keinen unnoetigen Code.

To-dos:

- `AGENTS.md` lesen.
- `docs/05_codex_workflow.md` lesen.
- `docs/08_next_session_handover.md` lesen.
- `app/README.md` und `app/ROADMAP.md` lesen.
- `app/CODEX_SETUP_AUDIT.md` lesen.
- `app/SUPABASE_SETUP_GUIDE.md` lesen.
- `print_pdfs/00_manifest.txt` lesen.
- Supabase-Skill/Docs fuer Auth, RLS und lokale Entwicklung beachten.
- pruefen, ob bereits ein App-Projekt existiert.
- bestaetigen, dass Implementierung unter `app/field-hub/` erfolgen soll.
- entscheiden, dass Supabase + Dexie genutzt wird: Supabase als zentrale Sync-Wahrheit, Dexie als Offline-Cache.

Fertig, wenn:

- neuer Codex-Kontext die App als lokales Coach-Dashboard versteht.
- Supabase-Sync ist bewusst als MVP-Teil bestaetigt.
- kein eigener Server/Native-App/Spielerportal versehentlich gestartet wurde.
- Implementierungsordner klar ist.

### Sprint 1: App-Shell und technisches Fundament

Status: erledigt am 13. Juni 2026 unter `app/field-hub/`.

Umgesetzt:

- Vite + React + TypeScript Projekt.
- PWA-Grundlagen mit `vite-plugin-pwa`, Manifest und Icon-Platzhaltern.
- Startscreen `Heute` als Dashboard, keine Landingpage.
- Hauptnavigation: Heute, Spieler, Check-in, Training, Nachbereitung, Returner, Bibliothek, Export.
- Sync-Status-Platzhalter.
- Home-Screen-/Storage-Persistenz-Hinweis mit `navigator.storage.persist()`.
- `.env.example` fuer Supabase URL und publishable key ohne echte Secrets.
- Lokale Kommandos in `app/field-hub/README.md`.

Verifiziert:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Browser-Smoke-Test auf Desktop-, iPad- und Mobile-Breite in der Sprint-1-Session.

Ziel:

Eine lauffaehige, einfache PWA-Grundlage schaffen.

To-dos:

- Vite React TypeScript Projekt unter `app/field-hub/` anlegen.
- Basisrouting oder Tab-State einrichten.
- Hauptnavigation bauen: Heute, Spieler, Check-in, Training, Nachbereitung, Returner, Bibliothek, Export.
- Sync-Status in der App-Shell vorsehen.
- iPad-first Layout bauen: grosse Touch-Zonen, klare Kontraste, keine dekorative Landingpage.
- PWA-Grundlagen vorbereiten: Manifest, App-Name, Icons-Platzhalter, mobile Meta-Tags (bevorzugt ueber vite-plugin-pwa statt handgesetzter Apple-Meta-Tags).
- Speicher-Persistenz absichern: beim ersten Start `navigator.storage.persist()` aufrufen und sichtbar darauf hinweisen, dass die App zum Home-Bildschirm hinzugefuegt werden muss. Hintergrund: iOS/Safari loescht lokalen Speicher (IndexedDB) nach ca. 7 Tagen ohne Nutzung, ausser die PWA ist am Home-Bildschirm installiert. Besonders relevant wegen Arwins Augustpause (3.-24. August): vor laengeren Pausen zusaetzlich ein JSON-Backup exportieren.
- `.env.example` fuer Supabase URL und publishable key anlegen, aber keine echten Secrets committen.
- lokale Build-/Dev-Kommandos dokumentieren.

Fertig, wenn:

- App lokal startet.
- Navigation auf Desktop- und iPad-Breite funktioniert.
- Build ohne Fehler durchlaeuft.
- Startscreen direkt das Dashboard zeigt, keine Marketingseite.
- Speicher-Persistenz ist angefordert und der Home-Bildschirm-Hinweis ist sichtbar.
- Sync-Status-Platzhalter ist sichtbar, auch wenn Supabase noch nicht verbunden ist.

### Sprint 2: Statischer Content und Bibliothek

Status: erledigt am 13. Juni 2026 unter `app/field-hub/`.

Umgesetzt:

- Handgepflegte statische Content-Struktur unter `app/field-hub/src/content/`.
- KW25 Dienstag und Donnerstag als detaillierte `SessionDefinition`-Eintraege.
- KW26-31 als kompakte Session-Karten aus den aktiven One-Page Field Cards.
- Heute-Dashboard nutzt echte statische Sessiondaten.
- Bibliothek mit Kategorien, Suche, Detailansicht und PDF-Fallbacks.
- Aktive PDF-Fallbacks unter `app/field-hub/public/library/`; Archivdateien bleiben ausgeschlossen.
- Sprint-2-Stand und Quellen in `app/field-hub/README.md` dokumentiert.

Verifiziert:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- PDF-Fallback ueber lokalen Dev-Server mit HTTP 200 geprueft.
- P2 Browser-QA nachgeholt: In-App-Browser-Pruefung auf Desktop-, iPad- und Mobile-Breite fuer Heute-Dashboard, Bibliothek, Suche, PDF-Fallbacks und horizontale Overflows bestanden. Dabei gefundener Dashboard-Overflow auf Desktop/iPad wurde durch einen frueheren einspaltigen Dashboard-Breakpoint behoben.

Hinweis:

- Die urspruenglich offene visuelle Browser-Automation aus Sprint 2 wurde nachtraeglich mit dem In-App-Browser abgeschlossen.

Offene Follow-ups:

- P3 fuer UX-Polish, spaetestens bei Sprint 4/5: "Naechste Sessions"-Buttons im Heute-Dashboard sollen nicht nur zur Bibliothek springen, sondern die passende Session oder Unterlage direkt vorauswaehlen/oeffnen.

Ziel:

Die vorhandenen Trainingsunterlagen in die App bringen, ohne sie als reine PDF-Liste zu behandeln.

To-dos:

- Content-Manifest fuer aktive Dateien erstellen.
- Inhalte fuer den MVP manuell in einfache TypeScript-/JSON-Strukturen uebertragen.
- Keine automatische Markdown-Parsing-Pipeline bauen, ausser die manuelle Strukturierung scheitert praktisch.
- KW25 Dienstag und Donnerstag als strukturierte `SessionDefinition` abbilden.
- KW25-31 One-Page Field Cards als weitere SessionDefinitions vorbereiten.
- Bibliothek mit Kategorien bauen:
  - Coach-Skript.
  - Spieler-Briefing.
  - Detail-Briefing.
  - Varianten.
  - Exercise Mapping.
  - Consent/Datenschutz.
  - PDFs.
- Aktive PDFs als statische Assets kopieren oder verlinken.
- Archiv klar getrennt halten und nicht als aktive Eingabevorlage anzeigen.

Fertig, wenn:

- Heute-Dashboard Dienstag/Donnerstag aus echten Quellen anzeigen kann.
- Bibliothek die relevanten Unterlagen findet.
- Nutzer kann PDF-Fallback oeffnen, aber Hauptansicht bleibt HTML/App-UI.
- Die Content-Struktur ist so einfach, dass spaetere Korrekturen ohne Generator-/Parser-Debugging moeglich sind.

### Sprint 3: Supabase-Foundation und Spieler-Stammdaten

Status: erledigt am 13. Juni 2026 unter `app/field-hub/` und remote in Supabase-Projekt `vpgqmykayreqlzfcvtat`.

Umgesetzt:

- Supabase Client mit `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY`; echte Werte nur lokal in `.env`.
- Supabase Auth UI fuer einen Coach-Login; keine Spieler-Accounts.
- Dexie/IndexedDB als lokaler Spieler-Cache und pending-write Queue.
- Supabase-Migration `supabase/migrations/20260613192159_sprint_3_foundation.sql`.
- Dynamische Tabellen: `players`, `session_logs`, `player_session_entries`, `progress_entries`, `baseline_entries`, `returner_entries`.
- `user_id`, Timestamps, `deleted_at`, `client_updated_at` und Constraints fuer die MVP-Datenstruktur.
- RLS auf allen dynamischen Tabellen mit Policies fuer eigene `user_id`-Zeilen.
- `anon`-Grants auf dynamischen Tabellen explizit entfernt.
- Privater Storage-Bucket `player-photos` mit Bild-MIME-Typen, 2 MB Limit und Storage-Policies fuer eigene `{user_id}/players/...` Pfade.
- Spieler-Liste, Anlegen/Bearbeiten/Deaktivieren, Position, Cluster, Consent, Foto-Erlaubnis, Returner-Status und Notizen.
- Spielerfoto-Upload/-Entfernung nur bei Foto-Erlaubnis, mit lokaler Bildverkleinerung/Canvas-Neuexport.
- JSON-Export fuer Spieler-Stammdaten.
- Sync-Status fuer Spieler und manuelle Sync-Aktion.
- Remote-Supabase-Projekt erstellt, Migration angewendet und Migrationshistorie nach SQL-Editor-Workaround per CLI repariert.
- Vite-Build-Chunks fuer React, Supabase, Dexie und Icons getrennt, damit der Produktionsbuild ohne grosse Chunk-Warnung laeuft.

Verifiziert:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm audit --audit-level=moderate`
- `supabase migration list`: lokal und remote `20260613192159`.
- `supabase db push --dry-run`: `Remote database is up to date.`
- Remote-SQL-Pruefung: 6 RLS-Tabellen, 24 Public-Policies, 4 Storage-Policies, 0 `anon`-Grants, privater `player-photos` Bucket.
- Secret-Suche: kein Supabase Personal Access Token im Workspace gefunden.

Hinweise fuer Folgesprints:

- Der fuer den CLI-Login verwendete Supabase Personal Access Token wurde einmal im Chat geteilt; er ist nicht im Workspace gespeichert, sollte aber im Supabase Dashboard geloescht/rotiert werden.
- Vor Sprint-4-Fachlogik einen echten App-E2E-Smoke-Test mit Coach-Login ausfuehren: Login, Spieler anlegen, Reload, Sync, zweites Geraet/zweiter Browserkontext, Foto nur mit Consent.

Ziel:

Spieler werden dauerhaft erkannt, auf iPad und iPhone synchronisiert und nicht jede Einheit neu getippt.

To-dos:

- Supabase Client einrichten.
- Supabase Auth einbauen: ein Coach-Login fuer Arwin, keine Spieler-Accounts.
- Arwin Schritt fuer Schritt durch Supabase-Projekt, URL, publishable key und `.env` fuehren; siehe `app/SUPABASE_SETUP_GUIDE.md`.
- Lokale `.env.example` anlegen/erweitern; echte Werte nur lokal in `.env`.
- Supabase-Migrationsstruktur vorbereiten.
- Tabellen fuer dynamische Daten anlegen:
  - players.
  - session_logs.
  - player_session_entries.
  - progress_entries.
  - baseline_entries.
  - returner_entries.
- RLS auf allen dynamischen Tabellen aktivieren.
- Policies: eingeloggter Nutzer darf nur eigene Zeilen lesen/schreiben.
- Spielerfoto-Felder an `players` ergaenzen: `photo_consent_status`, `photo_path`, `photo_updated_at`.
- `photo_consent_status` mit einfachem Check Constraint absichern: `not_asked`, `allowed`, `denied`.
- Nach stabiler Auth/RLS-Grundlage Supabase Storage fuer private Spielerprofilfotos einrichten:
  - Bucket `player-photos`.
  - nicht public.
  - erlaubte MIME-Typen nur Bilder, bevorzugt `image/jpeg`, `image/webp`, optional `image/png`.
  - Upload nach lokaler Verkleinerung klein halten; Zielgroesse ca. 512-800 px Breite, keine Originalfotos speichern.
  - Pfadstruktur: `{user_id}/players/{player_id}/profile.jpg` oder `.webp`.
  - Storage-Policies auf `storage.objects`, sodass eingeloggte Nutzer nur Dateien im eigenen `{user_id}`-Ordner lesen/schreiben/ersetzen/loeschen koennen.
- Spielerfoto-UI im Profil bauen:
  - Foto-Erlaubnis in der UI: nicht gefragt / erlaubt / abgelehnt.
  - technische Werte: `not_asked` / `allowed` / `denied`.
  - Foto aufnehmen oder aus Mediathek waehlen.
  - Bild vor Upload lokal verkleinern/komprimieren.
  - Metadaten/EXIF soweit praktikabel durch Canvas-Neuexport entfernen.
  - bei keiner Erlaubnis oder keinem Foto Initialen/Platzhalter anzeigen.
- IndexedDB/Dexie-Schema als lokaler Cache und Offline-Queue anlegen.
- Spieler-Liste bauen.
- Spieler anlegen, bearbeiten, deaktivieren.
- Position und Cluster erfassen.
- Consent-Status erfassen.
- Returner-Status erfassen.
- Import/Export-Grundlage fuer JSON vorbereiten.
- Sync-Status fuer Spieler anzeigen.

Fertig, wenn:

- Spieler bleiben nach Browser-Reload erhalten.
- Spieler werden in Supabase gespeichert und auf einem zweiten Geraet nach Login sichtbar.
- RLS verhindert Zugriff auf fremde `user_id`-Daten.
- Spieler koennen im Check-in ausgewaehlt werden.
- Consent- und Returner-Status sind sichtbar.
- Foto-Erlaubnis ist sichtbar und aenderbar.
- Bei Foto-Erlaubnis kann ein Profilfoto hochgeladen/ersetzt/entfernt werden.
- Profilfoto ist nach Supabase-Sync auf iPad und iPhone sichtbar.
- Spielerfotos liegen nicht in einem public bucket und werden nicht mit `service_role` aus dem Client verwaltet.
- JSON-Export enthaelt Spieler-Stammdaten.

### Sprint 4: Heute-Dashboard und Pre-Session Check-in

Status: abgeschlossen am 14. Juni 2026 unter `app/field-hub/`. Sprint-4-Fachlogik, Nachbesserungen, Remote-Migration und technische Verifikation sind erledigt; echter Coach-E2E mit Login/iPad-iPhone bleibt als Feldabnahme offen.

Umgesetzt:

- Check-in-Tab mit aktiven Spielern aus den Spieler-Stammdaten.
- Lokale Dexie-Tabellen fuer `session_logs` und `player_session_entries` als Offline-Cache und Pending-Queue.
- Check-in pro Spieler: Anwesenheit, Readiness 1-5, Life-Flag, Schmerzscore, Schmerzort, Returner-Status, Safety-Flag, auffaelliges Laufbild, Notiz.
- Regelbasierter Ampel-Vorschlag: Gruen/Gelb/Rot nach Schmerz, Readiness, Life-Flag, Returner/offen, Vorwarnung und Red Flags.
- Manuelle Ampel-Korrektur durch Coach; lokal und in Supabase-Zeilen werden finale Coach-Ampel, vorgeschlagene Ampel und Manual-Flag getrennt gefuehrt.
- Check-in-Sync nach Supabase ohne Edge Functions/Realtime; Nachbesserungs-Migration `supabase/migrations/20260613230725_add_player_session_traffic_audit.sql` ergaenzt dafuer `traffic_light_suggestion` und `traffic_light_was_manual`.
- Heute-Dashboard zeigt aktive bzw. aus der letzten Einheit erwartete Spieler, Anwesenheit, Check-in-Pending und offene Gelb/Rot/Returner-Hinweise aus lokalen Vor-Einheiten.
- Manuelle Session-Auswahl fuer Heute und Check-in, lokal im Browser gespeichert.
- Session-Logs werden nicht mehr beim Laden erzeugt, sondern erst beim ersten echten Check-in-Speichern.
- Save-/Sync-Fehler werden im Check-in sichtbar angezeigt.
- Harmlose Life-Flag-Freitexte wie `nein`, `ok`, `keine` oder `nichts` triggern nicht automatisch Gelb.
- Automatisierte Vitest-Tests fuer Ampel-Vorschlag, manuelle Ampel-Korrektur, Life-Flag-Normalisierung, Session-Log-Erzeugung und Repository-Mapping.

Verifiziert:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- Browser-QA im In-App-Browser: Check-in-Login-Gating sowie Heute-Dashboard/Session-Auswahl auf Desktop, iPad- und Mobile-Breite ohne horizontale Ueberbreite und ohne Konsolenfehler.
- `npm audit --audit-level=moderate`

Hinweis:

- Der vorgeschaltete echte Coach-E2E-Smoke konnte bis zum Login-Gate ausgefuehrt werden. Login, Testspieler-Anlage, Remote-Sync und zweiter Browserkontext konnten nicht abgeschlossen werden, weil keine Coach-Credentials eingegeben wurden und Codex keine Passwoerter oder Secrets speichern/erraten darf.
- Die Supabase-Migration fuer Ampel-Audit-Metadaten wurde am 14. Juni 2026 remote auf `rugby-snc-field-hub` (`vpgqmykayreqlzfcvtat`) angewendet. `supabase migration list` zeigt lokal/remote `20260613230725`, und `supabase db push --dry-run` meldet `Remote database is up to date`.
- Direktpruefung in Postgres bestaetigte die Spalten `traffic_light_suggestion` und `traffic_light_was_manual` in `public.player_session_entries`. Keine `service_role` Keys verwenden oder speichern; das im Chat geteilte DB-Passwort sollte im Supabase Dashboard nach Abschluss rotiert werden.

Ziel:

Die App wird vor dem Training praktisch nutzbar.

To-dos:

- automatische oder manuelle Auswahl der aktuellen Einheit.
- erwartete Spieler aus letzter Einheit vorladen.
- Anwesenheit abhaken.
- Readiness 1-5 erfassen.
- Life-Flag erfassen.
- Schmerzscore und Ort erfassen.
- Returner/offen erfassen.
- Ampel-Vorschlag implementieren.
- Ampel manuell ueberschreibbar machen.
- Automatisierte Tests fuer Ampel-Vorschlag und manuelle Ampel-Korrektur anlegen.
- offene Warnungen aus letzter Einheit anzeigen.
- Check-in-Eingaben zuerst lokal speichern und dann nach Supabase synchronisieren.
- Offline-Fall testen: Eingabe lokal pending, spaeter Sync. Dieser echte Coach-E2E-Smoke bleibt wegen fehlender Coach-Credentials offen.

Fertig, wenn:

- Dienstag-Check-in digital abbildbar ist.
- Spieler muessen nicht neu geschrieben werden.
- Gelb/Rot/Returner aus letzter Einheit erscheinen als Hinweis.
- Check-in ist mit grossen Touch-Flaechen am iPad bedienbar.
- Check-in-Daten erscheinen nach Sync auf iPad und iPhone.
- Offline eingegebene Check-ins werden sichtbar als pending markiert.

### Sprint 5: Training-Ansicht und Variantenlogik

Status: abgeschlossen am 14. Juni 2026 unter `app/field-hub/`; Supabase-Migration `20260613235336_add_training_variant_to_player_session_entries.sql` ist remote angewendet; technische Checks und Browser-QA siehe Projekt-Handover.

Umgesetzt:

- Training-Tab mit voller Timeline der aktuell gewaehlten Einheit.
- Zeitbloecke zeigen Zeit, Titel, Arbeit, Dosis und Dokumentationshinweis.
- Varianten A+/A/B/C/D als Schnellkarten.
- Exercise-Mapping je Muster als handgepflegte App-Referenz; keine Parser-Pipeline.
- Spieler-spezifische Quick Actions fuer C, D/stop/klaeren, kein Sprint, kein Conditioning, kein schweres Heben und Physio/Medical.
- Beobachtung pro Spieler auf `player_session_entries.observation`.
- `training_variant` als neue nullable Spalte auf `player_session_entries`.
- Coachseitiger Kontaktindex und Speed-Exposure auf dem bestehenden `session_logs`-Datensatz.
- Training-Anpassungen lokal mit Dexie/Pending-Queue und Supabase-Sync.

Nicht vorgezogen:

- Keine Nachbereitung, kein sRPE, kein E2, keine Progressionsworkflows, keine Coach-Review-Automation.

Ziel:

Waehrend der Einheit soll Arwin schnell Plan, Varianten und Anpassungen finden.

To-dos:

- Training-Timeline fuer aktuelle Einheit anzeigen.
- Zeitbloecke mit Ziel, Uebung, Coach-Fokus und Dokumentationshinweis zeigen.
- Varianten A+/A/B/C/D als Schnellansicht einbauen.
- Exercise-Mapping je Muster verfuegbar machen.
- Spieler-spezifische Quick Actions:
  - C-Variante.
  - D/stop/klaeren.
  - kein Sprint.
  - kein Conditioning.
  - kein schweres Heben.
  - Physio/Medical rueckmelden.
- Beobachtung pro Spieler erfassen.
- coachseitig Kontaktindex und Speed-Exposure notieren.
- Training-Anpassungen lokal speichern und nach Supabase synchronisieren.

Fertig, wenn:

- Arwin kann waehrend der Einheit ohne PDF-Wechsel Varianten finden.
- Anpassungen werden am Spieler gespeichert.
- Safety-Hinweise verhindern, dass D/Rot als normaler Trainingsblock wirkt.
- Anpassungen bleiben nach Reload und Geraetewechsel erhalten.

Abschlussbewertung:

- Erfuellt fuer Sprint 5. Vor echter Feldnutzung bleibt ein Coach-E2E-Smoke mit Login, Testdaten, Reload, Sync und zweitem Geraet/Browserkontext empfohlen.

### Sprint 6: Nachbereitung, E2 und Progression

Status: abgeschlossen und auditiert am 14. Juni 2026 unter `app/field-hub/`; keine neue Supabase-Migration angelegt, weil die benoetigten Felder und `progress_entries` bereits in `20260613192159_sprint_3_foundation.sql` existieren.

Umgesetzt:

- Nachbereitung-Tab mit Session-Auswahl, Sync-Status, Dauer, Gruppengroesse, Coach Review und Abschlussbutton.
- sRPE pro Spieler, Pain/Issue nach Training, E2-Entscheidung und naechster Schritt.
- sRPE-Load lokal berechnet und aus Supabase als generated column `session_load` gelesen; `session_load` wird nicht upserted.
- Progressionsdaten pro Spieler und Einheit ueber `progress_entries`: Hauptuebung, Last, Reps, RPE, Power/Sprint, Conditioning und Notiz.
- Regelbasierter Progressionsvorschlag und Follow-up-Ableitung; Coach entscheidet final.
- Heute-Dashboard, Check-in und Training zeigen E2-/Progressions-/Post-Pain-Carry-over.
- Dexie Version 3 mit `progressEntries`, Pending-Queue fuer `progress_entries` und Sync/Refresh ueber bestehende Supabase-Client-Schicht.
- Automatisierte Tests fuer sRPE-Load, Progressionsregel, Follow-ups, Progression-Repository, generated-column-Mapping, Ampel-Audit-Erhalt, Dauer-Neuberechnung und parallele Session-Log-Erstellung.

Verifiziert:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm audit --audit-level=moderate`
- `supabase db push --dry-run`: `Remote database is up to date.`
- `supabase migration list`: lokal und remote sind `20260613192159`, `20260613230725` und `20260613235336` abgeglichen.

Hinweis:

- Es ist kein Datenbank-Push fuer Sprint 6 noetig, weil keine neue Migration angelegt wurde und die Remote-Datenbank up to date ist.
- Vor echter Feldabnahme bleibt ein Coach-E2E-Smoke mit Login, Testdaten, Reload, Sync und zweitem Geraet/Browserkontext empfohlen.

Urspruengliches Ziel:

Die App speichert die entscheidenden Infos nach der Einheit und bereitet die naechste Einheit vor.

Abschlussmarkierung:

- Erfuellt: sRPE pro Spieler, Dauer und sRPE-Load sind lokal nachvollziehbar; `session_load` bleibt remote eine generated column.
- Erfuellt: Pain/Issue nach Training, E2-Entscheidung, naechster Schritt und Progressionsdaten werden pro Spieler gespeichert.
- Erfuellt: Coach Review, Gruppengroesse und Abschlussstatus werden auf Einheitsebene gespeichert.
- Erfuellt: E2-/Progressions-/Post-Pain-Hinweise erscheinen als Carry-over in Heute, Check-in und Training.
- Erfuellt: Nachbereitungsdaten werden lokal gespeichert und ueber die bestehende Supabase-/Dexie-Sync-Schicht synchronisiert.
- Erfuellt: Automatisierte Tests decken sRPE-Load, E2-/Progressionsregeln, Repository-Sync, Dauer-Neuberechnung und Session-Log-Deduplizierung ab.
- Remote-Status: Kein DB-Push noetig; `supabase db push --dry-run` meldete `Remote database is up to date`.

Offen ausserhalb Sprint 6:

- Voller eingeloggter Coach-E2E-Smoke mit Testdaten, Reload, Remote-Sync und zweitem Geraet/Browserkontext.
- Feldabnahme mit echten Coach-Credentials und spaeterem Offline-Smoke.

### Sprint 7: Returner-Modul

Status: abgeschlossen am 14. Juni 2026 unter `app/field-hub/`; keine neue Supabase-Migration angelegt, weil `returner_entries` bereits in `20260613192159_sprint_3_foundation.sql` existiert.

Umgesetzt:

- Returner-Tab ersetzt den Platzhalter durch eine echte iPad-first Arbeitsansicht.
- Returner-Liste aus aktiven Spielern mit Returner-Status, Check-in-Returner-Flag oder vorhandenem Returner-Verlauf.
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
- Kompakter Verlauf pro Returner mit den letzten lokalen Eintraegen, vier Caps, Symptomen, naechstem Morgen und Entscheidung.
- Red-Flag-Liste sichtbar im Returner-Tab.
- Klare Safety-Kopie: App dokumentiert und hilft steuern, gibt aber keine medizinische Freigabe.
- Unklare Symptom-/naechster-Morgen-Notizen gelten konservativ als Rueckmelde-Hinweis; nur explizit harmlose Eintraege wie `ok`, `keine Symptome`, `stabil` oder `schmerzfrei` bleiben unauffaellig.
- Returner-Daten werden in Dexie Version 4 lokal gecacht, ueber Pending-Queue synchronisiert und ueber die bestehende Supabase-/RLS-Tabelle `returner_entries` geschrieben.
- Returner-Pending und Returner-Fehler sind im Returner-Sync-Status und im globalen App-Sync-Status enthalten; Check-in/Post-Session zaehlt diese Eintraege nicht doppelt.
- Latest Returner Caps erscheinen als Carry-over-Hinweis in Check-in und Training, ohne Ampel oder Freigabe automatisch zu veraendern.
- Automatisierte Tests fuer Returner-Red-Flags, Entscheidungslogik, Repository-Mapping, Pending-Queue, Latest-Caps und gemeinsamen Sync-Overview.

Verifiziert:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm audit --audit-level=moderate`
- `supabase migration list` mit lokaler `.env.supabase.local`: lokale und Remote-Migrationen abgeglichen.
- `supabase db push --dry-run` mit lokaler `.env.supabase.local`: `Remote database is up to date.`
- Headless Chrome Smoke auf `http://127.0.0.1:5173/`: Returner-Tab/Login-Grenze rendert auf Desktop und Mobile ohne Console-/Page-Errors.

Hinweis:

- Voller eingeloggter Coach-E2E auf iPad/iPhone mit echten Returner-Testdaten bleibt ohne Coach-Credentials offen.

### Sprint 8: Baseline und Testwerte

Status: abgeschlossen und auditiert am 14. Juni 2026 unter `app/field-hub/`; keine neue Supabase-Migration angelegt, weil `baseline_entries` bereits in `20260613192159_sprint_3_foundation.sql` existiert.

Umgesetzt:

- Mini-Baseline-/Re-Check-Panel im Nachbereitung-Tab fuer aktive Spieler.
- Broad Jump in cm, Medicine-Ball-Chest-Pass in m, Medizinball-Gewicht in kg, optionaler 30-m-Wert und Coach-Notiz.
- 30 m ist in der UI klar als `30 m spaeter/optional` markiert, damit KW25 nicht zu einem Pflicht-Testtag wird.
- Baseline-Werte werden lokal in Dexie Version 5 in `baselineEntries` gespeichert und ueber die bestehende Pending-Write-Queue synchronisiert.
- Baseline-Sync ist in den globalen App-Sync-Status eingebunden, ohne Check-in-/Post-Session-Pending doppelt zu zaehlen.
- Spielerprofile zeigen die letzten bekannten Baseline-Werte read-only mit Session-Datum.
- Nach Audit wurde der Nachbereitung-Sync-Button so angepasst, dass nach dem gemeinsamen Sync auch die Baseline-Statusanzeige direkt aktualisiert wird.
- Automatisierte Tests fuer optionale Baseline-Zahlen, Repository-Mapping, Pending-Queue, Latest-Baselines und gemeinsamen Sync.

Verifiziert:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm audit --audit-level=moderate`
- Browser-Smoke im In-App-Browser auf `http://127.0.0.1:5173/`: App rendert, Nachbereitung-Login-Grenze ohne Console-Errors, iPad-Breite ohne horizontale Ueberbreite.

Hinweis:

- Voller eingeloggter Coach-E2E auf iPad/iPhone mit echtem Baseline-Eintrag bleibt ohne Coach-Credentials offen.
- Supabase-CLI-Remote-Checks konnten in der Sprint-8-Session nicht laufen, weil die Shell kein `SUPABASE_DB_PASSWORD` geladen hatte. Ein DB-Push ist fuer Sprint 8 nach aktuellem Stand nicht noetig.

Ziel:

Mini-Baseline und spaetere Re-Checks dokumentieren, ohne KW25 zu ueberladen.

To-dos:

- Broad Jump in cm erfassen.
- Seated Med-Ball Chest Pass in m erfassen.
- Med-Ball-Gewicht erfassen.
- 30-m-Feld nur als spaeter/optional markieren.
- Testwerte im Spielerprofil anzeigen.
- keine Pflichtlogik, die Dienstag zu einem Testtag macht.
- Testwerte synchronisieren.

Fertig, wenn:

- Donnerstag-Mini-Baseline optional digital erfassbar ist.
- App kommuniziert klar: 30 m spaeter, nicht erzwingen.
- Testwerte sind pro Spieler auffindbar.
- Testwerte sind nach Sync auf beiden Geraeten sichtbar.

### Sprint 9: Sync, Export, Backup und einfache Datensicherheit

Status: abgeschlossen und auditiert am 14. Juni 2026 unter `app/field-hub/`; keine Supabase-Migration noetig, `supabase db push --dry-run` meldet `Remote database is up to date`.

Ziel:

Die App ist praktisch sicher genug fuer einen Supabase-Sync-MVP, verhindert iPad/iPhone-Drift und erlaubt zusaetzliche Backups.

Umgesetzt:

- Sync-Status finalisiert: online/offline/synced/pending/error mit Pending Count, letztem Sync und manueller Sync-Aktion.
- Neuer Sync-Orchestrator fuer manuelle Syncs; Pending Queue bleibt retry-faehig.
- Error-Records mit Pending Write werden vor Retry wieder auf `pending` gesetzt.
- Konfliktfall dokumentiert und sichtbar: MVP nutzt `client_updated_at` / last-write-wins plus Warnung, kein Feld-Merge.
- Vollstaendiger JSON-Export fuer lokale App-Daten: Spieler, Session Logs, Check-ins/Nachbereitung, Progression, Baseline und Returner.
- JSON-Import mit Vorschau, Warnung vor Ueberschreiben/Duplikaten, Merge ohne automatische Loeschung und ohne fremde `user_id`-Daten.
- CSV-Export Spieler, Check-ins, Progression und Baseline/Testwerte.
- Anzeige letzter Export pro lokalem Coach-User.
- Backup-Hinweis nach abgeschlossener Einheit, wenn seitdem noch kein Export erstellt wurde.
- Backup-Hinweis ist temporaer wegklickbar, aber nicht dauerhaft versteckt.
- Hinweis: Daten liegen in Supabase und lokal im Geraete-Cache; Export ist Zusatzbackup.
- Supabase Security-Check dokumentiert in `app/field-hub/SECURITY_CHECK.md`: RLS aktiv, keine service-role Secrets im Client, keine Diagnosen/Arztbriefe.

Hinweis:

- Sprint 9 legt keine neuen Tabellen, Views, Edge Functions, Realtime-Funktionen oder Storage-Buckets an.
- Ein DB-Push ist fuer Sprint 9 nach aktuellem Stand nicht noetig.

Sprint-9-Checkliste: abgeschlossen.

- [x] Sync-Status finalisieren: online/offline/synced/pending/error.
- [x] manuelle Sync-Aktion bauen.
- [x] pending queue pruefen und retry-faehig machen.
- [x] Konfliktfall dokumentieren: MVP nutzt `client_updated_at`/last-write-wins plus Warnung.
- [x] kompletter JSON-Export.
- [x] JSON-Import mit Warnung vor Ueberschreiben/Duplikaten.
- [x] CSV-Export Spieler.
- [x] CSV-Export Check-ins.
- [x] CSV-Export Progression.
- [x] CSV-Export Baseline.
- [x] Anzeige `letzter Export`.
- [x] Nach Abschluss einer Einheit Export-Hinweis anzeigen, wenn seitdem noch kein Backup erstellt wurde.
- [x] Export-Hinweis wegklickbar machen, aber nicht dauerhaft verstecken.
- [x] einfacher Hinweis: Daten liegen in Supabase und lokal im Geraete-Cache.
- [x] keine Fake-Sicherheit durch uebertriebenen PIN verkaufen.
- [x] Supabase Security-Check: RLS aktiv, keine service-role Secrets im Client, keine Diagnosen/Arztbriefe.

Fertig, wenn:

- Daten koennen aus der App heraus gesichert werden.
- Export kann testweise wieder importiert werden.
- Nutzer sieht klar, ob iPad/iPhone synchron sind.
- App erinnert nach abgeschlossenen Einheiten sichtbar an ein Backup.
- Security-Check fuer Supabase/RLS ist dokumentiert.

### Sprint 10: iPad/iPhone UX, Offline und QA

Status 14. Juni 2026: umgesetzt als MVP-gerechte technische QA- und PWA-Nachbesserung.

Umgesetzt:

- PNG-Icons fuer PWA-/Apple-Installationspfade ergaenzt und in Manifest/HTML eingebunden.
- Aktive PDF-Bibliothek in den PWA-Precache aufgenommen.
- Persistenz-Hinweis geschaerft: Home-Screen-PWA, Supabase-Sync und JSON-Export sind zusammen die Schutzlinie gegen Datenverlust und Geraete-Drift.
- Responsive Hauptnavigation mit Accessible Names abgesichert, damit icons-only Navigation auf iPad-Breiten test- und bedienbar bleibt.
- QA-Matrix in `app/field-hub/QA_SPRINT_10.md` erstellt.

Verifiziert:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm audit --audit-level=moderate`
- Browser-Verifikation fuer Desktop, iPad-Viewport und iPhone-Viewport.
- iOS-Simulator-Verifikation fuer iPhone 17 und iPad Pro 11-inch in Safari.

Nicht als erledigt gewertet:

- Physische Home-Screen-PWA-Abnahme auf Arwins echten Geraeten.
- Coach-Login-basierter iPad/iPhone-Sync mit bewusst angelegten Testdaten.
- Offline-Eingabe mit echtem Remote-Retry ueber Supabase.

Ziel:

Vor echter Nutzung muessen Bedienbarkeit und Stabilitaet geprueft werden.

To-dos:

- iPad Safari testen.
- iPhone Safari testen, primaer auf Arwins iPhone 17 oder passendem Viewport; kleine iPhone-Modelle sind vorerst kein eigener Abnahmefokus.
- Vor echter iOS-PWA-Abnahme PNG-Icons fuer Apple-/PWA-Installationspfade ergaenzen und testen; SVG-Platzhalter aus Sprint 1 reichen nur fuer die technische Grundlage.
- Desktop testen.
- Offline nach PWA-Install testen.
- Offline-Eingabe + spaeterer Supabase-Sync testen.
- Echter iPad/iPhone-Abnahmetest mit Coach-Login, Offline-Aenderung, Pending Queue, Retry, Sync-Status und Export-Hinweis.
- iPad eingeben, iPhone nach Sync pruefen.
- iPhone eingeben, iPad nach Sync pruefen.
- Reload-/Browser-Neustart testen.
- Datenpersistenz testen.
- Persistenz-Risiko gezielt testen/dokumentieren: Home-Screen-PWA, Supabase-Sync und Export muessen so zusammenspielen, dass eine laengere Nichtnutzung wie Arwins Augustpause nicht zu Datenverlust oder Geraete-Drift fuehrt.
- Export/Import testen, inklusive real erzeugtem JSON-Backup und Test-Import in einem zweiten lokalen Browserprofil oder zweiten Browserkontext.
- lange Spielernamen testen.
- 20-Spieler-Check-in testen.
- leere Datenbank testen.
- bestehende Datenbank mit neuer Version testen.
- Build und Lint/Typecheck ausfuehren.

Fertig, wenn:

- App startet stabil.
- keine offensichtlichen Layout-Ueberlappungen.
- Check-in fuer 20 Spieler bleibt bedienbar.
- Offline-Bibliothek und gespeicherte Daten funktionieren.
- Sync-Status ist korrekt und verstaendlich.
- relevante Kommandos sind in `app/field-hub/README.md` dokumentiert.

### Sprint 11: Tuesday Readiness, Deploy, Account und Feldabnahme

Status 14. Juni 2026: geplant als Betriebs- und Abnahme-Sprint. Detailplan liegt in `app/field-hub/SPRINT_11_TUESDAY_READINESS.md`.

Ziel:

Die Sprint-1-bis-10-App soll am Dienstag, 16. Juni 2026, fuer Arwins erste Rugby-Einheit praktisch nutzbar sein.

Wichtige Entscheidung:

- Die App bekommt vor Dienstag keine oeffentliche Registrierung.
- Coach-Login wird ueber Supabase Auth bereitgestellt.
- Arwins Coach-User wird im Supabase Dashboard angelegt.
- Keine Spieler-Accounts, keine offene Signup-UI, kein `service_role` Key.

To-dos:

- GitHub-Repo verbinden:
  - vorhandenes Repo `https://github.com/epiclori1020/Rugby` nutzen.
  - Remote-URL `https://github.com/epiclori1020/Rugby.git`.
  - pruefen, ob das Repo leer ist oder bereits Dateien enthaelt.
  - bei vorhandenen Remote-Dateien nicht blind ueberschreiben.
  - lokalen Remote `origin` setzen.
  - Secret-Scan ausfuehren.
  - Initial Commit erstellen und pushen.
- App per HTTPS deployen:
  - bevorzugt Vercel.
  - Repository `epiclori1020/Rugby` importieren.
  - Root Directory `app/field-hub`.
  - Framework `Vite`.
  - Build Command `npm run build`.
  - Output Directory `dist`.
  - Env Vars setzen:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - keine Secrets, keine DB-Passwoerter, keine `service_role` Keys.
- Falls Arwin die App bereits online offen hat:
  - Produktions-URL kopieren.
  - pruefen, ob diese URL den aktuellen Sprint-10-Stand zeigt.
  - nur neu deployen, wenn die Online-Version veraltet ist oder Env Vars fehlen.
- Supabase Coach-Account anlegen:
  - Supabase Dashboard `https://supabase.com/dashboard` oeffnen.
  - Projekt `rugby-snc-field-hub` waehlen.
  - `Authentication` -> `Users`.
  - User `farajpooryarwin@gmx.at` pruefen; laut Nutzer wurde dieser Coach-Account bereits angelegt.
  - Falls User fehlt: mit Arwins Email und starkem Passwort anlegen oder einladen.
  - Passwort nur im Passwortmanager speichern.
  - keine Signup-UI bauen, keine offene Registrierung aktivieren.
  - Das im Chat geteilte Initialpasswort nicht dokumentieren und nach erfolgreichem Login-Test rotieren oder per Passwort-Reset ersetzen.
- Supabase Auth URL-Konfiguration pruefen:
  - Site URL auf die Produktions-URL setzen.
  - Redirect URLs fuer die Produktions-URL erlauben, falls Invite/Email-Bestaetigung genutzt wird.
- DB-Status ohne Aenderung pruefen:
  - `supabase migration list`.
  - `supabase db push --dry-run`.
  - Erwartung: `Remote database is up to date`.
  - echter DB-Push nur, wenn Dry-Run eine echte ausstehende Migration zeigt.
- Deploy-Smoke mit Coach-Login:
  - Produktions-URL oeffnen.
  - mit Coach-User einloggen.
  - Testspieler `Test Sprint11 Spieler` anlegen.
  - Reload.
  - Sync-Status pruefen.
- PWA auf physischem iPad und iPhone installieren:
  - Safari nutzen.
  - Produktions-URL oeffnen.
  - Teilen -> Zum Home-Bildschirm.
  - Name `Field Hub`.
  - Home-Screen-App starten und Login pruefen.
- iPad/iPhone-Sync-Abnahme:
  - iPad -> iPhone pruefen.
  - iPhone -> iPad pruefen.
  - Testspieler oder harmlose Testaenderung verwenden.
- Offline-/Pending-/Retry-Abnahme:
  - iPad-PWA online oeffnen.
  - Bibliothek und Check-in einmal laden.
  - offline gehen.
  - Test-Check-in speichern.
  - online gehen.
  - `Jetzt synchronisieren`.
  - auf zweitem Geraet pruefen.
- Spieler fuer Dienstag anlegen:
  - 15-20 erwartete Spieler.
  - Name, Position, Cluster, Consent-Status, Returner-Status.
  - keine Diagnosen, keine Arztbriefe, keine echten Gesundheitsdaten ausser trainingsrelevanten Minimalwerten.
  - Fotos nur bei dokumentierter Foto-Erlaubnis.
- Dienstag-Workflow pruefen:
  - Dienstag, 16. Juni 2026, auswaehlen.
  - Heute, Check-in, Training und Nachbereitung durchspielen.
  - Ampel, Varianten und sRPE-Load mit Testspieler pruefen.
- Backup-/Export-Routine:
  - vor der Einheit JSON-Backup erzeugen.
  - nach der Einheit JSON-Backup erzeugen.
  - Backups nicht ins Git committen.
- Print-Fallbacks bereitlegen:
  - `print_pdfs/1_DIESE_WOCHE_drucken/1_DIENSTAG_trainingsplan.pdf`
  - `print_pdfs/1_DIESE_WOCHE_drucken/2_COACH_SCRIPT_di_do.pdf`
  - `print_pdfs/1_DIESE_WOCHE_drucken/3_DIENSTAG_checkin_3x.pdf`
  - `print_pdfs/1_DIESE_WOCHE_drucken/5_OPTIONAL_einwilligung_20x.pdf`
  - `print_pdfs/1_DIESE_WOCHE_drucken/6_NOTFALL_admin_vor_dienstag.pdf`
- Security-/Secret-Check:
  - keine `.env` committen.
  - alte geteilte PATs/DB-Passwoerter rotieren, falls noch nicht erledigt.
  - kein `service_role` Key in Frontend, GitHub oder Vercel.

Fertig, wenn:

- GitHub-Remote und Commit existieren.
- Produktions-URL per HTTPS erreichbar ist.
- Vercel/Hosting hat die beiden Supabase Browser-Env-Variablen.
- Supabase Coach-User existiert und Login funktioniert.
- Das geteilte Initialpasswort wurde rotiert oder ein Passwort-Reset wurde ausgeloest.
- iPad und iPhone haben die Home-Screen-PWA installiert.
- iPad/iPhone-Sync funktioniert in beide Richtungen.
- Offline-Pending und Retry funktionieren mit Testdaten.
- 15-20 Spieler fuer Dienstag sind angelegt.
- JSON-Backup vor der Einheit existiert.
- Papier-/PDF-Fallback fuer Dienstag liegt bereit.
- `supabase db push --dry-run` bleibt sauber oder ein noetiger Push wurde bewusst ausgefuehrt und dokumentiert.

## 8. MVP-Cutline

Minimal sinnvoll nutzbar:

- Sprint 1 bis 4.
- Damit kann Arwin Spieler anlegen, heutige Einheit sehen, Check-in dokumentieren und iPad/iPhone-Sync fuer Basisdaten nutzen.

Praktisch wertvoll:

- Sprint 1 bis 6.
- Damit entsteht der echte Mehrwert: Carry-over, Nachbereitung, E2 und Progression.

Fachlich sauber fuer Returner:

- Sprint 1 bis 7.
- Damit sind Returner-Caps und Safety-Grenzen abgedeckt.

Rund fuer KW25-31:

- Sprint 1 bis 10.

## 9. Offene Produktentscheidungen

Diese Entscheidungen koennen vor oder waehrend der Implementierung getroffen werden:

- App-Name final: Vorschlag `Rugby S&C Field Hub`.
- Hauptgeraet: Empfehlung iPad.
- iPhone: soll dieselben Daten nach Supabase-Sync sehen.
- Digitale Einwilligung: Empfehlung nein im MVP; nur Consent-Status.
- Cloud-Sync: ja, Supabase ist MVP-Bestandteil.
- In-App-PIN: optional, aber nicht als echte Sicherheit verkaufen.

## 10. Implementierungswarnungen

- Keine Archiv-PDFs als aktive Workflows einbauen.
- Keine U18-Logik wiederbeleben; Fokus bleibt U22/Development plus Returner.
- Keine App-Entscheidung darf medizinische Freigabe ersetzen.
- Keine Diagnosefelder bauen.
- Keine 30-m-/Bronco-Pflicht fuer KW25.
- Keine komplexen Charts vor stabiler Dateneingabe.
- Keine Supabase-Komplexitaet ueber den Sync-MVP hinaus: keine Edge Functions, kein Realtime, keine Spieler-Accounts und kein breiter Storage-Einsatz, solange nicht noetig.
- Ausnahme zu Storage: private Spielerprofilfotos sind im Spielerprofil-Sprint erlaubt, weil sie Arwin beim Namen-/Gesicht-Mapping helfen. Keine medizinischen Dokumente, keine offenen Datei-Uploads, kein public bucket.
- Keine RLS-losen Tabellen in exposed schemas.
- Kein `service_role` Key im Frontend.
- Keine Landingpage bauen; Startscreen ist das Dashboard.
- Content-Drift vermeiden: Trainingsinhalte liegen doppelt vor (Markdown -> PDFs und manuell als TS/JSON -> App). Wird eine aktive KW25-31-Markdown-Quelle inhaltlich geaendert, muss der zugehoerige `SessionDefinition`-Eintrag in der App mitgezogen werden. Keinen Markdown-Parser bauen; eine kurze manuelle Nachzieh-Regel reicht.

## 11. Akzeptanztest fuer die erste echte Version

Eine Version ist fuer Arwins praktischen Start gut genug, wenn folgendes funktioniert:

1. Arwin legt 15-20 Spieler an.
2. Arwin kann fuer einen Spieler Foto-Erlaubnis dokumentieren und ein Profilfoto aufnehmen/hochladen.
3. Arwin waehlt Dienstag, 16. Juni 2026.
4. App zeigt Briefing, Plan, Material und Check-in.
5. Arwin hakt Anwesenheit ab.
6. Arwin gibt Readiness, Life, Schmerz/Ort und Returner ein.
7. App schlaegt Ampel vor.
8. Arwin setzt bei einzelnen Spielern C/D/kein Sprint/Physio.
9. Nach der Einheit traegt Arwin sRPE, Pain/Issue und E2 ein.
10. Arwin traegt die Dauer ein; die App berechnet sRPE-Load.
11. Die App synchronisiert die Einheit mit Supabase oder markiert sie offline als pending.
12. Am Donnerstag erscheinen diese Hinweise automatisch.
13. Dieselben Daten und Spielerfotos sind nach Sync auf iPad und iPhone sichtbar.
14. Arwin kann alle Daten exportieren.
15. Nach Abschluss der Einheit erinnert die App sichtbar an Backup/Export.
16. App funktioniert nach Reload weiter.
17. App bleibt auf iPad und iPhone layout-stabil.
18. RLS/Security-Check inklusive Storage-Policies ist bestanden.
