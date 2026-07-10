# OnField R7A Check-in Rows & Shared Row Primitives - Evidence

Stand: 2026-07-10

## Scope

Dieses Closeout setzt ausschliesslich Redesign-v2 R7A um: Der Check-in-Roster nutzt die gemeinsame v2-`AthleteRow` mit Readiness-Dot, Traffic-/Status-Chips, direkten Anwesenheitsaktionen und bestehendem Detail-Sheet. `Rows.tsx`, `Status.tsx` und die gemeinsamen CSS-Vertraege sind fuer weitere R7-Slices stabilisiert.

Ausserhalb: R7B Training Live Rows, R7C Nachbereitung/Returner Rows, R7D Spielerliste/Profilkopf, neue Routen oder Produktfelder, Supabase-Schema/RLS/Migrationen, Analyse-/Chart-Umbau, Brand-/Bildassets und medizinische Diagnose- oder Freigabesprache.

## UX- und Komponentenvertrag

- AthleteRow besitzt einen eigenen, beschrifteten Auswahlbereich aus HTML-gueltigem Phrasing-Content; Quick Actions liegen als Geschwister ausserhalb. Es entstehen keine verschachtelten Buttons.
- Readiness wird als Punkt/Form plus zugaenglicher Text vermittelt. Traffic-Light-Chips zeigen immer Glyph und Text; Status ist nie nur Farbe.
- `Da` und `Nicht da` bleiben als direkte, mindestens 48 px hohe Zeilenaktionen erhalten. Parallele Saves verschiedener Spieler besitzen unabhaengige Pending-Zustaende.
- Save-Feedback bleibt pro Athletenzeile und Einheit erhalten und unterscheidet `gespeichert`, `wartet auf Sync`, `offline lokal gespeichert` und einen sicheren generischen Fehler. Alte Requests koennen nach einem Einheitenwechsel keinen sichtbaren Status ueberschreiben; rohe Repository-/RLS-Texte werden nicht ausgegeben.
- Die Roster-Zusammenfassung ist ein semantisches `dl` mit `.of-num`, keine Metric-Card-Wall. Filter exponieren `aria-pressed`.
- Detail bleibt das bestehende Player-Sheet mit Feldern, Guidance, Escape, Fokusfalle und Fokus-Restoration. R7A fuegt keine neuen Datenfelder hinzu.
- Solange das Roster laedt, erscheinen Row-Skeletons statt einer sachlich falschen Empty-State-Meldung.
- Check-in besitzt genau eine `.of-button-primary`; aktive Anwesenheitszustaende bleiben kompakte Row Controls.

## Umsetzung

- `AthleteRowProps` ist exportiert und unterstuetzt optional `onSelect`, `selectLabel` und `selectDescription`; die Row trennt Auswahlcontent und Action-Slot strukturell und bindet den sichtbaren Statusgrund per `aria-describedby` an den Auswahlbutton.
- `TrafficLightChip` nutzt fuer Gruen, Gelb, Rot und Offen ein semantisch passendes Lucide-Glyph zusaetzlich zu Label und optionalem Grund.
- `CheckInView` ersetzt die eigene Legacy-Row, Avatar- und Traffic-Chip-Struktur durch `AthleteRow`, `ReadinessDot`, `StatusChip` und `TrafficLightChip`.
- Anwesenheit, Returner, Cap, Vorwarnung und Self-Quelle werden als kontextuell getoente Status-Chips abgebildet; Returner-Klaerung bleibt neutral statt medizinisch alarmistisch.
- Ein Preview-Eintrag ohne meaningful Check-in-Daten bleibt sichtbar `Offen`, auch wenn die Domain intern bereits eine gruene Empfehlung traegt. Offene Preview-Eintraege werden weder als Gruen noch als Returner-Klaerung dargestellt oder gezaehlt.
- Veraltete Check-in-Card-/Roster-CSS wurde nach Nutzungspruefung entfernt; neue Regeln verwenden bestehende `--of-*`-Typo-, Spacing-, Radius-, Border- und Status-Tokens.
- TodayDashboard nutzt dieselbe AthleteRow weiter; sein fokussierter Regressionstest blieb gruen.
- Keine Supabase-, Auth-, RLS-, Migrations-, Secret-, Route- oder spaetere R7-Datei wurde geaendert.

## Redesign Integrity Gate

