# OnField Beta Readiness

Stand: 2026-07-07

## Zweck

Dieses Dokument definiert, wann OnField Coach kontrolliert an externe Coaches in einem breiteren Club-Kreis gegeben werden kann. Es ist ein operativer Beta-Readiness-Check, keine juristische Endfreigabe und keine Plattform-Roadmap.

OnField Coach bleibt PWA-first, OnField Rugby bleibt der erste Sport-Preset, und die App unterstuetzt Coaching-Entscheidungen ohne medizinische Diagnose- oder Freigabe-Sprache.

## Beta Operating Envelope

| Thema | Sprint-20-Entscheidung |
|---|---|
| Beta-Art | Kontrollierte externe Beta, nicht oeffentliche Registrierung. |
| Beta-Kreis | Maximal 10 externe Coach-Tester aus bis zu 3 Club-Kontexten. |
| Nutzerrolle | Coach oder coachnaher Staff. Keine Spieler-Accounts. |
| Sport | OnField Rugby als erster Preset. Keine zweite Sportart im Beta-Scope. |
| Geraete | iPhone und iPad muessen fachlich denselben Funktionsumfang behalten. |
| Zugang | Coach-Accounts werden kontrolliert bereitgestellt. Keine Self-Signup-Freigabe. |
| Daten | Nur Test- oder freigegebene Clubdaten; keine medizinischen Dokumente, IDs oder echten Secrets. |
| Feedback | Direkter Coach-Kanal mit strukturierter Triage. Kein neues Ticket-/Formularsystem in Sprint 20. |

Ein groesserer Rollout, oeffentliche Registrierung, Organisationen, Rollen, Billing, App-Store-Metadaten, Support-Prozesse und finale Datenschutztexte gehoeren in eine spaetere OnField Performance Plattform-Roadmap.

## Go/No-Go Checkliste

### Technisches QA-Gate

| Check | Go-Kriterium |
|---|---|
| Supabase/Auth/RLS Audit | `npm run supabase:audit` laeuft gruen und blockiert unsichere Auth-Defaults, unerwartete `anon`-Oberflaechen, fehlende RLS-Policies und `service_role`-Drift. |
| Lokaler Arbeitscheck | `npm run qa:local` laeuft ohne Beta-Credentials. |
| Beta-Freigabecheck | `npm run qa:beta` laeuft mit temporaeren Laufzeit-Credentials und `FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION=1`. |
| Keine stillen Skips | `qa:beta` blockiert, wenn Signed-in-, Public/Kiosk- oder Remote-Testpfade nicht wirklich geprueft wurden. |
| Remote-Mutation | Kiosk-E2E erzeugt nur temporaere Testdaten und raeumt sie wieder auf. |
| Prozess-Cleanup | Nach E2E bleiben keine haengenden Vite-/Preview-/Browser-Prozesse. |
| Secret-Hygiene | Keine Passwoerter, Tokens, `service_role` Keys oder privaten Keys in Code, Markdown, `.env`, Logs, Screenshots oder Memory. |

## Post-Roadmap-Hardening Abschluss

Sprint 21-26 schliessen die Post-Roadmap-Hardening-Roadmap als Beta-Vorbereitung ab. Phase A war beta-blockierend; externe Beta-Vorbereitung bleibt trotzdem erst erlaubt, wenn die echten Gate-Kommandos frisch erfolgreich gelaufen sind.

| Bereich | Abschlussstand | Beta-Bedeutung |
|---|---|---|
| Sprint 21 `qa:local` / `qa:beta` | Lokaler Arbeitscheck und hartes Beta-Gate sind getrennt. `qa:beta` darf fehlende Credentials, Remote-Opt-in oder Skips nicht als Erfolg werten. | Externe Beta braucht ein echtes `qa:beta`-Pass, keinen Dry Run. |
| Sprint 22 Runtime Memory | Runtime-Memory-Redaction, Setup, Compile und Lint sind als lokales Agenten-Gate nutzbar. Sprint 26 entfernt einen False Positive fuer generierte `sha256`-Integritaetsfelder, ohne Payload-Secret-Erkennung zu schwaechen. | Memory darf keine Secrets oder medizinische Freigabe-Sprache konservieren. |
| Sprint 23 Supabase/Auth/RLS | `npm run supabase:audit` ist Teil der Gates und prueft Beta-kritische Auth-/RLS-Drift statisch. | Kein `service_role`, keine unerwartete `anon`-Oberflaeche und keine Self-Signup-Drift im Client-Scope. |
| Sprint 24 Routing/PWA | Kanonische Coach-Routen, Back/Forward-Verhalten und Public/Kiosk-Trennung sind dokumentiert und getestet. | iPhone/iPad-Paritaet darf nicht an Navigation oder Deep Links scheitern. |
| Sprint 25 Designsystem/A11y/Responsive | Medium-Viewport, Touch Targets, maskable Icons und betroffene A11y-Zustaende wurden hardening-orientiert geprueft. | Feldnutzung bleibt PWA-first und darf nicht nur Desktop-fit sein. |
| Sprint 26 Evidence/Memory | README, Beta-Doku, LUVI-Audit und Memory-Closeout verweisen auf den aktuellen Stand und die Pflicht-Gates. | Kuenftige Agenten- und Beta-Sessions sehen den echten Abschlussstand statt alter Sprint-Zwischenstaende. |

