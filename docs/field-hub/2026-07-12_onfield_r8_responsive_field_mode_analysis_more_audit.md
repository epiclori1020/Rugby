# OnField R8 Responsive, Field Mode, Analyse & Mehr - Evidence

Stand: 2026-07-12

## Scope

Umgesetzt ist ausschliesslich Redesign-v2 R8: die verbindlichen Breakpoints `compact <600`, `medium 600-839` und `expanded >=840`, der responsive Strukturumbau von Analyse, Bibliothek, Export & Backup und Einstellungen sowie Light-/Field-Mode-, PWA- und Accessibility-QA fuer 375, 393, 744, 834 und 1194 px. Die unten benannten Grenzen fuer echte iOS-Safe-Area- und befuellte Analyse-Evidence bleiben ausdruecklich offen.

Ausserhalb bleiben R7D Spieler/Profil, R9 Brand-Surfaces, R10 spaetere Daten-/Cap-Strukturen, neue Metriken, eine Chart-Library, neue Produktfelder, Supabase-Schema/RLS/Migrationen, Native-App-Arbeit und Brand-/Rasterassets.

## UX- und Komponentenvertrag

- Analyse trennt Entwurf und angewandten Filterzustand. Compact oeffnet Filter in einem Sheet; Medium und Expanded zeigen die Filter im Arbeitsraum. Erst `Filter anwenden` aktualisiert Chips und Auswertung.
- Die bisherigen Analyse-Tabellen sind durch eine einzige semantische, responsive Ergebnisliste ersetzt. Compact zeigt pro Row sichtbare Feldlabels; Medium/Expanded nutzen tabellarische Spalten. Zahlen verwenden `.of-num`.
- `MetricTile` ist ein kleines semantisches `dl`-Primitive fuer Kennzahlen mit Label, Wert, Kontext und optionalem Status-Ton. Analyse und Spieleranalyse nutzen dasselbe Primitive statt weiterer Einzelkarten.
- Bibliothek ist auf Compact list-first: Auswahl oeffnet das vorhandene zugaengliche Sheet. Ab Medium bleiben Liste und Detail-Pane gleichzeitig sichtbar. Aktive Kategorien/Rows exponieren `aria-pressed`. Beim PDF-Oeffnen schliesst das Detail-Sheet, der PDF-Dialog faengt Fokus und gibt ihn beim Schliessen an die Row zurueck; verschachtelte modale Dialoge sind ausgeschlossen.
- Export & Backup zeigt einen kompakten Summary-Strip, genau eine primaere JSON-Backup-Handlung, zeilenartige CSV-Aktionen und einen Import-Sheet mit Vorschau und lokaler Bestaetigung.
- Einstellungen sind ein ruhiger Utility-Workspace: Sync steht zuerst, der Status ist ein semantischer Strip, Backup/Geraet/Install/App-Version bleiben nachgeordnet. Signed-out ist Login die einzige Primaerhandlung; signed-in ist es der manuelle Sync.
- Die `Mehr`-Subnavigation nutzt vier Spalten ab 600 px und ein 2x2-Raster auf Compact. iPhone und iPad behalten fachlich dieselben Unterbereiche.

## Redesign Integrity Gate

- Dominante Handlung: Analyse, Export und Einstellungen haben im jeweiligen Zustand genau eine screenweite Primaerhandlung. Ein im QA entdeckter signed-out Konflikt zwischen Login und deaktiviertem Sync wurde test-first entfernt.
- Row-first: Analyseergebnisse, Bibliotheksobjekte und Exportaktionen sind Listen/Rows. Bibliothek verwendet auf Compact kein permanentes Detail-Card-Grid.
- Card-Wall: Export-Kennzahlen und Sync-Zustaende sind kompakte Summary-Strips; Import und mobile Bibliotheksdetails liegen in Sheets.
- Token-/Typo-Audit: neue Styles verwenden vorhandene `--of-*`-Tokens, `.of-num` und bestehende Weight-/Type-Tokens. Es wurden keine neuen rohen Farben, Font-Sizes oder Gewichte 850/900 eingefuehrt.
- Status/A11y: Kennzahlen besitzen Text/Detail neben Ton; Tabellenersatz nutzt ARIA-Table-Semantik und laesst die mobilen sichtbaren Zelllabels im Accessibility Tree; Sheets/PDF-Dialog behalten Dialogname, Fokusfang, Escape und Fokus-Rueckgabe; Touch Targets und sichtbarer Keyboard-Fokus werden automatisiert geprueft.
- Field Mode: alle elf Hauptscreens laufen in Light und Field Mode durch gerenderte Kontrastpruefungen aller sichtbaren Text-/Control-Kandidaten mit Alpha-Compositing. Dark-Primary wird separat gegen 7:1 geprueft; das Tokenpaar `#08130F` auf `#4FB89E` erreicht 7,82:1. Light Primary erreicht 6,33:1 und erfuellt damit WCAG AA, nicht die nur fuer Dark formulierte 7:1-Aspiration. Der Browser laeuft fuer stabile Evidence und den Accessibility-Pfad mit `prefers-reduced-motion: reduce`.
- Branding/Copy: keine Hero-/Marketingflaeche in operativen Screens, kein Neon, kein Oxblood als Statusfarbe und keine medizinische Diagnose- oder Return-to-Play-Freigabesprache.

