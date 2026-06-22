# Field Hub Sprint 12: Progress Tracking Data Audit

Stand: 21. Juni 2026

Scope: Dieses Audit beschreibt den aktuellen Datenstand der Rugby S&C Field Hub App nach den bisherigen Field-Hub-Sprints inklusive Public/Kiosk/Self-Check-in, Check-in-v1-Redesign, Reset/Public-Sync und Performance-Nachhaertungen. Es ist eine Grundlage fuer Sprint 13-15 und fuehrt keine App-Funktion, Migration oder UI-Aenderung ein.

## 1. Kurzfazit

Die App sammelt heute schon die wichtigsten operativen Trainingsdaten gut: Spieler-Stammdaten, Consent-/Foto-Status, Anwesenheit, Readiness, Life-Flag, Schmerzscore, Returner-Flag, Red Flags, auffaelliges Laufbild, Session-Reaktion, Ampel, Trainingsvariante, Limits, sRPE, Session Load, Post-Pain, E2, Next Step, Baseline-Werte, Returner-Caps, Public/Kiosk-Check-in-Quelle, Sync-Status und Backup-Zeitpunkt.

Die groessten Datenluecken liegen nicht im Basis-Check-in, sondern in der spaeteren Analyse-Granularitaet:

- Session-Bloecke haben noch keine stabilen Keys, Reihenfolge-IDs oder Exposure-Tags.
- Planned-vs-Actual ist nur grob ueber `planChanged`, `contactIndex`, `speedExposureNote`, `coachReview`, Trainingsvariante und Freitext ableitbar.
- Kraft-/Progressionsdaten sind vorhanden, aber Last, Reps, RPE, Power/Sprint und Conditioning sind noch Textfelder.
- Returner-Caps sind fachlich getrennt, aber fast komplett als Freitext gespeichert.
- Pain Location und Life Flag nutzen Chips plus Zusatztext in einem Textfeld; fuer einfache Nutzung gut, fuer robuste Koerperregion-/Stress-Statistiken noch nicht sauber genug.

Ohne Migration koennen bereits ausgewertet werden: Anwesenheit, Check-in-Abdeckung, Readiness-Verteilung, Pain Score, Ampelverteilung, Returner-/Klaerungsstatus, sRPE, Session Load, E2/Next Step, offene Follow-ups, vorhandene Baselines, vorhandene Progressionseintraege, Public/Kiosk/Coach-Quellen und Sync-/Backup-Zustand.

Nicht ueberstuerzt werden sollten: neue hochvolumige Fact-Tabellen, breites Realtime, client-clock-basierter Delta-Sync, medizinische Diagnosen, Koerperregion-Analytics, automatische Clearance-Logik, komplexe Charts im Feldmodus und dynamische Supabase-Kataloge fuer Metrics oder Exercises. Sprint 13 und 14 koennen mit bestehenden Daten starten; Sprint 15 muss vor Sprint 16-18 die Content- und Sync-Grundlagen klaeren.

## 2. Aktuelle Datenquellen nach App-Flow

