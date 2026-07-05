# OnField Design System

Stand: 2026-07-05

## Zweck

Dieses SSOT definiert die verbindlichen Designsystem-Regeln fuer OnField Coach. Es beschreibt Tokens, Layout-Regeln und Accessibility-Grenzen, ohne App-Code oder Figma-Artefakte in Sprint 0B zu bauen.

## Verbindliche Regeln

- Designrichtung: ruhige iPadOS Performance Console mit Field-Operations-DNA.
- Live-Coaching ist list-/row-first. Cards sind sekundaer fuer fokussierte Metriken, Empty States, Analyse-Module und Dialogkontext.
- Jede View hat genau eine dominante Primaerhandlung oberhalb der Falz.
- Status wird nie nur ueber Farbe kommuniziert.
- Operational UI nutzt Systemfont.
- Light Mode ist v1-Prioritaet. Dark Mode wird erst nach stabilen Kernflows bewertet.
- Keine zufaelligen Farben, Radiuswerte, Shadows oder Spacing-Werte ausserhalb des Token-Systems.
- Oxblood ist Brand-/Editorial-Akzent und nie Status-, Alarm- oder Follow-up-Farbe.
- Field-Operations-DNA wird ueber Layout, Gruppierung, Session Flow und Zonenlogik getragen, nicht ueber dekorative Feldlinien als Wallpaper.

## Tokens

### Code-Mapping ab Sprint 4

Sprint 4 implementiert die Token-Grundlage in `app/field-hub/src/design/tokens.css`. Der Code nutzt die Prefix-Konvention:

| Gruppe | Prefix | Beispiel |
|---|---|---|
| Farbe | `--of-color-*` | `--of-color-brand-primary` |
| Spacing | `--of-space-*` | `--of-space-lg` |
| Radius | `--of-radius-*` | `--of-radius-sm` |
| Border | `--of-border-*` | `--of-border-width-default` |
| Elevation | `--of-shadow-*` | `--of-shadow-panel` |
| Motion | `--of-motion-*` | `--of-motion-duration-tap` |

Bestehende Legacy-Aliases wie `--bg`, `--surface`, `--brand`, `--warning`, `--ok` und `--shadow` bleiben als Kompatibilitaetsschicht bestehen und mappen auf `--of-*` Tokens. Neue CSS-Werte sollen direkt die `--of-*` Tokens nutzen.

Das versionierte Token Sheet liegt in `docs/field-hub/onfield_token_sheet.md`. Die technische Wahrheit bleibt `tokens.css`; Figma spiegelt die Tokens nur als visuelles Arbeitsartefakt.

### Farbe

| Rolle | Wert | Einsatz |
|---|---:|---|
| `accent/primary` | `#1F6B5C` | Primaeraktionen, aktive Navigation |
| `accent/secondary` | `#7A1F2B` | Brand-/Editorial-Akzent auf Brand-Surfaces, nicht fuer Status |
| `bg/base` | `#F4F5F3` | App-Hintergrund |
| `surface/default` | `#FFFFFF` | Hauptflaechen |
| `border/default` | `#D9DED8` | ruhige Trennung |
| `text/primary` | `#131815` | Primaertext |
| `text/secondary` | `#5E6961` | Meta, Helper, sekundaere Labels |
| `status/success` | `#1D7A46` | ok, synchronisiert, gruene Synthese |
| `status/warning` | `#D39A2B` | beobachten, modifizieren |
| `status/danger` | `#B42318` | stoppen, abklaeren, destruktiv |
| `status/info` | `#155EEF` | technische Information |
| `focus/ring` | `#005FCC` | Fokusindikator |

### Typografie

| Ebene | iPhone | iPad | Einsatz |
|---|---:|---:|---|
| Display | 28/32 | 34/40 | Hauptscreen, Profilkopf |
| Titel | 22/28 | 28/34 | Hauptsektionen |
| Section Title | 18/24 | 22/28 | Listenabschnitte, Paneltitel |
| Body | 16/22 | 17/24 | Standardtext |
| Secondary | 14/20 | 15/22 | Metadaten, Zeit, Position |
| Caption | 12/16 | 13/18 | Helper, Badges |
| Metric XL | 24/28 | 28/32 | zentrale Kennzahlen |
| Metric M | 18/22 | 20/24 | kleinere KPIs |

Regeln:

- Keine funktional wichtigen Texte in Mikrotext.
- Spielername, Status, Warnung, Einheit-Kontext und Primaeraktionen muessen schnell lesbar bleiben.
- Zahlen fuer Scores, Load, Reps, Caps und Tabellen nutzen tabular numerals.
- Maximal drei sichtbare Textgewichte pro Screen.

### Spacing und Layout

| Token | Wert |
|---|---:|
| `space/xs` | 4 |
| `space/sm` | 8 |
| `space/md` | 12 |
| `space/lg` | 16 |
| `space/xl` | 24 |
| `space/xxl` | 32 |

Regeln:

- iPhone horizontal: 16 px Standard, 20 px auf Detail-Screens.
- iPad Content: 24 px Standard, 28-32 px in Detailpanels.
- Listen-Dichte Standard: 60-68 px Zeilenhoehe.
- Live-Modus: 64-72 px Zeilenhoehe, maximal zwei Metazeilen.
- Analyse-Modus: 72-88 px Bloecke, mehr Luft fuer Filter und Charts.
- iPad Sidebar: 280-320 px.
- iPad Main Content: 520-760 px.
- iPad Detailpane: 360-420 px.

### Radius, Border, Elevation

| Rolle | Wert |
|---|---:|
| Buttons/Inputs | 10-12 px |
| Panels/Cards | 14-18 px |
| Sheets/Modals | 18-24 px |
| Pills/Chips | volle Rundung |
| Border | 1 px |

Regeln:

- Surface-Unterschiede und Borders sind primaere Hierarchie.
- Shadows nur fuer Sheets, Popovers und Dialoge.
- Keine verschachtelten Cards.

### Motion

| Fall | Dauer |
|---|---:|
| Tap/Selection | 120-160 ms |
| Button/Chip Feedback | 120-180 ms |
| Sheet/Drawer | 180-240 ms |
| Panel/Screen Transition | 200-280 ms |

Motion ist funktional und ruhig. Kritische Screens nutzen keine verspielten oder federnden Animationen.

## Breakpoints und Plattformlogik

- `compact`: < 600 px
- `medium`: 600-839 px
- `expanded`: >= 840 px

Regeln:

- Layout folgt verfuegbarer Fensterbreite, nicht nur Geraetelabel.
- iPhone nutzt Bottom Tab Bar plus Stacks/Sheets.
- iPad nutzt Sidebar plus Content plus optional Detailpane.
- Feature-Paritaet zwischen iPhone und iPad ist verpflichtend.

## Touch Targets und Accessibility

- Interaktive Ziele mindestens 44 x 44 px.
- Feldkritische Aktionen 48-56 px hoch.
- Kleine Targets brauchen mindestens 8 px Abstand.
- Textkontrast mindestens 4.5:1.
- Grosse Schrift und Fokusindikatoren mindestens 3:1.
- Fokus ist sichtbar und darf nicht verdeckt werden.
- Labels stehen ueber Eingabefeldern.
- Fehler erscheinen inline am Feld mit konkreter Korrekturhilfe.
- Dynamische Save-/Sync-/Fehlermeldungen werden als Status/Live-Regionen angekuendigt.
- Safe Areas werden ueber `viewport-fit=cover` und `env(safe-area-inset-*)` beruecksichtigt.
- Bottom Bars und Floating Actions duerfen nicht am iPhone Home Indicator kleben.

## State Tokens und Zustandslogik

| Zustand | Regel |
|---|---|
| Active | Text/Icon plus deutlicher tonaler Zustand |
| Selected | nicht nur Farbe, auch Border/Background/Label |
| Disabled | sichtbarer Grund erforderlich |
| Loading | Skeleton ab ca. 300 ms fuer Listen/Panels |
| Empty | ein Satz, eine direkte Aktion |
| Error | kurzer Fehlertext, Retry, optionale Details |
| Offline | eigener Offline-Zustand, keine Browser-Offline-Seite |
| Pending Sync | sichtbar, aber nicht dominant |

## Nicht-Regeln

- Dieses Dokument ersetzt kein spaeteres Komponentenbibliothek-Artefakt.
- Das Figma Token Sheet aus Sprint 4 ist visuelle Referenz, nicht die technische Quelle der Wahrheit.
- Dark Mode, neue UI-Library und Native-Komponenten sind nicht Teil von Sprint 4.

## Offene Fragen

- Welche Icons werden als Standardset festgelegt?
- Wann werden die Core Components auf die Token-Schicht gemappt?
