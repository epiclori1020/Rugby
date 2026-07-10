# OnField R7B Training Live Rows - Evidence

Stand: 2026-07-10

## Scope

Umgesetzt ist ausschliesslich Redesign-v2 R7B: Die Training-Athletenliste nutzt die gemeinsame v2-`AthleteRow`; der aktuelle Live-Block besitzt eine direkte Abschlussaktion und einen ruhigen Anpassungs-Overflow. Bestehende Player-Details, Quick Actions, Save-/Sync-Feedback, Exposures, Capture und Sessionnavigation bleiben funktional erhalten.

Ausserhalb: R7C Nachbereitung/Returner Rows, R7D Spielerliste/Profilkopf, R8 Breakpoint-Refactor, neue Produktfelder, Routen, Supabase-Schema/RLS/Migrationen, Brand-/Bildassets und medizinische Diagnose- oder Freigabesprache.

## UX- und Komponentenvertrag

- Training besitzt genau eine dominante Primaerhandlung im operativen Header. Live-Beobachtung, Blockabschluss, Navigation und Empty-State-Aktionen bleiben sekundaer.
- Athleten sind row-first: Readiness-Dot, Name, Position/Cluster, priorisierter Coaching-Hinweis, Traffic-Chip sowie Anwesenheits-/Varianten-/Cap-/Warn-/Sync-Status. Status wird nie nur durch Farbe vermittelt.
- Die Zeile ist ein nativer beschrifteter Button und oeffnet das bestehende Detail-Sheet. Quick Actions wurden nicht dupliziert oder in eine Button-Wand verwandelt.
- Hinweisprioritaet: nicht erfasst; heute pruefen; konkrete Limits; Belastung anpassen; Returner-Cap; Vorwarnung; keine dokumentierten Warnsignale.
- Loading nutzt Row-Skeletons. Leere Filter und ein leerer Kader nutzen gemeinsame Empty States mit sekundaerer Ruecksetz-/Navigation-Aktion.
- Filter exponieren `aria-pressed`; iPhone und iPad behalten denselben fachlichen Umfang.
- Live-Block: `Erledigt` ist direkt, `Geplant`, `Reduziert`, `Geändert` und `Gestrichen` liegen unter `Block anpassen`. Bestehende Grundvalidierung, Notiz-Persistenz, Sync-Feedback und explizite Blocknavigation bleiben erhalten. Navigation ist deutsch beschriftet.
- Echte `preview:`-Einträge bleiben ungeachtet geerbter Suggestions/Returner-Defaults sichtbar offen; der Gelb/Rot-Filter berücksichtigt nur meaningful Check-ins.
- Blockstatus-Saves besitzen einen echten Pending-/Doppelklick-Lock. Live-Beobachtungen zeigen Erfolg erst nach bestätigtem Save und behalten den Entwurf bei Fehlern.

## Redesign Integrity Gate

- Row-first: sechs synthetische Athleten renderten als `.of-athlete-row`; keine `.training-player-scan-row` blieb uebrig.
- Dominante Handlung: exakt eine `.of-button-primary` auf allen Pflichtbreiten.
- Token-/Typo-Audit: neue R7B-CSS-Regeln verwenden vorhandene `--of-*`-Tokens; keine neuen rohen Farben, Font-Sizes oder Gewichte 850/900.
- Figma-Font-Audit: alle acht Frames verwenden ausschliesslich Inter.
- Status/A11y: Readiness-Form, Glyph, Text und zugängliche Beschreibung; Filter-Pressed-State; native Row-Buttons; R7B-Core-Controls mindestens 44 px.
- Detail-Sheet: Fokus startet im Dialog und kehrt beim Schließen zum auslösenden AthleteRow-Button zurück.
- Branding: keine Hero-/Marketingflaeche, kein Neon und kein Oxblood im Live-Coaching-Screen.
- Copy/Trust: coachnahe Aktionssprache; keine Diagnose- oder Return-to-Play-Freigabe.

## Figma- und visuelle Evidence

Primaere Anschlussreferenz war die bestehende R7A-Row (`42:3`) im OnField-Figma-File `https://www.figma.com/design/BBaL4jQKLHeOC7tP5lajdW`.

Neu angelegt wurde die Figma-Seite `R7B – Training Live Rows` mit acht responsiven Frames:

- Light: `44:2` (375), `44:123` (393), `44:244` (834), `44:365` (1194).
- Field Mode: `44:486` (375), `44:607` (393), `44:728` (834), `44:849` (1194).

Der erste Field-Mode-Render deckte unbeabsichtigte weisse Auto-Layout-Fuellungen auf; 152 transparente Strukturcontainer wurden gezielt korrigiert und der 1194-Frame erneut visuell geprueft.

Nachher-Evidence des echten React-/CSS-Screens entstand mit einem temporaeren, anschliessend vollstaendig entfernten Komponenten-Harness und synthetischen Namen:

- Viewports Light: `onfield-r7b-iphone-375-light-viewport.png`, `onfield-r7b-iphone-393-light-viewport.png`, `onfield-r7b-ipad-834-light-viewport.png`, `onfield-r7b-ipad-1194-light-viewport.png`.
- Viewports Field Mode: `onfield-r7b-iphone-375-field-viewport.png`, `onfield-r7b-iphone-393-field-viewport.png`, `onfield-r7b-ipad-834-field-viewport.png`, `onfield-r7b-ipad-1194-field-viewport.png`.
- Row-Fokus: `onfield-r7b-iphone-393-light-rows.png`, `onfield-r7b-iphone-393-field-rows.png`, `onfield-r7b-ipad-1194-light-rows.png`, `onfield-r7b-ipad-1194-field-rows.png`.

Alle Dateien liegen unter `/Users/arwinfarajpoory/.codex/visualizations/2026/07/10/019f4d88-02ac-7990-abc3-de4bc5a97e73/`.

Ein historischer signed-in Vorher-Screenshot mit demselben synthetischen Datensatz existierte nicht. Er wurde nicht nachtraeglich gestellt. Als begruendete Vorher-Evidence dienen der reproduzierbare Git-Parent `bf26187`, die entfernten Legacy-Row-Regeln im Diff, die R7A-Figma-Anschlussreferenz und die neuen R7B-Figma-/Nachher-Frames.

Figma ist die visuelle Richtungsreferenz für Row-Hierarchie, Statusdichte und Primärhandlung. Der echte 393-px-App-Render enthält zusätzlich den bestehenden Einheit-Workspace und zeigt deshalb weniger Athleten-Rows oberhalb der Falz als der isolierte Figma-Frame; dieser Unterschied ist bewusst, weil R7B weder R6 zurückbaut noch den späteren R8-Responsive-Sprint vorzieht. Die Screenshot-Evidence liegt maschinenlokal im dokumentierten Codex-Visualizations-Pfad und ist daher weniger portabel als Repo-Assets.

## Verification

- TDD: Row-/Preview-/Filter-, Blockstatus-/Save-Lock-, Live-Beobachtungs- und Fokus-Rückkehr-Verträge zuerst rot, danach grün.
- Fokussierte Regression: 5 Testdateien / 85 Tests gruen, inklusive Training, Check-in, Today, Shared Component Kit und OnField Components.
- `npm run typecheck`: gruen.
- `npm run lint`: gruen.
- `npm run build`: gruen; bekannte Hauptchunk-Warnung bei 506.03 kB bleibt ausserhalb R7B.
- `npm run qa:local`: gruen; Supabase-Audit, Typecheck, Lint, 99 Testdateien / 685 Tests, Build, PWA-E2E und Sprint-19-Visual-QA liefen.
- PWA-E2E: iPhone 375/393, Medium 744, iPad 834/1194 sowie Lazy Screens, Deep Links und History gruen.
- Sprint-19-Signed-in: wegen fehlender `FIELD_HUB_E2E_EMAIL`/`FIELD_HUB_E2E_PASSWORD` geskippt und nicht als Beta-/Signed-in-Gate gewertet.
- Separate synthetische Signed-in-Matrix: 375/393/834/1194 in Light/Field Mode, je 6 Rows, 1 Primary, 0 Legacy-Rows, 0 horizontales Overflow, R7B-Core-Controls mindestens 44 px.
- Authentifizierte App, read-only: 20 reale Athleten bei 375/393/834/1194 in Light und Field Mode; gleiche 20 Detail-Trigger, 6 Filter, 1 Primary, 0 Legacy-Rows, 0 horizontales Overflow und mindestens 44 px hohe R7B-Core-Controls. Preview-Rows blieben `Offen`; Gelb/Rot blendete unberührte Suggestions korrekt aus; Fokus-Rückkehr aus dem Detail-Sheet war erfolgreich.
- Aus Datenschutzgründen wurden aus der authentifizierten App keine Screenshots mit echten Spielernamen gespeichert. Login und Theme wurden nach QA zurückgesetzt und die Session ausgeloggt; keine Trainings-/Spielerdaten wurden mutiert.
- Field-Mode-Kontrast der offenen AthleteRow: 14,87:1.
- `qa:beta`: nicht ausgefuehrt; R7B aendert keine Remote-/Public-/Kiosk-Vertraege. Ein Skip gilt nicht als Beta-Freigabe.
- `git diff --check`: gruen.
- Zwei unabhängige Reviews: echte Preview-Semantik/Filter, Statuswechsel mit vorhandenem Grund, realer Block-Save-Lock, ehrliches Live-Beobachtungsfeedback, Fokus-Rückkehr, Danger-Markierung, relevante Umlaute und tabellarische Live-Zahlen wurden behoben bzw. gehärtet; keine spätere Sprint-Ausweitung gefunden.

## Abweichungen

Keine Produkt-Scope-Abweichung. Gegenueber der Roadmap-Dateiliste wurde `LiveSessionStepper.tsx` bewusst mitgeaendert, weil die R7B-Live-Block-Aktionen dort implementiert sind; `index.css` enthaelt den zugehoerigen Token-/Responsive-Vertrag. Das Evidence-Dokument ist Teil des Redesign Integrity Gate.

Prozessabweichung: Im geteilten Desktop-Workspace wurde ein isolierter Branch statt eines zusaetzlichen Worktrees verwendet. Die historische Vorher-Screenshot-Luecke wurde ehrlich dokumentiert statt mit einem nachtraeglich gestellten Zustand kaschiert.
