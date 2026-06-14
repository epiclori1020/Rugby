# Supabase Setup Guide: Rugby S&C Field Hub

Stand: 13. Juni 2026

Zweck: Diese Datei ist die praktische Schritt-fuer-Schritt-Anleitung fuer die neue Codex-Session, damit Arwin Supabase mit moeglichst wenig eigener Denkarbeit einrichten kann. Sie ergaenzt `app/ROADMAP.md` und ist Pflichtlekture, bevor Sprint 3 umgesetzt wird.

## 1. Warum Supabase hier gebraucht wird

Ohne Supabase haetten iPad und iPhone getrennte lokale IndexedDB-Datenbanken. Dann entsteht Drift:

- iPad: Check-in eingetragen.
- iPhone: weiss davon nichts.
- manueller Export/Import waere noetig.

Mit Supabase:

- iPad und iPhone nutzen dieselbe zentrale Datenquelle.
- Arwin loggt sich auf beiden Geraeten ein.
- Dynamische Daten liegen in Supabase Postgres.
- IndexedDB bleibt als lokaler Offline-Cache und Offline-Queue.
- Am Feld kann offline gearbeitet werden; Sync passiert spaeter.

Supabase wird primaer fuer Sync/Auth/RLS genutzt. Supabase Storage ist im MVP nur fuer private Spielerprofilfotos erlaubt, wenn Foto-Erlaubnis dokumentiert ist. Kein eigener Server, keine Edge Functions, kein Realtime und keine Spieler-Accounts im MVP.

## 2. Was Supabase im MVP leisten muss

Pflicht:

- Auth fuer genau Arwins Coach-Zugang.
- Postgres-Tabellen fuer dynamische Trainingsdaten.
- Row Level Security auf allen dynamischen Tabellen.
- Policies: Arwin darf nur seine eigenen Zeilen lesen/schreiben.
- Browser-sichere Client-Konfiguration mit URL + publishable/anon key.
- Kein `service_role` Key im Frontend.
- Migrationen versioniert im Projekt.
- Sync-Status in der App: online/offline/synced/pending/error.
- Optionaler privater Storage-Bucket fuer Spielerprofilfotos.

Nicht im MVP:

- Spieler-Logins.
- Rollen fuer mehrere Coaches.
- Physio-/Staff-Zugang.
- Realtime.
- Storage fuer Dokumente, PDFs, Arztbriefe oder freie Uploads.
- Edge Functions.
- digitale Einwilligungsunterschriften.
- medizinische Dokumente.

## 3. Externe Seiten, die die neue Session oeffnen soll

Die neue Codex-Session soll Arwin aktiv durch diese Seiten fuehren. Supabase Dashboard braucht Login; deshalb muss Arwin die Seiten im normalen Browser oeffnen und die noetigen Werte in lokale Dateien eintragen oder Codex mitteilen.

1. Supabase Dashboard:
   - https://supabase.com/dashboard
   - Zweck: Projekt erstellen/auswaehlen.

2. Supabase Auth Docs:
   - https://supabase.com/docs/guides/auth
   - Zweck: Auth-Setup pruefen.

3. Supabase RLS Docs:
   - https://supabase.com/docs/guides/database/postgres/row-level-security
   - Zweck: RLS/Policies pruefen.

4. Supabase Local Development:
   - https://supabase.com/docs/guides/local-development
   - Zweck: lokale CLI/Migrationen verstehen.

5. Supabase Storage:
   - https://supabase.com/docs/guides/storage
   - Zweck: private Spielerprofilfotos als Dateien speichern.

6. Supabase Storage Access Control:
   - https://supabase.com/docs/guides/storage/security/access-control
   - Zweck: Storage-Policies auf `storage.objects` korrekt einschraenken.

## 4. Supabase-Projekt anlegen

Die neue Session soll Arwin Schritt fuer Schritt durch Folgendes fuehren:

1. Oeffne https://supabase.com/dashboard.
2. Erstelle ein neues Projekt oder waehle ein bestehendes Projekt.
3. Empfohlener Projektname:
   - `rugby-snc-field-hub`
4. Region:
   - bevorzugt Europa, wenn verfuegbar.
5. Database Password:
   - starkes Passwort generieren.
   - nicht in Git speichern.
   - sicher im Passwortmanager ablegen.
6. Nach Projekterstellung warten, bis das Projekt bereit ist.

Wichtig:

- Keine echten Spieler-/Gesundheitsdaten in Testphasen eingeben.
- Keine Service-Role-Keys in Chat oder Dateien kopieren.

## 5. Keys und lokale `.env`

