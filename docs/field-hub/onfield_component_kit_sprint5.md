# OnField Sprint 5 Component Kit

Stand: 2026-07-05

## Zweck

Dieses Artefakt dokumentiert das erste Core Component Kit aus Sprint 5. Die technische Quelle bleibt der Code in `app/field-hub/src/components/` und `app/field-hub/src/design/tokens.css`. Figma spiegelt diese Komponenten als Designsystem-Artefakt, ersetzt aber nicht die Code-Quelle.

## Code-Orte

- Generische UI-Primitives: `app/field-hub/src/components/ui/`
- OnField-Kompositionen: `app/field-hub/src/components/onfield/`
- Component-CSS: `app/field-hub/src/components/ui/onfield-ui.css`

## Komponenten

| Komponente | Zweck | Wichtige Props |
|---|---|---|
| `PrimaryButton` | dominante Hauptaktion | `icon`, `isLoading`, `loadingLabel`, `disabledReason`, `compact` |
| `SecondaryButton` | alternative Aktion | `tone`, `icon`, `isLoading`, `disabledReason`, `compact` |
| `SegmentedControl` | enge Moduswahl | `label`, `options`, `value`, `onChange` |
| `StatusChip` | kompakter Zustand | `label`, `tone`, `icon` |
| `TrafficLightChip` | Ampelstatus mit Kurzgrund | `tone`, `label`, `reason` |
| `SafetyNotice` | verantwortungsrelevanter Hinweis | `title`, `tone`, `live`, `children` |
| `SyncStatus` | Speicherung/Sync sichtbar machen | `tone`, `label`, `detail` |
| `OfflineBanner` | globaler Offline-Hinweis | `message`, `detail` |
| `NumberScale` | numerische Eingabe | `label`, `min`, `max`, `value`, `onChange` |
| `PainScale` | sensible 0-10-Eingabe | `label`, `value`, `onChange` |
| `Sheet` | reversible Detail-/Teilaufgabe | `title`, `description`, `onClose`, `children` |
| `EmptyState` | aus Leere in Handlung fuehren | `title`, `body`, `action` |
| `Skeleton` | Ladezustand fuer Listen/Panels | `variant`, `label` |
| `ErrorState` | Fehler mit Wiederanlauf | `title`, `body`, `details`, `action` |
| `OnFieldTopbar` | Screen-Kontext und Aktionsbereich | `eyebrow`, `title`, `description`, `actions`, `syncStatus` |
| `SessionHeader` | Einheit-Kontext | `title`, `subtitle`, `meta`, `metrics`, `action` |
| `AthleteRow` | operative Athletenzeile | `name`, `meta`, `status`, `traffic`, `action`, `note` |
| `TaskQueueRow` | offene Aufgabe | `title`, `detail`, `meta`, `tone`, `action` |

## Regeln

- Komponenten verwenden sportartenuebergreifende Namen.
- OnField Rugby darf in Copy weiter `Spieler` und Rugby-Kontext verwenden; generische Komponenten bleiben aber `Athlete*`.
- Status nutzt Text plus Farbe, nie Farbe allein.
- Interaktive Ziele sind mindestens 44 x 44 px; feldkritische Aktionen sind 48 px oder hoeher.
- Disabled Actions koennen einen sichtbaren Grund ausgeben.
- Sheets beruecksichtigen Safe Areas und begrenzen ihre Hoehe mit `100svh`.
- Keine Oxblood-Nutzung fuer Status, Warning, Danger oder Follow-up.

## Bestehende Anbindung

- `SyncStatusBadge` nutzt `SyncStatus` als Kompatibilitaetswrapper.
- `PwaUpdateNotice` nutzt `SafetyNotice` und `SecondaryButton`.
- Grosse Screen-Migrationen in Check-in, Training, Nachbereitung und Spielerprofilen sind bewusst nicht Teil von Sprint 5.

## Figma-Spiegelung

Das Figma Component Sheet soll dieselben Komponentennamen verwenden. Falls Figma nicht aktualisiert werden kann, dient dieses Dokument als dokumentiertes Ersatzartefakt fuer Sprint 5.