| Flow | Welche Daten entstehen dort | Speicherung | Struktur | Zeitpunkt | Spaetere Nutzung |
| --- | --- | --- | --- | --- | --- |
| Heute | Keine primaeren neuen Trainingsdaten. Aggregiert Einheit, Ziele, Timeline, Material, PDFs, erwartete Spieler, Anwesenheit, Warnungen, Follow-ups, Pending-Sync und Speicherhinweis. | Statische `sessionDefinitions`; dynamisch aus `players`, `session_logs`, `player_session_entries`, `syncMeta`. | Gemischt: Session-Content strukturiert, Warnungen aus strukturierten Feldern plus Notizen. | Vor Training und zwischen Einheiten. | Heute-Dashboard, offene Aufgaben, Follow-up-Druck, Einsatzbereitschaft, Sprint-14-Closure-Hinweise. |
| Spieler | Name, Position, Cluster, aktiv/inaktiv, Consent, Foto-Erlaubnis, Returner-Status, Coach-Notizen, Foto-Pfad und Foto-Zeitpunkt. | `players`; Fotos in privatem Storage, lokal `photoCache`, `pendingPhotoUploads`. | Stammdaten strukturiert; Notizen Freitext; Foto als Blob/Storage-Pfad. | Vor erster Nutzung, Kaderpflege zwischen Einheiten, Profilkorrektur. | Player Profile 2.0, Filter nach Cluster/Position, Consent-/Returner-Uebersicht, Namens-/Foto-Mapping. |
| Check-in | Anwesenheit, Readiness, Life Flag, Pain Score, Pain Location, Returner-Flag, Session Reaction, Red Flag, Movement Concern, Auto-/Coach-Ampel, Limits, Observation, Quelle. | `session_logs` wird bei echter Eingabe erzeugt; `player_session_entries` speichert Spielerwerte; `pendingWrites` fuer Sync. | Vieles strukturiert; Life Flag, Pain Location und Observation teils Freitext. | Direkt vor Training oder zu Trainingsbeginn. | Attendance, Readiness, Pain, Ampel, Risiko-/Follow-up-Listen, Spielerprofil, Team-Trends, Sprint-14-Pflichtchecks. |
| Public/Kiosk/Self-Check-in | Namensauswahl, Readiness, Life Flag, Pain Score, Pain Location, Returner-Flag, Session Reaction, Player Note; Public zusaetzlich Link, Link-Spieler, Submission-Status. | Public: `public_checkin_links`, `public_checkin_link_players`, `public_checkin_submissions`; Import nach `player_session_entries`. Kiosk direkt local-first nach `player_session_entries`. | Spielerwerte strukturiert plus Textfelder; Status strukturiert. | Vor Training, entweder Spieler-Link oder Coach-Geraet im Kioskmodus. | Nutzung nach Quelle, Konflikte, Submission-Quote, Importqualitaet, Abdeckung vor Trainingsstart. |
| Training | Spieler-Quick-Actions: C/D, kein Sprint, kein Conditioning, kein schweres Heben, Physio/Klaeren; Live-Beobachtungen; Kontaktindex; Speed-Exposure; Gruppen-Notizen. | Spielerwerte in `player_session_entries.trainingVariant`, `limits`, `observation`; Einheitsebene in `session_logs.contactIndex`, `speedExposureNote`, `coachReview`, `planChanged`, `status`. | Quick Actions strukturiert; Kontakt/Speed/Beobachtung Freitext. | Waehrend der Einheit. | Live-Coaching, Carry-over, spaeter Planned-vs-Actual, Exposure-Vorarbeit, Safety-Verlauf. |
| Nachbereitung | Dauer, Gruppengroesse, Coach Review, Status completed, sRPE, Session Load, Post-Pain Score/Location, E2, Next Step, Progression. | Einheitsebene in `session_logs`; Spielerlast/Follow-up in `player_session_entries`; Progression in `progress_entries`. | sRPE, Load, E2, Next Step strukturiert; Post-Pain Location, Progression und Coach Review teils Freitext. | Direkt nach Training oder spaetere Korrektur. | Load-Verlauf, offene Nachbereitung, E2-Carry-over, Player Profile, Sprint-14-Closure. |
| Returner | Current Stage, Medical/Physio-Kontaktnotiz, Speed/COD/Conditioning/Contact Caps, allowed today, planned caps, completed, symptoms during, next morning, decision. | `returner_entries`; lokale Historie pro Spieler; `pendingWrites`. | Entscheidung und teils Stage strukturiert; Caps/Symptome/Notizen Freitext. | Vor, waehrend und nach Returner-relevanten Einheiten. | Returner-Verlauf, Cap-Carry-over, Risiko-/Rueckmeldehinweise, keine medizinische Freigabe. |
| Baseline/Testwerte | Broad Jump cm, Med-Ball Chest Pass m, Med-Ball-Gewicht kg, 30 m optional/spaeter, Notiz. | `baseline_entries`; neuester Wert im Spielerprofil angezeigt. | Messwerte strukturiert numerisch; Notiz Freitext. | Optional in ruhigen Baseline-/Recheck-Sessions. | Testwert-Verlauf, Player Profile, einfache Recheck-Auswertung ohne Migration. |
| Progression | Hauptuebung, Last, Reps, RPE, Power/Sprint, Conditioning, Progressionsnotiz; Next Step gekoppelt an `player_session_entries`. | `progress_entries`; `nextStep` in `player_session_entries`. | Eintrag vorhanden pro Spieler/Session, Inhalte meist Freitext. | Nach Training, meist direkt in Nachbereitung. | Kraft-/Power-/Conditioning-Verlauf, aber fuer echte Charts erst nach Strukturierung belastbar. |
| Bibliothek/PDFs | Keine dynamischen Spieler- oder Trainingsdaten. Statische Library Items, PDF-Refs, Session-Library-Refs. | `content/library.ts`, `content/pdfRefs.ts`, `public/library/*`. | Statisch strukturiert; PDFs als Referenz. | Vor, waehrend oder nach Einheit als Nachschlagewerk. | Content-Kontext, Quellenbezug, spaeter Plan-Integration; keine Statistikquelle. |
| Export/Backup | JSON-Backup, CSV Spieler, CSV Check-ins, CSV Progression, CSV Baseline; letzter Exportzeitpunkt. | `backupRepository` liest lokale Dexie-Stores; `syncMeta` speichert `exports:lastExportAt`. | JSON vollstaendig strukturiert; CSV nur Teilmengen. | Zwischen Einheiten und nach Abschluss einer Einheit. | Backup, externe Tabellenanalyse, Import/Restore, Datenqualitaetsreview. |
| Sync/Offline | Pending Writes, Sync-Status, Sync-Error, Last Successful Sync, Public-Refresh/Import, lokale Foto-Uploads. | `pendingWrites`, `syncMeta`, `syncStatus`/`syncError` pro Store, `pendingPhotoUploads`. | Strukturiert. | Bei jeder lokalen Eingabe, Online/Offline-Wechsel, manueller Sync. | Betriebssicherheit, Drift-Vermeidung, Audit ob Daten remote angekommen sind. |

