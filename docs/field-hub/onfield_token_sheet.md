# OnField Token Sheet

Stand: 2026-07-05

## Zweck

Dieses Token Sheet ist das versionierte Repo-Artefakt fuer Sprint 4. Die technische Wahrheit liegt in `app/field-hub/src/design/tokens.css`; dieses Dokument macht die Token-Gruppen fuer Code, Review und Figma-Abgleich lesbar.

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
| `--of-color-focus-ring` | `#005FCC` | Fokusindikator |

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

Sprint 4 ergaenzt ein minimales Figma Token Sheet in der bestehenden OnField Brand Board Datei. Das Figma Sheet ist visuelle Referenz; `tokens.css` bleibt die technische Wahrheit.

Nicht enthalten in Sprint 4:

- Komponentenbibliothek.
- Dark Mode.
- neues App-Shell- oder Navigationsdesign.
- Bildgenerierung oder Hero-Gestaltung.
