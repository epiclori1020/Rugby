# OnField Component Inventory

Stand: 2026-07-13

## Zweck

Dieses SSOT listet die geplanten OnField UI-Komponenten mit Zweck, Einsatz, Nicht-Einsatz und betroffenen Screens. Es ist ein Planungs- und Review-Artefakt, keine Implementierung.

Sprint 5 hat die erste Code-Struktur fuer das Core Component Kit unter `app/field-hub/src/components/ui/` und `app/field-hub/src/components/onfield/` angelegt. Vollstaendige Screen-Migrationen folgen in spaeteren Sprints.

## Verbindliche Regeln

- Komponenten werden sportartenuebergreifend benannt.
- Spieler-/Athletenobjekte sind standardmaessig Rows/Listen.
- Sheets, Panes und Queues sind Primaerstruktur fuer Details und Aufgaben.
- Cards sind nicht Default-Container.
- Jede Komponente muss iPhone- und iPad-Verhalten haben.
- Status-Komponenten nutzen Text plus Farbe, optional Icon.

## Komponenten

| Komponente | Zweck | Einsatz | Nicht-Einsatz | Screens |
|---|---|---|---|---|
| App Shell | Grundstruktur der App | iPad Sidebar + Content + Detail; iPhone Tabs + Stack/Sheets | pro Screen neu erfinden | alle Hauptbereiche |
| iPad Sidebar | Top-Level-Navigation | `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr` | Inline-Aktionen, Filter | iPad |
| iPhone Bottom Tab Bar | Top-Level-Navigation | 5 Hauptbereiche mit Label | Unterbereiche, Filter, Aktionen | iPhone |
| Topbar | Screen-Kontext, Suche, Filter, Sync, Overflow | maximal eine Primaeraktion | zweites Hauptmenue | alle Hauptbereiche |
| OnField Wordmark | konsistente Markenkennung mit Dot-Signature | Brand- und operative Header; Produktlabel separat | Statusanzeige oder in Rasterasset eingebrannter Text | App Shell, Welcome/Auth, Install, Public/Kiosk |
| Brand Surface | erlaubte Markenflaeche mit kontrolliertem Artwork | Welcome/Auth/Install als Hero; Public/Kiosk-Einstieg als Texture | Live-Coaching, Readiness, Review, Error/Offline | Welcome, Auth, Settings, Public/Kiosk |
| Session Header | schnelle Einheit-Zusammenfassung | Datum, Gruppe, Ort, Attendance, offene Tasks, CTA | Charts oder tiefe Historie | Heute, Einheit |
| Primary Button | dominante Hauptaktion | eine sichtbare Hauptaktion pro Screen | mehrere gleich starke CTAs | alle |
| Secondary Button | Alternative ohne Dominanz | Details, Profil oeffnen, Abbrechen | konkurrierende Primaeraktion | alle |
| Destructive Button | destruktive Aktionen | Loeschen, Import ueberschreiben, Queue verwerfen | normale Warnungen | Mehr, Dialoge |
| Segmented Control | enge Submodi | Check-in/Training/Nachbereitung | 4+ lose Kategorien | Einheit |
| Filter Chip | temporaerer Filter | Position, Cluster, Returner, Attendance | Hauptnavigation | Spieler, Analyse, Einheit |
| Status Chip | kompakter Zustand | aktiv, inaktiv, Consent offen, Sync | alleiniger Safety-Hinweis | alle |
| Traffic Light Chip | Coach-Synthese | Gruen/Gelb/Rot mit Kurzgrund | Entscheidungsersatz | Check-in, Spieler |
| Player/Athlete Row | operative Basiseinheit | Name, Position, Statusstack, Quick Action | grosse Card-Wall | Check-in, Training, Spieler |
| Player Detail Sheet | Vertiefung im Flow | Verlauf, Notiz, letzte Werte, Limits | dauerhafte Hauptstruktur | Einheit, Spieler |
| Task Queue Row | offene Arbeit sichtbar machen | fehlende Pflichtwerte, Pending Sync, Review Tasks | Alltags-Dashboard dominieren | Heute, Nachbereitung, Mehr |
| Warning Banner | sichtbarer nicht-blockierender Hinweis | offene Aufgaben, Risiko, Konflikt | irreversible Entscheidung | Heute, Einheit |
| Safety Notice | Verantwortungsgrenze | Pain, Returner, sensible Hinweise | Toast, Marketingtext | Check-in, Training, Spieler |
| Sync Status | Vertrauen in Speicherung | online, offline, syncing, pending | nur in Einstellungen verstecken | global |
| Offline Banner | globaler Offline-Zustand | persistenter Hinweis, lokale Speicherung | kleiner Dot allein | global |
| Number Scale | numerische Eingabe | Readiness, sRPE, Sessionwerte | Dropdown | Check-in, Nachbereitung |
| Pain Scale | sensible Schmerzangabe | 0-10 plus Kontext | Ampelersatz oder medizinische Einordnung | Check-in, Nachbereitung, Spieler |
| Returner Cap Row/Group | geplante und dokumentierte Belastungsrahmen | Speed, COD/Decel, Conditioning, Kontakt | medizinische Entscheidung oder generische KPI-Card | Einheit, Training, Spieler |
| Metric Card | fokussierte Kennzahl | Team-Readiness, offene Returner | Default fuer Listen | Heute, Analyse |
| Analysis Card | Frage + Insight + Drilldown | Trends und Rueckblick | Live-Screens | Analyse, Spieler |
| Form Field | Datenaufnahme | Coach-Notiz, Schmerzort, Settings | Placeholder-only | Einheit, Spieler, Mehr |
| Sheet | reversible Teilaufgabe | Details, Kommentare, Zusatzoptionen | jede Kleinigkeit als neuer Screen | iPhone/iPad |
| Empty State | aus Leere in Handlung fuehren | ein Satz, ein CTA, ein Helper | Illustration-only | alle |
| Loading/Skeleton | wahrgenommener Fortschritt | Listen-/Panel-Skeletons | Vollbild-Spinner fuer Listen | alle |
| Error State | Wiederanlauf | Fehlertext, Retry, Details | roher technischer Fehler | alle |
| Confirmation Dialog | kritische Bestaetigung | Loeschen, Import, Ueberschreiben | harmlose Zustandswechsel | Mehr, Dialoge |

