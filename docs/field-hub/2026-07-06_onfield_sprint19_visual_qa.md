# OnField Sprint 19 Visual QA

Stand: 2026-07-06

## Scope

Sprint 19 prueft den Screen-by-Screen-Rollout nach den OnField-Redesign-Sprints und behebt nur visuelle/UX-Inkonsistenzen, fehlende Zustaende und Regressionen.

Screens:

- Heute
- Einheit / Check-in
- Einheit / Training
- Einheit / Nachbereitung
- Spieler
- Analyse
- Mehr / Bibliothek
- Mehr / Export & Backup
- Mehr / Einstellungen
- Public Check-in
- Kiosk Check-in

Nicht im Scope:

- neue Features
- neue Supabase-Migrationen, RLS-Policies oder Storage-Regeln
- Native-/Flutter-Rewrite
- weitere Sport-Presets
- Deep Research, Konkurrenzanalyse oder Bildgenerierung
- Produktentscheidungen fuer Sprint 20 oder spaeter

## QA-Matrix

| Bereich | iPhone klein | iPhone gross | iPad Portrait | iPad Landscape | Daten-/State-Abdeckung |
|---|---|---|---|---|---|
| Heute | automatisiert | automatisiert | automatisiert | automatisiert | leer/signed-out strukturell, full/signed-in falls Env gesetzt |
| Einheit / Check-in | automatisiert | automatisiert | automatisiert | automatisiert | leer/signed-out strukturell, full/signed-in falls Env gesetzt |
| Einheit / Training | automatisiert | automatisiert | automatisiert | automatisiert | leer/signed-out strukturell, full/signed-in falls Env gesetzt |
| Einheit / Nachbereitung | automatisiert | automatisiert | automatisiert | automatisiert | leer/signed-out strukturell, full/signed-in falls Env gesetzt |
| Spieler | automatisiert | automatisiert | automatisiert | automatisiert | signed-in Spielerbereich per Auth-Smoke nachgeholt |
| Analyse | automatisiert | automatisiert | automatisiert | automatisiert | Lazy-Screen plus deterministischer Boundary-Komponententest; Browser-Fault-Injection bleibt best-effort |
| Mehr / Bibliothek | automatisiert | automatisiert | automatisiert | automatisiert | Lazy-Screen strukturell |
| Mehr / Export & Backup | automatisiert | automatisiert | automatisiert | automatisiert | Locked/signed-out plus signed-in falls Env gesetzt |
| Mehr / Einstellungen | automatisiert | automatisiert | automatisiert | automatisiert | Auth, Sync, Backup, Install-Hinweise |
| Public Check-in | automatisiert | automatisiert | automatisiert | automatisiert | invalid-token Error State |
| Kiosk Check-in | bestehender Kiosk-Smoke | bestehender Kiosk-Smoke | bestehender Kiosk-Smoke | bestehender Kiosk-Smoke | Remote-Submit mit temporaerem Seed und Cleanup nachgeholt |

Automatisiertes Script:

- `npm run test:e2e:sprint19`
- nutzt den gebauten Preview-Stand
- prueft vier Viewports: 375x667, 393x852, 834x1194, 1194x834
- prueft Screen-Erreichbarkeit, erwartete Screen-Texte, horizontales Overflow, Bottom-Nav-Touch-Targets, sichtbaren Tastaturfokus und verbotene alte Copy
- prueft Public-Check-in-Error-State mit invalidem Token
- prueft Lazy-Screen-Error-State durch script-only Abbruch eines Lazy-Chunks, sofern der Chunk nicht bereits geladen oder vorgeladen ist; der Error-State selbst ist zusaetzlich per `App.lazyScreenBoundary.test.tsx` deterministisch abgedeckt
- prueft Signed-in nur, wenn `FIELD_HUB_E2E_EMAIL` und `FIELD_HUB_E2E_PASSWORD` zur Laufzeit gesetzt sind; der signed-in Sprint-19-Smoke wurde nachgeholt und meldete `status: checked`

## Auth- und Datenstrategie

Der bereitgestellte Testaccount wird nicht in Code, Dokumentation, Screenshot-Dateien, Scripts oder Git gespeichert. Auth-QA erfolgt nur ueber Environment-Variablen:

- `FIELD_HUB_E2E_EMAIL`
- `FIELD_HUB_E2E_PASSWORD`

Wenn diese Variablen fehlen, markiert `npm run test:e2e:sprint19` Signed-in-QA als `skipped`, ausser `FIELD_HUB_SPRINT19_REQUIRE_AUTH=1` ist gesetzt.

