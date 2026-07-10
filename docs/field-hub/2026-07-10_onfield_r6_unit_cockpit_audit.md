# OnField R6 Einheit-Cockpit & Returner im Loop - Evidence

Stand: 2026-07-10

## Scope

Dieses Closeout setzt ausschliesslich Redesign-v2 R6 um: `SessionWorkspace` fuehrt Check-in, Training, Returner und Nachbereitung als gemeinsamen Trainingstag; Returner ist kontextuell aus Heute, Check-in, Training und Spieler erreichbar; Training und Nachbereitung haben eine klare Primaerhandlung; iPhone und iPad behalten denselben Funktionsumfang.

Ausserhalb: R7A-R7D Row-/Chip-/Stepper-Refactors, globaler Returner-Haupttab, neue Sportarten oder SportConfig-Engine, Supabase-Schema/RLS/Migrationen, medizinische Diagnose oder Return-to-Play-Freigabe sowie spaetere Brand-Surfaces.

## UX- und fachlicher Vertrag

- Kanonischer Arbeitsort ist `#/unit/returners`; `#/more/returners` bleibt kompatibler Backup-Zugang.
- Alle vier Einheitsschritte teilen `selectedSession`; der Returner-Fokus speichert nur `{ playerId, originRoute }` im laufenden UI-Kontext und kehrt stabil zum Ursprung zurueck.
- `returnerStatus=offen` erzeugt allein keinen Dauer-Alarm. Eine Aufgabe entsteht aus explizitem Returner-Kontext, einem dokumentierten Cap oder einem aktuellen Returner-Eintrag.
- Ohne offene Aufgabe zeigt das Cockpit den textlich und farblich erkennbaren Zustand `Returner aktuell geklaert`.
- Safety-Copy lautet `Hinweis fuer Coaching-Entscheidung`; die App dokumentiert Caps und Reaktionen, erteilt aber keine medizinische Freigabe.
- Check-in, Training, Returner und Nachbereitung besitzen je genau eine dominante Primaeraktion. Sekundaere oder destruktive Trainingsaktionen liegen im Overflow.

## Umsetzung

- `src/domain/returnerTasks.ts` liefert eine pure, getestete Ableitung fuer Planning, In-progress, Decision, Follow-up und Done.
- `SessionWorkspace` besitzt vier gleichwertige Einheitsschritte sowie einen offenen/neutralen Returner-Kontextstatus.
- `TodayDashboard`, `CheckInView`, `TrainingView` und `PlayersView` oeffnen Returner mit Spieler- und Ursprungsbezug; `App.tsx` stellt beim Ruecksprung in Check-in, Training und Spieler auch den fokussierten Athleten und beim Spielerprofil den Returner-Tab wieder her.
- `ReturnerView` ist row-first: Aufgabenliste plus genau ein Fokusdetail, neutraler Leerzustand, eingeklappte Safety-Hinweise und R4-Action-Feedback.
- Training nutzt eine Primaeraktion und `Weitere Aktionen`; Nachbereitung besitzt genau einen sticky Closeout und erzeugt keinen zweiten `session_status`-Pflichtpunkt.
- iPhone zeigt das Detail als Safe-Area-bewusstes modales Sheet mit Backdrop, Dialogsemantik, Escape und Tab-Fokusbegrenzung; ab 600 px nutzt das Layout Content plus sticky Detail-Pane. Es wurden keine R7C-Cap-Chips oder Stepper vorgezogen.
- Canonical-/Legacy-Routing, PWA-Smoke und ein authentifizierter R6-E2E-Gate decken die neue Route ab.
- Keine Supabase-, Auth-, RLS-, Migrations- oder Secret-Datei wurde geaendert.

## Redesign Integrity Gate

- Dominante Primaerhandlung: Browser und E2E bestaetigen exakt eine sichtbare `.of-button-primary` je Einheitsschritt.
- Row-first: Returner-Aufgaben sind Zeilen/Articles mit einem einzelnen Detailfokus; keine Card-Wall und kein globaler Returner-Tab.
- Status: Offen/geklaert wird mit Text, Ton und Icon vermittelt, nie nur ueber Farbe.
- Tokens/Typografie: neue CSS-Regeln nutzen vorhandene `--of-*`-Tokens; keine rohen Farben oder Font-Sizes und keine neuen Gewichte 850/900.
- Branding: keine Hero-/Marketing-Flaeche, kein Neon und kein Oxblood auf operativen Statusflaechen.
- Copy/Trust: `Hinweis fuer Coaching-Entscheidung`, ehrliches R4-Save-Feedback und keine Freigabe-Sprache.

## Figma- und Screenshot-Evidence

Primaere Anschlussreferenz: `https://www.figma.com/design/BBaL4jQKLHeOC7tP5lajdW?node-id=31-3`, Frame `31:3` (`Squad heute / iPhone SE`). Der node-spezifische Designkontext wurde gegen die R6-Umsetzung geprueft: ruhige operative Hierarchie, genau eine Primary Action, kompakte Statusflaechen und Athlete-Row-Muster wurden fortgefuehrt.

