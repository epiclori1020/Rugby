# OnField Redesign v2 – R10 Launch-Evidence

Stand: 2026-07-14

Sprint: R10 – Politur, P2-Backlog & Launch-Evidence

Route: A – Heritage Field Instrument

## Ergebnis

R10 schliesst die Redesign-v2-Serie R1-R10 code- und funktionsseitig ab. Die geaenderten Analyse-, Export-, Returner-, Spieler- und Einstellungsflaechen verwenden gemeinsame Lade-/Leer-/Fehlerzustaende, eine ruhigere Informationshierarchie und funktionale, Reduced-Motion-sichere Interaktion. Der unabhaengige Abschluss-Audit hat Initial-Loading, destruktive Partial-Success-Grenzen und technische Rohfehler nachgeschaerft. Es wurden keine neuen Produktfelder, keine neue Route, keine Supabase-Migration und kein medizinischer Entscheidungsflow eingefuehrt. Das historische Screenshot-/Launch-Evidence-Gate ist wegen der unten benannten R5-/R7- und authentifizierten Matrixluecken nicht vollstaendig geschlossen.

## UX-Intent und Umsetzung

| Bereich | Vor R10 | Nach R10 |
|---|---|---|
| Analyse | Exakte Ergebnislisten ohne visuellen Wochenverlauf | Zwei leichte, zugaengliche SVG-Diagramme fuer Wochenbelastung und Belastungsarten; die exakten Listen bleiben darunter die Datenreferenz. |
| First Load | Uneinheitliche oder sofortige Ladeanzeige | Gemeinsamer 300-ms-Delay verhindert Flackern; Skeletons erscheinen erst bei wahrnehmbarer Wartezeit. |
| Empty/Error | Screen-lokale Muster | Gemeinsame `EmptyState`-/`ErrorState`-Varianten fuer Surface und Inline-Kontext mit Retry/Details. |
| Export & Backup | JSON und CSV visuell zu gleichrangig | Vollbackup ist die eine dominante Primaerhandlung; CSV-Auswahl ist standardmaessig geschlossen und sekundaer; Import bleibt ein separates Sheet. |
| Spieler loeschen | Browser-`window.confirm` | Zugaengliches In-App-Sheet mit klarer Konsequenz, Abbruch, einmaliger Bestaetigung und ehrlichem Fehlerzustand. |
| Returner/Settings | Lokale Rohfehler und sofortige Ladewechsel | Shared Error State, Retry und delayed Skeleton; die vier vorhandenen Caps bleiben als strukturierte Zeilen statt KPI-Card-Wall erhalten. |
| Motion/Haptik | Sheet ohne orchestrierten Eintritt | Tokenisierte Backdrop-/Sheet-Bewegung; bei `prefers-reduced-motion` deaktiviert. Haptik nur fuer Oeffnen, Erfolg und Fehler der destruktiven Aktion. |
| Skalen | Numerische Readiness-, sRPE- und Beschwerde-Chips ohne durchgaengig sichtbare Endpunkte | Coach-Flows zeigen kompakte 1/5- beziehungsweise 0/10-Anker; Self-Check-in behaelt seine vorhandenen ausfuehrlicheren Skalenhinweise. |
| Trust/Fehler | Technische Storage-/Sync-Meldungen konnten in neuen R10-States sichtbar werden | Coach-sichere kontextspezifische Copy; Dexie-/PostgREST-/Policy-Details werden in den neuen R10-Fehlerflaechen nicht gerendert. |

## Redesign Integrity Gate

- Eine dominante Primaerhandlung: JSON-Vollbackup bleibt primaer; CSV und Import sind sekundaer.
- Row-first: Spieler- und Returner-Objekte bleiben Rows; R10 fuegt keine Athleten-Card-Wall ein.
- Card-Dichte: Analysecharts sind zwei fokussierte Datenflaechen in einem Panel, keine neue Dashboard-Kachelwand.
- Status: Diagrammlegende und Zustaende nutzen Text/Form plus Farbe; kein Status ist color-only.
- Branding: Live-Coaching bleibt ruhig; kein Hero, kein Oxblood-Status, keine KI-generierte operative UI.
- Tokens/Typografie: Produktions-CSS nutzt bestehende `--of-*`-Tokens; keine neuen rohen Farben, keine neuen rohen Fontgroessen und keine Gewichte 850/900.
- Sprache: Der R10-Sweep entfernt ASCII-Umschreibungen aus den angefassten sichtbaren Texten und fuehrt keine Diagnose-/Freigabesprache ein.
- PWA-Paritaet: iPhone und iPad behalten denselben fachlichen Umfang; nur Layout und Progressive Disclosure unterscheiden sich.

## Visuelle Evidence