## Sprint-5-Code-Mapping

| Inventory-Komponente | Code-Komponente | Status Sprint 5 |
|---|---|---|
| Topbar | `OnFieldTopbar` | Angelegt als OnField-Komposition; noch keine App-Shell-Migration |
| Session Header | `SessionHeader` | Angelegt als OnField-Komposition |
| Primary Button | `PrimaryButton` | Angelegt und getestet |
| Secondary Button | `SecondaryButton` | Angelegt und getestet; Danger-Tone enthalten |
| Segmented Control | `SegmentedControl` | Angelegt und getestet |
| Status Chip | `StatusChip` | Angelegt und getestet |
| Traffic Light Chip | `TrafficLightChip` | Angelegt und getestet |
| Safety Notice | `SafetyNotice` | Angelegt und getestet |
| Sync Status | `SyncStatus` | Angelegt und in `SyncStatusBadge` angebunden |
| Offline Banner | `OfflineBanner` | Angelegt und getestet |
| Player/Athlete Row | `AthleteRow` | Generisch angelegt und getestet |
| Task Queue Row | `TaskQueueRow` | Angelegt und getestet |
| Number Scale | `NumberScale` | Angelegt und getestet |
| Pain Scale | `PainScale` | Angelegt und getestet |
| Sheet | `Sheet` | Angelegt und getestet |
| Empty State | `EmptyState` | Angelegt und getestet |
| Loading/Skeleton | `Skeleton` | Angelegt und getestet |
| Error State | `ErrorState` | Angelegt und getestet |

Sprint 5 bindet nur risikoarme bestehende Stellen an. Die alte 10-Tab-Navigation bleibt bis zum App-Shell-/Navigationssprint bestehen.

## Redesign-v2 R7D Mapping

