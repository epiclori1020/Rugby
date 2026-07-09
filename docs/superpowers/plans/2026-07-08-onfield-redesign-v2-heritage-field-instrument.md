# OnField Redesign v2 - Heritage Field Instrument Roadmap

Status: Planungsdokument, 2026-07-08
Produkt: OnField Coach, technisch `app/field-hub`
Primaere Quellen: `docs/field-hub/onfield_redesign_spec_v2.md` und `docs/field-hub/2026-07-08_onfield_design_audit_live.md`
Ziel: Den entschiedenen Redesign-Zyklus Route A "Execute + Elevate Field Graphite" in unabhaengig mergebare Sprints schneiden, damit OnField Coach sichtbar aus dem MVP-/AI-Slop-Eindruck herauskommt, ohne die ruhige operations-first Markenrichtung zu brechen.

> Fuer kuenftige KI-Agenten: Dies ist eine neue Redesign-v2-Serie nach Abschluss der Sprints 0A-26. Vor Umsetzung eines Sprints zuerst `AGENTS.md`, `docs/field-hub/memory/index.md`, `docs/field-hub/onfield_current_state.md`, `docs/field-hub/onfield_decision_log.md`, `.agents/skills/onfield-roadmap-execution/SKILL.md` und je nach Sprint die relevanten Design-/Screen-/PWA-Skills laden. Nicht mehrere spaetere Sprints nebenbei umsetzen. Kein Route-B-/Neon-Bruch ohne neue Nutzer-Ratifizierung und Decision-Log-Eintrag.

## Ziel Der Roadmap

Diese Roadmap baut nicht "noch ein MVP-Schoenheitsupdate", sondern setzt die eigene Redesign-Spec endlich sichtbar um: typografisches Fundament, Gewicht-Disziplin, tabellarische Scoreboard-Zahlen, row-first Kaderarbeit, genau eine Primaerhandlung pro View, Dark "Field Mode" und robuste Sicherheits-/Datenschutz-Korrekturen. Die Umsetzung bleibt PWA-first, iPhone/iPad-paritaetisch, operations-first und ohne medizinische Freigabesprache.

## Sequenzierungs-Begruendung

Die Reihenfolge folgt der Build-Reihenfolge aus `onfield_redesign_spec_v2.md` §7: erst Tokens v2 und Typo-/Weight-Refactor, weil alle Screens sonst wieder Rohwerte und alte Gewichtsmuster kopieren. Danach kommen die P0-Blocker frueh, mit Kiosk-Sicherheit als eigenem Sprint, damit Datenschutz nicht an grosse Screen-Umbauten gekoppelt ist. Erst dann wird "Squad heute" als erster sichtbarer row-first Leit-Screen gebaut. Danach folgt der Einheit-Cockpit-Loop, weil Returner, Check-in, Training und Nachbereitung fachlich zusammengehoeren. Branding/Logo/Display-Font bleibt ein eigener Sprint, damit Live-Screens ruhig bleiben und Brand-Surfaces bewusst gestaltet werden.

## Abhaengigkeits-Ueberblick

1. R1A Tokens v2 & Field-Mode Token-Fundament
2. R1B Theme-Persistenz & Field-Mode Toggle
3. R2 Typo-/Weight-/Numeric-Refactor
4. R3 P0 Kiosk-Schloss
5. R4 P0 Trust, Save-Feedback & Roh-Copy
6. R5 "Squad heute" Leit-Screen
7. R6 Einheit-Cockpit & Returner im Loop
8. R7A-R7D Row-first Kernflows
9. R8 Responsive, Field-Mode-QA & Analyse/Mehr
10. R9 Brand-Surfaces, Wortmarke & Display-Font-Test
11. R10 Politur, P2-Backlog & Launch-Evidence

Erster mergebarer Slice: R1A ist der technische Token-Fundament-Slice und darf ohne Screen-Rewrite gemerged werden. R1B macht Field Mode bedien- und persistierbar, ohne R1A aufzublaehen. Erster sichtbarer Redesign-Wert fuer Coaches: R5 "Squad heute", bewusst erst nach R1A/R2 und den fruehen P0-Sicherheits-Slices. Branding beginnt nicht erst in R9: R1A/R1B/R2 schaffen Typo, Zahlen und Field Mode, R5 fuehrt Scoreboard/Dot-Signature sichtbar ein, R9 finalisiert Brand-Surfaces, Wortmarke und Display-Font.

## Grober Umfang Und Kalenderblick

- Gesamtumfang: ca. 14 mergebare Slices: R1A, R1B, R2, R3, R4, R5, R6, R7A, R7B, R7C, R7D, R8, R9, R10.
- Arbeitslogik: Fundament zuerst (R1A-R2), dann P0-Sicherheit/Trust (R3-R4), dann erster sichtbarer Proof (R5), dann Einheit/Kernflows (R6-R7D), danach Responsive/Brand/Finish (R8-R10).
- Grobe Kalenderwellen: Welle 1 = R1A-R4; Welle 2 = R5-R7D; Welle 3 = R8-R10. Das ist bewusst kein Wochenversprechen, weil Agentenanzahl, Review-Tiefe, Testlaufzeit und Figma-/Bildfreigaben den Kalender bestimmen.
- Prioritaet bei knapper Kapazitaet: Fundament + P0 zuerst, dann die sichtbarsten Coach-Flows. P2 bleibt bis R10 geparkt, ausser ein P2-Punkt blockiert ein P0/P1-Ziel.
- Qualitaetsregel: Jeder Slice braucht `qa:local`; jeder sichtbar-redesignende Slice braucht zusaetzlich Redesign Integrity Gate, Figma-/Screenshot-Referenz und begruendete Vorher/Nachher-Evidence.

## Globale Guardrails Fuer Alle Sprints

- Route A "Heritage Field Instrument" bleibt verbindlich: Field Graphite, ruhig, hochwertig, kein Neon, keine Route-B-Sprache.
- OnField / OnField Coach / OnField Rugby / OnField Performance konsistent verwenden.
- 5 Hauptbereiche bleiben: `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr`.
- `Check-in`, `Training`, `Nachbereitung` gehoeren unter `Einheit`.
- iPhone und iPad behalten fachlich denselben Funktionsumfang; Unterschiede nur Layout, Dichte, Navigation, Sheets/Panes.
- PWA-first bleibt; kein Flutter/RN-/Native-Rewrite, keine Multi-Tenant-SaaS-, Player-Account- oder Leaderboard-Arbeit.
- Keine medizinische Diagnose- oder Return-to-Play-Freigabesprache.
- Live-Coaching-Screens bleiben operativ: keine Hero-Flaechen, kein Oxblood als Status, keine dekorative Feldtapete.
- Jede View hat genau eine dominante Primaerhandlung oberhalb der Falz.
- Row-first fuer Athleten-/Kaderarbeit; keine neuen Card-Walls.
- Typografie: Tokens nutzen, Body 400/500, max. 3 sichtbare Gewichte pro Screen, keine neuen 850/900-Deklarationen.
- Zahlen fuer Scores/Load/Reps/Caps/Tabellen nutzen tabular numerals und `of-num`.
- Status = Farbe + Text + Glyph/Form; nie color-only.
- Jede Speicher-/Aktion quittiert: Haptik plus inline "gespeichert" oder klarer Fehler-/Offline-Zustand.
- QA-Groessen: iPhone SE 375, iPhone 15 393, iPad hoch 834, iPad quer 1194.
- Standard-Gate: `npm run qa:local` in `app/field-hub`; bei Auth/Kiosk/Public/RLS zusaetzlich `npm run qa:beta` bzw. `npm run supabase:audit`.

## Redesign Integrity Gate - Kein Kosmetik-Merge

