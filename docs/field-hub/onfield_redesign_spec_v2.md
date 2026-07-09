# OnField Redesign Spec v2 — „Heritage Field Instrument" (Route A)

Stand: 2026-07-08 · Typ: buildbare Design-Spec (agentenlesbar) · Route A = Execute + Elevate (Decision Log 2026-07-08)

## Zweck & Nutzung

Dies ist die **konkrete, umsetzbare Spezifikation** fuer den OnField-Redesign-Zyklus. Sie uebersetzt das visuelle Konzept in exakte Tokens, Komponenten- und Screen-Regeln, damit ein Agent (Codex/Claude Code) direkt bauen kann — ohne das Bild zu sehen. Sie ergaenzt und praezisiert die SSOTs; bei Konflikt gelten die verbindlichen Entscheidungen aus `onfield_decision_log.md` und `onfield_brand_kit.md`.

- Visuelle Referenz (nur fuer Menschen/Abgleich): `docs/field-hub/2026-07-08_onfield_redesign_concept.html`. Dessen CSS enthaelt dieselben Werte; diese MD ist die verbindliche Textquelle.
- Audit-/Diagnose-Grundlage: `docs/field-hub/2026-07-08_onfield_design_audit_live.md`.
- Technische Token-Wahrheit bleibt `app/field-hub/src/design/tokens.css`; diese Spec definiert, was dort v2 ergaenzt wird.

## Leitprinzip (nicht neu erfinden, sondern bauen)

Das dokumentierte Designsystem (`onfield_design_system.md`) ist gut, der Code weicht ab. Diese Spec schliesst die Luecke + aktiviert erlaubte Premium-Hebel. **Kein Neon, keine lauten Live-Screens.** Differenzierung entsteht aus Craft + Signature.

Verbindliche Regeln (aus SSOTs, hier scharf gestellt):
- **Row-first:** Live-Coaching = Listen/Rows; Cards nur fuer Fokus-Metriken, Empty States, Analyse, Dialoge. Keine Card-Walls.
- **Genau eine dominante Primaerhandlung pro View**, oberhalb der Falz. Destruktives hinter Overflow.
- **Max. 3 sichtbare Textgewichte pro Screen.**
- **Tabellarische Zahlen** fuer Scores/Load/Reps/Caps/Tabellen.
- **Status nie nur ueber Farbe:** immer Farbe + Text + Glyph/Form.
- **Oxblood** nur auf Brand-Surfaces (Welcome/Login/Install/Splash/Kiosk-Welcome/Empty-Demo), nie Status, nie in Live-Screens.
- **Hero/Marketing** nur auf Brand-Surfaces; Live-Screens ruhig/operativ.

---

## 1. Farb-Tokens v2

Namenskonvention bleibt `--of-color-*` (siehe `onfield_token_sheet.md`). **Light bleibt Field Graphite** (unveraendert). **Neu: Dark „Field Mode".**

### 1.1 Light (`:root`, unveraendert — Referenz)
| Token | Wert |
|---|---|
| `--of-color-brand-primary` | `#1F6B5C` |
| `--of-color-brand-primary-strong` | `#155448` |
| `--of-color-brand-primary-soft` | `#DCEBE7` |
| `--of-color-brand-secondary` (Oxblood) | `#7A1F2B` |
| `--of-color-bg-base` | `#F4F5F3` |
| `--of-color-surface-default` | `#FFFFFF` |
| `--of-color-surface-muted` | `#EEF2EF` |
| `--of-color-border-default` | `#D9DED8` |
| `--of-color-text-primary` | `#131815` |
| `--of-color-text-secondary` | `#5E6961` |
| `--of-color-on-brand` (neu) | `#FFFFFF` |
| `--of-color-status-success` | `#1D7A46` |
| `--of-color-status-warning` | `#D39A2B` |
| `--of-color-status-danger` | `#B42318` |
| `--of-color-status-info` | `#155EEF` |
| `--of-color-focus-ring` | `#005FCC` |

### 1.2 Dark „Field Mode" (NEU)
Implementieren als Token-Override unter **beiden**: `@media (prefers-color-scheme: dark)` **und** `:root[data-theme="dark"]` (Toggle gewinnt). Zusaetzlich `color-scheme: light dark;` auf `:root`. Light zusaetzlich unter `:root[data-theme="light"]` fixieren, damit der Toggle in beide Richtungen ueberschreibt.

