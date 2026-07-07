# OnField PWA Accessibility QA

Stand: 2026-07-07

## Zweck

Dieses SSOT definiert die QA-Regeln fuer OnField als PWA auf iPhone und iPad. Es ist eine Checkliste fuer spaetere UI- und PWA-Sprints; Sprint 0B fuehrt keine Browser- oder UI-Verifikation aus.

## Sprint 18 Smoke

Sprint 18 fuegt eine automatisierte PWA-Smoke-Pruefung fuer den gebauten Preview-Stand hinzu:

- Script: `npm run test:e2e:pwa` in `app/field-hub`.
- Viewports: 375 x 667, 393 x 852, 834 x 1194, 1194 x 834.
- Pruefungen: App-Shell rendert, kein horizontales Overflow, Bottom Navigation bleibt im Viewport, Tastaturfokus ist sichtbar, lazy geladene Screens `Analyse`, `Bibliothek`, `Export & Backup`, `Einstellungen` und `Returner` laden auf iPhone klein und iPad Landscape, Offline-Navigation faellt auf die App-Shell zurueck.
- Voraussetzung: lokaler Chromium/Chrome oder `PUPPETEER_EXECUTABLE_PATH`.

## Sprint 25 Medium QA

Sprint 25 erweitert PWA- und Visual-QA um die mittlere Fensterbreite:

- zusaetzlicher Viewport: 744 x 1133.
- `npm run test:e2e:pwa` prueft App-Shell, Bottom Navigation, Lazy Screens, Deep Links und Browser History zusaetzlich in Medium.
- `npm run test:e2e:sprint19` prueft die Hauptscreen-Matrix zusaetzlich in Medium.
- Medium folgt der OnField-Breakpoint-Logik `600-839px`: kompakte Shell ohne permanente Sidebar, aber mit voller Funktion.

## Verbindliche Regeln

- iPhone und iPad muessen fachlich denselben Funktionsumfang haben.
- Unterschiede duerfen nur Layout, Navigation, Dichte und Sheet/Pane-Verhalten betreffen.
- PWA-first bleibt aktiv.
- Die App darf nicht in eine generische Browser-Offline-Seite fallen.
- Offline, lokal gespeichert, ausstehend, synchronisiert und Konflikt muessen verstaendlich sichtbar sein.
- Status nie nur ueber Farbe.
- Disabled Actions brauchen einen sichtbaren Grund.
- Public/Kiosk-Check-in ist eine reduzierte eigene Experience ohne Coach-Admininhalte.

## Viewports

Pruefe bei UI-Sprints, sofern praktisch:

| Viewport | Zweck |
|---|---|
| iPhone klein | enge Breite, Bottom Bar, Home Indicator, einspaltige Forms |
| iPhone gross | typische mobile Feldnutzung |
| Medium 744 | iPad Split View / kleines Tabletfenster ohne permanente Sidebar |
| iPad Portrait | Tablet im Stehen, Sidebar/Content-Verhalten |
| iPad Landscape | Primaere Coach-Arbeitsflaeche mit optionalem Detailpane |
| iPad Split View | Layout nach Fensterbreite, nicht nur Geraetelabel |

## Checkliste

### Navigation und Paritaet

- iPhone zeigt Bottom Tab Bar fuer `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr`.
- iPad zeigt Sidebar fuer dieselben Hauptbereiche.
- Kein Feature ist iPad-only.
- `Einheit` enthaelt Check-in, Training und Nachbereitung.
- Unterbereiche nutzen Segments, Stacks, Sheets oder Panes statt globale Tabs.

### Safe Areas und Install

- `viewport-fit=cover` ist gesetzt, wenn Safe Areas aktiv genutzt werden.
- `env(safe-area-inset-*)` wird fuer Header, Bottom Bar und Floating Actions beruecksichtigt.
- Bottom Bar klebt nicht am Home Indicator.
- PWA startet installiert ohne Browser-Chrome, soweit Plattform es erlaubt.
- iOS-Install-Hinweis verlaesst sich nicht allein auf `beforeinstallprompt`.
- App Name, Icon, Splash/Startsurface und Install-Copy passen zur OnField Marke.

### Touch und Fokus

- Interaktive Ziele mindestens 44 x 44 px.
- Feldkritische Aktionen 48-56 px hoch.
- Kleine Ziele haben mindestens 8 px Abstand.
- Fokuszustand ist sichtbar und nicht verdeckt.
- iPad Pointer/Keyboard bricht keine Touch-Interaktion.
- Form Labels stehen ueber Eingaben.
- Fehler erscheinen inline am betroffenen Feld.

### Kontrast und Status

- Textkontrast mindestens 4.5:1.
- Grosse Schrift und Fokusindikatoren mindestens 3:1.
- Status nutzt Text plus Farbe, optional Icon.
- Ampelstatus zeigt Kurzgrund und Handlung.
- Warning und Danger sind semantisch getrennt von Brandfarben.

### Offline, Sync und Pending Writes

- Offline-Zustand ist eigener App-Zustand.
- Lokale Speicherung wird direkt bestaetigt.
- Pending Sync ist sichtbar, aber nicht dominant.
- Konflikte zeigen betroffenen Datensatz und naechste Aktion.
- Retry ist vorhanden, wenn sinnvoll.
- Background Sync auf iOS/Safari wird nicht vorausgesetzt.

### Loading, Empty, Error und Disabled

- Listen und Panels nutzen Skeletons ab ca. 300 ms.
- Empty States haben ein Satz Zustand, eine direkte Aktion und optional einen Helper.
- Fehlertexte sind coach-nah und nennen Recovery.
- Technische Details sind optional, nicht Primaertext.
- Disabled States erklaeren den Grund.

### Kiosk/Public

- Eigene reduzierte Route oder Experience.
- Keine Coach-Notizen, Historie, Analyse oder Team-Admininhalte.
- Grosse Touch-Ziele.
- Linearer Schrittfluss.
- Klare Rueckkehr in Coach-Modus.
- Privacy-/Consent-Texte knapp und sichtbar.

## Nicht-Regeln

- Dieses Dokument ersetzt keinen echten Browser-/Simulator-Test.
- Sprint 0B fuehrt keine Playwright-, Browser- oder Screenshot-QA aus.
- Dieses Dokument baut keine PWA-Manifest-, Service-Worker- oder CSS-Aenderungen.

## Offene Fragen

- Welche konkreten Geraete werden fuer externe Beta als Pflicht-QA festgelegt?
- Soll es fuer Install-Hilfe eigene Screenshots oder eine kleine Onboarding-Route geben?
- Welche Offline-/Conflict-Szenarien brauchen spaeter automatisierte Tests?