Dieses Gate gilt fuer jeden Sprint, der sichtbare UI, UX, Branding, Layout, Copy oder Interaction aendert. Ein PR darf nicht als Redesign-Sprint akzeptiert werden, wenn er nur Farben, Abstaende oder einzelne CSS-Werte leicht anpasst, obwohl der Sprint eine strukturelle UX-/UI-Aenderung verlangt.

Pflicht-Evidence je sichtbarem Sprint:
- Vorher/Nachher-Screenshots fuer alle betroffenen Hauptzustande in 375, 393, 834 und 1194 px, jeweils Light und - sobald R1B verfuegbar ist - Field Mode.
- Kurzer UX-Intent-Abschnitt: Welche Coach-Frage loest der Screen jetzt schneller? Welche Primaerhandlung fuehrt die View?
- Pattern-Audit: Card-Walls entfernt oder begruendet, genau eine dominante Primaeraktion, row-first fuer Athletenobjekte, Status nicht color-only.
- Typo-/Token-Audit: keine neuen rohen `font-size`, keine neuen rohen Farben, keine neuen 850/900-Gewichte, Zahlen mit `of-num`/tabular numerals.
- Copy-/Trust-Audit: keine Dev-Copy, kein Denglisch in bearbeiteten UI-Flaechen, Save-/Action-Feedback sichtbar, keine medizinische Freigabe-Sprache.
- Dark-/Field-Mode-Audit: Kontrast mindestens 4.5:1; Primaercontrols Ziel 7:1 oder Abweichung dokumentiert.
- Regression-Gate: `qa:local` frisch; bei Kiosk/Public/Auth/RLS `qa:beta`/`supabase:audit` wie oben.

Nicht akzeptabel:
- "Design verbessert" ohne Screenshots und Pattern-Audit.
- Neue Card-Walls oder mehrere gleich starke CTAs.
- Reine Token-/CSS-Aenderung in einem Screen-Sprint ohne UX-Struktur-Aenderung.
- Field Mode nur technisch vorhanden, aber nicht visuell geprueft.
- Brand-Arbeit, die Oxblood in Live-/Status-Screens drueckt oder Marketing-Heroes in Coach-Flows baut.

## Design-Reference-Workflow: Figma, Figma Make Und Bild-KI

Fuer dieses Redesign gilt: **Figma ist die primaere visuelle Referenz- und Review-Quelle.** Codex darf und soll Figma fuer Screen-Frames, Komponenten, Token-Boards, Prototyp-Flows und Design-to-Code-Kontext nutzen. Figma-Designs sind aber keine blinde Codequelle: Implementierung bleibt React/Vite/TypeScript mit OnField-Tokens und bestehenden Komponenten.

Verbindliche Nutzung:
- Vor R5 muss ein Figma Redesign Reference Pack existieren oder bewusst als blockiert dokumentiert sein: Tokens Light/Dark, Type Scale, Scoreboard Strip, Readiness-Dot, Athlete Row, Status Chips, Primary/Secondary/Overflow Actions.
- Fuer R5-R9 sollen Figma Frames fuer die betroffenen Screens/States entstehen: mindestens 375, 393, 834 und 1194 px; Light und - sobald R1B verfuegbar ist - Field Mode.
- Codex nutzt Figma `get_design_context` fuer Design-to-Code, sobald ein node-spezifischer Figma-Link vorliegt. Das Ergebnis ist Referenz, nicht finaler Code.
- Codex darf `use_figma` nutzen, um Screens/Frames/Komponenten in Figma aufzubauen oder zu aktualisieren. Dabei bestehende OnField-Tokens/Komponenten wiederverwenden statt primitives Hardcoding.
- Codex darf `generate_figma_design` nutzen, um laufende App-Screens als pixelnahe Referenz nach Figma zu capturen. Diese Captures dienen als Vergleichs- und Audit-Layer; das kanonische Design bleibt der bewusst gebaute Figma-Frame.
- Figma Make darf fuer schnelle Explorationsvarianten genutzt werden, wenn ein `/make/`-Link geliefert wird. Figma-Make-Ausgaben sind Inspirations-/Prototypenmaterial und muessen vor Implementierung in ein sauberes Figma-Designfile bzw. in klare Roadmap-Scope-Entscheidungen ueberfuehrt werden.

Bild-KI-Regel:
- Codex hat eine eingebaute `image_gen`-Faehigkeit fuer Rasterbilder und darf sie fuer Brand-Moodboards, Splash-/Install-Assets, Kiosk-Welcome-Stimmung, externe Landing-/Marketing-Visuals und ggf. Produktkompositionen nutzen.
- Ein dediziertes Nano-Banana-Plugin ist in der aktuellen Codex-Umgebung nicht als geladenes oder installierbares Plugin verfuegbar. Wenn externe Nano-Banana/Gemini-Image-Outputs entstehen, koennen sie als Referenzbilder oder Assets in Figma/importierte Dateien genutzt werden, aber sie sind nicht die operative UI-Quelle.
- Bild-KI wird **nicht** fuer operative Live-Screen-Struktur verwendet: `Heute`, `Einheit`, Check-in, Training, Nachbereitung, Spieler und Analyse werden als Figma-/Code-Komponenten mit Tokens, Auto-Layout, States und Responsiveness gebaut.
- Projektgebundene Bild-KI-Assets muessen in `app/field-hub` oder unter einem dokumentierten Asset-Pfad gespeichert und in Figma/Code referenziert werden. Keine Produktionsreferenz darf nur in einem lokalen Generator-Output liegen.

## Phase 1 - Fundament

### R1A - Tokens v2 & Field-Mode Token-Fundament

Status: Abgeschlossen am 2026-07-09.

Ziel: Die technische Token-Wahrheit auf Redesign v2 heben, bevor Screen-Code neue visuelle Entscheidungen kopiert, ohne Theme-Persistenz und Toggle-UI in denselben Slice zu ziehen.

Scope drin:
- `--of-color-on-brand` ergaenzen.
- Typografie-Tokens aus `onfield_redesign_spec_v2.md` §2.1-2.3 ergaenzen.
- Dark "Field Mode"-Farb-Overrides unter `@media (prefers-color-scheme: dark)` und `:root[data-theme="dark"]` anlegen.
- `:root[data-theme="light"]` und `color-scheme: light dark` als reine CSS-/Token-Schicht sauber abbilden.
- Token-Tests erweitern, damit die neuen Pflicht-Tokens nicht wieder verschwinden.
- Figma Token/Type Board vorbereiten oder bestehendes Board aktualisieren, falls ein Figma-File verfuegbar ist.

Bewusst nicht drin:
- Kein grossflaechiger Screen-Umbau.
- Keine Theme-Persistenz, keine System-/Light-/Dark-Auswahllogik, keine Toggle-UI. Das ist R1B.
- Kein finales Logo, keine finale Display-Font-Lizenzierung.
- Kein Route-B-/Neon-Experiment.

Deliverables und Dateien:
- Modify: `app/field-hub/src/design/tokens.css`
- Modify: `app/field-hub/src/design/tokens.test.ts`
- Modify: `app/field-hub/src/index.css`
- Create/Modify bei Bedarf: Figma Redesign Reference Pack mit Token-/Type-Frames.

Abhaengigkeiten:
- Keine.

Definition of Done:
- [x] Alle Token-Werte aus Spec §1 und §2 sind in `tokens.css` oder bewusst in Tests dokumentiert.
- [x] Light- und Dark-/Field-Tokenebenen sind technisch getrennt und per `data-theme` adressierbar.
- [x] Primaerbutton-Kontrast in Dark erreicht mindestens 4.5:1; Zielwert 7:1 ist dokumentiert oder erreicht.
- [x] Keine neuen Rohfarben ausserhalb von `--of-color-*`.
- [x] Keine neuen Roh-Font-Sizes fuer Redesign-Rollen ausserhalb der Typo-Tokens.
- [x] iPhone/iPad-Paritaet bleibt unveraendert.
- [x] Live-Screens erhalten kein Oxblood und keine Hero-Flaechen.
- [x] Figma Reference Pack ist aktualisiert oder als blockiert dokumentiert, bevor R5 startet.