| Token | Dark-Wert | Notiz |
|---|---|---|
| `--of-color-bg-base` | `#0C110E` | „Night Pitch", gruen-getoenter Near-Black |
| `--of-color-surface-default` | `#151D18` | primaere Flaeche |
| `--of-color-surface-muted` | `#1B241E` | Sidebar/Panels |
| `--of-color-border-default` | `#28332C` | ruhige Trennung |
| `--of-color-text-primary` | `#EAF0EA` | |
| `--of-color-text-secondary` | `#9AA69D` | ≥4.5:1 auf bg pruefen |
| `--of-color-on-brand` | `#08130F` | Text auf hellem Brand im Dark |
| `--of-color-brand-primary` | `#4FB89E` | aufgehellt fuer Kontrast auf Dark (interaktiv/live) |
| `--of-color-brand-primary-strong` | `#63C6AE` | Hover |
| `--of-color-brand-primary-soft` | `#16302A` | tonale Flaeche |
| `--of-color-brand-secondary` (Oxblood) | `#CE7B82` | nur Brand-Surfaces |
| `--of-color-status-success` | `#5FC98A` | |
| `--of-color-status-warning` | `#E4B052` | |
| `--of-color-status-danger` | `#F0837A` | |
| `--of-color-status-info` | `#6FA8FF` | |
| `--of-color-focus-ring` | `#5B9BFF` | |

Regeln Dark:
- Primaer-Button: Hintergrund `--of-color-brand-primary`, Text `--of-color-on-brand` (im Dark near-black, nicht weiss).
- Feldtauglichkeit: Dark ist auch fuer Sonnenlicht gedacht; **Kontrast fuer Primaercontrols zu 7:1** anstreben (WCAG-Minimum 4.5:1 ist Untergrenze).
- Alle status-*-Werte behalten ihre Semantik; Ampel bleibt Farbe + Glyph + Text.

### 1.3 Toggle
- 3 Zustaende: `system` (default), `light`, `dark`; Auswahl persistieren (localStorage), `data-theme` auf `<html>`.
- Zugang: Einstellungen; optional schneller „Field Mode"-Umschalter im Coach-Header fuer die Sideline.

---

## 2. Typografie-Tokens v2 (groesster Hebel — heute fehlend)

**Problem:** keine Typo-Tokens; 21 hart kodierte Groessen; ~55/59 Gewichte 800–900. **Ziel:** Skala + Gewicht-Disziplin als Tokens, dann Screens darauf mappen.

