# Sprint 11: Tuesday Readiness

Stand: 14. Juni 2026.

Ziel: Die Sprint-1-bis-10-App so in Betrieb nehmen, dass Arwin sie am Dienstag, 16. Juni 2026, bei der ersten Rugby-Einheit praktisch nutzen kann.

Sprint 11 ist kein Fachfeature-Sprint. Er ist ein Betriebs-, Deployment-, Account-, PWA- und Feldabnahme-Sprint.

## Status aus dem Audit

Technisch erledigt:

- Sprint 1-10 sind code-seitig umgesetzt.
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` und `npm audit --audit-level=moderate` sind gruen.
- Supabase-Migrationen sind lokal und remote synchron.
- `supabase db push --dry-run` meldet `Remote database is up to date`.

Weiterhin offen:

- GitHub-Remote und sauberer Initial Commit.
- Hosting/Deploy mit stabiler HTTPS-URL.
- Coach-Account in Supabase Auth.
- Login-Test auf der echten Deploy-URL.
- PWA-Installation auf physischem iPad und iPhone.
- Offline-/Pending-/Retry-Test mit Coach-Login.
- iPad-zu-iPhone- und iPhone-zu-iPad-Sync-Test.
- 15-20 Spieler fuer Dienstag anlegen.
- Backup-/Export-Routine praktisch testen.
- Print-Fallbacks fuer Dienstag bereitlegen.

## Wichtige Entscheidung: Registrierung

Die App hat bewusst keinen oeffentlichen Registrierungsflow. Das ist fuer den Ein-Coach-MVP richtig.

Was das bedeutet:

- Arwin registriert sich nicht in der App.
- Der Coach-Account wird in Supabase Auth angelegt.
- Danach loggt sich Arwin in der App mit Email und Passwort ein.
- Es wird kein `Sign up`-Button in die App eingebaut, solange nicht bewusst ein spaeterer Multi-Coach-Sprint geplant wird.

Warum:

- Weniger Angriffsflache.
- Keine offenen Registrierungen fuer fremde Nutzer.
- Keine neue Rollen-/Invite-/Admin-Komplexitaet vor Dienstag.
- Passt zur Roadmap: keine Spieler-Accounts, kein Staff-Portal, kein Overengineering.

Wenn spaeter mehrere Coaches gebraucht werden, wird das als eigener Sprint geplant.

## Felder fuer die naechste Session

Diese Werte in der naechsten Codex-Session vom Nutzer abfragen oder nach erfolgreicher Einrichtung eintragen:

```text
GitHub Repo URL: https://github.com/epiclori1020/Rugby
Vercel Projekt URL:
Produktions-URL der App:
Supabase Projektname: rugby-snc-field-hub
Supabase Project Ref:
Coach Email: farajpooryarwin@gmx.at
iPad PWA installiert: ja/nein
iPhone PWA installiert: ja/nein
Letztes JSON-Backup gespeichert unter:
```

Keine Secrets, Passwoerter, Tokens, DB-Passwoerter oder `service_role` Keys in diese Datei eintragen.

Hinweis 14. Juni 2026: Ein Coach-Account fuer `farajpooryarwin@gmx.at` wurde laut Nutzer bereits angelegt. Das Passwort wurde im Chat geteilt und wird hier bewusst nicht gespeichert. Nach erfolgreichem Login-Test sollte das Passwort rotiert oder per Supabase-Passwort-Reset neu gesetzt werden.

## Task 1: GitHub-Repo verbinden und Versionierung

Was es bedeutet:

- Der aktuelle App-Stand wird versioniert.
- Vercel kann aus GitHub deployen.
- Es gibt eine Rueckfallbasis, falls vor Dienstag etwas kaputt geht.
- Das GitHub-Repo existiert bereits: `https://github.com/epiclori1020/Rugby`.

Wo:

- Lokal im Terminal unter `/Users/arwinfarajpoory/Desktop/Rugby`.
- Im Browser unter `https://github.com/epiclori1020/Rugby`.