Die neue Session soll eine `.env.example` vorbereiten:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Arwin muss aus dem Supabase Dashboard eintragen:

- Project URL -> `VITE_SUPABASE_URL`
- Publishable key oder anon public key -> `VITE_SUPABASE_PUBLISHABLE_KEY`

Nicht eintragen:

- `service_role`
- database password
- JWT secret
- private keys

Die echte `.env` bleibt lokal und wird durch `.gitignore` nicht committed.

## 6. Auth-Entscheidung fuer den MVP

Empfehlung:

- Ein Coach-Login fuer Arwin.
- Keine Spieler-Accounts.
- Email + Passwort ist fuer eine private PWA am einfachsten.

Warum nicht Magic Link als Default:

- Magic Links koennen bei iPad/iPhone-PWAs und Redirects mehr Reibung erzeugen.
- Email/Passwort ist fuer einen Ein-Nutzer-MVP einfacher zu testen.

Die neue Session soll:

1. Auth UI minimal bauen: Login, Logout, Session anzeigen.
2. sicherstellen, dass ohne Login keine dynamischen Daten geladen werden.
3. keine Rollenlogik fuer Spieler bauen.

Optional spaeter:

- Magic Link.
- mehrere Coach-Accounts.
- Physio-/Staff-Rollen.

## 7. Tabellen fuer den MVP

Die neue Session soll eine Migration vorbereiten, nicht ad hoc im Dashboard herumklicken.

Tabellen:

- `players`
- `session_logs`
- `player_session_entries`
- `progress_entries`
- `baseline_entries`
- `returner_entries`

Zusaetzliche Felder in `players` fuer Profilfotos:

- `photo_consent_status text not null default 'not_asked'`
- `photo_path text null`
- `photo_updated_at timestamptz null`

`photo_consent_status` braucht einen einfachen Check Constraint:

- erlaubt: `not_asked`, `allowed`, `denied`

Alle dynamischen Tabellen brauchen:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`
- `client_updated_at timestamptz not null`

Lokale Felder wie `sync_status` gehoeren primaer in IndexedDB, nicht zwingend in Supabase.

## 8. Spielerfotos mit Supabase Storage

Spielerfotos sind der einzige erlaubte Storage-Anwendungsfall im MVP.

Warum:

- Arwin kann Namen und Gesichter schneller zuordnen.
- iPad und iPhone sehen dasselbe Foto.
- Bilder gehoeren nicht als grosse Dateien in Postgres.

Pflichtregeln:

- Vor dem Foto muss `photo_consent_status = allowed` gesetzt sein.
- Wenn ein Spieler ablehnt, bleibt `photo_consent_status = denied`; die App zeigt Initialen/Platzhalter.
- Bucket-Name: `player-photos`.
- Bucket nicht public.
- Erlaubte Dateitypen: bevorzugt `image/jpeg` und `image/webp`, optional `image/png`.
- Keine Originalfotos speichern; vor Upload auf ca. 512-800 px Breite verkleinern.
- Pfadstruktur: `{user_id}/players/{player_id}/profile.jpg` oder `.webp`.
- In `players.photo_path` steht nur der Storage-Pfad.
- Keine medizinischen Dokumente, Arztbriefe, Ausweise oder sonstige Dateien hochladen.
- Keine echten Spielerfotos in Tests verwenden.

Upload-UX:

1. Spielerprofil oeffnen.
2. Foto-Erlaubnis erfassen: nicht gefragt / erlaubt / abgelehnt.
3. Nur bei erlaubt: Button "Foto aufnehmen/waehlen".
4. iPhone/iPad Kamera oder Mediathek ueber Browser-Dateiinput oeffnen.
5. Bild lokal verkleinern/komprimieren.
6. EXIF/Metadaten soweit praktikabel durch Canvas-Neuexport entfernen.
7. In privaten Supabase Storage hochladen.
8. `players.photo_path` und `photo_updated_at` aktualisieren.

Storage-Policies:

- Die neue Session muss vor Implementierung aktuelle Supabase Storage Docs/Changelog pruefen.
- Policies auf `storage.objects` muessen `bucket_id = 'player-photos'` und den ersten Pfadordner als eigene `auth.uid()` einschraenken.
- Upload braucht INSERT.
- Ersetzen per upsert braucht zusaetzlich SELECT und UPDATE.
- Entfernen braucht DELETE.
- Kein `service_role` Key im Client.

## 9. RLS-Policy-Muster

Jede Tabelle:

```sql
alter table public.TABLE_NAME enable row level security;