Primaere Referenz ist das bestehende Figma-File. R10 liegt dort als editierbarer Frame `R10 · Politur + Launch Evidence` (`86:2`) mit Analyse in 393 px Light/Field Mode sowie Export, States und destruktivem Sheet in 834 px Light/Field Mode:

- Figma: `https://www.figma.com/design/BBaL4jQKLHeOC7tP5lajdW?node-id=86-2`
- Repo-Snapshot: `docs/field-hub/assets/r10/onfield-r10-figma-reference.png`
- Vorher-/Kontext-Evidence: `docs/field-hub/2026-07-12_onfield_r8_responsive_field_mode_analysis_more_audit.md`
- Brand-/Field-Mode-Evidence: `docs/field-hub/2026-07-13_onfield_r9_brand_surfaces_wordmark_display_font_audit.md`

Die lokale Browsermatrix prueft 375, 393, 744, 834 und 1194 px in Light und Field Mode, inklusive horizontalem Overflow, Touch-Targets, Fokus, Kontrast, PWA-Navigation und Reduced Motion. Sie rendert in `qa:local` jedoch bewusst nur den signed-out Welcome-Vertrag. Im Abschluss-Audit wurden Analyse bei 393 px Light, Export bei 834 px Field Mode, Returner sowie das destruktive Spieler-Sheet mit dem autorisierten Testkonto read-only in der echten App geprueft. Die zwei temporaeren Screenshots enthalten keine Spielernamen und werden nicht ins Repo uebernommen; Account- und Teamdaten bleiben damit ausserhalb dauerhafter Evidence.

Damit ist R10 browserseitig fuer die geprueften Hauptzustaende belastbar, aber nicht als vollstaendige persistierte authentifizierte 375/393/834/1194-Light-/Field-Matrix zu bezeichnen. Historisch bleiben zudem das in R5 ausdruecklich offene Integrity Gate, fehlende identische Vorher-Screenshots in R7A/R7B und die populated Returner-Matrix aus R7C offen. Figma-, DOM- und Git-Parent-Evidence sind sinnvoll, ersetzen diese ausdruecklich geforderten Screenshot-Artefakte aber nicht.

Bildgenerierung wurde nach dem visuellen Review nicht ausgefuehrt. R10 benoetigte kein neues Brand-, Splash-, Install- oder Kiosk-Rasterasset; ein ungenutztes KI-Konzeptbild waere kein projektgebundenes Deliverable gewesen. Figma blieb daher die primaere visuelle Quelle, und operative UI wurde ausschliesslich mit React, CSS, SVG, Tokens und bestehenden Komponenten gebaut.

## P0/P1-Coverage

Die Roadmap-Tabelle bleibt die Coverage-SSOT. R10 bestaetigt den Abschluss beziehungsweise die transparent dokumentierte Grenze:

- R5: `docs/field-hub/2026-07-10_onfield_r5_squad_heute_audit.md`
- R6: `docs/field-hub/2026-07-10_onfield_r6_unit_cockpit_audit.md`
- R7A-R7D: die vier R7-Audits vom 2026-07-10 bis 2026-07-13
- R8: `docs/field-hub/2026-07-12_onfield_r8_responsive_field_mode_analysis_more_audit.md`
- R9: `docs/field-hub/2026-07-13_onfield_r9_brand_surfaces_wordmark_display_font_audit.md`
- R10: dieses Dokument

P0/P1-Regeln fuer Kiosk, ehrliches Save-Feedback, Returner im Live-Loop, Rohcopy, Typografie, Row-first, Field Mode, Onboarding, iPhone-Erfahrung und PWA-Paritaet wurden funktional nicht aufgeweicht. Die oben dokumentierten historischen Evidence-Grenzen bleiben davon getrennt offen.

## P2-Klassifizierung

| P2-Punkt | R10-Entscheidung |
|---|---|
| Leichte Analysecharts | Umgesetzt als native React/SVG-Diagramme ohne neue Chart-Library. |
| Export-/Backup-IA | R10-Hierarchie umgesetzt; weitere IA erst nach externer Coach-Evidence. |
| Micro-Motion/Haptik | Funktionales Mindestset umgesetzt; feinere Choreografie bleibt spaeter und evidenzgetrieben. |
| Skalen-Anker | Umgesetzt fuer die numerischen Coach-Skalen in Check-in und Nachbereitung; Self-Check-in hatte bereits sichtbare Endpunkt-/Bereichshinweise. |
| Externe Brand-Assets | Nicht-Ziel dieses Sprints; Landingpage/App-Store/SaaS bleiben ausserhalb der Redesign-v2-App-Roadmap. |

## Verifikation

