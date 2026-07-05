# OnField Product Brief

Stand: 2026-07-04

## Zweck

Dieses SSOT beschreibt, was OnField Coach aktuell ist, fuer wen es gebaut wird und welche Produktgrenzen fuer den Coach-MVP gelten. Es ersetzt keine Roadmap und keine Research-Datei, sondern verdichtet die verbindlichen Produktentscheidungen fuer kuenftige Agenten.

## Verbindliche Regeln

- **OnField** ist die Hauptmarke.
- **OnField Coach** ist die aktuelle App fuer Coach-Workflows vor, waehrend und nach Einheiten.
- **OnField Performance** ist die spaetere Plattformrichtung, nicht der aktuelle MVP-Scope.
- **OnField Rugby** ist der erste Sport-Preset. Rugby ist Startkontext, aber nicht die Grenze der generischen Architektur.
- iPhone und iPad muessen fachlich denselben Funktionsumfang haben. Unterschiede betreffen nur Layout, Navigation, Dichte und Interaktion.
- PWA-first bleibt aktiv. Native App, App Store, MDM und tiefere OS-Integration werden erst nach stabiler PWA-UX und externer Nutzung neu bewertet.
- Der Coach-MVP priorisiert operative Feldarbeit: Tagesueberblick, Einheit, Check-in, Training, Nachbereitung, Spieler, Analyse, Mehr/Utility.
- Die Hauptnavigation lautet `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr`.
- `Check-in`, `Training` und `Nachbereitung` sind Unterbereiche von `Einheit`.
- Bibliothek, Export/Backup und Einstellungen gehoeren unter `Mehr`.
- Returner/Reconditioning ist kein globaler Haupttab. Es erscheint in Einheit, im Spielerprofil und optional als Utility unter Mehr.
- Die App unterstuetzt Coaching-Entscheidungen. Sie ersetzt keine medizinische Entscheidung und darf keine Freigabe- oder Diagnosesprache verwenden.
- Live-Coaching-Screens bleiben ruhig, operativ und feldtauglich. Analyse, Verwaltung und tiefe Historie bleiben zweite Ebene.
- Public/Kiosk-Check-in ist eine eigene reduzierte Experience ohne Coach-Admininhalte.

## Kernnutzer und Job-to-be-done

Primaerer Nutzer ist ein Coach, der unter realen Feldbedingungen schnell entscheiden muss:

- Wer ist heute da?
- Wer braucht Modifikation, Ruecksprache oder Beobachtung?
- Was ist die naechste sinnvolle Aktion in der Einheit?
- Welche Pflichtwerte fehlen nach der Einheit?
- Welche Daten sind lokal gespeichert, ausstehend oder synchronisiert?

Sekundaere Nutzer koennen spaeter weitere Coaches, Staff, Physio/Medical-Kontakte oder Spieler in Public/Kiosk-Flows sein. Diese Rollen sind fuer Sprint 0B nur als spaetere Produktgrenze zu dokumentieren, nicht zu bauen.

## Kernflows

| Flow | Produktabsicht | Primaerer Ort |
|---|---|---|
| Heute | Naechste relevante Coach-Handlung zeigen | `Heute` |
| Einheit vorbereiten | Session-Kontext und Check-in oeffnen | `Einheit` |
| Check-in | Anwesenheit und Tagesstatus roster-first erfassen | `Einheit / Check-in` |
| Training | Aktuellen Block, Spieleraktionen und Limits live steuern | `Einheit / Training` |
| Nachbereitung | Fehlende Pflichtwerte als Aufgabenqueue abschliessen | `Einheit / Nachbereitung` |
| Spieler | Profil, Verlauf, Status und relevante Historie pruefen | `Spieler` |
| Analyse | Rueckblick und Trends getrennt vom Live-Flow auswerten | `Analyse` |
| Utility | Bibliothek, Backup/Export, Einstellungen, Install-Hilfe | `Mehr` |

## Informationsarchitektur v1

Diese Spezifikation ist das Zielbild fuer den spaeteren App-Shell-Umbau. Sie beschreibt, wo jede bestehende Funktion lebt. Sie baut in Sprint 2 noch keine Navigation im Code.

### Hauptbereiche

| Bereich | Zweck | Primaeraktion | Rolle |
|---|---|---|---|
| `Heute` | Tageslage, naechste Einheit, offene Aufgaben und schnelle Einstiege zusammenfassen | Naechste relevante Coach-Handlung oeffnen | Primaerflow |
| `Einheit` | Vor, waehrend und nach einer konkreten Session arbeiten | Aktuellen Session-Schritt fortsetzen | Primaerflow |
| `Spieler` | Athletenprofile, Status, Verlauf und relevante Historie pruefen | Spielerprofil oeffnen oder bearbeiten | Primaerflow |
| `Analyse` | Rueckblick, Trends und Planungsfragen getrennt vom Live-Flow auswerten | Analysefrage oder Quelle oeffnen | Sekundaerer Arbeitsraum |
| `Mehr` | Verwaltung, Unterlagen, Backup, Einstellungen und Install-Hilfe buendeln | Utility oeffnen | Utility |