create policy "Users can select own TABLE_NAME"
on public.TABLE_NAME
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own TABLE_NAME"
on public.TABLE_NAME
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own TABLE_NAME"
on public.TABLE_NAME
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own TABLE_NAME"
on public.TABLE_NAME
for delete
to authenticated
using (auth.uid() = user_id);
```

Hinweis:

- Fuer Soft Deletes wird die App bevorzugt `deleted_at` setzen statt echte Deletes zu erzwingen.
- Trotzdem darf eine Delete-Policy existieren, falls spaeter echtes Loeschen gebraucht wird.
- UPDATE braucht auch eine SELECT/USING-Policy; nicht nur `with check`.

## 10. Lokale Entwicklung und Migrationen

Bevor Schema wirklich gebaut wird, soll die neue Session:

1. Supabase CLI Version pruefen:
   - `supabase --version`
2. Help lesen, nicht raten:
   - `supabase --help`
   - `supabase migration --help`
3. Wenn lokale Supabase-Entwicklung verfuegbar ist:
   - lokales Projekt initialisieren.
   - Migration erstellen.
   - Migration lokal anwenden.
   - RLS testen.
4. Wenn lokale Supabase-Entwicklung nicht verfuegbar ist:
   - kein blindes Remote-Schema schreiben.
   - erst Nutzer bestaetigen lassen, dass Remote-Projekt genutzt werden darf.

Wichtig fuer die neue Session:

- Vor Schema-Aenderungen aktuelle Supabase Docs/Changelog pruefen.
- Kein `apply_migration` fuer Remote-Experimente verwenden, solange noch iteriert wird.
- Erst saubere Migration erzeugen, dann anwenden.

## 11. App-Sync-Konzept

Die App arbeitet mit zwei Schichten:

1. Supabase:
   - kanonische Datenquelle.
   - synchronisiert iPad/iPhone.

2. IndexedDB/Dexie:
   - lokaler Cache.
   - Offline-Queue.
   - `sync_status`: synced / pending / error.
   - `lastSuccessfulSyncAt`.

Write Flow:

1. Nutzer traegt Daten ein.
2. App speichert sofort lokal in IndexedDB.
3. Datensatz bekommt `sync_status = pending`.
4. Wenn online und eingeloggt, schreibt App nach Supabase.
5. Bei Erfolg: `sync_status = synced`.
6. Bei Fehler: `sync_status = error`, Warnung anzeigen.

Read Flow:

1. App zeigt lokale Daten sofort an.
2. Wenn online, App zieht aktuelle Supabase-Daten.
3. Lokaler Cache wird aktualisiert.
4. UI zeigt letzten erfolgreichen Sync.

Konfliktregel fuer MVP:

- `client_updated_at` entscheidet.
- spaeterer Stand gewinnt.
- wenn derselbe Datensatz auf zwei Geraeten offline geaendert wurde, zeigt die App eine Warnung.

## 12. Was die neue Session fuer Arwin vorbereiten soll

Die neue Session soll nicht nur sagen, was Arwin tun muss, sondern konkrete Artefakte vorbereiten:

- `.env.example`
- Supabase Client-Datei
- Auth Helper
- Migration SQL
- privaten Storage-Bucket + Storage-Policy-SQL fuer Spielerprofilfotos
- TypeScript-Types fuer Datenmodell
- Dexie Schema
- Sync-Service
- RLS-Testnotizen
- kurze Checkliste fuer Arwin:
  - Welche Supabase-Seite oeffnen.
  - Welchen Wert kopieren.
  - Wohin in `.env` einfuegen.
  - Was nicht kopieren.

## 13. Supabase-Akzeptanztest

Supabase-Teil gilt erst als fertig, wenn:

1. Arwin kann sich einloggen.
2. App zeigt eingeloggten User.
3. Spieler wird auf iPad angelegt.
4. Spieler erscheint nach Sync auf iPhone.
5. Foto-Erlaubnis kann pro Spieler dokumentiert werden.
6. Bei erlaubtem Foto kann ein Profilfoto hochgeladen/ersetzt/entfernt werden.
7. Profilfoto ist nach Sync auf iPad und iPhone sichtbar.
8. Storage-Policies verhindern Zugriff auf fremde Foto-Pfade.
9. Offline-Eingabe wird lokal als pending angezeigt.
10. Nach Online-Rueckkehr wird pending zu synced.
11. RLS verhindert Zugriff auf fremde Daten.
12. Kein `service_role` Key ist im Code oder `.env.example`.
13. Build laeuft.
14. JSON/CSV Export funktioniert weiter.
