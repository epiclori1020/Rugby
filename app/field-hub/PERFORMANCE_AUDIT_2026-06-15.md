# Performance-Audit Field Hub — 2026-06-15

> Reiner Audit / Analyse. **Es wurde nichts am Code geändert.** Ziel: erklären,
> warum Interaktionen (Spieler anlegen, Foto, Check-in, PDFs) lange „im pending"
> hängen bzw. langsam laden — auf iPhone- und iPad-PWA.

## Kurzfazit (TL;DR)

Die App ist **lokal-first** gebaut (Dexie/IndexedDB als lokale DB, Supabase als
Cloud). Das Speichern selbst ist fast überall schnell. Die gefühlte Langsamkeit
kommt **nicht aus der Datenbank** und **nicht aus den PDF-Dateigrößen**, sondern
aus **drei selbstgebauten Mustern im Sync-Code**:

1. **Jede einzelne Interaktion löst einen kompletten, 10-stufigen Cloud-Sync aus**
   — inklusive vollständigem Neu-Laden *aller* Check-ins, Baselines, Returner und
   Progress-Einträge der gesamten Saison. Größte Ursache.
2. **Foto-Upload blockiert synchron** auf Bild-Verarbeitung + Netzwerk, ohne
   Offline-Warteschlange.
3. **Spielerfotos werden bei jedem App-Start einzeln neu aus der Cloud geladen**
   (kein dauerhafter Cache).

Die DB ist sauber (Indizes + RLS vorhanden), die PDFs sind winzig (<200 KB
gesamt), das JS-Bundle ist ok. Das Problem liegt klar im **Frontend-Sync-Layer**.

## Architektur in einem Satz

React 19 + Vite + Dexie (IndexedDB, lokal-first) + Supabase (Postgres + Storage),
als PWA über Workbox. Muster: lokal schreiben → Pending-Write einreihen →
Hintergrund-Sync (250 ms Debounce) → Push zu Supabase + Refetch.

## Was NICHT schuld ist (um nicht falsch zu optimieren)

| Verdächtigt | Befund |
|---|---|
| **Supabase-DB** | Sauber. Indizes auf `user_id` + zusammengesetzte Indizes (`supabase/migrations/20260613192159_sprint_3_foundation.sql:159-167`), RLS-Policies korrekt. Keine fehlenden Indizes. |
| **PDF-Größe** | 14 PDFs, je 5–25 KB, gesamt <200 KB. Von Workbox vorgecacht (`vite.config.ts:61`). Kein Datenproblem. |
| **JS-Bundle** | ~700 KB über mehrere Chunks, sauber code-split (react/supabase/dexie/icons getrennt, `vite.config.ts:6-30`). Nur einmalig beim Installieren. |
| **Check-in-Schreiben selbst** | Lokal-first, optimistisch — die lokale Speicherung ist schnell. |

## Hauptursachen (nach Schwere)

### 🔴 #1 — „Sync-Storm": jede Interaktion startet eine 10-stufige Voll-Synchronisation

Kern des „ewig im pending".

In `src/lib/checkInRepository.ts:738-783` (`syncCheckInsOnce`) laufen **10
Netzwerk-Operationen streng nacheinander** (jede wartet auf die vorige):

```
1.  syncPlayers          → alle offenen Spieler hochladen + ALLE Spieler neu laden
2.  syncPendingSessionLogs
3.  syncPendingPlayerSessionEntries
4.  syncPendingProgressEntries
5.  syncPendingBaselineEntries
6.  syncPendingReturnerEntries
7.  refreshRemoteCheckIns        → ALLE session_logs + ALLE Check-in-Einträge neu laden
8.  refreshRemoteProgressEntries → ALLE neu laden
9.  refreshRemoteBaselineEntries → ALLE neu laden
10. refreshRemoteReturnerEntries → ALLE neu laden
```

Die Refetches (7–10) haben **keinen Datums-/Mengenfilter**
(`.eq('user_id').is('deleted_at', null)`, sonst nichts, z. B.
`checkInRepository.ts:714-721`) — sie laden die **komplette Saison-Historie**
jedes Mal neu und schreiben sie Eintrag für Eintrag (`await ...put()` in einer
Schleife, kein Bulk, `:726-734`) zurück in IndexedDB.