- `npm run qa:local`: gruen.
  - Supabase-Audit: gruen; keine Migration/RLS-Aenderung.
  - Typecheck: gruen.
  - Lint: gruen.
  - Tests: 111 Dateien, 754 Tests, alle gruen.
  - Production Build/PWA-Precache: gruen; bestehende Chunk-Warnung ueber 500 kB bleibt ein nicht-blockierender Build-Hinweis.
  - PWA-E2E: gruen fuer 375/393/744/834/1194.
  - Sprint-19-Visual-QA: gruen fuer Light/Field Mode; authentifizierte Matrix bleibt dem expliziten Beta-Gate vorbehalten.
- Gezielte R10-/Audit-Suite: 12 Dateien, 115 Tests, gruen.
- Figma-Review: Frame `86:2` visuell geprueft; unbeabsichtigte helle Field-Mode-Flächen wurden entfernt.
- Authentifizierter read-only Browser-Audit: Analyse 393 Light, Export 834 Field Mode, Returner und Spieler-Delete-Sheet geprueft; kein horizontales Overflow, eine Primärhandlung, zwei zugaengliche Analyse-SVGs, CSV standardmaessig geschlossen, ehrliche Offline-/Sync-Copy und keine sichtbaren technischen Rohfehler. Die Löschung wurde nicht bestätigt und es wurden keine Daten mutiert.
- `qa:beta`: nicht ausgefuehrt und nicht als Erfolg gewertet. R10 aendert keine Auth-/Kiosk-/Public-/RLS-Logik; das Gate mutiert kontrolliert Remote-Fixtures und hatte in diesem Lauf kein ausdrueckliches Opt-in.
- Physische iPhone-/iPad-Safari-Safe-Area: in diesem Lauf nicht verfuegbar; die maschinelle Viewport-/PWA-Matrix ist gruen.
- Production Deploy: Vercel-Deployment `dpl_BU5fVGrxfGBYPaef7EkGn42TaRN6` ist `READY` und auf `https://field-hub-beta.vercel.app` aliased. Der Remote-Build ist gruen; die ausgelieferten Analyse-, Export- und Loading-Bundles wurden per HTTP 200 und R10-Markern verifiziert. Deployment-Input war ein temporaeres, secret-freies Paket aus ausschliesslich `src`, `public` und den notwendigen Paket-/TypeScript-/Vite-Konfigurationen.

## Planabweichungen

1. Statt eines separaten Worktrees wurde ein eigener Branch `codex/r10-polish-launch-evidence` im bereits geteilten Workspace verwendet. Das vermeidet eine zweite Dependency-/Runtime-Kopie; fremde Aenderungen waren beim Start nicht vorhanden.
2. Das diskutierte Image-Generation-Konzeptboard wurde nach dem Figma- und Asset-Audit nicht erzeugt. Es gab keinen neuen erlaubten Rasterasset-Bedarf; die visuelle R10-Referenz wurde editierbar in Figma aufgebaut.
3. Returner-Caps wurden nicht erneut modelliert. R7C hatte bereits vier strukturierte Cap-Zeilen geliefert; R10 hat deren Lade-/Fehlerverhalten poliert, statt ein unnoetiges Datenmodell- oder UI-Rewrite einzufuehren.
4. Der unabhaengige Abschluss-Audit hat ueber die urspruengliche Dateiliste hinaus `CheckInView`, `PostSessionView` und die Delete-Commit-Grenze in `usePlayers` geaendert. Das ist keine neue Produktfunktion, sondern schliesst den bereits im P2-Audit genannten Skalen-Anker sowie zwei R10-Trust-/Partial-Success-Regressionsrisiken.
5. Der erste Vercel-Dry-Run am Repo-Root wurde vor jedem Upload abgebrochen, weil er lokale QA- und projektfremde Dateien eingeschlossen haette. Der produktive Deploy nutzte deshalb ein temporaeres minimales Build-Paket; keine Workspace-Datei, Remote-Umgebungsvariable oder Vercel-Projekteinstellung wurde dafuer veraendert.

## Offene Risiken nach R10

- Vor externer Beta braucht es eine frisch autorisierte echte `qa:beta`-Ausfuehrung; ein Skip ist kein Beta-Gate.
- Die persistierte authentifizierte R10-Appmatrix sowie die historischen R5-/R7A-R7C-Vorher-/Nachher-Evidence-Luecken bleiben offen; Code-/Funktionsabschluss ist nicht gleich vollstaendiger Launch-Evidence-Abschluss.
- Authentifizierte Screenshots mit realen Account-/Spielerdaten werden weiterhin nicht ins Repo persistiert.
- Weitere Export-IA, Motion und externe Brand-Assets bleiben bewusst evidenzgetriebenes Folge-Backlog, nicht ein versteckter R11-Sprint.