- Row-first: sechs gemischte synthetische Athleten renderten als `.of-athlete-row`; keine `.checkin-roster-row`, Card-Wall oder Avatar-Kachel blieb uebrig.
- Dominante Handlung: exakt eine `.of-button-primary` auf allen Pflichtbreiten; Row-Actions sind klar gruppierte Statuskontrollen.
- Tokens/Typografie: keine neue rohe Farbe oder Font-Size und kein Gewicht 850/900 in den betroffenen Redesign-Dateien; Summary-Zahlen nutzen `.of-num`.
- Status/A11y: Dot/Form, Glyph und Text; Statuszusammenfassung per `aria-describedby`; Quick Actions als beschriftete Gruppe; Filterzustand per `aria-pressed`; 48-px Quick Actions; Detail-Dialog mit `aria-modal`, Label, Escape, Fokusfalle und Fokus-Restoration.
- Branding: keine Hero-/Marketingflaeche, kein Neon und kein Oxblood auf operativen Statusflaechen.
- Copy/Trust: coachnahe Aktionssprache; keine Diagnose- oder Return-to-Play-Freigabe.

## Figma- und Screenshot-Evidence

Primaere Anschlussreferenz blieb das vorhandene R5-Set in `https://www.figma.com/design/BBaL4jQKLHeOC7tP5lajdW`, insbesondere `31:3` und `31:168`. Es lieferte die ruhige Route-A-Hierarchie, row-first Athletenobjekte und das Muster aus genau einer Primaerhandlung.

Neu angelegt wurde die Figma-Seite `R7A – Check-in Rows` mit Light und Field Mode:

- `42:3` / `42:403` - iPhone SE 375.
- `42:104` / `42:504` - iPhone 15 393.
- `42:205` / `42:605` - iPad Portrait 834.
- `42:304` / `42:704` - iPad Landscape 1194.

Die Figma-Designsystem-Suche lieferte keine publizierten wiederverwendbaren Assets. Deshalb wurden Review-Frames mit den bestehenden OnField-Tokenwerten gebaut, ohne neue Library, Variablen oder Brand-Architektur.

Nachher-Evidence des echten React-/CSS-Screens entstand mit einem temporaeren, anschliessend vollstaendig entfernten lokalen Komponenten-Harness und synthetischen Namen. Er veraendert weder Produkt-Routing noch Persistenz und ersetzt keinen Auth-/Sync-Gate:

- iPhone 375 Light: `/Users/arwinfarajpoory/.codex/visualizations/2026/07/10/019f4d3d-c45d-76a1-9d46-f9f428eba763/onfield-r7a-iphone-375-light-viewport.png`
- iPhone 393 Field Mode: `/Users/arwinfarajpoory/.codex/visualizations/2026/07/10/019f4d3d-c45d-76a1-9d46-f9f428eba763/onfield-r7a-iphone-393-dark-viewport.png`
- iPhone 393 Rows Light: `/Users/arwinfarajpoory/.codex/visualizations/2026/07/10/019f4d3d-c45d-76a1-9d46-f9f428eba763/onfield-r7a-iphone-393-light-rows.png`
- iPhone 393 Detail Light: `/Users/arwinfarajpoory/.codex/visualizations/2026/07/10/019f4d3d-c45d-76a1-9d46-f9f428eba763/onfield-r7a-iphone-393-light-detail.png`
- iPad 834 Field Mode: `/Users/arwinfarajpoory/.codex/visualizations/2026/07/10/019f4d3d-c45d-76a1-9d46-f9f428eba763/onfield-r7a-ipad-834-dark-viewport.png`
- iPad 1194 Field Mode: `/Users/arwinfarajpoory/.codex/visualizations/2026/07/10/019f4d3d-c45d-76a1-9d46-f9f428eba763/onfield-r7a-ipad-1194-dark-viewport.png`
- iPad 1194 Detail Field Mode: `/Users/arwinfarajpoory/.codex/visualizations/2026/07/10/019f4d3d-c45d-76a1-9d46-f9f428eba763/onfield-r7a-ipad-1194-dark-detail.png`

Der Vorherzustand ist reproduzierbar ueber den Git-Parent und die entfernten `.checkin-roster-row`-/`roster-traffic-chip`-Regeln: eigene 6-px-Ampelborduere, Avatar-/Dreispalten-Row, generische Tags, vier Metric-Kacheln und globales Save-Feedback. Es wurde kein nachtraeglich gestellter Vorher-Screenshot erzeugt; als begruendete visuelle Evidence dienen der reproduzierbare Parent-Diff, die vorhandene R5-Figma-Referenz, acht R7A-Figma-Frames und die responsive Nachher-Matrix.