Remote-Mutationen werden fuer Sprint 19 nicht als Default in das neue Screen-QA-Script eingebaut. Der bestehende Kiosk-Smoke deckt Remote-Submit mit temporaerem Seed und Cleanup ab und wurde nachgeholt:

- `npm run test:e2e:kiosk`

Pending Sync wird strukturell ueber bestehende Sync-Komponenten, lokale Pending-Texte und den PWA-/Offline-Smoke geprueft. Ein echter offline erzeugter Remote-Pending-Datensatz wird nur in einem bewusst konfigurierten Auth-/Kiosk-Lauf erzeugt, nicht als Default-Side-Effect der visuellen QA.

## LUVI-Audit Integration

Aus dem LUVI-Projekt wurden folgende Patterns als passend fuer OnField bewertet:

| LUVI-Pattern | Uebernahme fuer OnField | Begruendung |
|---|---|---|
| Bottom-Nav-Clearance mit SafeArea | ja, als QA-Kriterium fuer `.bottom-tab-bar` und mobilen Content-Abstand | OnField muss iPhone Home Indicator und Bottom Tabs sicher freihalten. |
| Zentrale Sheet-Regeln mit Clamp und SafeArea | ja, als Audit-Kriterium | OnField nutzt eigene Tokens/Radien, braucht aber dieselbe Robustheit fuer Sheets und Detail-Panes. |
| InteractiveSurface mit Semantics, Keyboard und 44dp Minimum | ja, als Prinzip | Passt direkt zu OnField PWA/A11y und Feldnutzung. |
| ErrorScaffold/LiveRegion | ja, als Prinzip | Fehler und Pending-Zustaende muessen coachnah und assistive lesbar sein. |
| Loading-/Disabled-Button mit stabiler Label-Breite | ja, als Prinzip | Deutsche Labels und Sync-Zustaende duerfen Layout nicht springen lassen. |
| Sticky CTA plus SafeArea | ja, als Pruefpunkt | Feldkritische Aktionen duerfen nicht mit Bottom Bar/Home Indicator kollidieren. |
| Flutter Widgets direkt | nein | OnField ist Vite/React/PWA; direkte Wiederverwendung waere Architekturdrift. |
| LUVI-Farben, Fonts, grosse Radien, Glass-/Hero-Stil | nein | OnField bleibt Field Graphite, ruhig und operations-first. |
| Zyklus-, Paywall-, Social- und Consumer-Health-Flows | nein | Nicht OnField Coach Sprint-19-Domain. |
| Native-only Haptics | nein | OnField bleibt PWA-first. |

## Geloeste Inkonsistenzen

- Nachbereitung: alte englische Action-Labels wurden in coachnahe deutsche Labels ueberfuehrt.
- Training: Quick Action `D / stop / klaeren` wurde zu `D / stoppen / klaeren`.
- Returner: riskante medizinische Entscheidungs-Sprache wurde durch klare Verantwortungsgrenzen ersetzt.
- Sprint-19-E2E deckt alte Copy als verbotene sichtbare Texte ab.

## Nachgeholte Audit-Punkte

- Signed-in-Full-Data-QA wurde mit Laufzeit-Env nachgeholt; `npm run test:e2e:sprint19` meldete `signedIn.status: checked`.
- Kiosk-E2E wurde mit Laufzeit-Env nachgeholt; `npm run test:e2e:kiosk` verifizierte einen Remote-Entry mit `checkInSource: player_kiosk` und Cleanup.
- Lazy-Error-State wurde durch `App.lazyScreenBoundary.test.tsx` deterministisch abgedeckt.

## Restrisiken

- Pending Sync wird im neuen Screen-QA-Script nicht per Default durch Remote-Mutation erzeugt, um keine Seiteneffekte in echten Testdaten zu riskieren.
- Lazy-Error-Fault-Injection im Browser kann weiter `skipped` sein, wenn der Browser den Lazy-Chunk bereits geladen oder vorgeladen hat; der sichtbare Error-State ist ueber den Boundary-Komponententest abgedeckt.
- Screenshots sind optional und werden nur mit `FIELD_HUB_SPRINT19_SCREENSHOTS=1` erzeugt.
- Figma wurde fuer Sprint 19 nicht als neue Designquelle genutzt; massgeblich bleiben SSOTs, Code und Browser-QA.

## Abschlusskriterien

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run test:e2e:pwa`
- `npm run test:e2e:sprint19`
- `npm run test:e2e:kiosk`, wenn Auth-/Supabase-Env verfuegbar ist

Memory Closeout folgt nach den Checks gemaess Memory Governance.