### Echte Freigabechecks

| Check | Pflicht vor externer Beta? | Hinweis |
|---|---|---|
| `npm run qa:local` | ja | Arbeitscheck fuer Build, Tests, Supabase-Audit und lokale PWA-/Kiosk-Smokes. |
| `npm run qa:beta` | ja | Muss mit temporaeren Laufzeit-Credentials und `FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION=1` laufen. Ein Skip oder Blocker zaehlt nicht als Erfolg. |
| `npm run supabase:audit` | ja | Laeuft auch innerhalb der QA-Gates; ein separater Lauf macht Fehlerursachen sichtbarer. |
| Runtime-Memory Setup/Compile/Lint | ja fuer Agenten-Closeout | Stellt sicher, dass Memory-Artefakte redigiert, kompiliert und frei von blockierenden Lint-Fehlern sind. |
| Git-Artifact-Check | ja | Keine generierten Runtime-Memory-Artefakte oder Secrets duerfen getrackt werden. |

### Bewusst spaeter

| Risiko / Thema | Warum nicht Sprint 26? | Naechster Umgang |
|---|---|---|
| Remote-Supabase-Dashboard-Handcheck | Kann nicht vollstaendig aus dem Repo heraus bewiesen werden. | Vor externer Beta manuell gegen Dashboard-Einstellungen pruefen und Ergebnis ausserhalb sensibler Daten dokumentieren. |
| Juristische Datenschutz-Endfreigabe | Sprint 26 ist technischer und organisatorischer Closeout, keine Legal-Freigabe. | Vor breiterer Nutzung separat klaeren. |
| Support-/Incident-Prozess fuer groessere Beta | Kontrollierte Beta bleibt klein; kein neues Ticketsystem im Scope. | Erst nach echten Coach-Rueckmeldungen skalieren. |
| Native App, App Store, MDM, SaaS-Plattform | OnField bleibt PWA-first, bis Beta-Evidence eine andere Entscheidung begruendet. | Ueber `onfield_native_saas_decision_criteria.md` nach Beta auswerten. |
| Zweite Sportart | Rugby bleibt erster Preset; keine generische Sportarchitektur im Sprint 26 erweitern. | Spaeter nur evidence-basiert und nach OnField-Produktentscheidung. |

### Produkt und Scope

| Check | Go-Kriterium |
|---|---|
| OnField-Naming | UI, README und Doku sprechen von OnField Coach; Rugby bleibt Preset, nicht generische Architektur. |
| Hauptnavigation | `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr` sind auf iPhone und iPad erreichbar. |
| Einheit-Flow | Check-in, Training und Nachbereitung bleiben unter `Einheit` erreichbar. |
| Public/Kiosk | Public/Kiosk bleiben reduzierte Experiences ohne Coach-Admininhalte. |
| Keine Plattformfeatures | Keine Rollen, Organisationen, Billing, Player Portal, zweite Sportart oder native App im Sprint. |

### PWA, Geraete und Offline

| Check | Go-Kriterium |
|---|---|
| Install | OnField Coach kann auf iPhone und iPad zum Home-Bildschirm hinzugefuegt werden. |
| Viewports | iPhone klein/gross, iPad Portrait und iPad Landscape zeigen keine fachlichen Funktionsluecken. |
| Safe Areas | Bottom Navigation, Header und Form-Aktionen kollidieren nicht mit Home Indicator oder Tastatur. |
| Touch Targets | Primaere Aktionen und Navigation bleiben mit 44px/48px Mindestzielgroesse bedienbar. |
| Offline-App-Shell | Die App faellt nicht auf eine generische Browser-Offline-Seite zurueck. |
| Lokale Eingaben | Coach sieht, wenn Daten lokal gespeichert sind oder auf Sync warten. |
| Retry | Sync-Fehler bieten eine verstaendliche naechste Aktion. |
| Backup | JSON-Export bleibt vor laengeren Tests als Rueckfallweg sichtbar. |