Nutzer-Schritte in GitHub:

1. `https://github.com/epiclori1020/Rugby` oeffnen.
2. Pruefen, ob du Schreibzugriff hast.
3. Wenn das Repo leer ist: keine README/.gitignore/License im Web nachtraeglich erzeugen.
4. Wenn das Repo bereits Dateien enthaelt: vor dem Push lokale und Remote-Historie bewusst abgleichen, nicht blind ueberschreiben.
5. HTTPS-URL verwenden: `https://github.com/epiclori1020/Rugby.git`.

Codex-/Terminal-Schritte:

```bash
cd /Users/arwinfarajpoory/Desktop/Rugby
git status --short
git remote -v
```

Wenn noch kein Remote existiert:

```bash
git remote add origin https://github.com/epiclori1020/Rugby.git
git remote -v
```

Wenn bereits ein falscher Remote existiert:

```bash
git remote set-url origin https://github.com/epiclori1020/Rugby.git
git remote -v
```

Vor dem Commit pruefen:

```bash
git status --short
rg -n "service_role|DB_PASSWORD|JWT_SECRET|SUPABASE_SERVICE|BEGIN PRIVATE KEY|ghp_|github_pat_" .
```

Nicht committen:

- `.env`
- `.env.*` ausser `.env.example` und `.env.supabase.local.example`
- echte Spieler-/Gesundheitsdaten
- echte JSON-Backups
- echte Spielerfotos
- DB-Passwoerter, Tokens, `service_role` Keys

Empfohlener erster Commit, wenn die Secret-Pruefung sauber ist:

```bash
git add .agents .gitignore AGENTS.md app codex docs plans print_pdfs research scripts supabase templates data/.gitkeep .env.supabase.local.example
git status --short
git commit -m "feat: prepare rugby field hub mvp"
git branch -M main
git push -u origin main
```

Wenn `Kurzkonzept_Rugby_Donau_U18.pdf` oder `print_pdfs 2/` committed werden sollen, vorher bewusst entscheiden. Sie sind fuer den Sprint-11-App-Deploy nicht noetig.

Fertig, wenn:

- `git remote -v` zeigt GitHub als `origin`.
- `origin` zeigt auf `https://github.com/epiclori1020/Rugby.git`.
- `git status --short` ist nach Commit leer oder enthaelt nur bewusst lokale Dateien.
- GitHub zeigt den Commit.

## Task 2: Hosting/Deploy mit HTTPS

Was es bedeutet:

- iPad und iPhone brauchen eine stabile HTTPS-URL.
- PWA-Installation, Service Worker und Geraete-Sync werden erst damit realistisch testbar.

Wo:

- Browser: `https://vercel.com/new`
- GitHub-Repo aus Task 1
- Supabase Dashboard fuer die beiden Browser-Env-Variablen

Wenn die App bereits online offen ist:

1. Aktuelle URL aus der Browser-Adresszeile kopieren.
2. In `Produktions-URL der App` oben eintragen.
3. In der naechsten Codex-Session die URL mit dem Browser-Plugin oeffnen.
4. Pruefen, ob diese Online-Version wirklich den aktuellen Sprint-10-Stand hat.
5. Nur neu deployen, wenn die Online-Version veraltet ist oder keine Supabase-Env-Variablen hat.

Vercel-Schritte:

1. `https://vercel.com/new` oeffnen.
2. Mit GitHub verbinden, falls noch nicht verbunden.
3. Repository `epiclori1020/Rugby` importieren.
4. Project Name: `rugby-field-hub` oder `rugby-snc-field-hub`.
5. Root Directory setzen: `app/field-hub`.
6. Framework Preset: `Vite`.
7. Install Command: `npm install`.
8. Build Command: `npm run build`.
9. Output Directory: `dist`.
10. Environment Variables fuer `Production`, `Preview` und `Development` eintragen:

```text
VITE_SUPABASE_URL=<Project URL aus Supabase>
VITE_SUPABASE_PUBLISHABLE_KEY=<Publishable/anon Key aus Supabase>
```

Nicht eintragen:

- `service_role`
- DB-Passwort
- JWT Secret
- Personal Access Tokens

11. `Deploy` klicken.
12. Nach erfolgreichem Deploy die Produktions-URL kopieren.

Fertig, wenn:

- Die Deploy-URL per HTTPS erreichbar ist.
- `Heute` als Startscreen laedt.
- Die App zeigt keinen Supabase-Setup-Fehler.
- Login-Form ist sichtbar, wenn kein Coach eingeloggt ist.

## Task 3: Supabase Coach-Account anlegen

Was es bedeutet:

- Die App hat Login, aber keine Registrierung.
- Ohne Supabase Auth User kann Arwin keine dynamischen Daten nutzen.
- Laut Nutzer existiert der Coach-Account `farajpooryarwin@gmx.at` bereits.

Wo:

- Supabase Dashboard: `https://supabase.com/dashboard`
- Projekt: `rugby-snc-field-hub`
- Bereich: `Authentication` -> `Users`

Nutzer-Schritte:

1. `https://supabase.com/dashboard` oeffnen.
2. Projekt `rugby-snc-field-hub` oeffnen.
3. Links `Authentication` oeffnen.
4. `Users` oeffnen.
5. Pruefen, ob `farajpooryarwin@gmx.at` vorhanden ist.
6. Wenn der User fehlt: Button wie `Add user`, `Create user`, `Invite user` oder vergleichbar klicken.
7. Coach Email `farajpooryarwin@gmx.at` eintragen.
8. Starkes Passwort generieren und im Passwortmanager speichern.
9. Wenn die UI eine Option fuer Email-Bestaetigung zeigt: User als bestaetigt/autoconfirmed anlegen oder Invite-Link sauber abschliessen.
10. User erstellen.
11. Wenn der User bereits existiert: Login-Test durchfuehren und danach das im Chat geteilte Passwort rotieren oder per Passwort-Reset neu setzen.

Wichtig:

- Passwort nicht in Git, Chat, Markdown oder `.env` speichern.
- Keine Spieler-Accounts anlegen.
- Keine offene Registrierung aktivieren, nur damit Arwin sich selbst registrieren kann.
- Wenn Supabase eine Site URL oder Redirect URL fuer Invite/Email braucht, die Produktions-URL aus Task 2 eintragen.
- Das einmal im Chat geteilte Coach-Passwort gilt als kompromittiert und soll nach dem ersten erfolgreichen Setup-Test ersetzt werden.

Fertig, wenn:

- In Supabase `Authentication` -> `Users` ein Coach-User mit Arwins Email sichtbar ist.
- Arwin kann sich auf der Deploy-URL mit Email/Passwort einloggen.
- Das geteilte Initialpasswort ist rotiert oder ein Passwort-Reset wurde ausgeloest.

## Task 4: Supabase URL-Konfiguration pruefen

Was es bedeutet:

- Invite-Links, Email-Bestaetigung und spaetere Auth-Flows sollen zur richtigen App-URL fuehren.

Wo:

- Supabase Dashboard -> Projekt -> `Authentication` -> URL/Redirect-Konfiguration.

Nutzer-Schritte:

1. Produktions-URL aus Task 2 kopieren.
2. In Supabase Auth URL Configuration oeffnen.
3. Site URL auf die Produktions-URL setzen, z. B. `https://rugby-snc-field-hub.vercel.app`.
4. Redirect URLs erlauben:

```text
https://rugby-snc-field-hub.vercel.app
https://rugby-snc-field-hub.vercel.app/**
```

Wenn Vercel eine andere Domain erzeugt, exakt diese Domain verwenden.

Fertig, wenn:

- Site URL ist die echte Deploy-URL.
- Redirect URLs enthalten die echte Deploy-URL.