## Verification

- Testgetrieben: neue Row-/Status-Vertragstests und Check-in-Akzeptanztests wurden zuerst rot und danach gruen ausgefuehrt.
- Fokussiert nach Review-Korrekturen: 4 Testdateien / 69 Tests inklusive `TodayDashboard`, Shared Rows und Token-/CSS-Vertraegen gruen.
- `npm run typecheck`: checked.
- `npm run lint`: checked.
- `npm run qa:local`: checked; Supabase-Audit, Typecheck, Lint, 99 Testdateien / 684 Tests, Build, PWA-E2E und Sprint-19-Visual-QA gruen.
- PWA-E2E: checked fuer 375/393/744/834/1194, Lazy Screens, Deep Links und History.
- Synthetische Browsermatrix: checked fuer 375/393/834/1194, Light/Field Mode, je 6 Rows, eine Primary Action, 48-px Quick Actions, `.of-num`, keine Legacy-Rows und kein horizontales Overflow.
- Authentifizierte Live-App, read-only: checked mit 20 aktiven Spielern bei 375/393/834/1194 in Light und Field Mode. 20/20 unberuehrte Check-ins renderten als offen, 0 als gruen, 0 mit falschem `Returner klaeren`; Row-Aussenpadding war 0 px, Quick Actions 48 px hoch und kein Viewport hatte horizontales Overflow.
- Authentifizierter Detail-Fokus: checked bei 393; Fokus startete im Dialog, Shift+Tab blieb im Dialog, Schliessen stellte den Row-Trigger wieder her.
- Field-Mode-Kontrast: der live berechnete Open-Chip-Text-/Hintergrundkontrast betrug 13,77:1 und lag damit ueber 4,5:1.
- Credentials wurden nur transient im In-App-Browser verwendet, nicht in Datei, Terminal, Testartefakt oder Screenshot geschrieben; Theme wurde auf System zurueckgesetzt und die QA-Session danach ausgeloggt.
- Der fruehere generische Sprint-19-Signed-in-Teil blieb im damaligen `qa:local` wegen fehlender Env-Credentials `skipped`; er ist weiterhin kein Beta-Gate. Der separate authentifizierte R7A-Live-Check oben ist der aktuelle Funktions-/Responsive-Nachweis.
- Keine authentifizierten Screenshots mit echten Spielernamen wurden gespeichert. Das schuetzt personenbezogene Daten, bedeutet aber, dass die Signed-in-Screenshotmatrix kein persistiertes Abnahmeartefakt ist.
- `qa:beta`: nicht ausgefuehrt, weil R7A keine Public/Kiosk-/Remote-Datenvertraege aendert. Ein Skip gilt nicht als Beta-Freigabe.
- Bekannte Build-Warnung: Hauptchunk 504.75 kB; ausserhalb des R7A-Scopes.
- `git diff --check`: checked im finalen Closeout.

## Abweichungen

Keine Produkt-Scope-Abweichung. Gegenueber der Roadmap-Dateiliste wurden nur fokussierte Tests der bereits betroffenen Shared Components und dieses Evidence-Dokument ergaenzt. Sie sind notwendig, um den gemeinsamen Row-/Status-Vertrag und die Today-Regression nachzuweisen.

Prozessabweichung: Statt eines zusaetzlichen Git-Worktrees wurde im von Codex und Nutzer geteilten Desktop-Workspace der isolierte Branch `codex/r7a-checkin-rows` angelegt. So blieb der sichtbare Workspace konsistent, ohne fremde Aenderungen zu vermischen.

Visuelle Abweichung: Die authentifizierte App wurde read-only und ohne Datenmutation ueber die Pflichtbreiten sowie Light/Field Mode geprueft. Aus Datenschutzgruenden wurde davon kein Screenshot mit echten Spielernamen gespeichert. Der temporaere synthetische Komponenten-Harness liefert die persistierte Nachher-Screenshotmatrix. Ein historischer Vorher-Screenshot wurde nicht nachtraeglich gestellt; diese Roadmap-Evidence-Luecke bleibt offen. R7A ist code-, Funktions-, Responsive- und local-QA-seitig abgeschlossen, aber nicht als vollstaendig historisch dokumentiertes Vorher/Nachher-Screenshot-Gate zu bezeichnen.