## 3. Tabellen-/Store-Mapping

| Tabelle/Store | Zweck | Wichtigste Felder | Quelle in der App | Analysefaehigkeit | Risiken oder Luecken |
| --- | --- | --- | --- | --- | --- |
| `players` | Spieler-Stammdaten und Profilstatus. | `name`, `position`, `cluster`, `active`, `consentStatus`, `photoConsentStatus`, `photoPath`, `returnerStatus`, `notes`. | Spieler-Tab, Foto-Aktionen, Kaderpflege. | Gut fuer Kader, Cluster, Consent, Returner-Ausgangslage, Profilfilter. | `notes` ist Freitext; keine Diagnose speichern; Loeschen anonymisiert historische Eintraege ueber FK `on delete set null`. |
| `session_logs` | Konkrete durchgefuehrte oder begonnene Einheit. | `sessionDefinitionId`, `date`, `status`, `groupSize`, `durationMinutes`, `contactIndex`, `speedExposureNote`, `coachReview`, `planChanged`. | Check-in, Training, Nachbereitung, Baseline/Returner bei erster echter Eingabe. | Gut fuer Einheiten, Dauer, Abschlussstatus, grobe Gruppen-/Exposure-Notizen. | Kontakt/Speed/Review sind Freitext; keine Block-Logs; Planned-vs-Actual nur grob. |
| `player_session_entries` | Zentrale Spieler-pro-Einheit-Zeile fuer Check-in, Training und Nachbereitung. | `present`, `readiness`, `lifeFlag`, `painScore`, `painLocation`, `returnerFlag`, `sessionReaction`, `redFlag`, `movementConcern`, `trafficLight`, `trafficLightSuggestion`, `trafficLightWasManual`, `trainingVariant`, `limits`, `observation`, `sessionRpe`, `durationMinutes`, `sessionLoad`, `postPainScore`, `postPainLocation`, `e2Decision`, `nextStep`, `checkInSource`, `playerSubmittedAt`, `coachEditedAt`, `playerNote`. | Coach Check-in, Public import, Kiosk, Training Quick Actions, Nachbereitung. | Sehr gut fuer MVP-Statistiken: Attendance, Readiness, Pain, Ampel, Load, E2, Quelle, Follow-ups. | Sehr breite Tabelle; Pain/Life/Observation Freitext; keine Block-/Exposure-Granularitaet; `returnerFlag=offen` ist Klaerung, nicht automatisch Gelb. |
| `progress_entries` | Ein Progressionsdatensatz pro Spieler und Einheit. | `mainExercise`, `load`, `reps`, `rpe`, `powerOrSprint`, `conditioning`, `note`. | Nachbereitung Progression. | Vorhandensein und Freitext-Verlauf schon nutzbar; gut fuer Player Profile. | Fuer Charts zu unstrukturiert; Last/Reps/RPE als Text; keine Exercise-ID, kein Metric-Typ, keine Block-Zuordnung. |
| `baseline_entries` | Mini-Baseline und Rechecks. | `broadJumpCm`, `medBallChestPassM`, `medBallWeightKg`, `sprint30m`, `note`. | Nachbereitung Mini-Baseline/Recheck; Spielerprofil zeigt latest. | Gut fuer einfache Testwertverlaeufe ohne Migration. | Nur feste Tests; 30 m optional; keine flexible Metric-Definition; Notiz Freitext. |
| `returner_entries` | Returner-Caps und Verlauf pro Spieler/Einheit. | `currentStage`, `speedCap`, `codDecelCap`, `conditioningCap`, `contactCap`, `allowedToday`, `plannedCaps`, `completed`, `symptomsDuring`, `nextMorning`, `decision`, `medicalContactNote`. | Returner-Tab; Carry-over in Check-in/Training. | Gut fuer Returner-Historie, letzte Caps, Entscheidung, Rueckmeldebedarf. | Caps sind Freitext; keine getrennten numerischen Exposure-Limits; `medicalContactNote` darf keine Diagnose/Arztbrief ersetzen. |
| `public_checkin_links` | Public/WhatsApp/QR-Link pro Session. | `sessionDefinitionId`, `sessionTitle`, `sessionDate`, `tokenHash`, `expiresAt`, `closedAt`. | Check-in-Link erstellen/schliessen. | Gut fuer Link-Nutzung pro Einheit und offene/geschlossene Links. | Roh-Token wird bewusst nicht dauerhaft gespeichert; Link-Analyse nur ueber gehashte/Statusdaten. |
| `public_checkin_link_players` | Snapshot der fuer den Link sichtbaren Namensliste. | `linkId`, `playerId`, `displayName`, `sortOrder`. | Beim Erstellen eines Public-Links. | Gut fuer Link-Abdeckung: wer konnte sich ueber Link melden. | Snapshot kann von spaeterem Kader abweichen; Spielername sichtbar im Public-Flow, aber keine Coach-Daten. |
| `public_checkin_submissions` | Roh-Submissions aus Public/Self-Check-in. | `linkId`, `linkPlayerId`, `playerId`, `readiness`, `lifeFlag`, `painScore`, `painLocation`, `returnerFlag`, `sessionReaction`, `playerNote`, `status`, `submittedAt`, `importedAt`, `conflictReason`. | Public-Route; Import in Coach-App; Reset/Public-Sync. | Gut fuer Public-Nutzung, Konflikte, Pending/Imported/Superseded/Reset, Datenqualitaet. | Statistik muss unterscheiden zwischen Roh-Submission und importierter `player_session_entries`-Zeile; Public Check-ins nutzen kein Supabase Realtime mehr, sondern leichtes, session-scoped Polling/Refresh (kein Vollsync-Poll). |
| `pendingWrites` | Offline-/Retry-Queue fuer lokale Aenderungen. | `table`, `recordId`, `operation`, `userId`, `createdAt`, `metadata`. | Alle local-first Speichervorgaenge, Import, Foto-Cleanup-Metadata. | Betriebsanalyse: offene Aenderungen, Fehler, Sync-Druck. | Bei neuen Tabellen muss Queue-Scope, Retry, Backup/Import und RLS mitgezogen werden; hoher Aufwand bei Fact-Tabellen. |
| `syncMeta` | Kleine lokale Metadaten. | `key`, `value`; u. a. `players:lastSuccessfulSyncAt`, `checkIns:lastSuccessfulSyncAt`, `baselines:lastSuccessfulSyncAt`, `returners:lastSuccessfulSyncAt`, `exports:lastExportAt`. | Sync-Repository, Backup-Repository, Statusanzeigen. | Gut fuer Betriebszustand und Backup-Routine. | Kein Ersatz fuer Remote-Audit; Public-Check-in-Overview hat aktuell kein eigenes Last-Successful-Feld. |
| `photoCache` | Lokaler Cache fuer private Spielerfotos. | `cacheKey`, `photoPath`, `photoUpdatedAt`, `blob`, `cachedAt`. | Spielerfoto anzeigen/downloaden. | Keine Trainingsanalyse; reine UX-/Performance-Hilfe. | Blob-Daten nicht in JSON-Backup; Fotos bleiben Storage-Thema und brauchen Consent. |
| `pendingPhotoUploads` | Lokale Queue fuer Foto-Uploads. | `photoPath`, `userId`, `playerId`, `blob`, `contentType`, `createdAt`. | Foto aufnehmen/waehlen im Spieler-Tab. | Keine Trainingsanalyse; Betriebsstatus fuer Foto-Sync. | Storage-spezifische Fehler; keine medizinischen Dokumente; Backup exportiert keine Bilddateien. |

