# Sprint 10 QA Matrix

Stand: 14. Juni 2026.

Sprint 10 ist auf iPad/iPhone-UX, PWA-/Offline-Grundlage und Abnahmefaehigkeit begrenzt. Es wurden keine Supabase-Migrationen, Edge Functions, Realtime-Funktionen, Spieler-Accounts oder Parser-Pipelines eingefuehrt.

## Automatisierte Checks

| Check | Ergebnis | Notiz |
| --- | --- | --- |
| `npm run typecheck` | bestanden | TypeScript-Projekt prueft inklusive Sprint-10-Tests. |
| `npm run lint` | bestanden | Keine Lint-Fehler im App-Code. |
| `npm test` | bestanden | Vitest-Suite inklusive PWA- und Navigation-Regressionscheck. |
| `npm run build` | bestanden | Produktionsbuild inklusive PWA-Precache. |
| `npm audit --audit-level=moderate` | bestanden | 0 bekannte moderate oder hoehere Vulnerabilities. |

## PWA und Offline-Grundlage

| Szenario | Ergebnis | Notiz |
| --- | --- | --- |
| PNG-Icons fuer PWA/Apple-Pfade vorhanden | bestanden | `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png` erzeugt und Dimensionen geprueft. |
| Manifest nutzt PNG-Icons | bestanden | `manifest.webmanifest` referenziert PNG-Dateien statt SVG-Platzhalter. |
| Apple Touch Icon im HTML | bestanden | `index.html` referenziert `apple-touch-icon.png`. |
| Aktive PDF-Bibliothek im Service-Worker-Precache | bestanden | `dist/sw.js` enthaelt die aktiven `library/*.pdf`-Assets. |
| Offline nach Home-Screen-PWA-Install | teilweise geprueft | Build-/Precache-Konfiguration geprueft. Echter Home-Screen-PWA-Test auf physischem iPad/iPhone bleibt Abnahme mit Geraet und Coach-Login. |
| Offline-Eingabe und spaeterer Supabase-Sync | nicht vollstaendig geprueft | Keine Coach-Credentials und keine bewusst erzeugten echten Testdaten verwendet. Bestehende Repository-/Queue-Tests decken die lokale Pending-Logik ab. |

## Browser- und Simulator-Abnahme

| Ziel | Ergebnis | Notiz |
| --- | --- | --- |
| Desktop 1280 x 900 | bestanden | Browser-Verifikation: Startscreen, alle acht Haupttabs erreichbar, kein horizontaler Overflow, keine Browser-Console-Errors. |
| iPad-Viewport 834 x 1194 | bestanden | Browser-Verifikation: icons-only Navigation, alle acht Tabs per Accessible Name erreichbar, kein horizontaler Overflow. |
| iPhone-Viewport 393 x 852 | bestanden | Browser-Verifikation: Startscreen und Navigation erreichbar, kein horizontaler Overflow. |
| iOS Simulator iPhone 17 / Safari | bestanden | App rendert in Safari stabil; keine offensichtlichen Layout-Ueberlappungen im Startscreen. |
| iOS Simulator iPad Pro 11-inch / Safari | bestanden | App rendert in Safari stabil. Bei `127.0.0.1` oeffnete Safari zuerst nicht korrekt; `localhost` funktionierte. |

## Daten- und Workflow-Szenarien

| Szenario | Ergebnis | Notiz |
| --- | --- | --- |
| Leere Datenbank / nicht eingeloggter Start | bestanden | Login-Gate und statische App-Shell rendern stabil ohne dynamische Coach-Daten. |
| Bestehende Dexie-v5-Datenbank | indirekt bestanden | Sprint 10 aendert kein Dexie-Schema; bestehende Tests und Build laufen mit Dexie v5. |
| Export/Import in zweitem Browserkontext | nicht vollstaendig geprueft | Export-Tab ist Coach-Login-gated. Ohne Test-Coach-Credentials wurde kein reales JSON-Backup erzeugt/importiert. Bestehende Import-/Export-Tests bleiben massgeblich. |
| 20-Spieler-Check-in | nicht vollstaendig geprueft | Benoetigt Coach-Login und Testdaten. Es wurden keine echten Spieler- oder Gesundheitsdaten erzeugt. |
| Lange Spielernamen | nicht vollstaendig geprueft | Benoetigt Coach-Login/Testdaten. Keine neuen Seed-Daten in den Sprint-10-Scope aufgenommen. |
| iPad eingeben, iPhone nach Sync pruefen | nicht vollstaendig geprueft | Benoetigt Coach-Login und Remote-Testdaten. |
| iPhone eingeben, iPad nach Sync pruefen | nicht vollstaendig geprueft | Benoetigt Coach-Login und Remote-Testdaten. |

## Ergebnis

Sprint 10 hat die technischen Blocker fuer iOS-PWA-Installationspfade und Offline-Asset-Caching geschlossen und eine Accessibility-Regressionsluecke in der responsiven Hauptnavigation behoben. Die echte physische Abnahme mit Coach-Login, Home-Screen-PWA, iPad/iPhone-Geraetewechsel und Testdaten bleibt als naechster Abnahmeschritt offen, weil dafuer reale Geraete/Credentials oder explizite Testdatenfreigabe noetig sind.
