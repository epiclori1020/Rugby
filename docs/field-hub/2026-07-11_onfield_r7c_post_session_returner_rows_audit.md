# OnField R7C Nachbereitung & Returner Rows - Evidence

Stand: 2026-07-11

## Scope

Umgesetzt ist ausschliesslich Redesign-v2 R7C: Die Nachbereitung besitzt einen kompakten Status-Strip und eine row-first Aufgabenqueue mit iPhone-Sheet beziehungsweise iPad/Desktop-Pane. Returner nutzt gemeinsame `AthleteRow`s, eine direkt bedienbare Stufensteuerung sowie vier strukturierte Cap-Zeilen, ohne das bestehende String-Datenmodell umzubauen.

Ausserhalb: R7D Spieler/Profil, R8 Responsive-Gesamtrefactor, R9 Brand-Surfaces, R10 vollstaendige Cap-Datenstruktur, neue Produktfelder, Routen, Supabase-Schema/RLS/Migrationen, Analyse, Brand-/Bildassets und medizinische Diagnose- oder Freigabesprache.

## UX- und Komponentenvertrag

- Nachbereitung zeigt Spieler, nachbereitete Eintraege, Follow-ups und Status als kompaktes semantisches `dl` statt KPI-Card-Wall.
- Pflichtaufgaben bleiben `TaskQueueRow`s. iPhone oeffnet eine Aufgabe explizit im `Sheet`; ab Medium/iPad bleibt die Liste neben einer sticky Aufgabenpane sichtbar.
- Wird eine ausgewaehlte Aufgabe durch Speichern erledigt, springt die Detailpane nicht still zur naechsten Aufgabe, sondern fuehrt den Fokus zur Queue zurueck. Dauer- und screenweite Save-Rueckmeldungen bleiben am sticky Abschluss sichtbar; taskbezogenes Feedback bleibt an der Aufgabe.
- Das gemeinsame `Sheet` bindet Titel/Beschreibung, schliesst per Escape, haelt den Fokus im Dialog und gibt ihn beim Schliessen an den Ausloeser zurueck.
- Returner-Athleten sind `AthleteRow`s mit Readiness-Form, Aufgabenhinweis, Text/Glyph-Status und separater Oeffnen-Aktion.
- Die Returner-Stufe ist eine beschriftete Segmented-Steuerung. Speed, COD/Decel, Conditioning und Kontakt sind vier zeilenartige Cap-Eintraege mit sichtbarem `Offen`/`Erfasst`-Status; gespeichert werden weiterhin die vorhandenen String-Felder.
- Returner-Saves sind pro Row serialisiert: Waehrend eines Saves sind die uebrigen Controls gesperrt, und ein fehlgeschlagener Cap-Save setzt den sichtbaren Wert auf den gespeicherten Stand zurueck.
- Plan/Ist, Reaktion/naechster Morgen, Entscheidung, Verlauf und Safety bleiben erhalten. Verlauf ist als Divider-Liste statt verschachtelter Card-Wall gestaltet.
- Beide Screens behalten genau eine dominante Primaerhandlung; iPhone und iPad haben denselben fachlichen Umfang.

## Redesign Integrity Gate

- Row-first: Returner rendert `.of-athlete-row`; die alte `TaskQueueRow`-Athletenliste ist entfernt. Nachbereitung bleibt fachlich eine Task-Queue und nutzt das dafuer vorgesehene Row-Primitive.
- Dominante Handlung: Browser- und Markup-Pruefung ergaben exakt eine `.of-button-primary` pro View.
- Card-Wall: Status-Kacheln der Nachbereitung wurden durch einen Summary-Strip ersetzt; Returner-Caps und Verlauf sind Rows/Divider.
- Token-/Typo-Audit: neue Regeln verwenden vorhandene `--of-*`-Tokens; keine neuen rohen Farben, Font-Sizes oder Gewichte 850/900.
- Status/A11y: Status wird durch Form/Glyph/Text und Farbe vermittelt; Sheet besitzt Dialogname, Beschreibung, Escape, Fokusfang und Fokus-Rueckgabe.
- Statussemantik: Ein neutraler laufender Returner wird als `Beobachten` dargestellt; nur abgeschlossene/positive Zustaende erscheinen als `Geklaert`. Zahlen in Cap-Feldern und -Verlauf verwenden tabellarische Ziffern.
- Kontrast der verwendeten Basispaare: Light Primary 17,96:1, Light Secondary 5,72:1, Field Primary 14,87:1, Field Secondary 6,81:1, Field Danger 15,22:1.
- Branding/Copy: keine Hero-/Marketingflaeche, kein Neon, kein Oxblood als operative Brandfarbe und keine Diagnose-/Return-to-Play-Freigabe.

## Figma- und visuelle Evidence