Diese Kaskade wird von **allen vier Hooks** bei *jeder* Speicherung ausgelöst:
- `useCheckIns` (Readiness, Schmerz, Safety, Ampel …) — `useCheckIns.ts:82,108`
- `useReturners` (jedes Returner-Feld) — `useReturners.ts:91,117`
- `useBaselines` (jeder Testwert) — `useBaselines.ts:55,81`
- `usePostSession` (jede Nachbereitung) — `usePostSession.ts:72,98`

**Erlebnis:** „Readiness 7" tippen → optimistisches Update sofort da, ABER 250 ms
später startet die volle Kaskade. Der Sync-Status („Änderungen offen / pending",
`SyncStatusBadge.tsx:28`, bzw. „X pending" in `PlayersView.tsx:370`) bleibt
erleuchtet, **bis alle 10 Roundtrips fertig sind**. Über Mobilfunk pro Roundtrip
leicht 200–800 ms → die ganze Kaskade dauert **mehrere Sekunden bis >10 s**, und
sie startet nach *jedem* Tipp neu. Danach jeweils großes
`refreshLocalCheckIns()`/`refreshReturners()` mit vielen IndexedDB-Reads +
`setState` → Re-Render.

> Wird über die Saison schlimmer, weil die Voll-Refetches mit der Datenmenge
> linear wachsen.

### 🔴 #2 — Foto-Upload blockiert synchron (Bildverarbeitung + Netzwerk), keine Queue

`uploadPlayerPhoto` (`src/lib/playerRepository.ts:447-482`) macht alles
blockierend nacheinander:
1. `resizeImageForUpload` (`:395`) — dekodiert das (mehrere MB große iPhone-)Foto,
   zeichnet auf Canvas, `toBlob` → **auf dem Main-Thread**, kann 1–3 s ruckeln.
2. `supabase.storage.upload(...)` — wartet auf den **Upload-Roundtrip**.

Der Handler `handlePhotoChange` (`PlayersView.tsx:294`) `await`et diese ganze
Kette, bevor „Profilfoto gespeichert" erscheint. **Kein Offline-/Queue-Pfad** für
Fotos (anders als bei allen anderen Daten): offline/langsam → hängt bzw. schlägt
fehl. Lokale Vorschau wird sofort gezeigt (objectURL, `:284`), aber Bestätigung +
echte Speicherung warten aufs Netz. **Direktestes „lange im pending".**

### 🟠 #3 — Spielerfotos bei jedem App-Start einzeln neu geladen (kein dauerhafter Cache)

`downloadPlayerPhotoUrl` (`playerRepository.ts:524-543`) lädt **pro Foto** einen
Blob via `supabase.storage.download()` → objectURL. Der Cache dafür
(`playerPhotoUrlCache`, `:17`) ist eine **In-Memory-Map** — nach jedem
Neuladen/Neustart der PWA **weg**.

Folge: Bei jedem frischen Öffnen + „Spieler"-Tab feuert `PlayerAvatar`
(`PlayersView.tsx:46-75`) für **jeden** Spieler mit Foto einen **neuen
Netzwerk-Download**. Diese gehen über supabase-js (authentifiziert), **nicht**
über den Workbox-Cache → Service Worker hilft hier nicht. → Spielerliste träge
beim Öffnen, Avatare erscheinen verzögert.

### 🟠 #4 — Manueller „Jetzt synchronisieren"-Button = die ganze Kaskade, voll blockierend

`runManualSync` (`App.tsx:140-154`) → `syncAllUserData`
(`syncRepository.ts:101-116`): `resetErrored` + `syncPlayers` + **`syncCheckIns`
(komplette 10-Stufen-Kaskade)** + `getCombinedSyncOverview` +
`refreshAllLocalData` — alles sequenziell, alles `await`, mit Spinner
(„Synchronisiere…"). Langsamste Einzelaktion der App.

### 🟡 #5 — Redundante, überlappende Syncs

`syncCheckIns` ruft intern bereits `syncPlayers` auf — gleichzeitig synct
`usePlayers` Spieler separat. `useBaselines`/`useReturners`/`usePostSession`
feuern jeweils die *volle* `syncCheckIns`-Kaskade. In-Flight-Dedupe-Maps
(`pendingCheckInSyncs` etc.) fangen exakt gleichzeitige Doppelläufe ab, aber die
Debounce-Scopes sind getrennt (`'check-ins'`/`'returners'`/`'baselines'`,
z. B. `usePlayers.ts:125`), sodass mehrere Voll-Kaskaden kurz hintereinander
laufen. Beim `online`-Event feuern mehrere Hooks gleichzeitig `runSync`.

### 🟡 #6 — PDF-Erstöffnung

PDFs sind winzig und vorgecacht — „erst langsam, dann schnell" kommt aus:
- **iOS Safari** baut beim ersten PDF seinen eingebetteten Renderer (im `<iframe>`,
  `LibraryView.tsx:271`) erst auf; danach warm. (Größter Anteil, iOS-inhärent.)
- Bei echtem Kaltstart evtl. **Precache noch nicht fertig** → erstes PDF ans Netz.
- `prewarmPdfAssets` (`LibraryView.tsx:88`) lädt **alle 14 PDFs gleichzeitig** vor
  — Burst, der mit dem gerade angetippten PDF konkurriert.

Niedrige Priorität, kein Datenmengen-Problem.

## Deine Fragen, direkt beantwortet

- **Unnötige Sync-Zustände?** → **Ja, Hauptursache** (#1, #5). Mini-Interaktion →
  viel zu große Voll-Synchronisation.
- **Was macht der Sync-Button, wird nicht eh online gesynct?** → Stimmt. Die App
  synct **automatisch**: bei jeder Änderung (250 ms Debounce) *und* beim
  Wiederverbinden (`addEventListener('online', runSync)`, `usePlayers.ts:107`,
  `useCheckIns.ts:141`). Der Button erzwingt nur (a) sofortigen Sync statt nach
  Debounce und (b) **Retry fehlgeschlagener** Schreibvorgänge
  (`resetErroredPendingWritesForRetry`, nur manueller Pfad). **Kein P2P**
  iPad↔iPhone — beide gehen über Supabase (Cloud). Wieder online → gleicht sich
  selbst ab; kein Datenverlust durch „nicht drücken".
- **Datenbank?** → **Nein.** Schema/Indizes/RLS ok. Last entsteht durch zu häufige
  und zu umfangreiche Frontend-Abfragen (Voll-Refetches), nicht durch langsame DB.
- **Frontend?** → **Ja, eindeutig** — Sync-Layer (`checkInRepository.ts`, Hooks)
  und Foto-Handling (`playerRepository.ts`), nicht das UI-Rendering an sich.
- **Etwas anderes?** → Verstärkend: **iOS-Safari/PWA** (IndexedDB auf WebKit
  langsam, Eintrag-für-Eintrag-Schreibschleifen verschärfen das) + **Mobilfunk-
  Latenz** (jede Kaskaden-Stufe = eigener Roundtrip).

## Symptom → Ursache

| Symptom | Hauptursache | Warum |
|---|---|---|
| Neuer Spieler „ewig pending" | #1 / #3 (Wahrnehmung) | Anlegen lokal sofort fertig; hängen bleibt die **Status-Anzeige „pending"**, weil Hintergrund-Sync (Upsert + Voll-Refetch aller Spieler) langsam ist — oft parallel zu Foto-Downloads. |
| Foto hinzufügen „lange pending" | **#2** | Synchroner Bild-Decode + Cloud-Upload, ohne Queue. |
| Check-in „ewig pending" | **#1** | Volle 10-Stufen-Kaskade nach **jedem** Tipp. |
| PDF erstmalig langsam | #6 | iOS-PDF-Renderer-Warmup + Precache-/Prewarm-Konkurrenz. |

## Stoßrichtung der Lösung (NICHT umgesetzt — nur Ausblick)

- **#1 (größter Hebel):** Sync entkoppeln — nur **geänderte** Datensätze pushen,
  Refetches **filtern** (nur aktuelle/relevante Session statt ganze Historie) bzw.
  inkrementell über `updated_at`-Wasserzeichen; Push und Pull trennen, sodass ein
  Tipp nicht die ganze Saison neu lädt.
- **#2:** Foto wie alle anderen Daten behandeln — lokal/optimistisch speichern,
  Upload in Pending-Queue, Bild-Resize in Worker (oder `createImageBitmap`).
- **#3:** Heruntergeladene Fotos dauerhaft cachen (IndexedDB/Cache Storage statt
  In-Memory-Map), Avatare lazy beim Sichtbarwerden laden.
- **#4/#5:** Manuellen Button schlanker machen (nur Retry + leichter Refresh),
  überlappende Hook-Syncs zu einem koordinierten Lauf zusammenfassen.
- **#6:** `prewarmPdfAssets`-Burst entzerren (nur geöffnetes PDF priorisieren).

---

# Maßnahmenplan & Entscheidungen — 2026-06-15 (Teil 2)

> Antwort auf: „Was müssen wir tun, damit Sachen fast instant reagieren / schlanker
> werden?" und „Spieler sollen beim Löschen auch wirklich aus der DB verschwinden."
> Weiterhin **nur Planung, kein Code geändert.**

## Teil A — Performance „fast instant" machen

### Leitprinzip
**Die UI darf nie auf das Netzwerk warten.** Lokal schreiben → sofort anzeigen →
Cloud im Hintergrund nachziehen. Das ist im Kern schon so gebaut; kaputt ist, dass
nach *jeder* Aktion die **ganze Saison neu aus der Cloud gezogen** wird und der
Status-Badge bis dahin „pending" zeigt. Die Hebel zielen alle darauf, das
Hintergrund-Volumen drastisch zu senken.

### A1 — Push und Pull trennen *(größter Hebel)*
Aktuell macht `syncCheckInsOnce` (`checkInRepository.ts:738-783`) beides in einem:
hochladen **und** alles neu herunterladen. Trennen in:
- `flushPendingWrites(userId, table?)` — schiebt **nur die offenen Änderungen** der
  jeweiligen Tabelle hoch. Wird nach einer Interaktion ausgelöst.
- `pullRemote(userId)` — holt Remote-Stände. Läuft **nur selten**: App-Start,
  „online"-Event, manueller Sync, evtl. alle paar Minuten — **nicht** nach jedem Tipp.

Ergebnis: Ein Check-in-Tipp löst nur noch einen kleinen Upload aus (1 Roundtrip,
millisekunden­schnell), nicht 10 + Voll-Refetch.

### A2 — Pull inkrementell machen (Delta-Sync)
Statt `select * where user_id` (ganze Historie, `checkInRepository.ts:691-721`,
`playerRepository.ts:341-347`) nur laden, was sich seit dem letzten Sync geändert
hat: Wasserzeichen je Tabelle speichern und `.gt('updated_at', lastPulledAt)`.
- **Voraussetzung:** Es gibt **keinen** serverseitigen `updated_at`-Trigger
  (`updated_at` wird nur beim INSERT auf `now()` gesetzt). Für verlässlichen
  Delta-Sync brauchen wir einen `BEFORE UPDATE`-Trigger (z. B. `moddatetime`-
  Extension), der `updated_at = now()` setzt. Alternativ `client_updated_at` als
  Wasserzeichen (Index `players_client_updated_idx` existiert), aber anfällig für
  Uhrzeit-Differenzen zwischen iPhone/iPad → Trigger ist sauberer.
- Effekt: Pro Session werden 0–wenige Zeilen geladen statt der ganzen Saison.

### A3 — Pull auf die aktuelle Session begrenzen
Die Check-in-Ansicht braucht nur die **aktuelle** Session, nicht alle. Refetch auf
`where session_log_id = <aktuell>` (bzw. `date >= kürzlich`) eingrenzen. Die
historischen Warnungen (`listLatestWarnings`) einmalig laden, nicht pro Tipp.

### A4 — IndexedDB-Schreibschleifen durch `bulkPut` ersetzen
Die Refetches schreiben Zeile für Zeile mit `await ...put()` in Schleifen
(`checkInRepository.ts:703-712, 726-734`; `playerRepository.ts:358-367`). Auf
einen `bulkPut` in einer Transaktion umstellen → drastisch schneller und blockiert
nicht die nächste Nutzer-Eingabe.

### A5 — Die vier Hooks koordinieren (ein Sync statt vier)
`useCheckIns`, `useReturners`, `useBaselines`, `usePostSession` feuern jeweils die
volle `syncCheckIns`-Kaskade (`useCheckIns.ts:82,108`, `useReturners.ts:91,117`,
`useBaselines.ts:55,81`, `usePostSession.ts:72,98`). Nach A1 schiebt jeder Scope
nur seine eigene Tabelle; der Pull wird **einmal** koaleziert (ein gemeinsamer,
entprellter Lauf pro Nutzer statt vier). `syncCheckIns` darf **nicht** mehr intern
`syncPlayers` mitlaufen lassen (`checkInRepository.ts:755`) — Spieler-Sync ist
unabhängig.

### A6 — Foto-Upload lokal-first + Resize vom Main-Thread holen
`uploadPlayerPhoto` (`playerRepository.ts:447-482`) blockiert auf Resize + Upload.
Umbauen:
- Verkleinertes Bild **zuerst lokal** (IndexedDB-Blob) speichern, Avatar sofort aus
  dem lokalen Blob zeigen, Status „Upload offen" → **sofort fertig** für den Nutzer.
- Upload in die Pending-Queue (wie alle anderen Daten); offline → läuft beim
  Wiederverbinden.
- Resize via `createImageBitmap` (dekodiert off-thread) statt `new Image()`/`onload`
  (`playerRepository.ts:395-445`), ideal in einem Web Worker mit `OffscreenCanvas`.
  Entfernt das 1–3 s Ruckeln bei großen iPhone-Fotos.

### A7 — Fotos dauerhaft cachen + lazy laden
`downloadPlayerPhotoUrl` (`playerRepository.ts:513-543`) cached nur **im
Arbeitsspeicher** → bei jedem Start alle Fotos neu aus der Cloud.
- Blobs dauerhaft in IndexedDB/Cache Storage cachen (Key `photoPath::photoUpdatedAt`)
  → beim Start sofort, kein Netz.
- Vom Gerät aufgenommene Fotos direkt als Avatar wiederverwenden (kein Download).
- Avatare erst beim Sichtbarwerden laden (IntersectionObserver), damit das Öffnen des
  Spieler-Tabs nicht N Downloads auf einmal auslöst.
- Optional: öffentlichen Bucket + `getPublicUrl` → `<img>` lädt über normales HTTP,
  das der **Workbox-Runtime-Cache** (CacheFirst) automatisch übernimmt. Abwägung:
  öffentlicher Bucket = jeder mit Link sieht das Bild (Foto-Consent beachten).

### A8 — Manuellen Sync-Button verschlanken
`runManualSync`/`syncAllUserData` (`App.tsx:140-154`, `syncRepository.ts:101-116`)
auf: „offene Writes flushen + ein Delta-Pull + Fehler erneut versuchen". Mit
Delta-Sync ist das von selbst schnell. (Der Button bleibt sinnvoll für den
gezielten Retry — die App synct ansonsten ohnehin automatisch.)

### A9 — PDF-Prewarm entzerren
`prewarmPdfAssets` (`LibraryView.tsx:88`) lädt alle 14 PDFs gleichzeitig vor.
Stattdessen: gar nicht vorwärmen (Workbox-Precache reicht) oder nur per
`requestIdleCallback` im Leerlauf. Die iOS-Erstöffnung des PDF-Viewers bleibt
prinzipbedingt etwas träge.

### Priorisierung (Wirkung × Aufwand)

| # | Maßnahme | Wirkung | Aufwand | Reihenfolge |
|---|---|---|---|---|
| A1 | Push/Pull trennen | 🔥🔥🔥 | mittel | **1. zuerst** |
| A4 | bulkPut | 🔥🔥 | klein | **2.** (schneller Mitnahmeeffekt) |
| A2 | Delta-Pull (+ updated_at-Trigger) | 🔥🔥🔥 | mittel | **3.** |
| A5 | Hooks koordinieren / syncPlayers entkoppeln | 🔥🔥 | mittel | 4. |
| A6 | Foto lokal-first + off-thread | 🔥🔥🔥 (Foto) | mittel | 5. |
| A7 | Foto-Cache + lazy | 🔥🔥 (Liste) | mittel | 6. |
| A3 | Pull auf Session begrenzen | 🔥 | klein | 7. |
| A8 | Sync-Button schlank | 🔥 | klein | 8. |
| A9 | PDF-Prewarm | 🔥 (gering) | klein | 9. |

> Allein **A1 + A4** dürften Check-in/Returner/Baseline von „Sekunden-pending" auf
> „praktisch sofort" bringen, weil die UI schon optimistisch ist und nur die
> Hintergrund-Last wegfällt.

## Teil B — Spieler endgültig aus der DB löschen (Hard Delete)

### Ist-Zustand
`deletePlayer` (`playerRepository.ts:252-268`) macht ein **Soft-Delete**: setzt
`deletedAt`, behält die Zeile und synct ein Upsert. Folgen:
- Die Zeile bleibt **dauerhaft** in Supabase (`players` füllt sich mit Leichen).
- Der Spieler-Refetch filtert `deleted_at` **nicht** (`playerRepository.ts:341-347`)
  → gelöschte Spieler werden bei **jedem** Sync wieder heruntergeladen (Extra-Last).
- Lokal werden sie nur aus der Liste gefiltert (`listLocalPlayers`), bleiben aber
  in IndexedDB.
- Foto wird immerhin entfernt (`needsStoredPhotoCleanup` greift bei `deletedAt`).

### Soll
Beim Löschen verschwindet der Spieler **wirklich** aus der Datenbank (und lokal).

### Umbau (Mechanik)
1. **Pending-Write um `'delete'` erweitern** — aktuell nur `'upsert'`
   (`localDb.ts:8`). Neue Operation in Typ + Schema.
2. **Lokal** die Zeile entfernen (`localDb.players.delete(id)`), nicht nur `deletedAt`.
3. **Sync:** für eine `delete`-Pending-Write → erst Foto aus dem Storage entfernen
   (`removeStoredPlayerPhoto`), dann `supabase.from('players').delete().eq('id', …)`.
   RLS erlaubt das bereits (Policy „Users can delete own players",
   Migration `:189`). Offline → Write bleibt in der Queue, läuft beim Reconnect.
4. **Refetch-Filter** `deleted_at`-Spieler ausschließen (`.is('deleted_at', null)`),
   damit nichts Gelöschtes zurückkommt.
5. **Dialogtext anpassen:** der aktuelle Hinweis „Historische Einträge bleiben
   erhalten" (`PlayersView.tsx:245-247`) muss zur gewählten Variante passen.

### Die eine Entscheidung, die DU treffen musst: Was passiert mit der Historie?
Die Verlaufstabellen verweisen mit `player_id ... on delete set null`
(Migration `:54, :90, :108, :124`). Daraus folgen drei saubere Varianten:

- **Option A — Spieler löschen, Historie anonymisiert behalten** *(empfohlen)*
  `DELETE FROM players` → Spieler weg, die alten Check-in-/Test-/Returner-Zeilen
  bleiben, aber ihr `player_id` wird automatisch `NULL`. DB ist nicht mehr mit
  Spielern vollgestopft, Saison-Historie/Statistik bleibt erhalten. **Kein
  FK-Umbau nötig.** Passt zum bisherigen Versprechen „Historie bleibt".
- **Option B — Spieler **und** seine komplette Historie löschen**
  Alles unwiderruflich weg. Erfordert entweder FK auf `on delete cascade` umstellen
  (Migration) oder die Kind-Zeilen im Sync explizit mitlöschen. **Vorher
  CSV-Export** dringend empfohlen (Export existiert: `csvExport.ts`,
  `playerExport.ts`, `ExportView.tsx`).
- **Option C — Zweistufig:** normales Löschen = ausblenden (Soft), zusätzlicher
  Button „endgültig löschen" = Hard Delete. Sicherste UX, meiste Arbeit.

**Empfehlung:** **Option A.** Sie löst dein eigentliches Problem („keine
Karteileichen in `players`") vollständig, ohne Trainingshistorie zu vernichten, und
ist der kleinste, risikoärmste Eingriff. Wenn du die Historie ebenfalls komplett
weghaben willst → Option B (mit Export davor).

### Einmalige Bereinigung des Ist-Bestands
Unabhängig von der Variante: die **bereits** soft-gelöschten Spieler einmalig aus
Supabase entfernen (`delete from players where deleted_at is not null`) bzw. per
einmaligem Cleanup-Lauf in der App. Danach greift der neue `deleted_at`-Filter.

### Offene Frage an dich
👉 **Option A oder B?** (A = Spieler weg, Historie bleibt anonym · B = alles weg,
Export vorher). Danach setze ich Teil B um.

---

*Erstellt am 2026-06-15. Analyse-Basis: `app/field-hub/src` (Hooks, `lib/`-Repos,
Views), `vite.config.ts`, `supabase/migrations/`. Keine Code-Änderungen.*

*Ergänzt am 2026-06-15 (Teil 2): Maßnahmenplan Performance + Hard-Delete-Konzept.
Weiterhin keine Code-Änderungen.*
