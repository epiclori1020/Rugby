# OnField Post-Roadmap Hardening

Status: Planungsdokument, 2026-07-06
Produkt: OnField Coach, technisch `app/field-hub`
Ausgangspunkt: Die OnField UX-, Branding- und App-Transformation Roadmap 0A-20 ist abgeschlossen.
Ziel: Die nach dem Abschluss-Audit gefundenen Restpunkte sauber schliessen, bevor OnField Coach extern geoeffnet oder groesser beta-getestet wird.

> Fuer kuenftige KI-Agenten: Dieses Dokument ist die Anschluss-Roadmap nach `docs/superpowers/plans/2026-07-04-onfield-ux-branding-transformation-roadmap.md`. Vor Umsetzung eines Sprints zuerst `AGENTS.md`, den Memory Index, Current State, Decision Log und den passenden OnField-Skill laden. Dann nur den konkreten Sprint-Scope bearbeiten. Keine spaeteren Sprints nebenbei umsetzen.

## Warum Diese Anschluss-Roadmap Existiert

Die Haupt-Roadmap hat die App substanziell umgebaut:

- OnField-Naming und Brand-System.
- 5er-Informationsarchitektur.
- Einheit-Container fuer Check-in, Training und Nachbereitung.
- Roster-first Check-in.
- Live-first Training.
- Queue-first Nachbereitung.
- Spieler-, Analyse-, Mehr-, Public/Kiosk-, Sync-, PWA- und Beta-Readiness-Sprints.

Der Abschluss-Audit hat aber gezeigt: Die App ist nicht nur oberflaechlich veraendert, aber einige Beweise und Guardrails sind noch nicht hart genug. Das betrifft vor allem:

- QA-Gates, die noch Skips erlauben.
- Runtime-Memory-Lint/Privacy.
- Supabase-Beta-Auth-Defaults.
- Legacy-Routing unter der neuen IA.
- Designsystem-/A11y-/Responsive-Restmigration.
- finale Dokumentation, damit kuenftige Agenten nicht wieder die falsche naechste Arbeit starten.

## Phasenentscheidung

Diese Roadmap ist bewusst in zwei Phasen getrennt.

### Phase A: Beta-Blocker

Phase A muss vor einer kontrollierten externen Beta abgeschlossen sein.

Enthalten:

1. Sprint 21: Harte Beta-QA-Gates.
2. Sprint 22: Runtime-Memory Privacy & Lint Fix.
3. Sprint 23: Supabase/Auth/RLS Beta Guardrails.

Wenn Phase A nicht abgeschlossen ist, darf OnField Coach nicht als beta-ready behandelt werden.

### Phase B: Qualitaets- und Struktur-Hardening

Phase B verbessert Stabilitaet, Native Feel, Skalierbarkeit und Agenten-Sicherheit.

Enthalten:

1. Sprint 24: Coach-Routing & Navigation Refactor.
2. Sprint 25: Designsystem, A11y & Responsive Hardening.
3. Sprint 26: Final Cleanup, Evidence & Memory Closeout.

Phase B sollte spaetestens vor groesserer Beta, App-Store-Ueberlegung oder OnField-Performance-/SaaS-Vorbereitung abgeschlossen sein.

## Verbindliche Guardrails

Diese Regeln gelten fuer alle Sprints:

- PWA-first bleibt aktiv.
- Keine Native-, Flutter- oder React-Native-Vorentscheidung.
- Keine SaaS-/Multi-Tenant-/Billing-Arbeit.
- Keine zweite Sportart einfuehren.
- OnField Rugby bleibt einziges aktives Sport-Preset.
- iPhone und iPad muessen fachlich dasselbe koennen.
- Unterschiede zwischen iPhone und iPad duerfen nur Layout, Navigation, Dichte und Interaktionsmuster betreffen.
- Keine medizinische Diagnose- oder Return-to-Play-Freigabe-Sprache.
- Keine echten Secrets, keine `service_role` Keys und keine echten sensiblen Spieler-/Gesundheitsdaten in Tests, Doku oder Memory.
- Runtime Memory bleibt lokal, ignored und unterhalb von AGENTS, Decision Log, Current State und SSOTs.
- Marketing-/Hero-Optik bleibt auf Brand-Surfaces. Live-Coaching-Flows bleiben ruhig und operativ.

