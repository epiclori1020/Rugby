# OnField R7D Spielerliste & Profilkopf - Evidence

Stand: 2026-07-13

## Scope

Umgesetzt ist ausschliesslich Redesign-v2 R7D: Die Spielerliste ist row-first, priorisiert operative Statussignale und besitzt genau eine dominante Anlagehandlung. Der Profilkopf fuehrt Identitaet, Position/Positionsgruppe, Status und vier tabellarische Coaching-Metriken zusammen. Das bestehende Profil bleibt unter 840 px ein Sheet und ab 840 px eine Pane.

Ausserhalb: Analyse-Neukonzeption, neue Profilfelder, Datenbank/Supabase/Auth/RLS, tiefe Profil-Tab-Umbauten, weitere Redesign-Sprints, Brand-/Marketingassets sowie medizinische Diagnose- oder Return-to-Play-Freigabesprache.

## UX- und Komponentenvertrag

- Spieler werden als gemeinsame `AthleteRow` mit Foto/Initialen, Name, Position, Positionsgruppe, letztem Signal und Statusstack dargestellt; das alte responsive Kartenraster ist entfernt.
- Der Statusstack hat maximal zwei Eintraege: Check-in/Ampel als primaerer Zustand und genau einen priorisierten Sekundaerzustand. Offene rote/gelbe Themen stehen vor Roster-, Returner- und Einwilligungsstatus.
- Form/Glyph plus sichtbarer Text tragen jede Statusbedeutung; Farbe ist nur zusaetzlich.
- `Spieler anlegen` ist die einzige dominante Primaerhandlung. Sync-Wiederanlauf bleibt sekundaer.
- Filter sind als gedrueckte Toggle-Buttons beschriftet; Auswahl in der Liste verwendet `aria-current` statt Toggle-Semantik.
- Der Profilkopf zeigt einen gemeinsamen semantischen `dl`-Strip fuer letzte Teilnahme, Readiness, Beschwerden und offene Themen statt zwei KPI-Card-Walls.
- Auf iPhone/Medium oeffnet das Profil modal, sperrt Hintergrundscroll, faengt Fokus/Escape ab und gibt Fokus an die ausloesende Row zurueck. Ab 840 px bleiben Liste und Profil-Pane gleichzeitig sichtbar.
- Empty- und Loading-Zustaende verwenden die bestehenden OnField-Komponenten. Fotos, Bearbeiten, alle Profil-Tabs und der Returner-Ruecksprung bleiben auf iPhone und iPad erhalten.

## Redesign Integrity Gate

- Row-first: `.player-list-item` ist aus Markup und CSS entfernt; Spieler rendert `.of-athlete-row`.
- Dominante Handlung: exakt eine `.of-button-primary` in der View.
- Card-Wall: das Spieler-Kartenraster und die doppelten Status-/Teilnahme-Kachelgruppen im Profilkopf sind entfernt; tiefere Stammdaten bleiben ausserhalb des Kopfes unveraendert.
- Tokens/Typo: neue Regeln verwenden vorhandene `--of-*`-Tokens; keine rohen Farben oder Font-Sizes und keine Gewichte 850/900 wurden eingefuehrt. Kennzahlen nutzen `.of-num`/tabellarische Ziffern.
- Status/A11y: maximal zwei Chips, Text plus Glyph/Form, `aria-pressed` fuer Filter, `aria-current` fuer Auswahl, benannter Dialog, Fokusfang, Escape, Fokus-Rueckgabe und Scroll-Lock.
- Responsive: Compact `<600` nutzt einen 2x2-Metrikstrip; Medium `600-839` ein modales Sheet; Expanded `>=840` eine Liste/Pane-Kombination mit vier Metrikspalten. Ein zusaetzlicher AppShell-Audit deckte bei 1024 px eine zu schmale Detailspalte auf; die Grid-Tracks teilen den verfuegbaren Contentraum nun proportional 2:3 statt durch geklemmte Bruchteile Restbreite zu verlieren.
- Branding/Copy: ruhige operative Surface, kein Hero, kein Neon/Oxblood, konsistentes `OnField Rugby`-Preset und keine medizinische Freigabesprache.

## Figma- und visuelle Evidence

Primaere visuelle Referenz ist das bestehende OnField-Figma-File `https://www.figma.com/design/BBaL4jQKLHeOC7tP5lajdW`, Seite `R7D – Spielerliste & Profilkopf` (`60:2`). Die lokale R7D-Komponentenbasis liegt in `60:6` mit Statuschip `60:7`, Athlete Row `60:9` und Metrikzelle `60:21`.