Aufwand/Risiko/QA:
- Aufwand: M.
- Risiko: M, weil Token-Aenderungen globale UI betreffen.
- QA-Gate: `npm run qa:local`; zusaetzlich visuelle Smoke-Pruefung Light/Dark in den vier QA-Groessen.

Rollback-/Sicherheitshinweis:
- Rollback ist token-zentriert: `tokens.css` und Tests zuruecknehmen. Keine Datenmigration.

Impact:
- H, weil alle spaeteren Screen-Sprints darauf aufsetzen.

### R1B - Theme-Persistenz & Field-Mode Toggle

Ziel: Field Mode bewusst steuerbar machen, ohne Token-Arbeit, Screen-Redesign und Settings-Politur zu vermischen.

Scope drin:
- Theme-Preference `system | light | dark` persistieren.
- `data-theme` stabil auf `document.documentElement` setzen.
- System Preference sauber respektieren, solange keine manuelle Auswahl gesetzt ist.
- Minimaler, field-tauglicher Toggle oder Segmented Control an einem bestehenden sinnvollen Ort, primaer Settings; optional zusaetzlich Coach-Header-Quick-Access, wenn die bestehende Shell das ohne Umbau traegt.
- Accessible Labels, sichtbarer Fokus und Touch-Ziele fuer iPhone/iPad.
- Unit-Tests fuer Persistenz, Default, System-Fallback und manuelle Overrides.

Bewusst nicht drin:
- Keine neuen Tokenwerte. Die gehoeren R1A.
- Keine Full-Screen Dark-/Field-Mode-QA. Die gehoert R8.
- Keine Brand-Surfaces, Splash, Install oder Landing. Die gehoeren R9.
- Kein Settings-Redesign als eigener grosser Screen-Umbau, ausser minimale Anpassungen sind fuer den Toggle noetig.

Deliverables und Dateien:
- Modify: `app/field-hub/src/main.tsx`
- Create/Modify: `app/field-hub/src/lib/themePreference.ts`
- Create/Modify: `app/field-hub/src/lib/themePreference.test.ts`
- Modify: `app/field-hub/src/components/SettingsView.tsx`
- Modify: `app/field-hub/src/components/SettingsView.test.tsx` oder naechstliegende Settings-/Shell-Tests.
- Optional Modify: `app/field-hub/src/components/AppShell.tsx` nur wenn Quick-Access dort bereits gut passt.

Abhaengigkeiten:
- R1A.
- R1B kann parallel zu R2 laufen, muss aber vor R8/R9 abgeschlossen sein.

Definition of Done:
- [x] System, Light und Dark/Field koennen technisch unterschieden werden.
- [x] Manuelle Auswahl ueberschreibt `prefers-color-scheme` und bleibt nach Reload erhalten.
- [x] Default bleibt `system`, damit bestehende Nutzer nicht ueberraschend umgestellt werden.
- [x] Toggle/Control ist keyboard- und screenreader-bedienbar.
- [x] Keine Layoutverschiebung in Settings oder Shell auf iPhone/iPad.

Aufwand/Risiko/QA:
- Aufwand: S/M.
- Risiko: M, weil Persistenz und OS Preference sauber zusammenspielen muessen.
- QA-Gate: `npm run qa:local`; zusaetzlich Theme-Preference-Unit-Tests und visuelle Smoke-Pruefung Light/Dark in den vier QA-Groessen.

Rollback-/Sicherheitshinweis:
- Rueckbau: Theme-Bootstrap und Preference-Layer entfernen, CSS `data-theme` wieder statisch/default nutzen.
- Risiko: Persistenz driftet zwischen OS Preference und manueller Auswahl. Absicherung durch Tests fuer alle drei Modi.

Impact:
- M/H, weil Field Mode dadurch nicht nur technisch existiert, sondern fuer Coaches kontrollierbar wird.

### R2 - Typo-/Weight-/Numeric-Refactor

Status: Abgeschlossen am 2026-07-09.

Ziel: Den Execution-Drift bei Typografie beheben: hart kodierte Groessen und 800/900-Gewichtswand auf Tokens und klare Hierarchie zurueckfuehren.

Scope drin:
- `index.css` und `onfield-ui.css` auf Typo-Tokens mappen.
- Utility `of-num` fuer tabellarische Zahlen einfuehren.
- Bestehende 850/900-/ueberfette Deklarationen auf Token-Gewichte normalisieren.
- Core-Komponenten auf Body 400/500, Labels 600, Titel 700/800 bringen.
- CSS-/Test-Guardrails gegen neue `font-weight: 900` und rohe Redesign-Font-Sizes vorbereiten.

Bewusst nicht drin:
- Keine inhaltliche Neuordnung von `Heute`, `Einheit` oder `Spieler`.
- Kein umfassender Copy-Sweep; nur CSS-/Komponenten-Hierarchie.

Deliverables und Dateien:
- Modify: `app/field-hub/src/index.css`
- Modify: `app/field-hub/src/components/ui/onfield-ui.css`
- Modify: `app/field-hub/src/components/ui/Button.tsx`
- Modify: `app/field-hub/src/components/ui/Status.tsx`
- Modify: `app/field-hub/src/components/ui/States.tsx`
- Modify: `app/field-hub/src/components/onfield/Rows.tsx`
- Modify: `app/field-hub/src/components/onfield/SessionHeader.tsx`
- Modify: `app/field-hub/src/components/onfield/OnFieldComponents.test.tsx`
- Modify: `app/field-hub/src/accessibilityCss.test.ts`

Umsetzungshinweis:
- Tatsaechlich geaendert wurden die screen-weiten CSS-Dateien, `Scales.tsx`, `SessionHeader.tsx` und die relevanten Token-/Komponententests. `Button.tsx`, `Status.tsx`, `States.tsx`, `Rows.tsx` und `accessibilityCss.test.ts` brauchten keine Codeaenderung, weil dort keine R2-relevanten rohen Fontgroessen/-gewichte gefunden wurden.

Abhaengigkeiten:
- R1A. R1B kann parallel laufen, solange R2 keine Toggle-UI voraussetzt.

Definition of Done:
- [x] Geaenderte Komponenten nutzen Typo-/Weight-Tokens statt roher `font-size`.
- [x] Keine neuen 850/900-Deklarationen.
- [x] Sichtbare Screens bleiben bei max. 3 Textgewichten.
- [x] `of-num` ist fuer KPI-/Score-/Tabellenzahlen verfuegbar.
- [x] Body-Text ist 400/500, Labels 600, Hauptzahlen/Titel 700/800.
- [x] Status-Chips behalten Text plus Farbe/Glyph.
- [x] iPhone/iPad-Layouts verlieren keine Funktion.

Aufwand/Risiko/QA:
- Aufwand: L.
- Risiko: M, weil viele Styles betroffen sind und visuelle Regressionen moeglich sind.
- QA-Gate: `npm run qa:local`; zusaetzlich CSS-Scan fuer `font-size:` und `font-weight: 900|850`.

Rollback-/Sicherheitshinweis:
- Rollback ueber CSS-/Core-Komponenten-Diff; keine Auth-, Sync- oder Datenpfade betroffen.

Impact:
- H, weil der MVP-Eindruck wesentlich aus fehlender Hierarchie entsteht.

## Phase 2 - P0-Sicherheit Und Vertrauen

### R3 - P0 Kiosk-Schloss

Ziel: Den Kiosk-/Public-Check-in vor unbefugtem Ausstieg in die Coach-App schuetzen.