- `PlayersView` nutzt `AthleteRow` fuer die Spielerliste; Foto/Initialen sind optionale Row-Medien, der aktuelle Eintrag wird mit `aria-current` markiert.
- Eine Row zeigt einen primaeren Readiness-/Check-in-Status und maximal einen priorisierten Sekundaerstatus. Status bleibt durch Glyph/Form und Text ohne Farbabhaengigkeit lesbar.
- Der Profilkopf kombiniert Identitaet, Position/Positionsgruppe, dieselbe Statuslogik und einen semantischen Vier-Metriken-Strip fuer letzte Teilnahme, Readiness, Beschwerden und offene Themen.
- Player Detail bleibt unter 840 px ein modales Sheet mit Fokusfang/-rueckgabe und ab 840 px eine Pane neben der Liste. Der fachliche Umfang bleibt gleich.
- `PrimaryButton`, `EmptyState` und `Skeleton` ersetzen Legacy-Aktionen beziehungsweise rohe Leer-/Ladehinweise in der Spielerliste.

## Redesign-v2 R9 Mapping

- `OnFieldWordmark` implementiert Mixed Case `OnField•`, getrennte optionale Produktlabels und Brand-/Operational-Kontext ohne Statussemantik.
- `BrandSurface` hat den sicheren Artwork-Default `none` sowie die expliziten Modi `hero` und `texture`.
- `WelcomeView` ist die First-Run-/Login-Kante mit drei nuetzlichen Schritten; nach erfolgreichem Login wird eine zuvor angeforderte Coach-Route wiederhergestellt.
- Public/Kiosk zeigen die Textur nur am Einstieg und entfernen sie ab Readiness. `Heute` und der No-Roster-Zustand bleiben kontrolliert ruhig und row-/action-first.
- Settings zeigt im Browser genau eine Install-Aktion und danach dieselben nummerierten Safari-Schritte fuer iPhone und iPad; im Standalone-Modus bleibt die Darstellung kompakt.

## IA-Auswirkungen aus Sprint 2

Sprint 2 spezifiziert nur die Informationsarchitektur. Die folgenden Punkte markieren spaetere Umsetzungspunkte fuer App-Shell- und Screen-Sprints; sie bauen in diesem Sprint keine Komponenten.

| Bereich | Betroffene Komponenten | Spaetere Aenderung |
|---|---|---|
| Hauptnavigation | App Shell, iPad Sidebar, iPhone Bottom Tab Bar, Main Navigation | Von 10 gleichrangigen Tabs auf `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr` reduzieren |
| `Einheit` | App Shell, Topbar, Session Header, Segmented Control | `Check-in`, `Training` und `Nachbereitung` als Unterbereiche statt globale Tabs fuehren |
| `Mehr` | App Shell, Topbar, Sheet, Empty State | `Bibliothek`, `Export & Backup`, `Einstellungen` und optional `Returner/Reconditioning Board` als Utility-Unterbereiche gruppieren |
| Returner/Reconditioning | Filter Chip, Player/Athlete Row, Player Detail Sheet, Returner Cap Row/Group, Safety Notice | Kontext in `Einheit`, `Spieler` und optional `Mehr`; kein globaler Hauptnavigationsbutton |
| Quellen und Rueckspruenge | Sheet, Player Detail Sheet, Analysis Card, Task Queue Row | Analyse- und Spielerquellen muessen spaeter auf neue Bereiche und Unterbereiche zeigen |
| Public/Kiosk | App Shell, Number Scale, Empty State, Error State | Eigene reduzierte Experience ausserhalb der Coach-Hauptnavigation behalten |

## Nicht-Regeln

- Dieses Inventory ist keine Vorgabe, alle Komponenten sofort zu bauen.
- Bestehende Komponenten muessen nicht in Sprint 0B umbenannt werden.
- Sport-Presets duerfen Texte und Inhalte liefern, aber Komponenten bleiben generisch.
- Sprint 2 baut keine App Shell, Bottom Tab Bar, Sidebar oder neuen Unterbereichs-Container.

## Offene Fragen

- Welche bestehenden Komponenten in `app/field-hub` lassen sich spaeter direkt auf diese Namen mappen?
- Welche Komponenten brauchen zuerst Figma- oder Screenshot-Review?
- Welche Komponente wird im App-Shell-Sprint als erstes verbindlich umgesetzt?