## Task 5: Datenbankstatus ohne Aenderung pruefen

Was es bedeutet:

- Sicherstellen, dass keine Migration fehlt.
- Es wird nichts gepusht.

Wo:

- Lokal im Terminal unter `/Users/arwinfarajpoory/Desktop/Rugby`.
- Datei `.env.supabase.local` muss lokal vorhanden sein.

Codex-/Terminal-Schritte:

```bash
cd /Users/arwinfarajpoory/Desktop/Rugby
set -a
source .env.supabase.local
set +a
supabase migration list
supabase db push --dry-run
```

Erwartung:

```text
Local          | Remote
20260613192159 | 20260613192159
20260613230725 | 20260613230725
20260613235336 | 20260613235336
Remote database is up to date.
```

Fertig, wenn:

- Keine neue Migration offen ist.
- Kein echter `supabase db push` noetig ist.

## Task 6: Deploy-Smoke mit Coach-Login

Was es bedeutet:

- Die echte Online-App spricht mit Supabase.
- Auth, RLS und Frontend-Env sind korrekt verbunden.

Wo:

- Desktop-Browser.
- Deploy-URL aus Task 2.

Schritte:

1. Deploy-URL oeffnen.
2. Login mit Coach Email und Passwort.
3. Sync-Status anschauen.
4. Tab `Spieler` oeffnen.
5. Testspieler anlegen:

```text
Name: Test Sprint11 Spieler
Position: Offen
Cluster: Offen
Consent: unklar
Returner: nein
Foto-Erlaubnis: nicht gefragt
```

6. Speichern.
7. Seite neu laden.
8. Pruefen, ob Testspieler weiter sichtbar ist.
9. `Jetzt synchronisieren` ausloesen, falls Pending angezeigt wird.

Fertig, wenn:

- Login funktioniert.
- Testspieler bleibt nach Reload sichtbar.
- Sync-Status ist `synced` oder nachvollziehbar `pending`, wenn absichtlich offline.

## Task 7: PWA auf iPad und iPhone installieren

Was es bedeutet:

- Die App wird nicht nur als Safari-Tab genutzt, sondern als Home-Screen-PWA.
- Das verbessert iOS-Nutzung und Speicherpersistenz.

Wo:

- Physisches iPad.
- Physisches iPhone.
- Safari, nicht Chrome.

iPad-Schritte:

1. Safari oeffnen.
2. Produktions-URL oeffnen.
3. Einmal einloggen.
4. Teilen-Button antippen.
5. `Zum Home-Bildschirm` antippen.
6. Name setzen: `Field Hub`.
7. `Hinzufuegen` antippen.
8. Safari schliessen.
9. App vom Home-Bildschirm starten.
10. Login pruefen.

iPhone-Schritte:

1. Safari oeffnen.
2. Produktions-URL oeffnen.
3. Teilen-Button antippen.
4. `Zum Home-Bildschirm` antippen.
5. Name setzen: `Field Hub`.
6. `Hinzufuegen` antippen.
7. App vom Home-Bildschirm starten.
8. Login pruefen.

Fertig, wenn:

- Auf iPad und iPhone ein Home-Screen-Icon existiert.
- Beide starten die App.
- Beide koennen sich mit demselben Coach-Account einloggen.

## Task 8: iPad/iPhone-Sync-Abnahme

Was es bedeutet:

- Nachweis, dass kein Geraete-Drift entsteht.

Wo:

- Physisches iPad.
- Physisches iPhone.
- Beide online.

Schritte:

1. Auf iPad einloggen.
2. Spieler `Test Sprint11 Spieler` anlegen oder oeffnen.
3. Auf iPhone einloggen.
4. Pruefen, ob derselbe Spieler sichtbar ist.
5. Auf iPhone beim Testspieler eine harmlose Notiz oder Position aendern.
6. Speichern.
7. Auf iPad `Jetzt synchronisieren` oder Reload.
8. Pruefen, ob die Aenderung auf iPad sichtbar ist.
9. Danach auf iPad eine weitere harmlose Aenderung machen.
10. Auf iPhone synchronisieren/reloaden.
11. Pruefen, ob die Aenderung sichtbar ist.