Primaere visuelle Referenz ist das OnField-Figma-File `https://www.figma.com/design/BBaL4jQKLHeOC7tP5lajdW`, Seite `R7C – Nachbereitung & Returner Rows` (`46:2`). Vor dem Bau wurde das vorhandene Figma-Designsystem durchsucht; es gab keine publizierten Komponenten/Variablen, daher wurden die dokumentierten Code-/SSOT-Tokens und R7A/R7B-Patterns verwendet.

Nachbereitung:

- Light: `47:2` (375), `47:126` (393), `47:250` (834), `47:374` (1194).
- Field Mode: `47:64` (375), `47:188` (393), `47:312` (834), `47:436` (1194).

Returner:

- Light: `48:2` (375), `48:174` (393), `48:346` (834), `48:518` (1194).
- Field Mode: `48:88` (375), `48:260` (393), `48:432` (834), `48:604` (1194).

Die Frames wurden nach einem Auto-Layout-Fix erneut visuell geprueft. Als ehrliche Vorher-Evidence dienen der reproduzierbare Git-Parent `e1d78b1`, die bisherige `metric-grid`-/Inline-Select-/Card-Struktur und der Live-Audit. Ein identischer historischer Vorher-Screenshot wurde nicht nachtraeglich gestellt.

Die authentifizierte App wurde read-only bei 393, 834 und 1194 px in Light/Field Mode geprueft. Der iPhone-Task-Dialog, das iPad-Zweispaltenlayout, der Desktop-Field-Mode, Fokus, eine Primaerhandlung und horizontales Overflow wurden kontrolliert. Der echte Account enthielt im gewaehlten Kontext keine Returner-Aufgabe; populated Returner-Rows/Caps wurden deshalb ueber Figma und Komponenten-Tests belegt, nicht mit echten Spielerdaten in Screenshots. Es wurden keine authentifizierten Screenshots persistiert. Damit ist die persistierte React-Vorher/Nachher-Matrix mit befuellter Returner-Row weiterhin eine offene Evidence-Luecke und kein bestandenes Gate. Login, Theme und Viewport wurden zurueckgesetzt und die Session ausgeloggt.

Bild-KI wurde bewusst nicht genutzt: R7C gestaltet operative UI-Struktur, keine Brand-/Marketing-/Kiosk-/Install-Rasterassets.

## Verification

- TDD: neue R7C-Markup-/Sheet-/Row-/Cap-Vertraege zuerst rot, danach gruen.
- Fokussiert: 3 Testdateien / 12 Tests gruen. Die interaktiven Regressionen decken Sheet-Fokus, entfernte Aufgabenauswahl, lokale/screenweite Save-Rueckmeldung, Save-Serialisierung, Cap-Rollback und neutrale Returner-Semantik ab.
- Vollstaendiges `npm run qa:local`: nach dem Review erneut gruen; Supabase-Audit, Typecheck, Lint, 100 Testdateien / 691 Tests, Build, PWA-E2E und Sprint-19-Visual-QA liefen.
- PWA-E2E: 375, 393, 744, 834 und 1194 px; Lazy Screens, Deep Links und History gruen.
- Sprint-19-Visual-QA: 11 Screens an allen Pflichtbreiten gruen. Signed-in wurde im generischen Script mangels Env-Credentials geskippt und nicht als Beta-Gate gewertet; die separate authentifizierte R7C-Pruefung lief erfolgreich.
- Browser: mobile Task-Sheet-Interaktion, iPad Pane, Field Mode, kein horizontales Overflow, exakt eine Primaerhandlung und frische Console ohne Fehler.
- Build: gruen; bekannte Hauptchunk-Warnung bei 507,66 kB bleibt ausserhalb R7C.
- `qa:beta`: nicht ausgefuehrt; R7C aendert keine Remote-/Public-/Kiosk-/RLS-Vertraege. Ein Skip gilt nicht als Beta-Freigabe.
- `git diff --check`: gruen.

## Abweichungen

Keine Produkt-Scope-Abweichung. Gegenueber der Roadmap-Dateiliste wurden `Sheet.tsx`, `Sheet.test.tsx`, `Rows.tsx`, `index.css`, Component Inventory und dieses Evidence-Dokument bewusst mitgeaendert: Sie tragen den notwendigen mobilen Aufgaben-Dialog, den Row-Key-Fix, den responsive/tokenisierten Vertrag und das verpflichtende Redesign Integrity Gate.

Prozessabweichung: Im geteilten Desktop-Workspace wurde ein isolierter Branch statt eines zusaetzlichen Worktrees verwendet. Eine vollstaendige persistierte React-Screenshotmatrix mit synthetischem Returner-Datensatz wurde nicht als Dev-Feature in die App eingebaut; Figma-Frames, Komponenten-Tests, PWA-Matrix und die datenschutzkonforme read-only Live-Pruefung bilden die vorhandene kombinierte Evidence, ersetzen das offene Screenshot-Gate aber nicht vollstaendig.