## 4. Pflichtdaten vs optionale Daten

Pflichtdaten pro Einheit:

- `session_logs.sessionDefinitionId` und `date`, sobald echte dynamische Daten entstehen.
- `session_logs.status`, mindestens `planned` bei erster Eingabe und `completed`, wenn die Einheit bewusst abgeschlossen wird.
- `durationMinutes` fuer belastbare sRPE-Load-Auswertung, spaetestens in der Nachbereitung.
- Export-/Backup-Hinweis nach abgeschlossener Einheit ueber `lastExportAt` und letzte completed Session.

Pflichtdaten pro Spieler in einer Einheit:

- Anwesenheit oder bewusst offen/nicht da.
- Bei anwesenden Spielern mindestens Readiness und Pain Score, wenn Check-in sinnvoll auswertbar sein soll.
- Bei Pain Score > 0: Pain Location in pragmatischer Form.
- Bei auffaelligen Spielern: Returner-Flag, Red Flag/Movement Concern, Ampel, Limits und E2/Next Step nach der Einheit.
- Bei sRPE-Auswertung: `sessionRpe` plus `durationMinutes`.

Optionale Daten:

- Life Flag, Player Note, Coach Observation, Training Variant, Progression, Baseline, Returner-Caps, Contact Index, Speed Exposure, Coach Review.
- Spielerfoto nur nach Foto-Erlaubnis.
- 30 m bleibt spaeter/optional und darf nicht als Pflicht-Test in KW25/Offseason-Start umgedeutet werden.