Fertig, wenn:

- iPad -> iPhone funktioniert.
- iPhone -> iPad funktioniert.
- Sync-Status ist verstaendlich.

## Task 9: Offline-/Pending-/Retry-Test

Was es bedeutet:

- Der Feldfall ohne stabiles Internet wird praktisch getestet.

Wo:

- Bevorzugt iPad-PWA.
- Danach iPhone oder Desktop zur Gegenprobe.

Schritte:

1. iPad-PWA online oeffnen.
2. Einloggen.
3. Sicherstellen, dass `Test Sprint11 Spieler` existiert.
4. Kurz alle Haupttabs einmal oeffnen, besonders `Bibliothek`.
5. WLAN/Mobilfunk deaktivieren oder Flugmodus aktivieren.
6. In `Check-in` die aktuelle Dienstagseinheit waehlen.
7. Fuer den Testspieler Anwesenheit oder Readiness speichern.
8. Sync-Status pruefen: Es muss erkennbar sein, dass lokal gespeichert wurde und Sync offen/pending ist.
9. WLAN/Mobilfunk wieder aktivieren.
10. `Jetzt synchronisieren` ausloesen.
11. Auf iPhone oder Desktop pruefen, ob die Aenderung angekommen ist.

Fertig, wenn:

- Offline-Eingabe lokal moeglich ist.
- Nach Online-Rueckkehr wird synchronisiert.
- Kein Datenverlust beim Reload.

## Task 10: Spieler fuer Dienstag anlegen

Was es bedeutet:

- Die App ist erst praktisch nutzbar, wenn die erwarteten Spieler vorhanden sind.

Wo:

- App -> Tab `Spieler`.
- Bevorzugt am Desktop oder iPad mit Tastatur, nicht erst am Feld.

Minimalfelder pro Spieler:

```text
Name:
Position:
Cluster: Collision Forwards / Hybrid / Speed-Space Backs / offen
Consent-Status: vorhanden / offen / unklar
Returner-Status: nein / ja / offen
Foto-Erlaubnis: nicht gefragt / allowed / denied
```

Regeln:

- Keine Diagnosen eintragen.
- Keine Arztbriefe oder medizinischen Dokumente hochladen.
- Fotos nur, wenn Foto-Erlaubnis `allowed` ist.
- Wenn Position/Cluster noch unklar ist, `offen` verwenden und spaeter korrigieren.

Fertig, wenn:

- 15-20 erwartete Spieler fuer Dienstag angelegt sind.
- Auf iPad und iPhone nach Sync dieselbe Spielerzahl sichtbar ist.

## Task 11: Dienstag-Workflow testen

Was es bedeutet:

- Der konkrete 16. Juni 2026 ist in der App auffindbar und bedienbar.

Wo:

- iPad-PWA.

Schritte:

1. `Heute` oeffnen.
2. Dienstag, 16. Juni 2026, auswaehlen, falls nicht automatisch aktiv.
3. Pruefen:
   - Briefing sichtbar.
   - Material sichtbar.
   - Trainingsplan sichtbar.
   - Check-in erreichbar.
   - Training erreichbar.
   - Nachbereitung erreichbar.
4. Einen Testspieler durchspielen:
   - Anwesenheit.
   - Readiness.
   - Schmerzscore.
   - Ampel-Vorschlag.
   - Trainingsvariante C oder normal.
   - Nachbereitung mit sRPE-Testwert.

Fertig, wenn:

- Arwin weiss, welche Tabs er am Feld nutzt.
- Keine UI-Ueberraschung im Dienstag-Flow bleibt.

## Task 12: Export-/Backup-Routine testen

Was es bedeutet:

- Supabase ist Hauptsync, JSON ist Zusatzbackup.
- Vor laengeren Pausen und nach Einheiten soll ein Backup existieren.

Wo:

- App -> Tab `Export`.
- Speicherort ausserhalb des Repos, z. B. iCloud Drive, lokaler sicherer Ordner oder Passwortmanager-Dateianhang.

Schritte:

1. Nach Testspieler/Startliste in `Export` gehen.
2. Vollstaendiges JSON-Backup erzeugen.
3. Datei speichern unter:

```text
field-hub-backup-2026-06-16-vor-einheit.json
```

4. Nach der echten Dienstagseinheit erneut exportieren:

```text
field-hub-backup-2026-06-16-nach-einheit.json
```

5. Nicht in Git committen.
6. Nicht in `data/` committen, wenn echte Spieler-/Gesundheitsdaten enthalten sind.

Fertig, wenn:

- Vor der Einheit ein Backup existiert.
- Nach der Einheit ein Backup existiert.
- Arwin weiss, wo die Dateien liegen.

## Task 13: Print-Fallbacks fuer Dienstag

Was es bedeutet:

- Wenn PWA, Netz, Login oder iPad am Feld Probleme machen, kann die Einheit trotzdem laufen.

Wo:

- Ordner `print_pdfs/1_DIESE_WOCHE_drucken/`.

Vor Dienstag bereitlegen:

```text
1_DIENSTAG_trainingsplan.pdf
2_COACH_SCRIPT_di_do.pdf
3_DIENSTAG_checkin_3x.pdf
5_OPTIONAL_einwilligung_20x.pdf
6_NOTFALL_admin_vor_dienstag.pdf
```

Optional am iPad bereithalten:

```text
print_pdfs/2_NACHSCHLAGEN_ipad_nicht_drucken/coach_card_dienstag.pdf
print_pdfs/2_NACHSCHLAGEN_ipad_nicht_drucken/detail_briefing.pdf
print_pdfs/2_NACHSCHLAGEN_ipad_nicht_drucken/variantenkarte_ABCD.pdf
print_pdfs/2_NACHSCHLAGEN_ipad_nicht_drucken/exercise_pool_mapping.pdf
```

Fertig, wenn:

- Die wichtigsten PDFs sind gedruckt oder offline am iPad verfuegbar.

## Task 14: Sicherheits- und Secret-Check vor echter Nutzung

Was es bedeutet:

- Vor Nutzung mit echten Spielern darf kein Secret im Repo liegen.
- Alte geteilte Secrets muessen rotiert sein.

Wo:

- GitHub.
- Supabase Dashboard.
- Lokaler Projektordner.

Schritte:

1. Lokal suchen:

```bash
cd /Users/arwinfarajpoory/Desktop/Rugby
rg -n "service_role|DB_PASSWORD|JWT_SECRET|SUPABASE_SERVICE|BEGIN PRIVATE KEY|ghp_|github_pat_" .
```

2. Pruefen, dass `.env` und `.env.supabase.local` nicht committed sind:

```bash
git check-ignore app/field-hub/.env .env.supabase.local
```

3. Falls frueher ein GitHub PAT im Chat geteilt wurde: in GitHub loeschen/rotieren.
4. Falls frueher ein Supabase DB-Passwort im Chat geteilt wurde: in Supabase rotieren, wenn noch nicht erledigt.

Fertig, wenn:

- Kein Secret im Git-Status oder GitHub-Repo ist.
- Alte geteilte Secrets sind rotiert oder bewusst als ungueltig bestaetigt.

## Task 15: Akzeptanztest aus der Roadmap

Was es bedeutet:

- Abschluss gegen `app/ROADMAP.md` Abschnitt 11.

Wo:

- iPad-PWA, iPhone-PWA, Supabase Dashboard, Export-Tab.

Checkliste:

- [ ] Arwin legt 15-20 Spieler an.
- [ ] Foto-Erlaubnis kann dokumentiert werden.
- [ ] Ein Profilfoto kann fuer einen Testspieler mit Erlaubnis hochgeladen werden.
- [ ] Dienstag, 16. Juni 2026, ist waehlbar.
- [ ] Briefing, Plan, Material und Check-in sind sichtbar.
- [ ] Anwesenheit kann erfasst werden.
- [ ] Readiness, Life, Schmerz/Ort und Returner koennen erfasst werden.
- [ ] Ampel-Vorschlag erscheint.
- [ ] C/D/kein Sprint/Physio kann fuer einzelne Spieler gesetzt werden.
- [ ] Nachbereitung mit sRPE, Pain/Issue und E2 funktioniert.
- [ ] Dauer kann eingetragen werden und sRPE-Load wird berechnet.
- [ ] Supabase-Sync funktioniert oder Offline-Pending ist klar sichtbar.
- [ ] Donnerstag zeigt Carry-over-Hinweise aus Dienstag.
- [ ] iPad und iPhone zeigen nach Sync dieselben Daten und Spielerfotos.
- [ ] Vollstaendiger JSON-Export funktioniert.

Fertig, wenn:

- Alle Punkte sind bestanden oder bewusst als Feldabnahme nach Dienstag markiert.

## Task 16: Startprompt fuer die naechste Codex-Session

Diesen Prompt in einer neuen Session verwenden:

```text
Lies bitte zuerst:
- AGENTS.md
- .agents/skills/rugby-field-hub-implementation/SKILL.md
- app/README.md
- app/ROADMAP.md
- app/field-hub/README.md
- app/field-hub/SPRINT_11_TUESDAY_READINESS.md
- app/SUPABASE_SETUP_GUIDE.md
- docs/08_next_session_handover.md

Setze Sprint 11 Tuesday Readiness um.

Ziel:
Die bereits fertig gebaute Field-Hub-App soll fuer Dienstag, 16. Juni 2026, auf iPad und iPhone praktisch nutzbar sein.

Arbeite strikt MVP-gerecht:
- keine neuen Fachfeatures
- keine Signup-UI, ausser Arwin entscheidet bewusst anders
- Coach-Account in Supabase Auth anlegen oder Arwin exakt durch die Dashboard-Schritte fuehren
- kein service_role Key
- keine echten Secrets committen
- keine echten Spieler-/Gesundheitsdaten committen
- kein DB-Push, ausser `supabase db push --dry-run` zeigt eine echte ausstehende Migration

Pruefe zuerst:
- ob ein GitHub-Remote existiert
- ob ein Vercel/Hosting-Deploy bereits existiert
- welche Produktions-URL Arwin gerade online offen hat
- ob Supabase Env Vars im Hosting gesetzt sind
- ob ein Coach-User in Supabase Auth existiert

Fuehre danach die Sprint-11-Tasks aus:
1. GitHub/Commit/Remote
2. Deploy/HTTPS
3. Supabase Coach-Account
4. Login-Smoke
5. PWA-Installation iPad/iPhone
6. iPad/iPhone-Sync
7. Offline/Pending/Retry
8. Spieler-Startliste
9. Backup/Export
10. Print-Fallbacks

Am Ende berichte:
- was erledigt ist
- welche URLs eingetragen wurden
- ob DB-Push noetig war
- ob Deploy noetig war
- ob PWA auf iPad/iPhone installiert ist
- ob Login und Sync funktionieren
- was vor Dienstag noch offen bleibt
```

## Offizielle Referenzen

- GitHub Repository erstellen: `https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository`
- GitHub Remote verbinden: `https://docs.github.com/en/get-started/git-basics/managing-remote-repositories`
- Vercel GitHub Deployments: `https://vercel.com/docs/git/vercel-for-github`
- Vercel Vite: `https://vercel.com/docs/frameworks/frontend/vite`
- Supabase Auth Users: `https://supabase.com/docs/guides/auth/users`
- Supabase User Management: `https://supabase.com/docs/guides/auth/managing-user-data`