Scope drin:
- Coach-geschuetzter Exit aus Kiosk statt `window.confirm`.
- Lock nicht an `authState` koppeln.
- Hold-to-exit plus Coach-PIN-/Unlock-Mechanik planen und implementieren.
- Kiosk-Auto-Reset und reduzierten Nav-Strip pruefen.
- Kiosk-Datenschutz-Copy schaerfen: Self-Check-in bleibt reduziert, keine Coach-Notizen/Historie/Analyse.

Bewusst nicht drin:
- Keine neuen Player-Accounts.
- Keine Supabase-RLS-Migration, sofern das Lock lokal geloest werden kann.
- Kein Kiosk-Design-Overhaul ueber die Sicherheitsanforderung hinaus.

Deliverables und Dateien:
- Modify: `app/field-hub/src/components/KioskCheckInView.tsx`
- Modify: `app/field-hub/src/components/KioskCheckInView.test.tsx`
- Modify: `app/field-hub/src/App.tsx`
- Modify: `app/field-hub/src/App.publicRouting.test.tsx`
- Modify: `app/field-hub/src/components/SelfCheckInFlow.tsx`
- Modify: `app/field-hub/src/components/SelfCheckInFlow.test.tsx`
- Create/Modify bei Bedarf: `app/field-hub/src/lib/kioskLock.ts`
- Create/Modify bei Bedarf: `app/field-hub/src/lib/kioskLock.test.ts`

Abhaengigkeiten:
- R1A empfohlen, R2 empfohlen. R1B ist fuer R3 nicht blockierend. R3 darf parallel zu R2 vorbereitet werden, muss aber separat gemerged werden.

Definition of Done:
- [x] Kiosk-Exit ist nicht mehr per einfachem Browser-Confirm erreichbar.
- [x] Ein Athlet kann aus dem Kiosk nicht in Coach-Daten, Export, Analyse oder Einstellungen springen.
- [x] Lock funktioniert unabhaengig vom aktuellen `authState`.
- [x] Kiosk-Flow hat Auto-Reset und klare Datenschutz-Copy.
- [x] Touch-Ziele mindestens 44 px, feldkritische Controls 48 px.
- [x] iPhone/iPad-Paritaet bleibt: Kiosk ist auf beiden Geraeten nutzbar.
- [x] Keine medizinische Freigabesprache.
- [ ] `qa:beta` deckt Kiosk/Public-Pfade echt ab, nicht als Skip.

Statusnotiz 2026-07-09:
- R3-Code, lokale QA und PWA-/Responsive-Smokes sind umgesetzt.
- `qa:beta` bleibt bewusst offen, weil Laufzeit-Credentials und `FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION=1` in der aktuellen Umgebung fehlen. Dieser Skip gilt nicht als Beta-Freigabe.

Aufwand/Risiko/QA:
- Aufwand: M.
- Risiko: H, weil Datenschutz/Sicherheit und Public/Kiosk betroffen sind.
- QA-Gate: `npm run qa:local`, `npm run qa:beta`, `npm run test:e2e:kiosk`.

Rollback-/Sicherheitshinweis:
- Sicherheitsrollback darf nicht auf den alten offenen Confirm zurueckfallen. Falls PIN/Lock Probleme macht, Kiosk-Exit auf "Coach-Modus deaktiviert" fail-closed setzen und Public-Check-in weiter separat verfuegbar lassen.

Offene Frage:
- Finales PIN-Modell vor Umsetzung bestaetigen: lokaler Geraete-PIN, Session-PIN oder anderer Coach-Unlock. Bis zur Bestaetigung keinen Remote-Secret- oder Player-Account-Mechanismus planen.

Impact:
- H, launch-relevant.

### R4 - P0 Trust, Save-Feedback & Roh-Copy

Ziel: Jede Speicherung und jede kritische Fehlersituation fuer Coaches verstaendlich machen, ohne technische Rohbegriffe oder stille Autosaves.

Scope drin:
- Einheitliches Action-/Save-Feedback: Haptik plus inline "gespeichert", "wartet auf Sync", "offline lokal gespeichert" oder Fehler.
- Feedback-Muster aus `PlayersView` auf Training, Nachbereitung und Returner uebertragen.
- Auth-/Public-/Supabase-Fehler in coachnahe Sprache mappen.
- Hartkodierten Namen "Arwin" aus Public-Fehlern entfernen.
- Kritische Denglisch-/Dev-Copy aus Auth, Public, Kiosk und Hauptflows entfernen.
- Umlaute und deutsche UI-Vokabeln fuer bearbeitete Dateien normalisieren.

Bewusst nicht drin:
- Kein kompletter Content-/Library-Sweep ueber alle Trainingsunterlagen.
- Keine neue Auth-Strategie.
- Kein Analytics-/Observability-System.

Deliverables und Dateien:
- Modify: `app/field-hub/src/lib/interactionFeedback.ts`
- Create/Modify bei Bedarf: `app/field-hub/src/hooks/useActionFeedback.ts`
- Create/Modify bei Bedarf: `app/field-hub/src/components/ui/ActionFeedback.tsx`
- Modify: `app/field-hub/src/components/TrainingView.tsx`
- Modify: `app/field-hub/src/components/PostSessionView.tsx`
- Modify: `app/field-hub/src/components/ReturnerView.tsx`
- Modify: `app/field-hub/src/components/AuthPanel.tsx`
- Modify: `app/field-hub/src/lib/auth.ts`
- Modify: `app/field-hub/src/lib/publicCheckInErrors.ts`
- Modify: `app/field-hub/src/components/PublicCheckInView.tsx`
- Modify: zugehoerige Tests: `TrainingView.sessionBlocks.test.tsx`, `PostSessionView.test.tsx`, `AuthPanel.test.tsx`, `PublicCheckInView.test.tsx`, `interactionFeedback.test.ts`

Abhaengigkeiten:
- R1A, R2 empfohlen. R1B ist fuer R4 nicht blockierend. R3 unabhaengig, aber beide sind P0.

Definition of Done:
- [x] OnBlur-/Quick-Actions in Training, Nachbereitung und Returner quittieren Speicherung sichtbar.
- [x] Feedback ist mit `aria-live` erreichbar und funktioniert offline/pending-sync.
- [x] Haptik nutzt `triggerHapticFeedback` ohne harte Browser-Abhaengigkeit.
- [x] Keine sichtbare Copy mit `VITE_SUPABASE_URL`, `.env`, rohen Supabase-Fehlern oder hartkodiertem Personennamen.
- [x] Geaenderte UI-Copy ist deutsch, coachnah und ohne Diagnose-/Freigabesprache.
- [x] Status bleibt Farbe + Text + Glyph/Form.
- [x] Genau eine dominante Primaeraktion pro betroffener View bleibt erhalten.

Aufwand/Risiko/QA:
- Aufwand: L.
- Risiko: H, weil Speichervertrauen, Auth und Public-Fehler betroffen sind.
- QA-Gate: `npm run qa:local`; bei Auth/Public-Aenderungen `npm run qa:beta` und `npm run supabase:audit`.

Rollback-/Sicherheitshinweis:
- Feedback-Komponente kann isoliert zurueckgerollt werden. Auth/Public-Error-Mapping nicht auf rohe Fehlermeldungen zurueckrollen; im Zweifel generische sichere Fehlermeldung anzeigen.

Impact:
- H, weil stilles Speichern und Dev-Copy den MVP-Eindruck direkt erzeugen.

## Phase 3 - Leit-Screen Und Erste Sichtbare Wertlieferung

### R5 - "Squad heute" Leit-Screen

Ziel: `Heute` als ersten sichtbaren Redesign-Screen nach Spec §5 bauen: row-first, Scoreboard, eine Primaeraktion, klare Warnprioritaet.

