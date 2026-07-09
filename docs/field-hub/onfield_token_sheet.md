# OnField Token Sheet

Stand: 2026-07-09

## Zweck

Dieses Token Sheet ist das versionierte Repo-Artefakt fuer OnField-Tokens. Die technische Wahrheit liegt in `app/field-hub/src/design/tokens.css`; dieses Dokument macht die Token-Gruppen fuer Code, Review und Figma-Abgleich lesbar.

## Namenskonvention

| Gruppe | Prefix | Beispiel |
|---|---|---|
| Farbe | `--of-color-*` | `--of-color-brand-primary` |
| Spacing | `--of-space-*` | `--of-space-lg` |
| Radius | `--of-radius-*` | `--of-radius-sm` |
| Border | `--of-border-*` | `--of-border-width-default` |
| Elevation | `--of-shadow-*` | `--of-shadow-panel` |
| Motion | `--of-motion-*` | `--of-motion-duration-tap` |

Bestehende App-Aliases wie `--bg`, `--surface`, `--brand`, `--warning` und `--ok` bleiben vorerst kompatibel und mappen auf `--of-*` Tokens.

## Core Colors

| Token | Wert | Einsatz |
|---|---:|---|
| `--of-color-brand-primary` | `#1F6B5C` | Primaeraktionen, aktive Navigation |
| `--of-color-brand-primary-strong` | `#155448` | Hover/strong primary |
| `--of-color-brand-primary-soft` | `#DCEBE7` | ruhige Brand-Flaechen |
| `--of-color-brand-secondary` | `#7A1F2B` | Oxblood, nur Brand/Editorial |
| `--of-color-bg-base` | `#F4F5F3` | App-Hintergrund |
| `--of-color-surface-default` | `#FFFFFF` | Hauptflaechen |
| `--of-color-surface-muted` | `#EEF2EF` | Sidebar, gedaempfte Panels |
| `--of-color-border-default` | `#D9DED8` | Standard-Trennung |
| `--of-color-text-primary` | `#131815` | Primaertext |
| `--of-color-text-secondary` | `#5E6961` | Meta, Helper, sekundaerer Text |
| `--of-color-on-brand` | `#FFFFFF` | Text auf Primary Brand in Light |
| `--of-color-focus-ring` | `#005FCC` | Fokusindikator |

## Dark Field Mode Colors

R1A ergaenzt Dark Field Mode als reine Token-Schicht. Technisch existieren beide Einstiege:

- `@media (prefers-color-scheme: dark)` fuer System-Dark.
- `:root[data-theme="dark"]` und `:root[data-theme="light"]` als Grundlage fuer den spaeteren R1B-Toggle.

R1A enthaelt keine Persistenz, keine Settings-Auswahl und keine Toggle-UI.

| Token | Dark-Wert | Einsatz |
|---|---:|---|
| `--of-color-bg-base` | `#0C110E` | Night Pitch Hintergrund |
| `--of-color-surface-default` | `#151D18` | primaere Flaeche |
| `--of-color-surface-muted` | `#1B241E` | Sidebar, Panels |
| `--of-color-border-default` | `#28332C` | ruhige Trennung |
| `--of-color-text-primary` | `#EAF0EA` | Primaertext |
| `--of-color-text-secondary` | `#9AA69D` | Meta, Helper |
| `--of-color-on-brand` | `#08130F` | Text auf hellem Primary im Dark |
| `--of-color-brand-primary` | `#4FB89E` | Primaeraktionen im Dark |
| `--of-color-brand-primary-strong` | `#63C6AE` | Hover/strong primary im Dark |
| `--of-color-brand-primary-soft` | `#16302A` | ruhige Brand-Flaeche im Dark |
| `--of-color-brand-secondary` | `#CE7B82` | Oxblood nur Brand/Editorial |
| `--of-color-status-success` | `#5FC98A` | ok/synchronisiert |
| `--of-color-status-warning` | `#E4B052` | beobachten/modifizieren |
| `--of-color-status-danger` | `#F0837A` | stoppen/abklaeren/destruktiv |
| `--of-color-status-info` | `#6FA8FF` | technische Information |
| `--of-color-focus-ring` | `#5B9BFF` | Fokusindikator |

Primaercontrols nutzen im Dark `--of-color-brand-primary` auf `--of-color-on-brand`. Der berechnete Kontrast fuer `#4FB89E` auf `#08130F` liegt bei ca. 7.82:1.