Daten nur bei Auffaelligkeit:

- Red Flag, Movement Concern, Physio/Klaeren-Limit.
- Post-Pain Location, wenn Post-Pain auffaellig ist.
- E2/Next Step fuer Gelb/Rot/Limits/Returner/Schmerzanstieg.
- Returner-Caps und Symptome nur fuer Returner oder offene Returner-Klaerung.
- Coach Review zu Planabweichung, Organisationsproblem oder Follow-up.

Daten, die erst spaeter strukturiert werden sollten:

- Koerperregionen fuer echte Analytics.
- Life Flag als getrennte Schlaf/Stress/Muskelkater-Skalen.
- Kraftuebungen, Lasten, Reps und RPE als Exercise-/Set-Modell.
- Contact-/Speed-Exposures als Block- oder Summary-Modell.
- Returner-Caps als numerische und regelbasierte Exposure-Limits.

## 5. Bereits mögliche Statistiken ohne Migration

- Anwesenheit: Anzahl aktiv, da, offen, nicht da pro Einheit aus `player_session_entries` und `deriveAttendanceStatus`.
- Check-in-Abdeckung: Spieler mit meaningful Check-in, Public/Kiosk/Coach-Quelle, offene Spieler.
- Readiness: Verteilung 1-5, Durchschnitt, Anteil <=2.
- Pain Score: Verteilung 0-10, Anteil >=3, Anteil >4, Pre-vs-Post-Vergleich.
- Ampelverteilung: Gruen/Gelb/Rot, Auto-Vorschlag vs Coach-Korrektur ueber `trafficLightSuggestion` und `trafficLightWasManual`.
- Red-Flag-/Movement-Signale: Anzahl pro Einheit und offene Klaerungen.
- sRPE und Session Load: `sessionRpe * durationMinutes`, lokal berechnet und remote generated/read.
- E2/Next Step: normal, C, D, kein Sprint, kein Cond, Physio; steigern/halten/reduzieren/klaeren.
- Returner-Status: Spieler mit `returnerStatus`, Check-in-Returner-Flag, letzte Caps, Returner-Entscheidungen.
- Baseline-Werte: Broad Jump, Med-Ball Chest Pass, Med-Ball-Gewicht und optional 30 m pro Spieler/Session.
- Progressionseintraege: vorhandene Eintraege, Hauptuebung als Text, Next Step, Notizverlauf.
- Public/Kiosk-Nutzung: Link erstellt/geschlossen, Submission-Status, importiert/konflikt/reset, `checkInSource`.
- Offene Follow-ups: Gelb/Rot, E2 ungleich normal, Next Step reduzieren/klaeren, Post-Pain >=3, Physio/Klaeren-Limit.
- Sync/Backup: Pending Count, Error Count, letzter Sync pro Bereich, letzter Export.