### Alt-zu-neu Mapping

| Aktueller `HubTab` | Neuer Ort | Erreichbarkeit | Rolle |
|---|---|---|---|
| `heute` | `Heute` | Top-Level auf iPhone und iPad | Primaerflow |
| `spieler` | `Spieler` | Top-Level auf iPhone und iPad | Primaerflow |
| `check-in` | `Einheit / Check-in` | Unterbereich von `Einheit` | Primaerflow |
| `training` | `Einheit / Training` | Unterbereich von `Einheit` | Primaerflow |
| `nachbereitung` | `Einheit / Nachbereitung` | Unterbereich von `Einheit` | Primaerflow |
| `returner` | Kontext in `Einheit`, `Spieler` und optional `Mehr / Returner/Reconditioning Board` | Kein globaler Haupttab | Kontext/Utility |
| `analysis` | `Analyse` | Top-Level auf iPhone und iPad | Sekundaerer Arbeitsraum |
| `bibliothek` | `Mehr / Bibliothek` | Unterbereich von `Mehr`; kontextuell aus `Heute` und `Einheit / Training` erreichbar | Utility |
| `export` | `Mehr / Export & Backup` | Unterbereich von `Mehr`; bei Backup-Hinweisen kontextuell erreichbar | Utility |
| `einstellungen` | `Mehr / Einstellungen` | Unterbereich von `Mehr` | Utility |

### Geraetemodell

| Bereich | iPhone-Zugriff | iPad-Zugriff |
|---|---|---|
| `Heute` | Bottom Tab Bar, erster Tab, Startscreen | Sidebar, erster Bereich, Startscreen |
| `Einheit` | Bottom Tab Bar; Unterbereiche ueber Segmented Control, Stack oder Sheet | Sidebar; Unterbereiche im Content, optional mit Detailpane |
| `Spieler` | Bottom Tab Bar; Profile als Stack oder Sheet | Sidebar; Liste plus Profil-Detailpane |
| `Analyse` | Bottom Tab Bar; Drilldowns als Stack oder Sheet | Sidebar; Analysefragen im Content, Quellen optional im Detailpane |
| `Mehr` | Bottom Tab Bar; Utilities als Liste und Unterseiten | Sidebar; Utility-Liste plus Detailbereich |

iPhone und iPad muessen fachlich denselben Funktionsumfang behalten. Unterschiede betreffen nur Layout, Navigation, Dichte und Sheet-/Pane-Verhalten.

### Unterbereiche und Back/Close-Verhalten

| Bereich | Route-/State-Zielbild | Back/Close-Verhalten |
|---|---|---|
| `Einheit / Check-in` | Session-Kontext plus Substate `check-in`; ersetzt den globalen Tab `check-in` | Zurueck bleibt innerhalb `Einheit`; Schliessen von Sheets kehrt zur Check-in-Liste zurueck |
| `Einheit / Training` | Session-Kontext plus Substate `training`; ersetzt den globalen Tab `training` | Zurueck bleibt innerhalb `Einheit`; Bibliothek-Links kehren zu `Einheit / Training` zurueck |
| `Einheit / Nachbereitung` | Session-Kontext plus Substate `nachbereitung`; ersetzt den globalen Tab `nachbereitung` | Zurueck bleibt innerhalb `Einheit`; Pflichtwerte-Queues bleiben sichtbar |
| `Spieler / Detail` | Spieler-Liste plus ausgewaehlter Athlete; Detail als Sheet auf iPhone und Pane auf iPad | Close entfernt die Detailauswahl und bleibt in `Spieler` |
| `Analyse / Quelle` | Analyse-Quelle fuehrt zum passenden Bereich und Session-Kontext | Quelle oeffnen setzt Session und Ziel-Unterbereich; Back/Close kehrt zur Analysefrage zurueck, wenn technisch verfuegbar |
| `Mehr / Bibliothek` | Utility-Unterseite; darf kontextuelle Initialkategorie oder Item-ID erhalten | Ruecksprung zu `Heute` oder `Einheit / Training`, wenn aus Kontext geoeffnet; sonst zur `Mehr`-Liste |
| `Mehr / Export & Backup` | Utility-Unterseite fuer JSON, CSV, Import-Vorschau und Backup-Hinweise | Zurueck zur `Mehr`-Liste |
| `Mehr / Einstellungen` | Utility-Unterseite fuer Account, Sync, Geraet und App-Version | Zurueck zur `Mehr`-Liste |
| `Mehr / Returner/Reconditioning Board` | Optionale Utility-Unterseite fuer uebergreifende Returner-Uebersicht | Zurueck zur `Mehr`-Liste; kein Ersatz fuer kontextuelle Limits in `Einheit` und `Spieler` |