Scope drin:
- `TodayDashboard.tsx` vom Panel-Turm zum Screen "Squad heute" umbauen.
- Header mit Wortmarke "OnField." bzw. Dot-Signature nach aktueller Wortmarken-Entscheidung, Kontext-Eyebrow und Sync-Chip.
- Scoreboard-Strip: Kader, Anwesend, Gelb, Rot, Returner.
- Eine dominante Primaeraktion: Check-in oeffnen.
- "Aufpassen zuerst" als severity-sortierte Athletenliste.
- Sekundaerer Kontext in Accordion statt First-Viewport-Panelwand.
- Empty-State fuer First-Run ohne leere 0-Kachelwand.
- Figma Frames fuer `Squad heute` in 375/393/834/1194 als Design-Referenz nutzen oder erstellen.

Bewusst nicht drin:
- Kein vollstaendiger Einheit-Cockpit-Umbau.
- Keine Analysecharts in `Heute`.
- Keine Brand-Hero-Flaeche in Live-Coaching.

Deliverables und Dateien:
- Modify: `app/field-hub/src/components/TodayDashboard.tsx`
- Modify: `app/field-hub/src/components/TodayDashboard.test.tsx`
- Modify: `app/field-hub/src/components/CoachInsightsPanel.tsx`
- Modify: `app/field-hub/src/components/onfield/Rows.tsx`
- Create/Modify bei Bedarf: `app/field-hub/src/components/onfield/ReadinessDot.tsx`
- Create/Modify bei Bedarf: `app/field-hub/src/components/onfield/ScoreboardStrip.tsx`
- Modify: `app/field-hub/src/components/onfield/OnFieldComponents.test.tsx`
- Modify: `app/field-hub/src/index.css`
- Modify: `app/field-hub/src/components/ui/onfield-ui.css`
- Create/Modify bei Bedarf: Figma Frames `Squad heute / iPhone SE`, `Squad heute / iPhone 15`, `Squad heute / iPad Portrait`, `Squad heute / iPad Landscape`.

Abhaengigkeiten:
- R1A, R1B, R2.
- R3 und R4 sollten vor externer Beta gemerged sein; R5 kann lokal nach R1A/R1B/R2 gebaut werden, darf aber nicht als launch-ready gelten, wenn P0 offen ist.

Definition of Done:
- [x] `Heute` zeigt keine neue Card-Wall.
- [x] First View hat eine dominante Zahl und genau eine dominante Primaeraktion.
- [x] Athleten-/Warnobjekte sind Rows mit Readiness-Dot, Name, Position, Sparkline/Trend oder kompakter Ersatz, Status-Chip.
- [x] Severity-Sortierung: Rot, Gelb, Returner, offen.
- [x] `of-num` fuer Scoreboard-Zahlen.
- [x] Geaenderte Komponenten nutzen Typo-Tokens und max. 3 Gewichte.
- [x] iPhone gestapelt mit Progressive Disclosure; iPad 2-Spalten ohne Funktionsverlust.
- [x] Dark Mode rendert ohne unlesbare Flaechen.
- [x] Keine Oxblood-/Hero-/Neon-Flaeche in Live-Screen.
- [x] App-Screenshots sind gegen Figma-Frames abgeglichen; relevante Abweichungen sind behoben oder dokumentiert.

Aufwand/Risiko/QA:
- Aufwand: L.
- Risiko: M, weil Datenverdichtung und visuelle Hierarchie neu geordnet werden.
- QA-Gate: `npm run qa:local`; zusaetzlich visuelle Pruefung in 375/393/834/1194.

Rollback-/Sicherheitshinweis:
- Rollback auf alten `TodayDashboard` ist moeglich, solange neue OnField-Komponenten kompatibel bleiben. Keine Datenmigration.

Impact:
- H, erster sichtbarer Beweis, dass der Redesign-Zyklus kein MVP-Patch ist.

## Phase 4 - Einheit Als Geschlossener Coach-Loop

### R6 - Einheit-Cockpit & Returner Im Loop

Ziel: Check-in, Training, Returner und Nachbereitung als zusammenhaengenden Trainingstag fuehren, statt Returner im `Mehr`-Overflow zu verstecken.

Scope drin:
- `SessionWorkspace` als Cockpit-Loop schaerfen: Check-in -> Training -> Returner -> Nachbereitung.
- Returner als kontextuelle Einheit-Aufgabe sichtbar machen: aus `Heute`-"Aufpassen", Check-in-Rotflag und Training erreichbar.
- Returner-Zustand neutral/gruen gestalten, wenn keine offene Aktion besteht; kein Dauer-Alarm.
- Training-Toolbar auf eine Primaeraktion plus Overflow reduzieren.
- Nachbereitung mit einer klaren naechsten Pflichtaktion und sticky "Einheit abschliessen" vorbereiten.
- Rueckspruenge zwischen Spieler, Returner, Check-in und Nachbereitung stabil halten.

Bewusst nicht drin:
- Kein globaler Haupttab "Returner".
- Keine medizinische Freigabe- oder Diagnoseentscheidung.
- Keine neue Sportart oder SportConfig-Engine.

Deliverables und Dateien:
- Modify: `app/field-hub/src/components/SessionWorkspace.tsx`
- Modify: `app/field-hub/src/components/SessionWorkspace.test.tsx`
- Modify: `app/field-hub/src/components/CheckInView.tsx`
- Modify: `app/field-hub/src/components/TrainingView.tsx`
- Modify: `app/field-hub/src/components/PostSessionView.tsx`
- Modify: `app/field-hub/src/components/ReturnerView.tsx`
- Modify: `app/field-hub/src/navigation.ts`
- Modify: `app/field-hub/src/navigation.test.ts`
- Modify: `app/field-hub/src/components/AppShell.tsx`
- Modify: `app/field-hub/src/components/AppShell.test.tsx`

Abhaengigkeiten:
- R1A, R1B, R2, R3, R4.
- R5 empfohlen, weil `Heute` die Einstiege liefert.

Definition of Done:
- [ ] Returner ist in `Einheit` erreichbar und nicht nur unter `Mehr`.
- [ ] Check-in-, Training-, Returner- und Nachbereitungszustand teilen denselben Session-Kontext.
- [ ] Jede View hat genau eine dominante Primaeraktion.
- [ ] Training-Toolbar hat keine 5 gleichgewichtigen Buttons.
- [ ] Nachbereitung vermeidet doppelte Pflichtaktionen und fuehrt zur naechsten offenen Aufgabe.
- [ ] Safety-Copy sagt "Hinweis fuer Coaching-Entscheidung", keine Freigabe.
- [ ] iPhone nutzt Stack/Sheets, iPad nutzt Content plus Pane; fachliche Paritaet bleibt.
- [ ] Save-/Action-Feedback aus R4 ist in den betroffenen Flows sichtbar.

Aufwand/Risiko/QA:
- Aufwand: L.
- Risiko: H, weil Navigation, Session-Kontext und mehrere Kernflows betroffen sind.
- QA-Gate: `npm run qa:local`; bei Public/Kiosk-Rueckspruengen zusaetzlich `npm run qa:beta`.

Rollback-/Sicherheitshinweis:
- Ruecksprung-/Routing-Aenderungen nur mit Legacy-Hash-Kompatibilitaet mergen. Bei Regressionen `Returner` unter `Mehr` als Backup-Link behalten, aber nicht als primaeren Arbeitsort.

Impact:
- H, weil P0-3 und mehrere P1-Punkte zusammengefuehrt werden.

### R7A-R7D - Row-first Kernflows

Ziel: Die Kernarbeitsbereiche Check-in, Training, Nachbereitung und Spieler konsequent auf Athleten-Rows, klare Statusmuster und reduzierte Card-Dichte bringen. R7 ist bewusst in vier mergebare Sub-Slices geschnitten, damit kein Agent alle Kernflows als riskanten Big-Bang umbaut.