Diese Statistiken sollten in Sprint 13/14 zuerst als kompakte Profil- und Closure-Informationen erscheinen, nicht als grosses Analyse-Dashboard im Feldmodus.

## 6. Daten, die aktuell zu stark in Freitext stecken

| Datenbereich | Kurzfristig als Freitext okay? | Spaeter strukturieren? | Eigene Migration noetig? |
| --- | --- | --- | --- |
| Pain Location | Ja. Chips plus Zusatztext sind fuer Feldnutzung schnell und coachbar. | Ja, wenn Koerperregion-Trends oder Injury-Heatmaps gewuenscht sind. | Ja, fuer robuste Body-Region-Analytics wahrscheinlich neues Modell oder strukturierte Spalten. |
| Life Flag | Ja. Aktuell reicht Schlaf/Stress/Muskelkater plus Notiz fuer Tagesentscheidung. | Optional, wenn Wellness-Trends wirklich genutzt werden. | Nur wenn getrennte Dimensionen/Skalen eingefuehrt werden. |
| Beobachtungen | Ja. Live-Beobachtung braucht Diktat/Freitext und soll nicht bremsen. | Teilweise: Kategorie ist schon im Textprefix, koennte spaeter eigenes Feld werden. | Fuer echte Observation-Events oder Block-Bezug ja. |
| Progressionsnotizen | Ja fuer MVP. | Ja, bevor Kraftcharts oder Uebungsvergleiche gebaut werden. | Ja, wenn Exercise-ID, Sets, Reps, Load, Unit und RPE strukturiert werden. |
| Contact/Speed Exposure Notes | Kurzfristig ja, weil Arwin damit schnell dokumentiert. | Ja, vor Sprint 18 Exposure Tracking. | Ja, wenn Exposure-Zusammenfassungen oder Block-Logs persistiert werden. |
| Coach Review | Ja. Es ist bewusst ein Abschluss-/Orga-Feld. | Nur fuer haeufige Kategorien wie gekuerzt, Materialproblem, Gruppe muede. | Nicht zwingend; kann laenger Freitext bleiben. |
| Returner Caps | Kurzfristig ja, weil jede Reha individuell ist. | Ja, wenn Caps automatisch Exposures begrenzen oder Fortschritt visualisieren sollen. | Wahrscheinlich ja fuer strukturierte Cap-Dimensionen oder Exposure-Limits. |
| Medical/Physio Contact Note | Ja, aber streng trainingsbezogen. | Nur minimal, nicht diagnostisch. | Eher nein im MVP; keine medizinische Akte bauen. |

## 7. Risikoanalyse für spätere Sprints

Sync-/Full-Pull-Risiko:

- Die App hat bereits session-scoped Pulls fuer Check-in, Progression, Baseline und Returner, plus manuellen globalen Sync als Rettungsanker.
- Neue hochvolumige Fact-Tabellen duerfen keinen periodischen globalen Full Pull erzwingen.
- Kein client-clock-basierter Delta-Sync ohne serverseitiges `updated_at`-Wasserzeichen, weil iPad/iPhone-Uhren Daten ueberspringen koennen.

Dexie/Pending Queue Aufwand:

- Jede neue dynamische Tabelle braucht Dexie-Store, Pending-Queue, Push, Pull, Error-Handling, Retry, Import/Export und Sync-Status.
- Genau deshalb sollen Sprint 13 und 14 keine Migration brauchen; Sprint 15 soll die Sync-Regel fuer spaetere Fact-Daten festlegen.

Backup/Import-Auswirkungen:

- JSON-Backup umfasst heute Spieler, Einheiten, Check-ins/Nachbereitung, Progression, Baseline, Returner und Public-Check-in-Daten.
- CSV umfasst Spieler, Check-ins, Progression und Baseline/Testwerte. Returner und Public-Link-Nutzung sind im JSON vorhanden, aber nicht direkt als CSV exportiert.
- Jede neue Tabelle muss in JSON-Backup, Import-Vorschau, Import-Validation und ggf. CSV nachgezogen werden.

RLS/Supabase-Auswirkungen:

- Dynamische Tabellen haben `user_id`, RLS und eigene-Zeilen-Policies.
- Public-Check-in nutzt bewusst `anon`-Zugriff mit token-gehaerteten RLS-/Security-Definer-Helfern und eingeschraenkten Grants.
- Realtime ist entfernt: `public_checkin_submissions` ist nicht mehr in `supabase_realtime` (Migration `20260622135201_harden_release_audit_sync_rls_realtime.sql`). Public Check-ins aktualisieren bewusst ueber leichtes, session-scoped Polling/Refresh; kein Supabase Realtime und kein Vollsync-Poll. Realtime nicht ohne ausdrueckliche Review-Entscheidung wieder einfuehren.

UX-Überladung am iPad:

- `Heute`, `Check-in` und `Training` muessen low-friction bleiben.
- Analysen gehoeren in Spielerprofil oder spaetere Analysis-Ansicht, nicht in den Live-Flow.
- Pflichtdaten duerfen nicht so wachsen, dass Arwin waehrend des Trainings mehr dokumentiert als coacht.

Datenqualitaet:

- Public/Self-Check-in kann falschen Namen, spaete Resubmission oder Konflikt erzeugen; Statusfelder helfen, aber Roh-Submission und importierte Check-in-Zeile muessen getrennt gelesen werden.
- Freitext ist schnell, aber uneinheitlich. Vor Charts braucht es Definitionen, nicht nur UI.
- Coach-Korrekturen gewinnen gegen spaete Spieler-Resubmissions; das ist fuer Dateninterpretation wichtig.

Medizinische/diagnostische Grenzen:

- Die App dokumentiert Trainingssteuerung, keine Diagnosen und keine medizinische Freigabe.
- Concussion, Kopf/Nacken/Neuro, akute Instabilitaet und starker neuer Schmerz bleiben Stop/Klaerung.
- Returner-Caps steuern Belastung, ersetzen aber keine Physio-/Medical-Entscheidung.
- Body-Region-Analytics duerfen nicht als Diagnose- oder RTP-System verkauft werden.

## 8. Empfehlungen für Sprint 13-15

Sprint 13 Player Profile 2.0 sollte zuerst anzeigen:

- Stammdaten: Name, Position, Cluster, aktiv, Consent, Foto-Erlaubnis, Returner-Status.
- Letzte Einheit: Datum, Anwesenheit, Readiness, Pain Score, Ampel, Quelle.
- Offene Warnung: Gelb/Rot, Red Flag, Movement Concern, Limits, Post-Pain, E2/Next Step.
- Load: letzte sRPE, Dauer, Session Load und einfache letzte Werte, keine Charts als Pflicht.
- Tests: letzte Baseline-Werte mit Datum.
- Progression: letzter Progressionseintrag und Next Step.
- Returner: letzte Caps, Symptome/next morning, Entscheidung.
- Bearbeiten bleibt getrennt, damit die Spieler-Liste leicht bleibt.

Sprint 14 Nachbereitung sollte zuerst prüfen:

- Gibt es fuer die Einheit ueberhaupt einen `session_log`?
- Anwesenheit ist fuer erwartete/aktive Spieler ausreichend geklaert.
- sRPE fehlt bei anwesenden Spielern.
- Post-Pain fehlt bei Spielern mit Pre-Pain, Gelb/Rot, Limits oder Returner.
- E2/Next Step fehlt bei Gelb/Rot, D/C, Physio/Klaeren, Schmerzanstieg oder Returner.
- Progression fehlt nur dort, wo sie fachlich relevant ist; nicht jede Einheit/jeder Spieler braucht Progression.
- Baseline-Werte fehlen nur bei Baseline-/Recheck-Kontext und wenn Tests wirklich gemacht wurden.
- `session_logs.status` kann sichtbar offen, teilweise abgeschlossen oder abgeschlossen sein.
- Backup-Hinweis nach Abschluss bleibt sichtbar.