### Datenschutz, Safety und Sprache

| Check | Go-Kriterium |
|---|---|
| Keine Secrets | Kein Passwort, `service_role`, DB-Passwort, PAT oder privater Key in Code, Markdown, Tests, `.env` oder Screenshots. |
| Keine medizinische Freigabe | Keine Begriffe wie `cleared`, `fit`, `Return-to-play freigegeben`, `medizinisch freigegeben` oder App-Diagnosen. |
| Verantwortungsgrenze | Safety-Texte bleiben Coaching-Hinweise und keine medizinischen Entscheidungen. |
| Datenminimierung | Keine medizinischen Dokumente, IDs, Arztbriefe oder privaten Details ohne Trainingsbezug. |
| Beta-Daten | Echte Beta-Teilnehmerdaten werden nicht in Repo-Doku oder Memory gespeichert. |
| Legal-Hinweis | Sprint 20 ist operative Beta-Readiness, keine finale juristische Datenschutzfreigabe. |

## Coach-Onboarding fuer externe Beta

Der erste Beta-Kontakt soll kurz und handlungsnah sein. Keine Marketing-Landingpage und keine langen Produkterklaerungen im Live-Flow.

### 1. Vor dem ersten Test

- Coach bekommt die PWA-URL und den Hinweis, OnField Coach auf iPhone oder iPad zum Home-Bildschirm hinzuzufuegen.
- Coach bekommt einen kontrollierten Account ueber einen sicheren Kanal.
- Coach bekommt die Beta-Grenze: Testbetrieb, keine medizinische Entscheidung, keine echten sensiblen Daten ohne Freigabe.
- Coach bekommt die Feedback-Struktur: Screen, Geraet, Schritte, erwartetes Ergebnis, tatsaechliches Ergebnis, Schweregrad.

### 2. Erster App-Durchlauf

| Bereich | Coach-Aufgabe |
|---|---|
| `Heute` | Tageslage lesen, naechste relevante Aktion oeffnen. |
| `Einheit / Check-in` | 2-3 Spieler testweise auf Da/Nicht da setzen und Tagesstatus pruefen. |
| `Einheit / Training` | Session-Block lesen, Training starten/fortsetzen und Spielerlimit pruefen. |
| `Einheit / Nachbereitung` | Offene Pflichtwerte als Queue verstehen und einen Testwert erfassen. |
| `Spieler` | Profil oeffnen, Status, Verlauf, Consent und aktuelle Limits pruefen. |
| `Analyse` | Eine Coach-Frage oeffnen und Rueckblick getrennt vom Live-Flow verstehen. |
| `Mehr / Bibliothek` | Heute-relevante Unterlagen finden. |
| `Mehr / Export & Backup` | JSON-Backup und Import-Vorschau als Sicherungsweg verstehen. |
| `Mehr / Einstellungen` | Sync-/Offline-/Install-Zustand pruefen. |
| `Mehr / Returner` | Reconditioning-Board als Utility pruefen, nicht als medizinische Entscheidung. |

### 3. Public/Kiosk

- Public/Kiosk separat testen, ohne Coach-Admininhalte.
- Ablauf: Spieler suchen, Angaben machen, Review pruefen, absenden, Abschlusszustand sehen.
- Kiosk soll nach Abschluss wieder sauber fuer naechsten Spieler bereitstehen.
- Public/Kiosk darf keine Coach-Notizen, Historie, Analyse oder Team-Admininhalte zeigen.

## Install-Anleitung fuer Beta-Coaches

### iPhone / iPad Safari

1. Deploy-URL in Safari oeffnen.
2. Teilen-Menue oeffnen.
3. `Zum Home-Bildschirm` waehlen.
4. Name `OnField Coach` bestaetigen.
5. App ueber das Home-Screen-Icon starten.
6. Login pruefen.
7. Offline-Test nur mit vorherigem Hinweis durchfuehren, damit lokale Speicherung und Sync bewusst beobachtet werden.

### Beta-Hinweise

