# Audit-Vergleich: Claude vs. Codex – Rugby S&C Field Hub

**Stand:** 14. Juni 2026
**Aufgabe:** Codex-Audit gegenlesen, jede konkrete Behauptung verifizieren, mit dem Claude-Audit vergleichen, Unterschiede + Übernahme-Empfehlung benennen.
**Verwandte Dateien:** [`UX_UI_AUDIT_2026-06-14.md`](./UX_UI_AUDIT_2026-06-14.md) (mein Audit, Teil 1 + Teil 2), Screenshots in [`ux-audit-screenshots/`](./ux-audit-screenshots/).

> **Begriffsklärung:** „Mein Audit" = mein erstgehändiger Durchgang (Teil 1) **+** der Multi-Agent-Workflow (23 Agenten, 35 priorisierte Punkte, Teil 2). Wo relevant, unterscheide ich beide, weil mein Teil-1-Durchgang zwei Codex-Treffer selbst übersehen hat.

---

## 1. Verifikation von Codex' konkreten Behauptungen

Jede überprüfbare Aussage wurde **empirisch** (laufende App, Puppeteer-Messung) oder **im Code** geprüft.

| # | Codex-Behauptung | Verifikation | Beweis |
|---|------------------|--------------|--------|
| 1 | iPhone-Export hat **~47 px horizontalen Overflow** | ✅ **EXAKT WAHR** | Gemessen: iPhone 393px, eingeloggt, Export → `scrollWidth 440 / overflow 47`. Verursacher u. a. `label.file-upload-control` (407px, nativer `<input type=file>`). Tritt **nur eingeloggt auf Export** auf. |
| 2 | Auf **Heute steht „Login offen", aber kein Login-Formular** dort | ✅ **WAHR** | Gemessen (ausgeloggt @Heute): `hasEmailInput=false`, Text „Login offen" vorhanden. `AuthPanel` wird in 6 gesperrten Views gerendert, **nicht** in `TodayDashboard`. |
| 3 | Bibliothek zeigt bei **0 Treffern weiter das erste Dokument** | ✅ WAHR (beide gefunden) | [`LibraryView.tsx:38-39`](./src/components/LibraryView.tsx#L38-L39) Fallback `?? libraryItems[0]`. |
| 4 | **iPad-Portrait versteckt Nav-Labels** (nur Icons) | ✅ WAHR (beide) | [`index.css:1363-1365`](./src/index.css#L1363-L1365). |
| 5 | **iPad zu früh einspaltig** | ✅ WAHR (beide) | [`index.css:1338`](./src/index.css#L1338) (≤1240px). |
| 6 | **Header auf allen Tabs gleich** | ✅ WAHR (beide) | [`AppShell.tsx:42`](./src/components/AppShell.tsx#L42) statisch. |
| 7 | **CloudOff-Icon online** + `client_updated_at`-Jargon | ✅ WAHR (beide) | [`SyncStatusBadge.tsx:44`](./src/components/SyncStatusBadge.tsx#L44) + [`:49-51`](./src/components/SyncStatusBadge.tsx#L49-L51). |
| 8 | **Touch-Targets < 44px** (Pain-, Filter-Chips, Compact-Sync) | ✅ WAHR (Codex etwas präziser) | `filter-chip` 42px (Z.442), `compact-action` 40px (Z.1122), `sync-mini` 42px (Z.609), Pain-Chip 42px breit. |
| 9 | Login / Spieler create+delete / Check-in / Returner / Sync / Baseline-Validierung **„funktionieren"** | ⚠️ **OBERFLÄCHLICH WAHR, aber irreführend** | Stimmt im Klick-Test, **verdeckt aber tiefere Bugs** (siehe §4: Returner-Datenverlust, Ampel friert ein, Freitext-Verlust). |
| 10 | PDF lädt als `application/pdf`, HTTP 200, im Browser-Viewer | ✅ WAHR | Deckt sich mit meinem Code-Befund ([`LibraryView.tsx:142`](./src/components/LibraryView.tsx#L142), `target="_blank"`). |
| 11 | Dateipfade **`src/views/ExportView.tsx`**, `src/views/LibraryView.tsx` | ❌ **FALSCH** | Es gibt **kein `src/views/`**. Dateien liegen in `src/components/`. Zeilennummern stimmen ~ → Codex hat die richtige Datei gelesen, aber den Pfad falsch zitiert. |

**Fazit Verifikation:** Codex ist **inhaltlich überwiegend korrekt und sehr präzise** (v. a. #1 mit exakter 47px-Messung). Schwächen: ein **falscher Pfad-Prefix** (#11) und ein **zu optimistisches „funktioniert"** (#9), das ernste Bugs übersieht.

---

## 2. Konsens – was BEIDE gefunden haben (hohe Sicherheit)

Diese Punkte sind durch zwei unabhängige Audits bestätigt → mit höchster Priorität anzugehen:

1. „Sprint 2–8"-Dev-Labels in der UI (Codex implizit über „Sprint-/Tech-Labels entfernen"; ich explizit pro Datei).
2. Statischer Header auf allen Tabs → tab-spezifischer Titel.
3. CloudOff-Icon online + technische Sync-Sprache → coach-taugliche Sprache + korrektes Icon.
4. iPad-Portrait Icon-only-Nav → Labels auf iPad behalten.
5. iPad zu früh einspaltig → 2-Spalten-Tablet-Layout.
6. Bibliothek 0-Treffer-Fallback → echter Empty-State.
7. Touch-Targets ≥ 44px.
8. Weniger Card-/Schatten-Stil, klare Hierarchie (1 Primäraktion), flachere Sektionen.
9. Hover für Web **+** Press/Active für Touch.
10. Statussprache vereinfachen.

---

## 3. Was CODEX fand, das mein Audit NICHT (oder schwächer) hatte

| Befund | Status | Würde ich übernehmen? |
|--------|--------|------------------------|
| **iPhone-Export 47px Overflow** (präzises Symptom + Messung + Root-Cause „nativer File-Input") | **Codex-exklusiv als Bug.** Mein Workflow fand nur das *Element* als optisches Problem, nicht die Overflow-Folge; mein Teil 1 fand es gar nicht. | ✅ **Ja, voll übernehmen** – Codex' Diagnose ist hier schärfer als meine. |
| **„Login offen" auf Heute ohne Login-Möglichkeit** | **Codex-exklusiv.** Beide meiner Durchgänge haben es übersehen. | ✅ **Ja, übernehmen** – echtes Onboarding-Loch (erster Start ist immer Heute). |
| **Live-End-to-End-QA**: Testspieler real angelegt + gelöscht, PDF-HTTP-Status geprüft, `typecheck/lint/test/build` grün | Methodik-Stärke (ich habe aus Datenschutz **nicht** in die Produktivdaten geschrieben). | ✅ **Ja** – als ergänzende Absicherung sinnvoll. |
| **Externe Referenzen inline** (WCAG 2.2 Target Size & Focus Appearance, NN/g Mobile Navigation) | Konkrete, zitierfähige Belege. | ✅ **Ja** – gute Praxis, übernehme ich. |
| Positives Hierarchie-Modell „Session-Kontext → Primäraktion → Details" | Schön formuliert; mein Workflow kam **konvergent** zum selben Ergebnis („ein Hero + zurückgenommene Panels"). | ➖ Konsens, kein Alleinstellungsmerkmal. |

---

## 4. Was MEIN Audit fand, das Codex NICHT hatte (inkl. der ernsten Bugs)

> Hier liegt der größte Unterschied: Codex' „funktioniert alles" übersieht mehrere **funktionale** Bugs, die nur per Code-Analyse sicher sichtbar sind.

### Kritische / sicherheitsrelevante Bugs (Codex: „funktioniert")
- 🔴 **P0 – Returner-Datenverlust bei Re-Render.** `getEntryForPlayer()` ([`useReturners.ts:133-145`](./src/hooks/useReturners.ts#L133-L145)) ist nicht memoisiert und mintet pro Render eine **neue `entry.id`** (`buildEmptyReturnerEntry → createId()`). Die Felder nutzen `key={entry.id}-…` ([`ReturnerView.tsx:110-228`](./src/components/ReturnerView.tsx#L110-L228)) → bei jeder Sync-/State-Änderung **Remount → getippte Caps/Notizen weg**. **Von mir selbst im Code bestätigt.**
- 🔴 **P0 – Ampel-Override kann nie zurück zu „Auto".** Nach einer manuellen Korrektur bleibt `trafficLightWasManual=true` fixiert; steigt der Schmerz später auf 8, wird die Ampel **nicht** mehr rot. Sicherheitsrelevantes „eingefrorenes Signal" ohne UI-Reset ([`CheckInView.tsx:264`](./src/components/CheckInView.tsx#L264), `domain/checkIn.ts`).
- 🟠 **P0 – „Nächste Sessions"-Deeplink defekt** ([`TodayDashboard.tsx:173`](./src/components/TodayDashboard.tsx#L173)) – springt nicht zur passenden Einheit (war als Roadmap-P3 bekannt).

### Weitere funktionale Bugs (Codex nicht)
- **Check-in-Freitext geht bei Session-Wechsel verloren** (uncontrolled Felder ohne Draft-Persistenz).
- **Neu angelegter Spieler bleibt nicht selektiert** → Foto-Upload-UI erscheint nach „Speichern" nicht ([`PlayersView.tsx:148/466`](./src/components/PlayersView.tsx#L148)).
- **Training-Quick-Actions** ohne Aktiv-Zustand und nicht entfernbar.
- **Pro-Save-Sync disabled/blurred die UI** in Feld-Views (stört schnelle Eingabe).

### iPhone-spezifisch (Codex komplett übersehen)
- **Fehlendes `viewport-fit=cover` + keine `env(safe-area-inset-*)`** → installierte iPhone-17-PWA unter Dynamic Island / Home-Indikator ([`index.html:5`](./index.html#L5)). **Direkt relevant für deinen iPhone-Fokus.**

### Polish / Konsistenz (Codex nicht)
- **Roh-Enum-Leaks** in der UI: „synced", „centres", „training", Tag „App-UI aus aktiver Quelle" → auf deutsche Labels mappen.
- **Schwacher Kontrast der aktiven gelben Ampel** (AA-Problem, [`index.css:809-814`](./src/index.css#L809-L814)).
- **Null CSS-Transitions** als Root-Cause benannt (nicht nur „Hover ergänzen").
- **Verschachtelte Scroll-Regionen** auf Mobile (`library-list`/`player-list max-height`).
- **Disabled-/Pending-States** für Chips + Doppel-Submit-Schutz; **aria-live/focus-visible**-Lücken (A11y).

### „Stimmiges Gesamtpaket" – das eigentliche Ziel
- **Vollständiges Token-Level-Design-System**: System-Font-Stack, 6-stufige Typo-Skala, 4px-Spacing-Grid, **eine** Elevation-Strategie, Danger-/Warning-/`--ring`-Tokens, `--focus` als **einziger** Akzent für die eine CTA. → Deutlich tiefer als Codex' „Schatten reduzieren / weniger Cards".
- **Evidenz**: 24 Screenshots × 3 Viewports + empirische Overflow-/Login-Messung + adversariale Bug-Verifikation (0 widerlegt).

---

## 5. Direkter Vergleich: wo wessen Vorschlag besser ist

| Thema | Besser bei | Begründung |
|-------|-----------|------------|
| Export-Overflow (iPhone) | **Codex** | Präzises Symptom + Messung; ich nehme Codex' Framing + Fix (`min-width:0; max-width:100%`, nativen File-Input ersetzen). |
| Login-Zugang auf Heute | **Codex** | Echtes Loch, das ich übersah. |
| Live-Funktions-Absicherung | **Codex** | Hat Flows real durchgespielt; gibt Sicherheit, dass nichts grob bricht. |
| Inline-Quellen (WCAG/NN-g) | **Codex** | Zitierfähig. |
| Tiefe & Schwere der Bugs | **Claude** | Returner-Datenverlust, Ampel-Freeze, Deeplink, State-Verluste – alles von Codex als „funktioniert" eingestuft. |
| iPhone-PWA-Korrektheit (Safe-Area) | **Claude** | Codex hat es gar nicht; für „iPhone 17" zentral. |
| Kohärentes Design-System (Tokens) | **Claude** | Genau das vom Nutzer gewünschte „stimmige Paket". |
| Lokalisierung / Enum-Leaks | **Claude** | Von Codex nicht erfasst. |
| Knappheit / sofort umsetzbar | **Codex** | Kürzer, weniger zu lesen – gut für eine Einzelperson. |

---

## 6. Empfohlene Zusammenführung (was ich tatsächlich tun würde)

**Backbone = mein Audit** (Bug-Liste + Design-System), **veredelt mit Codex' Beiträgen**:

**Sofort (P0, additiv aus beiden):**
1. Alle „Sprint 2–8"-Eyebrows + `client_updated_at`-Notiz + „App-UI aus aktiver Quelle"-Tag löschen. *(Konsens)*
2. Tab-spezifischer Header. *(Konsens)*
3. iPad: 2-Spalten-Dashboard (Breakpoint auf ~760px) **+** Nav-Labels behalten. *(Konsens)*
4. `viewport-fit=cover` + Safe-Area-Insets. *(Claude)*
5. **Returner-Field-Keys auf `player.id`** (Datenverlust). *(Claude, kritisch)*
6. **Ampel-„Auto"-Reset** ermöglichen (Sicherheit). *(Claude)*
7. CloudOff→Cloud + Sync-/Enum-Status auf Deutsch. *(Konsens + Claude-Enums)*
8. **iPhone-Export-Overflow** fixen (`file-upload-control`/nativer Input). *(Codex)*
9. **Login-CTA im Sync-/Auth-Bereich auf Heute.** *(Codex)*
10. Bibliothek-Empty-State auch im Detail-Panel. *(Konsens)*
11. „Nächste Sessions"-Deeplink reparieren. *(Claude)*

**Danach (P1):** Flächen flach (eine Elevation), Heute mit einem Hero, **eine** globale Transition + `:active`-Press + `tap-highlight:transparent`, progressive Offenlegung der Check-in-/Nachbereitungs-Zeilen, Spieler list-first mit Sheet-Formular, System-Font + Typo-Skala, gelbe Ampel kontraststark, A11y (focus-visible/aria-live), Touch-Targets ≥44px.

**Querschnitt aus Codex übernehmen:** WCAG/NN-g als Referenz im Repo verankern; Live-QA (`typecheck/lint/test/build` + ein echter Flow-Durchlauf) als Vor-Release-Checkliste.

---

## 7. Ehrliches Gesamturteil

- **Codex' Audit ist gut, präzise und korrekt** in dem, was es abdeckt – und hat **zwei reale Dinge gefunden, die ich (zunächst) übersehen habe** (Export-Overflow, Login-auf-Heute). Beide übernehme ich.
- **Es ist aber flacher**: Es stuft mehrere Tabs als „funktioniert" ein, obwohl es dort **ernste Bugs** gibt (Returner-Datenverlust, eingefrorene Ampel, Freitext-/Selektionsverluste), übersieht die **iPhone-PWA-Safe-Area** und liefert kein **token-tiefes Design-System** – also genau das „stimmige Gesamtpaket", das gewünscht war.
- **Schwächen, die man kennen sollte:** Codex' Pfadangaben (`src/views/…`) sind falsch, und „funktional deutlich stabiler als die Optik wirkt" ist **zu optimistisch**.
- **Selbstkritisch:** Mein Teil-1-Schnelldurchgang hat den Overflow und das Login-Loch ebenfalls verpasst – erst die Messung beim Gegenprüfen hat sie bestätigt. Mein Workflow fand den File-Input nur kosmetisch.
- **Beste Lösung = Kombination.** Mein Bug- + Design-System-Backbone, ergänzt um Codex' zwei Treffer, die Live-QA-Disziplin und die Referenzen, ist klar stärker als jedes Audit allein.

> **Beide Audits einig (bitte umsetzen):** Das im Chat geteilte Passwort nach dem Audit **rotieren**.