## Pflichtkontext Fuer Agenten

Vor jedem Sprint lesen:

1. `AGENTS.md`
2. `docs/field-hub/memory/index.md`
3. `docs/field-hub/onfield_current_state.md`
4. `docs/field-hub/onfield_decision_log.md`
5. `.agents/skills/onfield-roadmap-execution/SKILL.md`

Je nach Sprint zusaetzlich:

- Runtime Memory: `.agents/skills/onfield-runtime-memory/SKILL.md`, `docs/field-hub/onfield_runtime_memory_faq.md`, `.onfield-memory/README.md`.
- PWA/A11y/Responsive: `.agents/skills/onfield-pwa-accessibility-qa/SKILL.md`, `docs/field-hub/onfield_pwa_accessibility_qa.md`.
- App-Code: `.agents/skills/rugby-field-hub-implementation/SKILL.md`, betroffene Dateien in `app/field-hub/src`.
- Supabase/Auth/RLS: Supabase Skill, `app/SUPABASE_SETUP_GUIDE.md`, `supabase/config.toml`, relevante Migrationen.

## Sprint 21 - Harte Beta-QA-Gates

Status: Geplant.
Phase: A, beta-blockierend.

### Was genau machen wir?

Wir machen aus den bisherigen E2E-/QA-Scripts ein klares zweistufiges Gate:

- `npm run qa:local`
- `npm run qa:beta`

`qa:local` ist fuer normale Entwicklungsarbeit. Es darf ohne Remote-Testdaten und ohne Coach-Test-Credentials laufen.

`qa:beta` ist das harte Freigabe-Gate. Es darf nicht gruen werden, wenn signierte Coach-Flows, Public/Kiosk oder Remote-Testpfade nicht wirklich geprueft wurden.

Arbeiten:

- `app/field-hub/package.json` um `qa:local` und `qa:beta` ergaenzen.
- `qa:local` ausfuehren lassen:
  - Typecheck.
  - Lint.
  - Tests.
  - Build.
  - PWA-E2E.
  - Sprint-19-Visual-QA ohne Auth-Zwang.
- `qa:beta` ausfuehren lassen:
  - Typecheck.
  - Lint.
  - Tests.
  - Build.
  - PWA-E2E.
  - Sprint-19-Visual-QA mit verpflichtendem Signed-in-Teil.
  - Kiosk-E2E mit explizitem Remote-Mutation-Opt-in.
- `qa:beta` bricht klar ab, wenn diese Variablen fehlen:
  - `FIELD_HUB_E2E_EMAIL`
  - `FIELD_HUB_E2E_PASSWORD`
  - `FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION=1` fuer Kiosk-Remote-Test.
- `app/field-hub/scripts/e2e-sprint19-visual-qa.mjs` so haerten, dass:
  - Signed-in-Skips bei Beta-Gate nicht erlaubt sind.
  - Child-Prozesse und Preview-Server sauber beendet werden.
  - der Prozess nach erfolgreichem JSON-Resultat nicht haengen bleibt.
  - Output klar zwischen `checked`, `skipped`, `failed` und `blocked` unterscheidet.
- `app/field-hub/scripts/e2e-kiosk-smoke.mjs` so absichern, dass Remote-Mutation nur mit explizitem Opt-in laeuft.
- QA-Doku aktualisieren:
  - `qa:local` ist Arbeitscheck.
  - `qa:beta` ist Freigabecheck.
  - Skips sind im Beta-Gate nicht akzeptabel.

### Wieso?

Der Abschluss-Audit hat gezeigt, dass Tests gruen wirken konnten, obwohl wichtige Beta-Flows uebersprungen wurden. Fuer externe Nutzer ist das zu riskant. Ein Beta-Gate muss beweisen, dass die relevanten Flows wirklich geprueft wurden.

### Wo?

- `app/field-hub/package.json`
- `app/field-hub/scripts/e2e-sprint19-visual-qa.mjs`
- `app/field-hub/scripts/e2e-kiosk-smoke.mjs`
- `docs/field-hub/2026-07-06_onfield_sprint19_visual_qa.md`
- ggf. `docs/field-hub/onfield_beta_readiness.md`