- Die PWA ist der aktuelle Produktpfad. Native App, App Store und MDM werden erst nach Beta-Daten neu bewertet.
- Browser- und installierte PWA koennen sich im sichtbaren Chrome unterscheiden; fachlich muss derselbe Funktionsumfang verfuegbar bleiben.
- Vor laengeren Tests oder echten Clubdaten sollte ein JSON-Backup exportiert werden.

## Signed-in QA Matrix

| Bereich | iPhone klein | iPhone gross | iPad Portrait | iPad Landscape | Erwartung |
|---|---|---|---|---|---|
| `Heute` | pruefen | pruefen | pruefen | pruefen | Startscreen, Sync sichtbar, keine horizontale Ueberlaeufe. |
| `Einheit / Check-in` | pruefen | pruefen | pruefen | pruefen | Roster-first, Quick Actions, Detail-Sheet/Pane erreichbar. |
| `Einheit / Training` | pruefen | pruefen | pruefen | pruefen | Aktueller Block, Start/Fortsetzen, Spielerlimit, sekundaere Panels erreichbar. |
| `Einheit / Nachbereitung` | pruefen | pruefen | pruefen | pruefen | Queue-first, Pflichtwerte, Abschlussaufgabe, Details erreichbar. |
| `Spieler` | pruefen | pruefen | pruefen | pruefen | Liste zuerst, Profil als Sheet/Pane, Status und Verlauf sichtbar. |
| `Analyse` | pruefen | pruefen | pruefen | pruefen | Auswertung getrennt vom Live-Flow, keine Live-Quick-Actions. |
| `Mehr / Bibliothek` | pruefen | pruefen | pruefen | pruefen | Heute-relevant-Filter und Unterlagen erreichbar. |
| `Mehr / Export & Backup` | pruefen | pruefen | pruefen | pruefen | JSON, CSV und Import-Vorschau sichtbar; keine stillen Ueberschreibungen. |
| `Mehr / Einstellungen` | pruefen | pruefen | pruefen | pruefen | Sync, Offline, Install und App-Zustand coachnah erklaert. |
| `Mehr / Returner` | pruefen | pruefen | pruefen | pruefen | Reconditioning als Coach-/Handoff-Kontext, keine Freigabe-Sprache. |

## Feedback-Triage

Feedback wird im Sprint-20-Scope ueber einen direkten Coach-Kanal gesammelt. Keine echten Kontakte oder Teilnehmerlisten in Repo-Dateien speichern.

Jedes Feedback soll enthalten:

- Coach-Kontext: Rolle und Club-Kontext, ohne private Kontaktdaten im Repo.
- Geraet: iPhone/iPad, Browser oder Home-Screen-PWA.
- Screen: z. B. `Einheit / Training`.
- Schritte: was wurde gemacht?
- Erwartet: was sollte passieren?
- Tatsaechlich: was ist passiert?
- Schweregrad:
  - `Blocker`: verhindert Beta-Nutzung oder Datenvertrauen.
  - `High`: behindert Kernflow deutlich.
  - `Medium`: irritiert, aber Workaround moeglich.
  - `Low`: Copy, Polish, kleine UX-Unklarheit.
- Datenrisiko: ja/nein.
- Screenshot: nur ohne Passwoerter, Tokens, private Kontakte oder sensible Spielerdaten.

## QA-Account-Regel

Fuer optische signed-in QA duerfen bereitgestellte QA-Zugangsdaten nur temporaer zur Laufzeit genutzt werden.

Nicht erlaubt:

- Passwort in Markdown, Code, `.env`, Tests, Screenshots, Issues oder Memory speichern.
- Passwort in automatisierte Artefakte oder Repo-Doku uebernehmen.
- `service_role` oder DB-Passwoerter anfordern.
- Shell-Kommandos mit Klartext-Passwort in Doku oder dauerhafte Logs uebernehmen.

Nach Login-QA sollte das Passwort rotiert oder per Reset neu gesetzt werden, wenn es in einem Chat geteilt wurde.

## Sprint-21 LUVI-Audit-Uebernahme

LUVI wird fuer Beta-Readiness als QA-/Audit-Vorbild genutzt, nicht als Flutter-Codequelle.