## Figma- und visuelle Evidence

Primaere visuelle Referenz ist das OnField-Figma-File `https://www.figma.com/design/BBaL4jQKLHeOC7tP5lajdW`, Top-Level-Frame `R8 Responsive · Analyse + Mehr` (`51:2`). Die vorhandene Datei hatte keine lokalen publizierten Komponenten, Variablen oder OnField-Library-Treffer; deshalb wurden die Code-/SSOT-Tokens sowie die bestehenden OnField-Patterns verwendet und keine fremde Material-/iOS-Library importiert.

- Analyse Light: Section `52:2`, Screens `52:5`, `52:59`, `52:113`, `52:181`.
- Analyse Field Mode: Section `53:2`, Screens `53:5`, `53:59`, `53:113`, `53:181`.
- Mehr Light (Bibliothek, Export, Einstellungen x vier Breiten): Section `54:2`, Screens `54:6`, `54:53`, `54:104`, `54:154`, `54:202`, `54:267`, `54:332`, `54:395`, `54:456`, `54:511`, `54:566`, `54:619`.
- Mehr Field Mode: Section `55:2`, Screens `55:6`, `55:53`, `55:104`, `55:154`, `55:202`, `55:267`, `55:332`, `55:395`, `55:456`, `55:511`, `55:566`, `55:619`.

Die reproduzierbare Vorher-Evidence liegt ignored unter `.tmp/onfield-qa/r8/before/light/`; historische Field-Mode-Vorherbilder existieren nicht und wurden nicht nachtraeglich gestellt. Die Nachher-Matrix enthaelt 110 Coach-Screens plus vier Public-Fehlerzustaende unter `.tmp/onfield-qa/r8/after/{light,dark}/`. Visuell geprueft wurden insbesondere Analyse bei 375/1194, Bibliothek bei 393/744, Export bei 834 und Einstellungen bei 834 in Field Mode. Die erste Nachher-Matrix zeigte nur Lazy-Loading-Zustaende; der QA-Vertrag wurde deshalb auf echte Inhaltsanker verschaerft und die Matrix neu erzeugt. Persistierte authentifizierte Screenshots wurden zum Schutz realer Account-/Spielerdaten bewusst nicht angelegt.

Bild-KI wurde nicht genutzt: R8 gestaltet operative UI-Struktur und QA, keine Brand-/Marketing-/Kiosk-/Install-Rasterassets.

## Verification