### 2.1 Font-Family
| Token | Wert |
|---|---|
| `--of-font-family-system` (Body/UI, vorhanden) | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` |
| `--of-font-family-display` (NEU) | zunaechst = System-Stack (Platzhalter). Finaler Display-Font wird separat lizenziert/getestet (Decision Log: Display-UI-Font erst nach Test). |
| `--of-font-family-mono` (NEU, optional) | `ui-monospace, "SF Mono", Menlo, monospace` — **nur** fuer Daten/Eyebrows/Micro-Labels; **pending Ratifizierung** (Brand-Regel „operative UI nutzt Systemfont"). Default = System-Semibold-Uppercase, wenn nicht ratifiziert. |

### 2.2 Groessen & Zeilenhoehen
Basis = compact (iPhone). Ueber `@media (min-width: 840px)` (`expanded`/iPad) die Size-Tokens neu setzen. Zeilenhoehen als unitless Ratio (skalierungssicher).

| Rolle | Token | compact px/rem | expanded px/rem | line-height (ratio) | Einsatz |
|---|---|---|---|---|---|
| Scoreboard (NEU, Signature) | `--of-font-size-scoreboard` | 40 / 2.5 | 56 / 3.5 | 1.0 | Hero-Kennzahl (Squad-Scoreboard) |
| Display | `--of-font-size-display` | 28 / 1.75 | 34 / 2.125 | 1.14 | Hauptscreen-Titel |
| Titel | `--of-font-size-title` | 22 / 1.375 | 28 / 1.75 | 1.25 | Hauptsektionen |
| Section | `--of-font-size-section` | 18 / 1.125 | 22 / 1.375 | 1.30 | Paneltitel/Listenabschnitte |
| Body | `--of-font-size-body` | 16 / 1.0 | 17 / 1.0625 | 1.40 | Standardtext |
| Secondary | `--of-font-size-secondary` | 14 / 0.875 | 15 / 0.9375 | 1.45 | Meta/Zeit/Position |
| Caption/Label | `--of-font-size-caption` | 12 / 0.75 | 13 / 0.8125 | 1.30 | Helper/Badges/Eyebrows |
| Metric XL | `--of-font-size-metric-xl` | 24 / 1.5 | 28 / 1.75 | 1.15 | zentrale KPIs (Nicht-Hero) |
| Metric M | `--of-font-size-metric-m` | 18 / 1.125 | 20 / 1.25 | 1.20 | kleinere KPIs |

Line-height-Tokens: `--of-line-height-tight 1.14`, `--of-line-height-snug 1.25`, `--of-line-height-normal 1.40`.

### 2.3 Gewichte (Disziplin!)
| Token | Wert | Einsatz |
|---|---|---|
| `--of-font-weight-regular` | 400 | Body |
| `--of-font-weight-medium` | 500 | Body-Emphasis, sekundaere Labels |
| `--of-font-weight-semibold` | 600 | Labels, Eyebrows, Chips, Nav |
| `--of-font-weight-bold` | 700 | Section-/Panel-Titel |
| `--of-font-weight-heading` | 800 | Display/Scoreboard/Titel |

Regeln:
- **Max. 3 Gewichte pro Screen.** Body ist 400/500 (nicht 800). Nur Ueberschriften/Kennzahlen 700–800.
- **Verboten:** neue Deklarationen mit 850/900. Bestehende 800–900 auf die Tokens zuruecksetzen.
- **Zahlen:** Scores/Load/Reps/Caps/Tabellen nutzen `font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1;`. Utility-Klasse `of-num` bereitstellen.
- **Scoreboard-Numerals:** `--of-font-family-display`, `--of-font-weight-heading`, `--of-font-size-scoreboard`, tabular, `letter-spacing: -0.03em`.

---

## 3. Spacing / Radius / Elevation / Motion

Bleiben wie in `tokens.css`/`onfield_token_sheet.md` (Space 4/8/12/16/24/32; Radius xs5/sm8/md12/lg16/xl20/pill; Motion tap140/feedback160/sheet220/screen240). **Keine neuen Werte.** Regel scharf stellen: **keine Roh-px in Komponenten** — nur `--of-space-*` / `--of-radius-*`. Bestehende Roh-px (18/20/22/14/10/6 in `index.css`) im Zuge des Umbaus auf Tokens ziehen. Shadows nur fuer Sheets/Popovers/Dialoge.

---

## 4. Komponenten-Specs

### 4.1 Readiness-Dot (Signature-Device)
- Kreis 11 px (Liste) / 8 px (dicht). Farbe = Status (`success/warning/danger`).
- „Kein Check-in / keine Daten": **hohler, gestrichelter** Dot (2 px dashed, `text-secondary`) — nie gruen/neutral gefuellt.
- Immer mit Text/Chip kombiniert (nie color-only).
- Gleiches Zeichen als Punkt in der Wortmarke „OnField•".

### 4.2 Status-Chip
- Pill, 1 px Border in Status-Farbe, Label + optional Glyph. Weight 600, Caption-Groesse.
- Klassen an bestehendes `of-status-chip`/`of-traffic-chip` anlehnen; Oxblood-Chip nur fuer „Returner"-Kontext auf Brand-Surfaces, nicht als Status.

### 4.3 Athleten-Row (row-first — Kernmuster)
- Grid: `[dot 14px] [main 1fr] [sparkline auto] [chip auto]`, `gap --of-space-md`, min-height 64–72 px (Live), Radius `--of-radius-md`, Border 1 px.
- `main`: Name (Body/600) + Position (Caption/mono-optional, uppercase, `text-secondary`).
- `sparkline`: 64×22, Load-/Readiness-Trend, Linie in Status-/Brand-Farbe, betonter Endpunkt.
- `chip`: Status/Returner.
- Rot-Flag-Row: dezenter Danger-Tint-Hintergrund (`color-mix danger 8%`), Border danger 30 %.
- Ersetzt Card-Walls in Check-in/Spieler/Training-Listen.

### 4.4 Scoreboard-Strip
- Grid gleichbreiter Zellen (Kader/Anwesend/Gelb/Rot/Returner), Hairline-Divider, je Zelle: Scoreboard-Numeral + Caption-Label (mono/uppercase). Gelb/Rot/Grün-Zellen faerben nur die Zahl, nicht die Flaeche.

### 4.5 Metric-Tile
- Radius md, Border 1 px, `--of-font-size-metric-xl` (tabular) + Caption-Label. Fuer Analyse/Detail.

### 4.6 Primaer-Button
- Bestehendes `of-button-primary` behalten (48 px min, Brand-Hintergrund, `on-brand`-Text). **Genau einer pro View.** Sekundaere/destruktive Aktionen als `secondary`/Overflow.

### 4.7 States
- `EmptyState/ErrorState/Skeleton` aus `ui/States.tsx` **konsequent** nutzen (heute ungenutzt). Skeleton ab ~300 ms fuer Listen/Panels. „Kein Check-in" ist ein eigener Zustand.
- Jede Speicher-/Aktion quittiert: Haptik (`triggerHapticFeedback`) + Inline-„gespeichert" (heute nur PlayersView → ueberall).

---

## 5. Screen-Spec: „Squad heute" (erster Redesign-Screen)

Datei: `app/field-hub/src/components/TodayDashboard.tsx`. Ersetzt den Panel-Turm.

Aufbau (oben→unten):
1. **Header:** Wortmarke „OnField•" + Kontext-Eyebrow (Wochentag/KW) + Sync-Chip (dezent).
2. **Titel:** „Squad heute" (Display) + Sub (Session · Zeit · Ort).
3. **Scoreboard-Strip:** Kader / Anwesend(gruen) / Gelb / Rot / Returner — Scoreboard-Numerals.
4. **EINE Primaeraktion:** „Check-in oeffnen →" (voll breit, Brand).
5. **„Aufpassen zuerst":** row-first Liste, **severity-sortiert** (Rot → Gelb → Returner → offen), jede Zeile = Dot + Name + Position + Sparkline + Chip. Enthaelt die heutigen Warnungen/Follow-ups (aktuell „Aufpassen"/Coach-Insights).
6. **Sekundaerer Kontext** (Material, Naechste Sessions, Notizen) **eingeklappt** in ein „Kontext"-Accordion.

Regeln: eine dominante Zahl (Anwesend) + eine Aktion; iPad = 2 Spalten (Scoreboard/Aktion/Aufpassen links, Kontext rechts), iPhone = gestapelt mit Progressive Disclosure; keine leeren „0"-Kachelwaende im First-Run (stattdessen Empty-State mit einer Aktion).

---

## 6. iPhone/iPad (Paritaet ist Pflicht)

Ein Inhalt, zwei Layouts (nicht nur umbrechen). Breite Tabellen (Analyse) am iPhone in Karten/Listen statt horizontalem Scroll. Feste QA-Groessen: iPhone SE 375 / iPhone 15 393 / iPad hoch 834 / iPad quer 1194. Breakpoints konsolidieren (Ziel: `compact <600`, `medium 600–839`, `expanded ≥840`; 760/900/980-Sonderfaelle aufloesen).

---

## 7. Build-Reihenfolge & Definition of Done

1. **Tokens v2** in `tokens.css`: Typo-Tokens (2.x) + Dark-Mode-Overrides (1.2) + `on-brand` + Toggle-Grundlage.
2. **Type-/Weight-Refactor:** hart kodierte `font-size` und 800/900-Weights in `index.css`/Komponenten auf Tokens/Skala ziehen; `of-num`-Utility.
3. **„Squad heute"** (Abschnitt 5) als erster row-first Screen.
4. **P0 parallel:** Kiosk-Schloss, Save-Feedback ueberall, Returner in den Loop, Roh-/Dev-Copy raus (siehe Audit §4).
5. **Cockpit-Loop** (Check-in→Training→Returner→Nachbereitung in einem Kontext), dann restliche Screens auf row-first.

**Definition of Done je Screen:**
- [ ] Keine hart kodierten `font-size` in geaenderten Komponenten (nur Tokens).
- [ ] ≤ 3 sichtbare Textgewichte; Body 400/500.
- [ ] Zahlen tabular (`of-num`).
- [ ] Genau eine dominante Primaeraktion.
- [ ] Row-first, keine neuen Card-Walls.
- [ ] Status = Farbe + Text + Glyph.
- [ ] Dark Mode gerendert und Kontrast ≥ 4.5:1 (Primaercontrols Ziel 7:1).
- [ ] Save-/Aktions-Feedback (Haptik + inline) vorhanden.
- [ ] iPhone + iPad geprueft (QA-Groessen), Paritaet erhalten.
- [ ] Live-Screen bleibt ruhig (kein Oxblood, keine Hero-Flaeche, kein Neon).

---

## 8. Nicht-Ziele / offen

- **Display-Font** ist v2 ein System-Platzhalter; finale Lizenzierung/Test ist eigener Branding-Schritt.
- **Logo/Wortmarke** (finale Form) ist eigener Schritt; hier nur das Dot-Signature-Prinzip.
- **Mono-fuer-Labels** ist optional/pending Ratifizierung (sonst System-Semibold-Uppercase).
- **Route B (New Territory)** ist nicht Teil dieser Spec; nur mit expliziter Ratifizierung + Decision-Log-Update.

## 9. Cross-Referenzen
`onfield_decision_log.md` (Route A) · `onfield_design_system.md` · `onfield_token_sheet.md` · `onfield_brand_kit.md` · `onfield_tone_of_voice.md` · `onfield_component_inventory.md` · `2026-07-08_onfield_design_audit_live.md` · Konzept-HTML: `2026-07-08_onfield_redesign_concept.html`.
