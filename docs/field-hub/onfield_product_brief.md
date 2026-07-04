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
