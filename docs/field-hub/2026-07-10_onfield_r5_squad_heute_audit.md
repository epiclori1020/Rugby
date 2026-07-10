# OnField R5 Squad heute - Hardening & Evidence

Stand: 2026-07-10

## Scope

Dieses Closeout haertet ausschliesslich Redesign-v2 R5 `Squad heute`: wahrheitsgetreue Kader-/Anwesenheitslogik, eine aggregierte Aufmerksamkeitszeile pro anwesendem Spieler, ein Header/Sync-Status, Scoreboard-Hierarchie, iPhone-/iPad-Layout, Figma-R5-Referenz und ein expliziter R5-E2E-Gate.

Ausserhalb: R6 Einheit-Cockpit/Returner-Loop, neue Produktfelder oder Routen, Supabase-Schema/RLS/Migrationen, spaetere Brand-/Display-Font-Sprints und medizinische Freigabeentscheidungen.

## Fachlicher Vertrag

- Operativer Kader = erwartete aktive Spieler plus unerwartet anwesende aktive Spieler.
- `Anwesend`, Gelb, Rot, Returner und `Aufpassen zuerst` werden nur aus tatsaechlich eingecheckten Spielern abgeleitet.
- Nicht eingecheckte Spieler bleiben im Check-in und erscheinen nicht als heutige Aufmerksamkeit.
- Explizites Returner-`ja` zaehlt; `offen` ist eine neutrale Klaerung.
- Mehrere Gruende fuer dieselbe Person werden in einer severity-sortierten Zeile aggregiert: Rot, Gelb, Returner, Klaerung.
- Gelb/Rot zaehlen die hoechste aggregierte Aufmerksamkeitsstufe pro anwesendem Spieler, damit Scoreboard und priorisierte Liste dieselbe Tageslage zeigen; aktuelle Ampel, Mitnahme und Coach Insight duerfen diese Stufe bestimmen.
- Wenn keine historische Erwartungsbasis vorhanden ist, dient die aktive Spielerliste als dokumentierter First-run-Fallback fuer den operativen Kader.

## Umsetzung

- `src/domain/todaySquad.ts` ist die gemeinsame pure Ableitung fuer Scoreboard, Aufmerksamkeit und relevante Coach Insights.
- Alle aggregierten Gruende bleiben in der Athletenzeile sichtbar; es gibt keinen nicht bedienbaren Platzhalter fuer versteckte Hinweise.
- `TodayDashboard` besitzt den Screen-Header; `AppShell` unterdrueckt fuer `Heute` den generischen zweiten Header und reicht dieselbe Sync-Komponente weiter.
- Mobile nutzt ein kompaktes 3x2-Scoreboard mit priorisiertem `Anwesend`; 834px nutzt den vereinbarten iPad-Split, 840-1099px stapelt wegen der gleichzeitig aktiven Sidebar, und 1194px nutzt wieder den Split.
- Ein echter Loading-Zustand verhindert, dass ein laufender Datenaufbau als leerer Kader erscheint; R5-Aktionen geben Inline- und best-effort-haptisches Feedback.
- `scripts/e2e-r5-squad-today.mjs` prueft 375/393/744/834/840/1194 und ist als `r5-squad-today-e2e` in `qa:beta` eingebunden. Remote Login-Ziele brauchen HTTPS plus exakte Origin-Freigabe, Logs entfernen Query/Fragment, der Gate verlangt einen befuellten Testzustand und Cleanup besitzt Timeout-/Kill-Fallbacks.
- Keine Supabase-, Auth-, RLS- oder Migrationsdatei wurde geaendert.

## Figma Evidence

Datei: `https://www.figma.com/design/BBaL4jQKLHeOC7tP5lajdW`

Seite `Redesign v2 R5 Squad heute`:

- `31:3` - Squad heute / iPhone SE (375x667)
- `31:58` - Squad heute / iPhone 15 (393x852)
- `31:113` - Squad heute / iPad Portrait (834x1194)
- `31:168` - Squad heute / iPad Landscape (1194x834)

Die bestehenden Frames wurden korrigiert statt dupliziert: kompakter Mobile-Score, keine nicht-anwesende Warnzeile, Main-/Kontext-Split auf iPad, SF Pro und umbrechender Kontexttext. Ein neuer Figma-Komponenten-/Variablenbau wurde bewusst nicht vorgezogen, weil er ausserhalb von R5 liegt.

## Verification

- `npm run typecheck`: checked.
- `npm run lint`: checked.
- `npm test`: checked, 97 Testdateien / 648 Tests.
- `npm run build`: checked.
- `npm run qa:local`: checked; Supabase-Audit, Typecheck, Lint, 97 Testdateien / 648 Tests, Build, PWA-E2E und Sprint-19-Visual-QA gruen. Der erste Sandbox-Lauf konnte den lokalen Preview-Port nicht oeffnen; der regelkonform ausserhalb der Sandbox wiederholte und nach den letzten Audit-Fixes erneut ausgefuehrte Lauf war vollstaendig gruen.
- Figma-Screenshots 375/393/834/1194: checked.
- Browser signed-out/first-run 375/393/834/1194: ein Screen-Header, kein horizontales Overflow, primaere Aktion sichtbar; 375 visuell geprueft.
- Authentifizierter `test:e2e:r5`: blocked, weil `FIELD_HUB_E2E_EMAIL` und `FIELD_HUB_E2E_PASSWORD` im Prozess nicht gesetzt waren. Der Gate blockiert absichtlich statt den Signed-in-Pfad still zu ueberspringen.
- `npm run qa:beta`: erwartungsgemaess `blocked`; Laufzeit-Credentials und `FIELD_HUB_E2E_ALLOW_REMOTE_MUTATION=1` fehlen. Dies ist keine Beta-Freigabe.
- Sprint-19-Signed-in-Smoke und Lazy-Fault-Injection: im lokalen Gate als `skipped` dokumentiert; fuer die R5-Freigabe ersetzt das keinen authentifizierten Lauf.
- Redesign Integrity Gate: offen. Reproduzierbare Vorher/Nachher-App-Screenshots in Light und Field Mode, authentifizierte befuellte Viewport-Evidence und der echte Kontrastnachweis ueber alle Pflichtbreiten liegen noch nicht vollstaendig vor.

## Abweichungen

Keine Produkt-Scope-Abweichung. Technisch wurde `AppShell` minimal erweitert, weil genau ein Header/Sync-Status ohne duplizierte Sync-Logik sonst nicht sauber umsetzbar ist. Als begruendete responsive Abweichung vom pauschalen "Split ab 834px" wird R5 bei 840-1099px gestapelt: Ab 840px nimmt die Sidebar so viel Inhaltsbreite ein, dass der 5-spaltige Score sonst unbrauchbar komprimiert wuerde; R8 soll diese Breakpoint-Sonderregel konsolidieren. Zeit und Ort im Untertitel bleiben mangels entsprechender Session-Felder offen und wurden nicht durch neue Produktfelder ausserhalb R5 vorgezogen. Der Figma-Designsystem-Neubau wurde zugunsten des vereinbarten R5-Scopes bewusst nicht gestartet.