- Light-Matrix: Gruppe `61:4`; Frames `61:5` (375), `61:83` (393), `61:161` (834), `61:239` (1194).
- Field-Mode-Matrix: Gruppe `62:192`; Frames `62:193` (375), `62:241` (393), `62:289` (834), `62:335` (1194).
- Vorher/Nachher-Appmatrix: `r7d/before` und `r7d/after` unter dem dokumentierten Codex-Visualisierungspfad `/Users/arwinfarajpoory/.codex/visualizations/2026/07/13/019f5b17-2425-79b3-a8ab-7b36de5b443a/`; je Liste/Detail, 375/393/834/1194 und Light/Field Mode. Zusaetzliche AppShell-Aufnahmen liegen unter `r7d/audit-shell` fuer 834/1024/1194 in Light/Field Mode.

Die Screenshots verwenden ausschliesslich einen temporaeren synthetischen lokalen Datensatz. Der Harness belegt Layout, Themes, Viewports und Detailmodus, lud den persistierten Profilverlauf aber nicht in jeder Aufnahme; befuellte rote/gelbe Statuspriorisierung und Profilmetriken sind deshalb zusaetzlich durch Interaktionstests belegt. Der Visualisierungspfad ist maschinenlokal und nicht Teil des Git-Repos; die Figma-Nodes und dieses Evidence-Dokument sind die dauerhaften Referenzen. Es wurden keine echten Spieler-, Gesundheits- oder Zugangsdaten persistiert. Ein temporaerer Figma-Code-Capture wurde nach dem Abgleich wieder geloescht.

Bild-KI wurde bewusst nicht genutzt: R7D gestaltet operative UI-Struktur und keine Brand-/Marketing-/Kiosk-/Install-Rasterassets.

## Verification

- TDD: sechs neue R7D-Vertraege schlugen am Legacy-Stand fehl und wurden danach gruen.
- Fokussiert: 2 Testdateien / 29 Tests gruen. Zusaetzlich abgedeckt sind stale Profil-IDs ohne Scroll-Lock, Fokus-Rueckgabe bei wiederhergestelltem Profil und gelbe Themen vor inaktivem Roster-Status.
- Vollstaendiges `npm run qa:local`: gruen mit Supabase-Audit, Typecheck, Lint, 104 Testdateien / 706 Tests, Build, PWA-E2E und Sprint-19-Visual-QA.
- PWA-E2E: iPhone klein/gross, Medium 744, iPad Portrait/Landscape; Lazy Screens, Deep Links und History gruen.
- Sprint-19-Visual-QA: 11 Screens in 10 Viewport-/Theme-Kombinationen (110 Kombinationen) gruen. Signed-in wurde mangels `FIELD_HUB_E2E_EMAIL`/`FIELD_HUB_E2E_PASSWORD` geskippt und nicht als Beta-Gate gewertet. Die optionale Lazy-Chunk-Fault-Injection wurde wegen bereits vorgeladenem Chunk geskippt; der normale Lazy-Screen-PWA-Pfad ist gruen, ein harter Fault-Nachweis ist damit aber nicht erbracht.
- Browser/Evidence: R7D zusaetzlich mit synthetischen Daten bei 375, 393, 834 und 1194 px in Light/Field Mode geprueft; die einzige Console-Meldung war ein harmloser fehlender Favicon-Request im temporaeren Harness.
- Element-Kontrast: befuellte Liste und befuelltes Profil wurden bei 375/393/834/1194 in Light/Field Mode mit demselben alpha-komponierenden Messprinzip wie die Sprint-19-QA geprueft. Je Zustand wurden 100-150 sichtbare Text-/Control-Elemente erfasst; keine Unterschreitung von 4.5:1, niedrigster allgemeiner Wert 5.06:1 in Light und 5.83:1 in Field Mode. Aktive Primaercontrols unterschritten im Field Mode auch das 7:1-Ziel nicht.
- Build: gruen; die bestehende Hauptchunk-Warnung bei 510,66 kB bleibt ausserhalb R7D.
- Der erste sandboxed `qa:local`-Versuch brach ausschliesslich ab, weil der Preview-Server nicht erreichbar war; der vollstaendige freigegebene Wiederholungslauf ist gruen.
- `qa:beta`: nicht ausgefuehrt; R7D aendert keine Remote-/Public-/Kiosk-/RLS-Vertraege. Ein Skip gilt nicht als Beta-Freigabe.

## Abweichungen

Keine Produkt-Scope-Abweichung. Gegenueber der Roadmap-Dateiliste wurden die gemeinsamen `Rows.tsx`-/Row-Tests und CSS-Dateien bewusst mitgeaendert, weil Foto/Initialen, Auswahlsemantik und Responsive-Detailvertrag am bestehenden R7A-Primitive sauber ergaenzt werden mussten. Es wurde keine neue Architektur eingefuehrt.

Eine zwischenzeitlich erwogene Umbenennung der tiefen Tabs `Load`/`Issues` wurde nach Regressionstests verworfen, weil sie ausserhalb des Profilkopf-Scope lag. Die finalen Tabs und ihre Funktionen bleiben unveraendert.