| LUVI-Muster | OnField-Entscheidung | Begruendung |
|---|---|---|
| Definition of Done mit mehreren Gate-Schichten | uebernehmen | `qa:local` und `qa:beta` trennen Arbeitscheck und Freigabecheck. |
| Auth-/Consent-Audit-Matrix | anpassen | OnField prueft, ob signed-in und remote wirklich getestet wurden, ohne neue Auth-Features zu bauen. |
| Persistence-Audit mit Cleanup | uebernehmen | Kiosk-Remote-E2E muss temporaere Testdaten wieder entfernen. |
| Privacy-/Sanitize-Checks | uebernehmen | QA-Output darf keine Secrets oder personenbezogenen Werte preisgeben. |
| Flutter Widgets, Buttons, Routing, Native Storage | nicht uebernehmen | OnField bleibt React/Vite/PWA-first; Sprint 21 ist kein UI- oder Native-Sprint. |

## Sprint-23 Supabase-Guardrails

Sprint 23 uebernimmt LUVI nur als Audit-Denkmodell, nicht als Flutter- oder Native-Codequelle.

| Guardrail | OnField-Entscheidung | Begruendung |
|---|---|---|
| Auth-/Consent-Evidence-Matrix | anpassen | `npm run supabase:audit` gibt eine konkrete Checkliste mit Failures aus. |
| Supabase-Auth-Settings-Doku-Guard | uebernehmen | `supabase/config.toml`, Setup-Guide und Remote-Dashboard muessen dieselbe kontrollierte Beta-Absicht haben. |
| Negative RLS-/anon-Pruefung | uebernehmen | Unerwarteter `anon`-Zugriff blockiert das Beta-Gate; Public/Kiosk bleibt die einzige Ausnahme. |
| Redacted Secret-Scan-Prinzip | uebernehmen | `service_role`-Drift und Service-Role-Key-Referenzen duerfen nicht in Client-/Script-Code oder `.env.example` landen. |
| Signup/OAuth/Consent Edge Functions | nicht uebernehmen | Kontrollierte Coach-Accounts reichen fuer Sprint 23; keine neue Auth- oder Supabase-Komplexitaet. |

## Bekannte Beta-Risiken

| Risiko | Auswirkung | Beta-Gegenmassnahme |
|---|---|---|
| PWA-Verhalten unterscheidet sich je iOS/Safari-Version. | Install, Offline oder Cache koennen uneinheitlich wirken. | Geraet und Display-Modus in jedem Feedback erfassen. |
| Breiter Club-Kreis erzeugt Supportbedarf. | Feedback wird unscharf oder ueberlastet direkten Kanal. | Beta auf maximal 10 Coaches / 3 Club-Kontexte begrenzen. |
| Datenschutztexte sind noch nicht final juristisch freigegeben. | Externe Nutzung darf nicht als public launch verstanden werden. | Beta als kontrollierten Test deklarieren und keine sensiblen echten Daten verlangen. |
| Echte Clubdaten koennen versehentlich in Screenshots landen. | Datenschutz- und Vertrauensrisiko. | Screenshot-Regel kommunizieren; private Daten redigieren. |
| Offline/Pending Sync wird falsch interpretiert. | Coach verliert Vertrauen in Speicherung. | Beta-Onboarding erklaert lokal gespeichert, wartet auf Sync und Backup. |
| Native/SaaS-Wuensche kommen frueh. | Scope Creep vor echter PWA-Bewertung. | Entscheidungskriterien in separatem Dokument nutzen. |

## Beta Exit Criteria

Eine kontrollierte Beta gilt als auswertbar, wenn:

- mindestens 3 externe Coach-Tester einen vollstaendigen Trainingstag-Flow bewertet haben.
- iPhone und iPad je mindestens einmal im signed-in Zustand geprueft wurden.
- Public/Kiosk mindestens einmal separat geprueft wurde.
- mindestens ein Offline-/Pending-/Retry-Szenario beobachtet oder bewusst als nicht geprueft dokumentiert wurde.
- keine Blocker fuer Check-in, Training, Nachbereitung, Spielerprofil, Backup oder Sync-Vertrauen offen sind.
- Safety-/Datenschutz-Copy keine Diagnose- oder Freigabe-Sprache enthaelt.

## Nicht Teil von Sprint 20

- Keine Native App, kein Flutter-Port, keine React-Native-Entscheidung.
- Keine Rollen, Organisationen, Multi-Tenant-Struktur oder Billing.
- Keine Player Accounts, Player Portal, Leaderboards, Feeds oder Challenges.
- Keine zweite Sportart und kein Runtime-Sportartenwechsel.
- Keine Supabase-Migration, keine Edge Functions, kein Realtime.
- Keine finalen Datenschutztexte oder App-Store-Metadaten.
- Keine generierten Marketingbilder oder neue Figma-Produktion.