- TDD: neue Vertraege fuer `MetricTile`, Analysefilter, responsive Ergebnisliste, Spieleranalyse, Bibliotheks-Sheet, Export-Import-Sheet, Settings-Hierarchie, Mehr-Subnavigation und R8-E2E wurden zuerst rot und danach gruen ausgefuehrt.
- `npm run qa:local`: gruen; Supabase-Audit, Typecheck, Lint, 104 Testdateien / 700 Tests, Produktions-Build, PWA-E2E und Sprint-19/R8-Visual-QA liefen vollstaendig.
- PWA-E2E: 375, 393, 744, 834 und 1194 px; Lazy Screens, kanonische Deep Links, History und Offline-App-Shell gruen.
- R8 Visual QA: elf Hauptscreens x fuenf Viewports x zwei Themes = 110 Kombinationen; horizontales Overflow, Bottom-Navigation/Touch Targets, Content-Clearance, Sticky-Kollisionen, Fokus, verbotene Copy, Responsive-Vertraege und gerenderter Text-/Control-Kontrast gruen. Public-Check-in-Fehlerzustand wurde bei 393/834 in beiden Themes geprueft.
- Authentifizierter R8-Lauf: 40 Kombinationen fuer Analyse, Bibliothek, Export und Einstellungen ueber alle fuenf Viewports und beide Themes sowie vier Kiosk-Welcome-Kombinationen bei 393/834 in Light/Field Mode gruen; Credentials wurden nur als Laufzeit-Input verwendet und nicht gespeichert oder ausgegeben.
- Kiosk-Remote-Smoke: temporaerer Spieler, kompletter Self-Check-in, Remote-Verifikation und Cleanup gruen; es blieben keine Testdaten bestehen.
- Dependency-Audit: `npm audit --omit=dev` meldet 0 bekannte Schwachstellen in Produktionsabhaengigkeiten.
- `qa:beta`: korrekt blockiert, nicht gruen. Der vorgelagerte R5-Squad-Test verlangt einen Kaderspieler, Check-in und eine sichtbare Aufmerksamkeitszeile; dieser produktive Testzustand fehlte. Es wurden keine fachfremden Dauerdaten erzeugt. Der R8-spezifische Auth-Lauf wurde separat erfolgreich ausgefuehrt.
- Build: gruen; die bekannte Warnung fuer den Hauptchunk ueber 500 kB bleibt ausserhalb R8.
- Sprint-spezifisches `git diff --check -- app/field-hub docs/field-hub`: gruen. Der globale Check meldet Whitespace in gleichzeitig vorhandenen, sprintfremden Trainings-PDFs und einer Trainingsvorlage; diese Nutzerdateien wurden nicht veraendert oder bereinigt.

## Offene Evidence-Grenzen

- Headless Chromium liefert `safe-area-inset-*` mit 0. CSS-`env(...)`, Bottom-Bar-Clearance und reale Bounding-Box-Kollisionen sind geprueft; eine nicht-null iPhone-Home-Indicator-Evidence braucht weiterhin einen echten Safari-/iOS-Simulatorlauf.
- Die persistierte App-Screenshotmatrix ist signed-out und zeigt deshalb keinen befuellten Analyse-Tabellenersatz. Der befuellte Zustand ist ueber Figma, semantische Komponenten-/Domaintests und den authentifizierten Browserlauf ohne persistierte Echtdaten-Screenshots belegt. Eine redigierte/synthetische befuellte App-Screenshot-Evidence bleibt moegliche Nachbesserung, ist aber kein Anlass fuer einen produktiven Testdaten-Harness.
- Public ist in Light/Field Mode als Brand-/Fehleroberflaeche geprueft; ein gueltiger Public-Form-/Review-/Success-Durchlauf wurde in R8 nicht remote geseedet. Kiosk deckt Welcome plus den separaten vollstaendigen Remote-Submit-/Cleanup-Flow ab.
- `e2e-r8-contract.test.mjs` ist nur ein statischer Verdrahtungs-Guard. Funktionale Evidence liefern die tatsaechlichen PWA-/Browserlaeufe und nicht dieser Source-String-Test.

## Abweichungen

Bewusste Reihenfolgeabweichung: Der Current State nennt R7D als vorherigen Abhaengigkeitsschritt. Der Nutzer hat R8 jedoch explizit als alleinigen Sprint beauftragt; R7D wurde nicht mitgezogen und bleibt offen. R8 nutzt nur bereits vorhandene generische Komponenten- und Breakpoint-Fundamente.

Gegenueber einer reinen View-Dateiliste wurden `MetricTile`, die gemeinsame Analyse-Ergebnisliste und die R8-E2E-Vertraege bewusst ergaenzt. Sie sind die kleinsten wiederverwendbaren Fundamente fuer den im Sprint geforderten semantischen Zahlen-, Tabellenersatz- und QA-Vertrag; es wurde keine neue Produkt- oder Datenarchitektur eingefuehrt.

Prozessabweichung: Im geteilten Desktop-Workspace wurde ein isolierter Feature-Branch statt eines zusaetzlichen Worktrees verwendet, um bestehende Dependencies und fremde ungetrackte Arbeitsdateien nicht zu duplizieren oder anzufassen. Die Vorher/Nachher-Evidence bleibt bewusst ignored unter `.tmp` statt den bereits getrackten historischen Audit-Ordner zu veraendern.