Sprint 15 Content And Sync Foundation muss vorbereiten:

- Stable `SessionBlock.key` und `order` fuer alle aktiven Session-Definitionen.
- Konservative `exposureTags` nur dort, wo spaeter automatische Exposure-Erzeugung geplant ist.
- `libraryRefs` auf Block-Ebene, falls Live-Stepper spaeter gezielt Unterlagen oeffnen soll.
- Statische Metric Definitions fuer Broad Jump, Med-Ball Chest Pass, 10 m Sprint und optional/later 30 m Sprint.
- Statische Exercise Definitions passend zu `trainingReference.ts`, nicht als Supabase-Katalog.
- Sync-Entscheidung fuer neue Fact-Daten: session-scoped Pull, kompaktes Summary-Modell oder serverseitiges Wasserzeichen; kein ungebremster Full Pull.

Vor Sprint 16-18 muessen geklaert sein:

- Planned-vs-Actual: pro Session-Block-Zeile oder kompaktes Session-Summary?
- Exposure Tracking: detailreiche Block-Exposure pro Spieler oder kompakte Spieler-Session-Zusammenfassung?
- Wie viele historische Einheiten sollen Analyseansichten initial laden?
- Sollen Returner-Caps numerisch/regelbasiert werden oder weiter als Coach-Freitext bleiben?
- Sollen Pain Locations strukturiert werden, und wenn ja, mit welchen Kategorien und Datenschutzgrenzen?

## 9. Offene Entscheidungen

- Soll Sprint 13 nur Profile lesen/anzeigen oder auch erste kleine Profil-Korrekturen ausserhalb des bestehenden Editors erlauben?
- Welche Felder sind fuer Arwin nach jeder Einheit wirklich Pflicht: nur Dauer/sRPE/E2 fuer Auffaellige oder sRPE fuer alle Anwesenden?
- Soll Returner/Public-Check-in spaeter eigene CSV-Exports bekommen?
- Soll `checkInSource` in Auswertungen als Coach, Public/QR, Kiosk und Mixed getrennt sichtbar sein?
- Wird Pain Location spaeter als strukturierte Body-Region modelliert oder bleibt es Feldnotiz?
- Welches Exposure-Modell ist fuer Rugby Donau realistisch: Block-Logs, kompakte Summary oder gar kein eigener Exposure-Sprint?
- Realtime fuer Public-Submissions wurde entfernt (kein `supabase_realtime`); Public Check-ins laufen ueber leichtes, session-scoped Polling/Refresh. Eine Wiedereinfuehrung braucht eine ausdrueckliche Review-Entscheidung.
- Wie weit zurueck sollen Player Profile und Analysen standardmaessig lesen: letzte Einheit, letzte 4 Einheiten, ganzer Block?
- Werden Exercise-/Metric-Definitionen rein statisch gepflegt oder spaeter remote editierbar? Empfehlung fuer MVP: statisch.
- Wie werden echte Spieler-/Gesundheitsdaten ausserhalb Git gesichert und wer darf Exporte sehen?

## 10. Review-Ready Abschluss

Datenlage: 7/10.

Begruendung: Die App hat eine starke MVP-Datenbasis fuer Coach-Entscheidungen, Check-in, Nachbereitung, Baselines, Returner, Sync und Backup. Fuer robuste Progress-/Chart-Funktionen fehlen aber stabile Session-Block-Keys, strukturierte Exercises/Exposures und sauber getrennte Body-Region-/Returner-Cap-Modelle.

Roadmap-Umsetzbarkeit nach diesem Audit: 8/10.

Begruendung: Sprint 13 und Sprint 14 koennen ohne Migration auf bestehenden Tabellen aufsetzen. Sprint 15 ist als Content-/Sync-Fundament richtig platziert. Die Roadmap bleibt umsetzbar, wenn Sprint 16-20 nicht vorgezogen und neue Fact-Tabellen erst nach Sync-/Backup-/RLS-Plan gebaut werden.

Empfehlung: Sprint 13 kann gestartet werden, ohne die Roadmap vorher grundlegend zu aendern. Vor Sprint 16-18 braucht es aber eine Review-Entscheidung zu Session-Block-Keys, Planned-vs-Actual, Exposure-Modell, strukturierter Pain Location und bounded historical reads.