### Kontext fuer Agenten

Nicht neue App-Funktionalitaet bauen. Es geht nur um Pruefbarkeit und harte Freigaberegeln.

Keine echten Credentials in Dateien schreiben. Wenn Credentials fuer einen Lauf fehlen, `qa:beta` nicht simulieren, sondern als blockiert melden.

### Deliverables

- `qa:local` Script.
- `qa:beta` Script.
- Gehaertete E2E-Scripts.
- Aktualisierte QA-Doku.
- Kurzer Abschlussvermerk, welche Checks lokal liefen und welche Beta-Credentials fuer `qa:beta` erforderlich sind.

### Akzeptanzkriterien

- `npm run qa:local` kann ohne Beta-Credentials laufen.
- `npm run qa:beta` schlaegt ohne Beta-Credentials verstaendlich fehl.
- `qa:beta` wird nur gruen, wenn Signed-in und Kiosk wirklich geprueft wurden.
- Keine haengenden Preview-, Browser- oder Child-Prozesse nach Abschluss.
- Keine Secrets landen in Git, Logs oder Memory.

## Sprint 22 - Runtime-Memory Privacy & Lint Fix

Status: Geplant.
Phase: A, beta-blockierend.

### Was genau machen wir?

Wir bereinigen und haerten das lokale OnField Runtime Memory.

Arbeiten:

- Lokale generated Runtime-Artefakte bereinigen:
  - `.onfield-memory/captures`
  - `.onfield-memory/daily`
  - `.onfield-memory/knowledge`
  - `.onfield-memory/reports`
  - `.onfield-memory/backups`
  - `.onfield-memory/orphans`
  - `.onfield-memory/tmp`
  - `.onfield-memory/state.json`
- Redaction vor dem Schreiben haerten fuer:
  - Env-Werte.
  - Supabase-Keys.
  - Bearer/Auth-Tokens.
  - lange Token-Strings.
  - URL-Keys.
  - potenziell sensible Payload-Werte.
- Lint-Ausgabe so halten, dass sie keine geheimen Werte ausgibt, sondern nur:
  - Pfad.
  - Pattern-Typ.
  - Anzahl.
  - Schweregrad.
- Runtime-Tests ergaenzen:
  - Redaction-Test.
  - Capture-/Flush-Test.
  - Lint-Test.
  - Hot-Cache-Limit-Test.
- `docs/field-hub/memory/gotchas.md` ergaenzen:
  - Wenn Runtime-Lint fehlschlaegt, darf generated Memory nicht als verlaesslicher Kontext genutzt werden.

### Wieso?

Runtime Memory soll Vergessen reduzieren, darf aber keine potenziell sensiblen Daten konservieren. Generated Memory ist kein SSOT. Wenn Lint fehlschlaegt, ist dieses lokale Memory nur Rohmaterial mit Risiko und darf nicht als sicherer Kontext gelten.

### Wo?

- `.onfield-memory/scripts/`
- `.onfield-memory/tests/`
- `.onfield-memory/config.json`
- `.codex/hooks.json`, nur falls noetig.
- `docs/field-hub/onfield_runtime_memory_faq.md`, falls sich Regeln aendern.
- `docs/field-hub/memory/gotchas.md`

### Kontext fuer Agenten

Die generated Runtime-Ordner sind ignored und nicht kanonisch. Sie duerfen geloescht oder sicher neu erzeugt werden.

Keine SSOTs automatisch aus Runtime Memory schreiben. Current State, Decision Log und Roadmap bleiben manuelle Memory-Closeout-Entscheidungen.

### Deliverables

- Gehaertete Redaction.
- Erweiterte Runtime-Tests.
- Gruener Runtime-Lint.
- Gotcha gegen unsichere generated Memory-Nutzung.

### Akzeptanzkriterien

- `python3 .onfield-memory/scripts/lint.py --json` gibt `ok: true` zurueck.
- Alle Runtime-Memory-Tests laufen gruen.
- Keine generated Runtime-Dateien werden committed.
- Hot Cache bleibt klein und optional.
- Lint-Ausgaben enthalten keine Roh-Secrets.