Scope drin:
- R7A Check-in Rows & shared row primitives: Check-in-Roster auf v2-Athleten-Row mit Readiness-Dot, Status-Chip, Quick Action und Detail-Sheet aktualisieren; `Rows.tsx`, `Status.tsx` und gemeinsame CSS-Klassen stabilisieren.
- R7B Training Live Rows: Training-Athletenliste, Live-Block-Aktionen und Toolbar-Dichte an R6/R7A ausrichten; genau eine Primaeraktion und Overflow fuer Sekundaeres/destruktive Aktionen.
- R7C Nachbereitung & Returner Rows: Nachbereitungsqueue visuell an `TaskQueueRow`/row-first ausrichten; Returner-Caps als strukturierte Chips/Stepper vorbereiten, soweit ohne Datenumbau moeglich.
- R7D Spielerliste & Profilkopf: Spieler-Liste und Profilkopf auf v2-Hierarchie, tabular Metrics und Row-Muster bringen; Detail bleibt Sheet/Pane.
- In jedem Sub-Slice Status-Chips und Traffic-Light-Chips pruefen: Farbe + Text + Glyph/Form.

Bewusst nicht drin:
- Keine Analyse-Neukonzeption.
- Kein schweres Chart-Library-Setup.
- Keine Datenbankmigration.
- Kein Zusammenlegen der vier Sub-Slices in einen einzigen grossen PR.

Deliverables und Dateien:
- R7A Modify: `app/field-hub/src/components/CheckInView.tsx`
- R7A Modify: `app/field-hub/src/components/CheckInView.test.tsx`
- R7A Modify: `app/field-hub/src/components/onfield/Rows.tsx`
- R7A Modify: `app/field-hub/src/components/ui/Status.tsx`
- R7A Modify: `app/field-hub/src/components/ui/onfield-ui.css`
- R7A Modify: `app/field-hub/src/index.css`
- R7B Modify: `app/field-hub/src/components/TrainingView.tsx`
- R7B Modify: `app/field-hub/src/components/TrainingView.sessionBlocks.test.tsx`
- R7C Modify: `app/field-hub/src/components/PostSessionView.tsx`
- R7C Modify: `app/field-hub/src/components/PostSessionView.test.tsx`
- R7C Modify: `app/field-hub/src/components/ReturnerView.tsx`
- R7D Modify: `app/field-hub/src/components/PlayersView.tsx`
- R7D Modify: `app/field-hub/src/components/PlayersView.test.tsx`

Abhaengigkeiten:
- R1A, R1B, R2-R6.
- R7A muss vor R7B/R7C/R7D landen, weil es gemeinsame Row-/Status-Primitives stabilisiert.
- R7B, R7C und R7D koennen danach separat umgesetzt und gemerged werden.

Definition of Done:
- [ ] Keine neuen Card-Walls in Kernflows.
- [ ] Athletenobjekte sind row-first; Detail bleibt Sheet/Pane.
- [ ] Max. eine dominante Primaeraktion pro View.
- [ ] Geaenderte Komponenten nutzen Typo-/Spacing-/Radius-Tokens.
- [ ] Tabular numbers fuer Readiness, Schmerz, sRPE, Caps, Reps und Load.
- [ ] Status wird nie nur durch Farbe angezeigt.
- [ ] Save-/Action-Feedback bleibt in Training, Nachbereitung und Returner erhalten.
- [ ] iPhone verliert keine Aktionen; lange Tabellen werden Listen/Karten.
- [ ] Dark Mode rendert Kernflows mit Kontrast >= 4.5:1.
- [ ] Jeder R7-Sub-Slice liefert Redesign-Integrity-Evidence mit Vorher/Nachher-Screenshots fuer seine betroffenen Screens.
- [ ] Jeder R7-Sub-Slice ist fuer sich mergebar und laesst `qa:local` gruen.

Aufwand/Risiko/QA:
- Aufwand: L insgesamt; R7A/R7B/R7C/R7D jeweils S-M.
- Risiko: H insgesamt, aber durch Sub-Slices kontrolliert.
- QA-Gate je Sub-Slice: `npm run qa:local`; zusaetzlich nach R7B/R7C/R7D `npm run test:e2e:sprint19` fuer Hauptscreens.

Rollback-/Sicherheitshinweis:
- Sub-Slices getrennt mergen. Bei Regression nur den betroffenen Sub-Slice zuruecknehmen; R7A-Primitives nur dann rollbacken, wenn kein spaeterer Sub-Slice darauf basiert.

Impact:
- H, weil hier die dokumentierte Designsystem-Regel "Rows statt Card-Walls" wirklich sichtbar wird.

## Phase 5 - Responsiveness, Field Mode Und Restliche Screens

### R8 - Responsive, Field-Mode-QA & Analyse/Mehr

Ziel: iPhone nicht laenger als zusammengedrueckte iPad-Version wirken lassen und Dark "Field Mode" screen-weit pruefbar machen.

Scope drin:
- Breakpoints auf `compact <600`, `medium 600-839`, `expanded >=840` konsolidieren.
- Analyse-Tabellen am iPhone in Karten/Listen statt Horizontal-Scroll ueberfuehren.
- Analyse-KPIs und Player-Charts auf `MetricTile`/tabular numerals ausrichten.
- `Mehr`-Bereiche Export, Bibliothek und Einstellungen entdichten und Primary-Action-Regel pruefen.
- Field-Mode-Visual-QA ueber Hauptscreens, Brand-Surfaces und Public/Kiosk.
- PWA-/Safe-Area-/Bottom-Bar-Risiken in den vier Pflichtgroessen pruefen.

Bewusst nicht drin:
- Keine neuen Analysemetriken ohne fachliche Quelle.
- Keine schwere externe Chart-Bibliothek.
- Kein Multi-Tenant-/SaaS-Scope.

Deliverables und Dateien:
- Modify: `app/field-hub/src/components/AnalysisView.tsx`
- Modify: `app/field-hub/src/components/AnalysisView.test.tsx`
- Modify: `app/field-hub/src/components/PlayerAnalysisCharts.tsx`
- Modify: `app/field-hub/src/components/ExportView.tsx`
- Modify: `app/field-hub/src/components/ExportView.test.tsx`
- Modify: `app/field-hub/src/components/LibraryView.tsx`
- Modify: `app/field-hub/src/components/LibraryView.test.tsx`
- Modify: `app/field-hub/src/components/SettingsView.tsx`
- Modify: `app/field-hub/src/components/SettingsView.test.tsx`
- Modify: `app/field-hub/src/components/AppShell.tsx`
- Modify: `app/field-hub/src/index.css`
- Modify: `app/field-hub/scripts/e2e-sprint19-visual-qa.mjs`
- Modify: `app/field-hub/scripts/e2e-pwa-smoke.mjs`

Abhaengigkeiten:
- R1A, R1B, R2.
- R5-R7 empfohlen, damit QA gegen neue Kernflows laeuft.

Definition of Done:
- [ ] Keine iPhone-Tabelle mit zwingendem horizontalem Scroll in geaenderten Screens.
- [ ] Pflichtgroessen 375, 393, 834, 1194 sind visuell geprueft.
- [ ] Bottom Tab Bar, Safe Areas und Sticky Actions ueberlappen keine Inhalte.
- [ ] Field Mode rendert Hauptscreens und Public/Kiosk ohne Kontrastfehler >= 4.5:1.
- [ ] Primaercontrols streben in Dark 7:1 an; Abweichungen werden explizit dokumentiert.
- [ ] Analyse bleibt eigener Auswertungsraum und dringt nicht in Live-Screens.
- [ ] Export/destruktive Aktionen liegen hinter klarer Sekundaer-/Overflow-Logik.