### Eigene reduzierte Experiences

| Experience | Zielbild | Navigation |
|---|---|---|
| Public Check-in | Reduzierte Self-Check-in-Route ohne Coach-Admininhalte | Eigene Route ausserhalb der Coach-Hauptnavigation |
| Kiosk Check-in | Reduzierte Vollbild-Experience fuer eine ausgewaehlte Session | Kein Zugriff auf Coach-Analyse, Historie, Export oder Einstellungen |

### Spaetere Code-Migrationspunkte

| Codeflaeche | Spaetere Aenderung | Sprint |
|---|---|---|
| `HubTab` in `app/field-hub/src/App.tsx` | Alte flache Tab-Union durch Top-Level-Bereich plus Unterbereich-State ersetzen oder kompatibel mappen | Sprint 6 |
| `activeTab` und `handleTabChange` in `App.tsx` | Navigationsstate muss Top-Level, Einheit-Subbereich und Utility-Subbereich unterscheiden | Sprint 6 |
| `handleOpenPlayerSourceSession` und `handleOpenCoachInsightSource` | `correctionTarget` wie `check-in`, `training`, `nachbereitung`, `returner` auf neue Ziele unter `Einheit` oder `Spieler` mappen | Sprint 6 oder Analyse-/Spieler-Sprints |
| Bibliothek-Ruecksprung in `App.tsx` | `libraryReturnTab` von altem Tab auf neuen Quellbereich umstellen | Sprint 6 |
| `AppShell.tsx` | Header-Metadaten fuer 5 Hauptbereiche und Unterbereiche modellieren; OnField-Naming statt alter Field-Hub-Brand im Shell-Chrome | Sprint 6 |
| `MainNavigation.tsx` | Von 10 Buttons auf 5 Top-Level-Ziele reduzieren; iPhone Bottom Tab Bar und iPad Sidebar spaeter aus derselben IA speisen | Sprint 6 |
| `TodayDashboard.tsx` Quick Actions | Schnellaktionen auf `Einheit / Check-in`, `Einheit / Training`, `Einheit / Nachbereitung` und `Mehr / Bibliothek` zielen lassen | Sprint 6 |

### Offene UX-Fragen

- Ob `Mehr / Returner/Reconditioning Board` in v1 sichtbar wird oder erst nach validiertem Bedarf aktiviert wird.
- Ob Analyse- und Spieler-Quellen einen expliziten Ruecksprung zur Ursprungsauswertung brauchen oder ob Session-Kontext plus Zielbereich reicht.
- Welche Unterbereichs-Darstellung fuer `Einheit` auf iPhone zuerst umgesetzt wird: Segmented Control, Stack oder Sheet.

## MVP-Grenzen

- Kein Multi-Tenant-SaaS, Billing oder Organisationsmodell im Coach-MVP.
- Keine Player Accounts oder Player Portal vor validiertem Public/Kiosk-Flow.
- Keine Leaderboards, Feeds oder Social Features im aktuellen Coach-Operations-Kern.
- Keine neue Supabase-Komplexitaet ohne eigenen Sprint.
- Keine Native-App-Entscheidung vor stabiler PWA, klarer IA und Feldtest.
- Keine Marketing-Landingpage als In-App-Start fuer Coaches. Startscreen bleibt `Heute`.

## Nicht-Regeln

- OnField Coach ist kein vollstaendiges AMS, kein medizinisches System und kein generisches Admin-Dashboard.
- OnField Rugby darf sichtbare Rugby-Inhalte enthalten, aber generische Komponenten, Navigation und Datenmodelle sollen sportartenuebergreifend benannt werden.
- PWA-first bedeutet nicht "nie native"; es ist die aktuelle Sequenzierungsentscheidung.
- OnField Performance ist kein Auftrag, SaaS-Architektur jetzt vorzuziehen.

## Offene Fragen

- Welche Rollen ausser Coach werden fuer eine externe Beta wirklich gebraucht?
- Wann wird eine Native-App-Bewertung durch reale PWA-Grenzen statt durch Gefuehl ausgeloest?
- Welche weiteren Sportarten sollen spaeter als Test fuer das Sport-Konfigurationsmodell dienen?