## Sprint 23 - Supabase/Auth/RLS Beta Guardrails

Status: Geplant.
Phase: A, beta-blockierend.

### Was genau machen wir?

Wir bringen Supabase-Auth, Setup-Doku und statische Security-Pruefung in Einklang mit kontrollierter Beta.

Arbeiten:

- `supabase/config.toml` auf kontrollierte Beta ausrichten:
  - Self-Signup deaktivieren.
  - E-Mail-Signup deaktivieren, sofern nicht explizit fuer Invite-Flow gebraucht.
  - Passwort-Mindestlaenge auf mindestens 12 setzen.
- `AuthPanel` bleibt Login-only.
- Keine Signup-UI einfuehren.
- `app/SUPABASE_SETUP_GUIDE.md` aktualisieren:
  - Coach-Accounts werden kontrolliert erstellt oder eingeladen.
  - Nur browser-sichere URL und Publishable/Anon Key in den Client.
  - Nie `service_role`.
  - Keine echten sensiblen Spieler- oder Gesundheitsdaten fuer Tests.
- Statischen Supabase-Audit ergaenzen:
  - prueft `supabase/config.toml` auf Beta-Defaults.
  - prueft Migrationen auf verbotene `service_role`-Muster.
  - prueft bekannte dynamische Tabellen heuristisch auf RLS-/Policy-Abdeckung.
  - erlaubt `anon` nur fuer Public/Kiosk-Check-in, wo fachlich noetig.
- Kein Remote-DB-Push ohne expliziten Auftrag.

### Wieso?

Die Beta-Readiness sagt kontrollierte Beta. Offene Signup-Defaults passen nicht zu diesem Ziel. Vor externen Tests muss die Konfiguration zur Produktentscheidung passen.

### Wo?

- `supabase/config.toml`
- `app/SUPABASE_SETUP_GUIDE.md`
- ggf. neues Script unter `scripts/` oder `app/field-hub/scripts/`, je nachdem wo Supabase-Checks im Repo besser eingeordnet sind.
- ggf. `docs/field-hub/onfield_beta_readiness.md`

### Kontext fuer Agenten

Supabase-Arbeit immer mit Supabase Skill erledigen.

Keine Edge Functions einfuehren. Kein Realtime-Ausbau. Kein Storage-Ausbau. Keine Service-Role-Keys verlangen, speichern oder dokumentieren.

### Deliverables

- Beta-konforme Supabase-Konfiguration.
- Aktualisierter Setup Guide.
- Statischer Supabase-Audit.
- Dokumentierte Abgrenzung zwischen lokaler Entwicklung und kontrollierter Beta.

### Akzeptanzkriterien

- Statischer Supabase-Audit laeuft gruen.
- Config und Setup Guide widersprechen kontrollierter Beta nicht mehr.
- Public/Kiosk bleibt moeglich.
- Keine neue Supabase-Komplexitaet wurde eingefuehrt.
- Keine echten Secrets oder sensiblen Daten wurden committed.

## Sprint 24 - Coach-Routing & Navigation Refactor

Status: Geplant.
Phase: B, Qualitaets- und Struktur-Hardening.

### Was genau machen wir?

Wir ersetzen das intern noch legacy-zentrierte `HubTab`-Modell durch ein echtes OnField-Routingmodell.

Zielrouten:

- `#/today`
- `#/unit/check-in`
- `#/unit/training`
- `#/unit/post-session`
- `#/players`
- `#/analysis`
- `#/more/library`
- `#/more/export`
- `#/more/settings`
- `#/more/returners`
- `#/checkin/:token` fuer Public/Kiosk bleibt erhalten.

Arbeiten:

- Navigationstypen in Richtung `AppRoute`, `AppSection`, `UnitRoute`, `MoreRoute` umbauen.
- `HubTab` nur noch als temporaere Kompatibilitaetsmap nutzen oder entfernen, wenn alle Call Sites migriert sind.
- Browser Back/Forward fuer Coach-Bereiche unterstuetzen.
- Alte Hash-/Tab-Ziele auf neue Routen mappen, wenn es bestehende Links gibt.
- App Shell, Main Navigation, Session Workspace und relevante Screen-Navigation auf neue Routen umstellen.
- Tests ergaenzen fuer:
  - initiale Route.
  - Hash-Wechsel.
  - Browser Back/Forward.
  - Public-Check-in-Route.
  - Einheit-Unterbereiche.
  - Mehr-Unterbereiche.

### Wieso?

Die neue Informationsarchitektur ist sichtbar umgesetzt, aber technisch noch teilweise auf dem alten Tab-Modell. Fuer Beta-Support, Deep Links, PWA-App-Gefuehl und spaetere App-Store-/SaaS-Reife braucht OnField stabilere Routen.

### Wo?

- `app/field-hub/src/navigation.ts`
- `app/field-hub/src/App.tsx`
- `app/field-hub/src/components/AppShell.tsx`
- `app/field-hub/src/components/MainNavigation.tsx`
- relevante Komponenten mit `onNavigate`.
- bestehende Navigationstests.

### Kontext fuer Agenten

Keine Screen-Redesigns in diesem Sprint. Ziel ist Navigation/Routing, nicht UI-Optik.

Public/Kiosk-Check-in darf nicht brechen.

### Deliverables

- Neues Routingmodell.
- Rueckwaertskompatible Linkbehandlung.
- Tests fuer neue Route-Logik.
- Kurzer Doku-Hinweis, welche Routen kanonisch sind.

### Akzeptanzkriterien

- Alle Hauptbereiche und Unterbereiche sind direkt per URL erreichbar.
- Browser Back/Forward funktioniert.
- Public Check-in bleibt erreichbar.
- iPhone und iPad behalten denselben Funktionsumfang.
- Tests/typecheck/lint/build laufen.

## Sprint 25 - Designsystem, A11y & Responsive Hardening

Status: Geplant.
Phase: B, Qualitaets- und Struktur-Hardening.

### Was genau machen wir?

Wir schliessen die groessten Designsystem-, Accessibility- und Responsive-Restpunkte.

Arbeiten:

- Breakpoints an SSOT angleichen:
  - compact `<600px`
  - medium `600-839px`
  - expanded `>=840px`
- Medium-Viewport in PWA-/Visual-QA aufnehmen.
- Verhalten festlegen:
  - compact: Bottom Tab Bar.
  - medium: kompakte Shell ohne permanente Sidebar, aber mit voller Funktion.
  - expanded: Sidebar + Content + optional Detail.
- Disabled-Action-Regel screen-weit anwenden:
  - erklaerungsbeduerftige disabled Actions brauchen sichtbaren Grund und `aria-describedby`.
  - reine Loading-/Saving-Zustaende duerfen statt Grund klare Loading-Copy und `aria-busy` nutzen.
- Priorisierte Migration:
  - Check-in Reset/Kiosk/Quick Actions.
  - Training Start/Live Controls/Observation Submit.
  - Nachbereitung Queue-/Save-Actions.
  - Spieler-Metrik-Actions.
  - Export Import Confirm.
  - Returner Save/Decision Actions.
  - Auth Login/Logout Loading.
- Legacy-Token-Nutzung reduzieren:
  - neue UI nutzt `--of-*`.
  - alte Aliase bleiben nur zentral in `tokens.css`, solange Migration laeuft.
- PWA-Manifest/Icon-Polish:
  - maskable Icons ergaenzen.
  - Install-Metadaten pruefen.
- Sichtbare Copy-Reste bereinigen:
  - keine englischen Kontrolltexte in Hauptflows.
  - keine Diagnose-, Freigabe- oder RTP-Sprache.

### Wieso?

Das Designsystem existiert, ist aber noch nicht ueberall dominant. Dieser Sprint macht OnField konsistenter, nativer und barriereaermer, ohne neue Features einzufuehren.

### Wo?

- `app/field-hub/src/design/tokens.css`
- relevante CSS-Dateien.
- `app/field-hub/src/components/ui/`
- betroffene Screen-Komponenten.
- PWA-/Manifest-Dateien.
- E2E-/QA-Scripts.

### Kontext fuer Agenten