Aufwand/Risiko/QA:
- Aufwand: L.
- Risiko: M, weil viele responsive CSS-Pfade betroffen sind.
- QA-Gate: `npm run qa:local`, `npm run test:e2e:pwa`, `npm run test:e2e:sprint19`.

Rollback-/Sicherheitshinweis:
- Responsive Aenderungen pro Screen oder CSS-Bereich klein halten. Bei Field-Mode-Kontrastproblemen Light Mode nicht beschaedigen; Dark kann per Toggle default `system` bleiben.

Impact:
- H, weil iPhone-Paritaet erst mit eigener Dichte wirklich professionell wirkt.

## Phase 6 - Brand-Surfaces Und Signature Craft

### R9 - Brand-Surfaces, Wortmarke & Display-Font-Test

Ziel: OnField als Marke bewusst sichtbar machen, ohne Live-Coaching-Screens in Marketing-Flaechen zu verwandeln.

Scope drin:
- Logo-/Wortmarken-Sprint: Dot-Signature, Wortmarken-Regeln und App-Header-Anwendung.
- Display-Font-Test fuer Headlines/Scoreboard, mit Systemfont als Fallback.
- Brand-Surfaces veredeln: Auth/Login, Welcome/Empty Demo, Install, Splash, Kiosk-Welcome.
- Onboarding/Login als First-Run-Schritt mit klarer, dreifach nuetzlicher Empty-State-Logik.
- Oxblood selbstbewusst nur auf erlaubten Brand-Surfaces einsetzen.
- First-Run/Empty States: ein Zustand, eine direkte Aktion, kein Marketing in Live-Flows.
- Figma Brand-Surface Frames und ggf. Bild-KI-gestuetzte Brand-Mood-Varianten erstellen.
- Codex `image_gen` oder externe Nano-Banana/Gemini-Image-Outputs nur fuer Brand-/Marketing-/Kiosk-/Install-Assets nutzen, nicht fuer Live-Screen-Struktur.

Bewusst nicht drin:
- Keine neue Hauptmarkenarchitektur.
- Keine Oxblood-Status- oder Alarmfarbe.
- Kein lauter Hero in `Heute`, `Einheit`, `Spieler`, `Analyse`.
- Keine finale externe Landingpage, sofern nicht separat beauftragt.
- Keine Uebernahme von Bild-KI-UI-Mockups als Production-UI ohne Figma-/Token-/Komponenten-Uebersetzung.

Deliverables und Dateien:
- Modify: `app/field-hub/src/components/onfield/BrandSurface.tsx`
- Modify: `app/field-hub/src/components/onfield/BrandSurface.test.tsx`
- Modify: `app/field-hub/src/components/AuthPanel.tsx`
- Modify: `app/field-hub/src/components/AuthPanel.test.tsx`
- Modify: `app/field-hub/src/components/PlaceholderView.tsx`
- Modify: `app/field-hub/src/components/PublicCheckInView.tsx`
- Modify: `app/field-hub/src/components/KioskCheckInView.tsx`
- Modify: `app/field-hub/src/components/SettingsView.tsx`
- Modify: `app/field-hub/src/components/PwaUpdateNotice.tsx`
- Modify: `app/field-hub/public/manifest.webmanifest`
- Modify: `app/field-hub/public/icons/*` nur wenn die Wortmarken-/Icon-Entscheidung ein Asset-Update verlangt.
- Modify bei Entscheidung: `docs/field-hub/onfield_brand_kit.md`
- Modify bei Entscheidung: `docs/field-hub/onfield_token_sheet.md`
- Create/Modify bei Bedarf: Figma Frames fuer Login, Install, Kiosk-Welcome, Empty Demo, Splash/App-Icon-Kontext.
- Create bei Bedarf: projektgebundene Brand-Rasterassets unter `app/field-hub/public/` oder dokumentiertem Asset-Pfad.

Abhaengigkeiten:
- R1A, R1B, R2.
- R5 empfohlen, damit Scoreboard-/Wortmarken-Einsatz gegen echten Leit-Screen geprueft wird.

Definition of Done:
- [ ] Brand-Surfaces nutzen Oxblood nur dort, wo Brand Kit und Spec es erlauben.
- [ ] Live-Coaching-Screens bleiben ruhig und ohne Hero/Marketing.
- [ ] Display-Font ist getestet oder explizit als System-Platzhalter belassen.
- [ ] Wortmarke/Dot-Signature ist in Code und SSOT konsistent.
- [ ] Empty States haben einen Satz, eine Aktion, optional einen Helper.
- [ ] Keine Diagnose-/Freigabesprache in Onboarding, Empty oder Kiosk.
- [ ] iPhone/iPad-First-Run und Install-Surfaces sind funktionsgleich.
- [ ] Dark Field Mode und Light Mode beide visuell geprueft.
- [ ] Bild-KI-Assets sind nur Brand-/Marketing-/Kiosk-/Install-Assets, in Figma/Repo dokumentiert und nicht operative UI-Struktur.
- [ ] Figma Brand-Surface Frames sind die visuelle Referenz fuer Implementierung und Evidence.

Aufwand/Risiko/QA:
- Aufwand: M.
- Risiko: M, weil Brand-Surfaces auffaellig sind und PWA-Assets Caching-/Install-Risiken haben.
- QA-Gate: `npm run qa:local`, `npm run test:e2e:pwa`; bei Public/Kiosk-Aenderungen `npm run qa:beta`.

Rollback-/Sicherheitshinweis:
- PWA-Icon-/Manifest-Aenderungen koennen gecacht werden; Rollback braucht Versions-/Cache-Pruefung. Display-Font nur mit Fallback mergen.

Offene Fragen:
- Finale Display-Font und Wortmarkenform muessen vor Umsetzung bestaetigt oder im Sprint als Testmatrix entschieden werden.
- Mono fuer Labels bleibt pending Ratifizierung; ohne Ratifizierung System-Semibold-Uppercase verwenden.

Impact:
- M/H, weil die App dadurch nicht nur geordnet, sondern markenfaehig wirkt.

## Phase 7 - Politur Und Evidence

### R10 - Politur, P2-Backlog & Launch-Evidence

Ziel: Nach den Redesign-Kernarbeiten die restlichen P2-Politurpunkte, QA-Evidence und Dokumentation so schliessen, dass kuenftige Agenten nicht wieder den falschen Stand interpretieren.

Scope drin:
- Geteilte `EmptyState`, `ErrorState`, `Skeleton` konsequent fuer geaenderte Flows einsetzen.
- First-load Skeletons fuer Listen/Panels ab ca. 300 ms.
- `window.confirm`-Loeschen in In-App-Sheets fuer verbleibende destruktive Aktionen.
- Export/Backup-Hierarchie: Vollbackup sichtbarer, CSVs sekundar.
- Returner-Caps strukturieren, wenn R7 nur vorbereitet hat.
- Orchestrierte Micro-Motion/Haptik nur funktional, reduziert und `prefers-reduced-motion`-sicher.
- Redesign-Evidence-Dokument fuer QA, Coverage, Screenshots und offene Risiken.
- Memory Closeout nach Governance: Current State/Decision Log/Index aktualisieren, falls sich Status oder naechster Schritt geaendert hat.

Bewusst nicht drin:
- Keine neuen Produktfelder ohne Fachentscheidung.
- Keine Leaderboards, Player-Accounts, Multi-Tenant-SaaS oder Native-Rewrite.
- Keine Route-B-Exploration.