## Status Colors

| Token | Wert | Regel |
|---|---:|---|
| `--of-color-status-success` | `#1D7A46` | ok, synchronisiert, gruene Synthese |
| `--of-color-status-warning` | `#D39A2B` | beobachten, modifizieren; nicht mit weissem Text |
| `--of-color-status-warning-text` | `#53370D` | Text auf Warning-Flaechen |
| `--of-color-status-danger` | `#B42318` | stoppen, abklaeren, destruktiv |
| `--of-color-status-danger-text` | `#7D241B` | Text auf Danger-Flaechen |
| `--of-color-status-info` | `#155EEF` | technische Information |

Oxblood ist kein Status-, Alarm-, Danger-, Warning-, Follow-up- oder Attention-Ton.

## Typography Tokens

R1A ergaenzt die Redesign-v2-Typografie-Tokens aus `docs/field-hub/onfield_redesign_spec_v2.md`. Compact ist der Default fuer iPhone; ab `840px` werden die expanded/iPad-Werte gesetzt.

| Rolle | Token | Compact | Expanded |
|---|---|---:|---:|
| Scoreboard | `--of-font-size-scoreboard` | `2.5rem` | `3.5rem` |
| Display | `--of-font-size-display` | `1.75rem` | `2.125rem` |
| Titel | `--of-font-size-title` | `1.375rem` | `1.75rem` |
| Section | `--of-font-size-section` | `1.125rem` | `1.375rem` |
| Body | `--of-font-size-body` | `1rem` | `1.0625rem` |
| Secondary | `--of-font-size-secondary` | `0.875rem` | `0.9375rem` |
| Caption | `--of-font-size-caption` | `0.75rem` | `0.8125rem` |
| Metric XL | `--of-font-size-metric-xl` | `1.5rem` | `1.75rem` |
| Metric M | `--of-font-size-metric-m` | `1.125rem` | `1.25rem` |

| Token | Wert |
|---|---:|
| `--of-font-weight-regular` | `400` |
| `--of-font-weight-medium` | `500` |
| `--of-font-weight-semibold` | `600` |
| `--of-font-weight-bold` | `700` |
| `--of-font-weight-heading` | `800` |

`--of-font-family-display` bleibt vorerst der System-Stack. Eine finale Display-Font-Lizenzierung ist nicht Teil von R1A.

## Numeric Utility

R1A ergaenzt `.of-num` in `src/index.css`:

- `font-variant-numeric: tabular-nums;`
- `font-feature-settings: "tnum" 1;`

Die Utility ist die Foundation fuer Scoreboard-, Load-, Reps-, Cap- und Tabellenwerte. Die screen-weite Migration gehoert in R2 und spaetere Screen-Sprints.

## Layout Tokens

| Gruppe | Tokens |
|---|---|
| Spacing | `xs 4px`, `sm 8px`, `md 12px`, `lg 16px`, `xl 24px`, `xxl 32px` |
| Radius | `xs 5px`, `sm 8px`, `md 12px`, `lg 16px`, `xl 20px`, `pill 999px` |
| Border | `default 1px` |
| Elevation | `panel`, `panel-hover`, `sheet`, `dialog`, `sidebar`, `action` |
| Motion | `tap 140ms`, `feedback 160ms`, `sheet 220ms`, `screen 240ms`, `standard ease`, `out ease-out` |

Die Radiuswerte sind in Sprint 4 eine technische Skala plus Migrationsbasis. Die finale Zuordnung von Buttons, Inputs, Panels, Sheets und Dialogen auf semantische Komponentenrollen gehoert in Sprint 5 Core Component Kit.

## Figma-Abgleich

Das Figma Sheet ist visuelle Referenz; `tokens.css` bleibt die technische Wahrheit.

R1A-Evidence:

- Datei: `https://www.figma.com/design/BBaL4jQKLHeOC7tP5lajdW`
- Page: `Sprint 3 Brand Foundation`
- Frame: `Redesign v2 R1A Token + Type Board`
- Node: `29:2`
- Inhalt: Light/Dark-Swatches, Type Scale compact/expanded, Weight-Tokens, `.of-num`/Scoreboard-Specimen und Dark-Primary-Kontrastnotiz.

Nicht enthalten in R1A:

- Komponentenbibliothek.
- Theme-Persistenz oder Toggle-UI.
- neues App-Shell- oder Navigationsdesign.
- Bildgenerierung oder Hero-Gestaltung.