Live-Coaching-Flows bleiben ruhig und operativ. Keine Marketing-Hero-Flaechen in Check-in, Training oder Nachbereitung.

Designsystem-Migration ja, aber keine grosse externe UI-Library einfuehren.

### Deliverables

- Medium-Viewport-QA.
- Verbesserte Disabled-State-Zugaenglichkeit.
- Reduzierte Legacy-Token-Nutzung.
- Maskable PWA-Icons oder klar dokumentierter Ersatz.
- Bereinigte sichtbare Copy-Reste.

### Akzeptanzkriterien

- Compact, Medium und Expanded werden automatisiert oder dokumentiert geprueft.
- Disabled-Hauptaktionen sind erklaerbar.
- Keine sichtbaren alten englischen Kontrolltexte in Hauptflows.
- Manifest enthaelt passende maskable Icons.
- Keine neue RTP-/Freigabe-Sprache.
- Tests/typecheck/lint/build laufen.

## Sprint 26 - Final Cleanup, Evidence & Memory Closeout

Status: Geplant.
Phase: B, Qualitaets- und Struktur-Hardening.

### Was genau machen wir?

Wir schliessen die Anschluss-Roadmap dokumentarisch und organisatorisch sauber ab.

Arbeiten:

- README und relevante App-Doku aktualisieren:
  - OnField Coach.
  - 5er-IA.
  - aktuelle Beta-Gates.
  - PWA-first-Richtung.
- Alte Rugby Field Hub-/alte Tab-Formulierungen nur noch als historische Hinweise stehen lassen.
- `docs/field-hub/onfield_beta_readiness.md` ergaenzen:
  - welche Phase-A-Blocker geschlossen wurden.
  - welche Checks echte Freigabechecks sind.
  - welche Risiken bewusst spaeter bleiben.
- Finales Evidence-/Audit-Ergebnis dokumentieren:
  - Phase A bestanden oder blockiert.
  - Phase B bestanden oder offene Restpunkte.
  - klare naechste Empfehlung.
- Memory Closeout:
  - `docs/field-hub/onfield_current_state.md` aktualisieren.
  - `docs/field-hub/onfield_decision_log.md` nur bei neuen dauerhaften Entscheidungen ergaenzen.
  - `docs/field-hub/memory/gotchas.md` nur bei wiederholbaren Fallen ergaenzen.
- Pruefen, dass keine generated Runtime-Memory-Artefakte im Git sind.

### Wieso?

Nach dem Hardening muessen kuenftige KI-Sessions sofort erkennen, was wirklich fertig ist, welche Gates gelten und welche Risiken bewusst spaeter kommen. Ohne diesen Abschluss wuerde die Roadmap wieder unscharf.

### Wo?

- `app/field-hub/README.md`, falls vorhanden und relevant.
- `docs/field-hub/onfield_beta_readiness.md`
- `docs/field-hub/onfield_current_state.md`
- `docs/field-hub/onfield_decision_log.md`
- `docs/field-hub/memory/index.md`
- `docs/field-hub/memory/gotchas.md`
- ggf. neues Audit-/Evidence-Dokument unter `docs/field-hub/`.

### Kontext fuer Agenten

Keine neuen Produktentscheidungen erfinden. Nur dokumentieren, was in Phase A/B wirklich umgesetzt und verifiziert wurde.

Memory nicht mit normalen Arbeitsdetails aufblaehen.

### Deliverables

- Aktualisierte Doku.
- Aktualisierter Current State.
- ggf. Decision-Log- und Gotcha-Ergaenzungen.
- klares Abschlussurteil fuer externe Beta.

### Akzeptanzkriterien

- Memory ist aktuell, aber nicht aufgeblasen.
- Current State beschreibt den echten Stand.
- Beta-Doku sagt eindeutig, welche Checks vor externer Nutzung Pflicht sind.
- Keine generated Runtime-Memory-Artefakte sind im Git.
- Tests und relevante QA-Gates sind dokumentiert.

## Standard-Closeout Nach Jedem Sprint

Jeder Sprint-Agent muss am Ende:

1. `git status --short --untracked-files=all` pruefen.
2. passende Checks ausfuehren.
3. Memory Closeout nach Governance durchfuehren.
4. dokumentieren:
   - was umgesetzt wurde.
   - welche Dateien geaendert wurden.
   - welche Checks liefen.
   - welche Checks nicht liefen und warum.
   - ob vom Plan abgewichen wurde.
   - offene Punkte.
   - eigene Bewertung 1-10.
5. committen und pushen, wenn:
   - der Sprint erfolgreich abgeschlossen ist.
   - Checks passend gelaufen sind.
   - keine fremden/unklaren Aenderungen im Git-Status stehen.
   - und der Arbeitsauftrag fuer diese Session Commit/Push einschliesst.

Empfohlene Commit-Namen:

- `test(onfield): add hard beta qa gate`
- `chore(onfield-memory): harden runtime redaction`
- `chore(supabase): align beta auth guardrails`
- `refactor(onfield): route coach navigation by hash`
- `fix(onfield): harden responsive accessibility polish`
- `docs(onfield): close post-roadmap hardening`

## Abbruchkriterien

Ein Sprint darf nicht als fertig gemeldet werden, wenn:

- `qa:beta` ohne Credentials nur simuliert wurde.
- Runtime-Memory-Lint fehlschlaegt.
- Kiosk-E2E Remote-Mutation ohne Opt-in laufen wuerde.
- Supabase-Audit neue offene Signup-/RLS-/Secret-Risiken findet.
- iPhone oder iPad fachlich weniger kann als die andere Plattform.
- ein Check fehlschlaegt und der Fehler im Sprint-Scope liegt.
- neue medizinische Diagnose- oder Freigabe-Sprache sichtbar wird.
- echte Secrets oder sensible Daten in Git, Logs, Memory oder Doku landen.

## Testplan

Pflicht je nach Sprint-Scope:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run test:e2e:pwa`
- `npm run test:e2e:sprint19`
- `npm run qa:local`
- `npm run qa:beta` nur mit vollstaendiger Beta-Test-Env
- `python3 -m compileall .onfield-memory/scripts .onfield-memory/tests`
- alle `.onfield-memory/tests/test_*.py`
- `python3 .onfield-memory/scripts/setup_check.py --json`
- `python3 .onfield-memory/scripts/lint.py --json`
- statischer Supabase-Audit
- `git diff --check`

Manuelle oder browserbasierte Pflichtpruefung fuer UI-Sprints:

- iPhone small.
- iPhone large.
- medium viewport `600-839px`.
- iPad portrait.
- iPad landscape.
- Public Check-in invalid token.
- Public/Kiosk Happy Path mit Testdaten.
- Offline-Fallback.
- Login/Signed-in Flows.
- Sync/Backup Detailsheet.

## Empfohlene Sprint-Reihenfolge

Nicht springen, ausser es gibt einen klaren Grund.

1. Sprint 21: Harte Beta-QA-Gates.
2. Sprint 22: Runtime-Memory Privacy & Lint Fix.
3. Sprint 23: Supabase/Auth/RLS Beta Guardrails.
4. Sprint 24: Coach-Routing & Navigation Refactor.
5. Sprint 25: Designsystem, A11y & Responsive Hardening.
6. Sprint 26: Final Cleanup, Evidence & Memory Closeout.

## Definition of Done Fuer Diese Anschluss-Roadmap

Diese Anschluss-Roadmap ist erfolgreich umgesetzt, wenn:

- Phase A ist abgeschlossen und dokumentiert.
- OnField Coach darf nicht mehr als beta-ready gelten, wenn `qa:beta` nicht wirklich gruen ist.
- Runtime Memory Lint ist gruen.
- Supabase-Auth-Defaults passen zur kontrollierten Beta.
- Coach-Routen sind stabil, direkt erreichbar und back/forward-faehig.
- Compact, Medium und Expanded Viewports sind geprueft.
- Disabled States sind erklaerbar.
- alte sichtbare Copy-/RTP-/Freigabe-Reste sind bereinigt.
- Current State, Decision Log, Memory Index und Gotchas zeigen den echten Stand.
- Keine generated Runtime-Memory-Artefakte, Secrets oder sensiblen Daten sind im Git.