Deliverables und Dateien:
- Modify: `app/field-hub/src/components/ui/States.tsx`
- Modify: `app/field-hub/src/components/ui/CoreComponentKit.test.tsx`
- Modify: `app/field-hub/src/components/ExportView.tsx`
- Modify: `app/field-hub/src/components/ReturnerView.tsx`
- Modify: `app/field-hub/src/components/AnalysisView.tsx`
- Modify: `app/field-hub/src/components/SettingsView.tsx`
- Modify: `app/field-hub/src/index.css`
- Modify: `app/field-hub/scripts/e2e-sprint19-visual-qa.mjs`
- Create: `docs/field-hub/2026-07-XX_onfield_redesign_v2_evidence.md`
- Modify bei qualifizierendem Statuswechsel: `docs/field-hub/onfield_current_state.md`
- Modify bei qualifizierender Entscheidung: `docs/field-hub/onfield_decision_log.md`
- Modify bei Routingbedarf: `docs/field-hub/memory/index.md`

Abhaengigkeiten:
- R1A, R1B, R2-R9.

Definition of Done:
- [ ] P0 und P1 aus dem Audit sind abgeschlossen oder bewusst mit Grund blockiert dokumentiert.
- [ ] P2-Items sind entweder umgesetzt, in ein spaeteres Backlog verschoben oder als Nicht-Ziel dokumentiert.
- [ ] `qa:local` ist gruen.
- [ ] `qa:beta` ist fuer Auth/Kiosk/Public/RLS relevante Aenderungen frisch geprueft oder klar blockiert.
- [ ] Visual QA deckt 375/393/834/1194 in Light und Field Mode ab.
- [ ] Fuer R5-R9 existiert Redesign-Integrity-Evidence mit Vorher/Nachher-Screenshots, UX-Intent, Pattern-Audit und Token-/Typo-Audit.
- [ ] Keine neuen Card-Walls, keine neuen Rohwerte, keine neuen 850/900-Gewichte.
- [ ] Keine sichtbaren Dev-/Rohfehler, keine personenbezogenen/sensiblen Daten in Doku oder Screenshots.
- [ ] Memory Closeout wurde nach Governance ausgefuehrt.

Aufwand/Risiko/QA:
- Aufwand: M.
- Risiko: M, weil es viele kleine Restpunkte gibt und Scope-Drift droht.
- QA-Gate: `npm run qa:local`, `npm run test:e2e:pwa`, `npm run test:e2e:sprint19`; bei relevanten Pfaden `npm run qa:beta` und `npm run supabase:audit`.

Rollback-/Sicherheitshinweis:
- P2-Politur darf nicht P0/P1-Regressionsdruck erzeugen. Bei Konflikt P2 zurueckstellen, nicht Fundament oder Sicherheitsarbeit aufweichen.

Impact:
- M, aber wichtig fuer externe Beta- und Agenten-Sicherheit.

## P0/P1 Coverage

| Audit-Punkt | Sprint(s) | Coverage-Hinweis |
|---|---|---|
| P0-1 Kiosk haerten | R3 | Eigenstaendiger Sprint, nicht an Screen-Rewrite gekoppelt. |
| P0-2 Save-Feedback ueberall | R4, R6, R7B, R7C | Gemeinsames Feedback-Muster zuerst, dann Flow-Rollout in Training/Nachbereitung/Returner. |
| P0-3 Returner in den Live-Loop | R5, R6, R7C | Einstieg aus `Heute`, fachlicher Loop in `Einheit`, Row-Polish in Nachbereitung/Returner. |
| P0-4 Roh-/Dev-Copy raus | R4, R9 | Kritische Auth/Public-Fehler frueh; Brand-/First-Run-Copy spaeter sauber. |
| P1-1 Typo-Skala + Gewicht-Disziplin | R1A, R2 | Tokens zuerst, dann CSS-/Komponenten-Refactor. |
| P1-2 Row-first + Hierarchie | R5, R6, R7A-R7D, R8 | Leit-Screen zuerst, dann Kernflows und restliche Screens. |
| P1-3 Umlaut-/Sprach-Sweep | R4, R7A-R7D, R9, R10 | Kritische Dev-/Denglisch-Copy frueh; breiter Sweep mit betroffenen Screens. |
| P1-4 Dark-/Field-Mode | R1A, R1B, R8, R9 | Tokens in R1A, Persistenz/Toggle in R1B, screen-weite QA in R8, Brand-Surfaces in R9. |
| P1-5 Onboarding/Login + Empty States | R9, R10 | Brand-Surfaces und First-Run, danach States-Politur. |
| P1-6 iPhone-Erfahrung | R5, R7A-R7D, R8 | Progressive Disclosure im Leit-Screen, Kernflows und responsive QA. |
| P1-7 Scoreboard-Numerals + Display-Font | R1A, R2, R5, R9 | Numeric-Foundation, Typo-/Numeric-Utility, `Heute`-Einsatz, Brand-/Font-Test. |
| P1-8 Training-Toolbar + Nachbereitung | R6, R7B, R7C | Cockpit-Loop und row-first Kernflows. |
| P1-9 Kiosk-Datenschutz/Impersonation | R3, R4 | Kiosk-Lock und sichere Public-/Kiosk-Copy. |

## P2 Backlog Nach R10

Diese Punkte bleiben bewusst spaeter, falls sie nicht in R10 abgeschlossen werden:

- Echte leichte SVG-/Custom-Charts fuer Analyse, ohne schwere Chart-Library.
- Weitere Export-/Backup-Informationsarchitektur nach externer Coach-Evidence.
- Feiner abgestimmte Micro-Motion/Haptik aus LUVI-Mustern.
- Zusaetzliche Brand-Assets fuer externe Landingpage oder App-Store-/SaaS-Vorbereitung.

## Offene Fragen Vor Umsetzung

- R3: finales Kiosk-Unlock-Modell bestaetigen, ohne Player-Accounts oder Remote-Secrets einzufuehren.
- R9: Display-Font und Wortmarkenvariante testen oder System-Platzhalter explizit bestaetigen.
- R9: Mono fuer Labels ratifizieren oder bei System-Semibold-Uppercase bleiben.
- R9: Entscheiden, ob Brand-Bildvarianten mit Codex `image_gen`, externem Nano Banana/Gemini Image oder rein in Figma entstehen sollen.
- R10: Entscheiden, ob P2-Analysecharts vor externer Beta noetig sind oder erst nach Coach-Evidence.

## Selbst-Qualitaetscheck

- [x] Sprints sind unabhaengig mergebar und vermeiden Big-Bang-Rewrite.
- [x] Fundament steht vor Screens; Kiosk-Sicherheit ist frueh und eigenstaendig.
- [x] R1 ist in R1A Token-Fundament und R1B Theme-Persistenz/Toggle getrennt, damit der Fundament-Sprint nicht zu voll wird.
- [x] Grober Umfang und Kalenderwellen sind dokumentiert: ca. 14 Slices, Fundament + P0 zuerst, P2 spaeter.
- [x] Jeder Sprint dokumentiert Ziel, Scope, Deliverables, Dateien, Abhaengigkeiten, DoD, Aufwand/Risiko, QA und Rollback/Sicherheit.
- [x] R7 ist in R7A-R7D geschnitten, damit Kernflow-Redesign nicht als Big-Bang-PR umgesetzt wird.
- [x] Das Redesign Integrity Gate verhindert kosmetische UI-PRs ohne Struktur-, Evidence- und Pattern-Nachweis.
- [x] Jede P0- und P1-Position aus dem Audit ist einem Sprint zugeordnet.
- [x] Route A, IA, PWA-first, iPhone/iPad-Paritaet und medizinische Guardrails bleiben erhalten.
- [x] Visuelle Leitplanken aus Spec §7 sind in globale und sprintbezogene DoDs gespiegelt.
- [x] Erster mergebarer Slice und erster sichtbarer Redesign-Slice sind benannt.
- [x] Die Roadmap referenziert Spec/Audit statt deren Inhalte vollstaendig zu duplizieren.