Es existierte kein R6-spezifischer node-spezifischer Frame. Deshalb wurden keine Figma-Primitives oder spaetere R7-Komponenten auf Verdacht vorgezogen. Als begruendete visuelle Evidence dienen der bestehende Figma-Anschluss, der Browser-Layoutnachweis und spielerdatenfreie Live-Captures:

- iPhone 375 Light: `/Users/arwinfarajpoory/.codex/visualizations/2026/07/10/019f4c52-6755-7d01-bb83-01d635339ee3/onfield-r6-returner-375-light.png`
- iPad 834 Field Mode: `/Users/arwinfarajpoory/.codex/visualizations/2026/07/10/019f4c52-6755-7d01-bb83-01d635339ee3/onfield-r6-returner-834-field.png`

Der authentifizierte Browserlauf verwendete reale Daten nur read-only fuer Layout-/Navigationspruefungen; gespeicherte Screenshots stammen aus dem neutralen Zustand ohne Spielernamen. 375 px: 48-px Primary, vier Einheitsschritte, kein horizontaler Overflow, Detail als 344-px fixed Dialog-Sheet. 834 px: Aufgabenliste 347 px plus sticky Detail-Pane 424 px, kein horizontaler Overflow und keine Modal-Semantik. Der Training-Returner-Training-Ruecksprung stellte Route und Spieler-Fokus wieder her; ein unberuehrter Check-in zeigte keinen Returner-Einstieg. Light und Field Mode wurden geprueft.

## Verification

- `npm run typecheck`: checked.
- `npm run lint`: checked.
- `npm run test`: checked, 99 Testdateien / 671 Tests.
- `npm run build`: checked; bekannte Vite-Chunk-Warnung fuer den 502-kB-Hauptchunk bleibt ausserhalb R6.
- `npm run qa:local`: checked; Supabase-Audit, Typecheck, Lint, Tests, Build, PWA-E2E und Sprint-19-Visual-QA gruen. Der erste Sandbox-Lauf konnte den Preview-Port nicht oeffnen; der regelkonform freigegebene Wiederholungslauf war vollstaendig gruen.
- `npm run test:e2e:pwa`: checked fuer 375/393/744/834/1194, Lazy Screens, Deep Links und History.
- `npm run test:e2e:sprint19`: checked fuer 11 Screens auf allen Pflichtbreiten. Der generische Signed-in-Teil meldet ohne Prozess-Credentials weiterhin `skipped`; dies wird nicht als Auth-Nachweis gewertet.
- `npm run test:e2e:r6`: authentifiziert checked, 40 Kombinationen aus 5 Viewports, 2 Themes und 4 Einheitsschritten; Screenshots bewusst deaktiviert.
- Browser: authentifiziert checked fuer neutralen und offenen Returner-Zustand, Training-Overflow, iPhone-Sheet, iPad-Pane, Light/Field Mode und stabile Session-Navigation; keine Datenmutation.
- `npm run qa:beta`: nicht relevant und nicht ausgefuehrt, weil R6 keine Public-/Kiosk-Ruecksprunglogik oder Remote-Datenvertraege aendert. Ein Skip wird nicht als Beta-Gate gewertet.
- `git diff --check`: checked im finalen Closeout.

## Abweichungen

Keine Produkt-Scope-Abweichung. Gegenueber der Roadmap-Dateiliste kamen die pure Returner-Task-Ableitung, die kontextuellen Einstiegsscreens, `App.tsx`, fokussierte Tests sowie ein eigener R6-E2E-Treiber hinzu; diese Dateien sind notwendig, um die ausdruecklich geforderten Einstiege, stabilen Rueckspruenge und den wahrheitsgetreuen neutralen Zustand ohne neue Persistenz umzusetzen.

Ein eigener R6-Figma-Frame wurde nicht erzeugt, weil kein R6-Node/Component-Library-Scope vorlag und ein nachtraeglicher Primitive-Nachbau den spaeteren R7-Designsystem-Scope vorgezogen haette. Stattdessen wurde der vorhandene node-spezifische R5-Figma-Frame als primaere Anschlussreferenz genutzt und durch authentifizierte responsive Browser-Evidence ergaenzt.

Der unabhaengige Scope-Review fand vor Abschluss vier Luecken: Route-only statt fachlichem Fokus-Ruecksprung, iPad 834 im Mobile-Sheet, Returner-Einstieg bei unberuehrtem Check-in und fehlende Modal-/Fokus-Semantik des iPhone-Sheets. Der Re-Review fand zusaetzlich eine enge Fokus-Trap-Kante bei `Shift+Tab` vom Dialogcontainer sowie fehlende Fokus-Restoration. Alle Findings wurden vor Closeout behoben und mit fokussierten Tests, einem interaktiven Fokus-Test sowie authentifizierter Browser-Evidence erneut geprueft.
