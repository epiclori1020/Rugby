# Sprint 9 Security Check

Stand: 14. Juni 2026

## Supabase/RLS

- Dynamische Tabellen bleiben: `players`, `session_logs`, `player_session_entries`, `progress_entries`, `baseline_entries`, `returner_entries`.
- Alle dynamischen Tabellen enthalten `user_id`, `client_updated_at`, `deleted_at`, RLS und eigene User-Policies.
- `authenticated` hat die noetigen Grants fuer Select/Insert/Update/Delete.
- `anon` Grants auf den dynamischen Tabellen sind in der Foundation-Migration explizit revoked.
- Sprint 9 legt keine neuen Tabellen, Views, Functions, Edge Functions oder Storage-Buckets an.
- Keine neue Migration noetig.

## Client-Secrets

- Browser-Client nutzt nur `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Kein `service_role` Key im Client.
- Keine DB-Passwoerter, PATs, JWT-Secrets oder privaten Keys committen.

## Datenminimierung

- Keine medizinischen Diagnosefelder.
- Keine Arztbriefe, IDs, medizinischen Dokumente oder freien Uploads.
- Supabase Storage bleibt nur fuer private Spielerprofilfotos mit Foto-Erlaubnis vorgesehen.
- JSON-Backup enthaelt nur lokale App-Daten und Foto-Pfade, keine Foto-Dateien.

## Sync/Backup-Grenze

- Konflikt-MVP: `client_updated_at` entscheidet, spaeterer Stand gewinnt.
- CSV ist fuer Weiterverarbeitung gedacht; Restore erfolgt ueber JSON.
- JSON-Import loescht keine lokalen Daten und importiert keine fremden `user_id`-Daten.
- Backup-Hinweis ist bewusst keine Sicherheitsschicht wie ein PIN. Er erinnert an einfache Datensicherung nach abgeschlossener Einheit.
