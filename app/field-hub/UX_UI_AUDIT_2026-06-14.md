# UX / UI / Design-Audit – Rugby S&C Field Hub

**Stand:** 14. Juni 2026
**Geprüft von:** Claude (UX-Audit, code- + screenshotbasiert)
**Scope:** Komplettes Frontend (alle 8 Tabs), Design-System (`index.css`), Responsive-Verhalten iPhone + iPad, Flows/Buttons, Bugs.
**Status dieser Datei:** Teil 1 (erstgehändig verifizierte Findings) ist vollständig. Teil 2 (vertieftes Multi-Agent-Audit, Research-Backing, vollständiges Design-System + priorisierte Roadmap) wird ergänzt, sobald der laufende Audit-Workflow abgeschlossen ist.

---

## Inhaltsverzeichnis

- [1. Wie getestet wurde](#1-wie-getestet-wurde)
- [2. Screenshot-Index](#2-screenshot-index)
- [3. Bestätigte Bugs / Leaks (P0)](#3-bestätigte-bugs--leaks-p0)
- [4. Strukturelle UX-Themen (P1)](#4-strukturelle-ux-themen-p1)
- [5. Die drei explizit gewünschten Flows](#5-die-drei-explizit-gewünschten-flows)
- [6. Beobachtungen pro View](#6-beobachtungen-pro-view)
- [7. Design-System – erste Beobachtungen](#7-design-system--erste-beobachtungen)
- [8. Teil 2 – Vertieftes Audit + Design-System (in Arbeit)](#8-teil-2--vertieftes-audit--design-system-in-arbeit)

---

## 1. Wie getestet wurde

- **Live-App** lokal gestartet (`npm run dev`, Vite auf `http://localhost:5173/`) und mit den bereitgestellten Coach-Credentials eingeloggt — also **echter angemeldeter Zustand** mit echten Supabase-Daten.
- **Headless Chrome (Puppeteer)** steuert die App und erstellt Screenshots auf drei realen Viewports:
  - **iPhone**: 393 × 852 (repräsentativ für iPhone 15/16/17-Klasse)
  - **iPad Portrait**: 834 × 1194 (iPad Pro 11″ hochkant)
  - **iPad Landscape**: 1194 × 834 (iPad Pro 11″ quer – das Primärgerät am Feld)
- Alle 8 Tabs × 3 Viewports = **24 Full-Page-Screenshots** (siehe [Index](#2-screenshot-index)).
- **Code-Verifikation**: jeder Befund unten ist gegen die Quell-Datei geprüft (Datei + Zeilennummer verlinkt).
- **Datenlage im Account:** aktuell **1 Spieler („Sabine", inaktiv)**, **0 aktive Spieler** → viele Views zeigen ihre Empty-States. Das entspricht realistisch dem Zustand kurz vor dem Launch am Di 16.6. und macht die Empty-States besonders wichtig.

---

## 2. Screenshot-Index

| Tab | iPhone | iPad Portrait | iPad Landscape |
|-----|--------|---------------|----------------|
| Heute | [📱](./ux-audit-screenshots/iphone__heute.png) | [▭](./ux-audit-screenshots/ipad-portrait__heute.png) | [▭](./ux-audit-screenshots/ipad-landscape__heute.png) |
| Spieler | [📱](./ux-audit-screenshots/iphone__spieler.png) | [▭](./ux-audit-screenshots/ipad-portrait__spieler.png) | [▭](./ux-audit-screenshots/ipad-landscape__spieler.png) |
| Check-in | [📱](./ux-audit-screenshots/iphone__checkin.png) | [▭](./ux-audit-screenshots/ipad-portrait__checkin.png) | [▭](./ux-audit-screenshots/ipad-landscape__checkin.png) |
| Training | [📱](./ux-audit-screenshots/iphone__training.png) | [▭](./ux-audit-screenshots/ipad-portrait__training.png) | [▭](./ux-audit-screenshots/ipad-landscape__training.png) |
| Nachbereitung | [📱](./ux-audit-screenshots/iphone__nachbereitung.png) | [▭](./ux-audit-screenshots/ipad-portrait__nachbereitung.png) | [▭](./ux-audit-screenshots/ipad-landscape__nachbereitung.png) |
| Returner | [📱](./ux-audit-screenshots/iphone__returner.png) | [▭](./ux-audit-screenshots/ipad-portrait__returner.png) | [▭](./ux-audit-screenshots/ipad-landscape__returner.png) |
| Bibliothek | [📱](./ux-audit-screenshots/iphone__bibliothek.png) | [▭](./ux-audit-screenshots/ipad-portrait__bibliothek.png) | [▭](./ux-audit-screenshots/ipad-landscape__bibliothek.png) |
| Export | [📱](./ux-audit-screenshots/iphone__export.png) | [▭](./ux-audit-screenshots/ipad-portrait__export.png) | [▭](./ux-audit-screenshots/ipad-landscape__export.png) |

---

## 3. Bestätigte Bugs / Leaks (P0)

> Alle Punkte hier sind im Code verifiziert und meist mit wenig Aufwand zu beheben, aber mit hoher Wirkung (Professionalität / Orientierung / iPhone-Darstellung).

### 3.1 Dev-Labels „Sprint 2–8" stehen live in der UI
Interne Sprint-Nummern erscheinen als sichtbare Abschnitts-Überschriften (`eyebrow`) in 6 Views. Für den Coach wirkt das wie ein unfertiger Bildschirm.

- [`src/components/LibraryView.tsx:57`](./src/components/LibraryView.tsx#L57) → „Sprint 2"
- [`src/components/PlayersView.tsx:239`](./src/components/PlayersView.tsx#L239) → „Sprint 3"
- [`src/components/CheckInView.tsx:346`](./src/components/CheckInView.tsx#L346) → „Sprint 4"
- [`src/components/TrainingView.tsx:281`](./src/components/TrainingView.tsx#L281) → „Sprint 5"
- [`src/components/PostSessionView.tsx:570`](./src/components/PostSessionView.tsx#L570) → „Sprint 6"
- [`src/components/PostSessionView.tsx:680`](./src/components/PostSessionView.tsx#L680) → „Sprint 8"
- [`src/components/ReturnerView.tsx:316`](./src/components/ReturnerView.tsx#L316) → „Sprint 7"

**Sichtbar in:** [Spieler 📱](./ux-audit-screenshots/iphone__spieler.png), [Check-in 📱](./ux-audit-screenshots/iphone__checkin.png), [Nachbereitung 📱](./ux-audit-screenshots/iphone__nachbereitung.png), [Returner 📱](./ux-audit-screenshots/iphone__returner.png).
**Fix:** Eyebrow ganz entfernen oder durch ein echtes Kontext-Label ersetzen (z. B. „Vor dem Training", „Nach dem Training").

### 3.2 Topbar-Titel ist statisch „Training Operations" — egal welcher Tab
Die Hauptüberschrift wechselt nie. Egal ob man auf Spieler, Bibliothek oder Export ist — oben steht immer „Heute zuerst / Training Operations". Damit fehlt die wichtigste Orientierung („Wo bin ich gerade?").

- [`src/components/AppShell.tsx:39-44`](./src/components/AppShell.tsx#L39-L44) (fest verdrahtetes `<h2>Training Operations</h2>`)

**Fix:** Titel + Eyebrow aus dem aktiven Tab ableiten (z. B. Map `activeTab → {eyebrow, title}`), an `AppShell` durchreichen.

### 3.3 Entwickler-Jargon in der Coach-UI
Technische Begriffe stehen wörtlich im sichtbaren Text:

- [`src/components/SyncStatusBadge.tsx:49-51`](./src/components/SyncStatusBadge.tsx#L49-L51) → „Konflikt-MVP: Bei iPad/iPhone-Abweichungen gewinnt der neuere **client_updated_at**-Stand."
- [`src/components/ExportView.tsx:285`](./src/components/ExportView.tsx#L285) → „… per **client_updated_at / last-write-wins** übernommen."

**Sichtbar in:** [Heute 📱](./ux-audit-screenshots/iphone__heute.png) (Sync-Box).
**Fix:** In Coach-Sprache umformulieren, z. B. „Bei Unterschieden zwischen iPad und iPhone zählt die zuletzt gespeicherte Version." Den `client_updated_at`-Begriff streichen.

### 3.4 Offline-Wolken-Icon ist immer sichtbar — auch online
Im Sync-Badge wird unabhängig vom Status immer das `CloudOff`-Icon (Wolke mit Schrägstrich = „offline/kein Sync") gerendert. Bei „Online · synced" widerspricht das Icon dem Text.

- [`src/components/SyncStatusBadge.tsx:44`](./src/components/SyncStatusBadge.tsx#L44) (unbedingtes `<CloudOff />`)

**Sichtbar in:** [Heute 📱](./ux-audit-screenshots/iphone__heute.png) — grüner Punkt + „Online · synced", aber Offline-Wolke daneben.
**Fix:** Icon abhängig von `playerSync.isOnline` (`Cloud` ↔ `CloudOff`) wählen; der grüne/graue Status-Dot ist bereits korrekt.

### 3.5 Fehlendes `viewport-fit=cover` + keine Safe-Area-Insets (iPhone-PWA)
Der Viewport-Meta-Tag deckt die iPhone-Safe-Areas nicht ab, und im gesamten `index.css` gibt es keine `env(safe-area-inset-*)`-Behandlung. Als Home-Screen-PWA auf iPhone 17 (Dynamic Island + Home-Indikator) kann Inhalt unter die Systemleisten rutschen.

- [`index.html:5`](./index.html#L5) → `content="width=device-width, initial-scale=1.0"` (ohne `viewport-fit=cover`)
- `src/index.css` → kein `env(safe-area-inset-*)` (Sidebar/Topbar/Bottom)

**Fix:** `viewport-fit=cover` ergänzen und `padding`/`min-height` der App-Shell um `env(safe-area-inset-*)` erweitern.

### 3.6 Bibliothek: Detail-Panel zeigt bei 0 Treffern trotzdem ein Dokument
Wenn die Suche keine Treffer hat, zeigt die Liste korrekt „Keine Unterlage gefunden", aber das Detail-Panel rechts fällt auf `libraryItems[0]` zurück und zeigt ein Dokument, das gar nicht in der gefilterten Liste ist.

- [`src/components/LibraryView.tsx:38-39`](./src/components/LibraryView.tsx#L38-L39) (`?? filteredItems[0] ?? libraryItems[0]`)

**Fix:** Wenn `filteredItems.length === 0`, auch im Detail-Panel einen Leerzustand zeigen statt des Fallback-Dokuments.

---

## 4. Strukturelle UX-Themen (P1)

> Diese werden vom laufenden Workflow mit konkreten Werten + Research untermauert. Hier der verifizierte Kern.

### 4.1 iPad-Portrait = reine Icon-Navigation ohne Labels
Ab Breakpoint `≤ 980px` werden die Nav-Labels ausgeblendet (`.nav-button span { display: none }`). Das trifft **jedes iPad im Hochformat** (744–834px) — also ausgerechnet das Primärgerät — mit 8 nur-Icon-Buttons in 4 Spalten × 2 Reihen.

- [`src/index.css:1363-1365`](./src/index.css#L1363-L1365) (Labels weg bei ≤980px), [`src/index.css:1391-1401`](./src/index.css#L1391-L1401) (erst <560px kommen Labels zurück)

**Sichtbar in:** [iPad-Portrait Spieler ▭](./ux-audit-screenshots/ipad-portrait__spieler.png) (8 Icons, keine Labels) vs. [iPhone Spieler 📱](./ux-audit-screenshots/iphone__spieler.png) (Labels vorhanden).
**Richtung:** Labels auf iPad behalten (genug Platz); für iPhone eine native Bottom-Tab-Bar erwägen.

### 4.2 Dashboard auf jedem iPad einspaltig
Die `dashboard-grid` wird erst `> 1240px` zweispaltig. iPad Portrait (834) **und** Landscape (1194) liegen darunter → alles in einer schmalen Spalte, breite Panels mit viel Leerraum, langes Scrollen.

- [`src/index.css:217-220`](./src/index.css#L217-L220) (2-Spalten-Definition), [`src/index.css:1338-1342`](./src/index.css#L1338-L1342) (Kollaps bei ≤1240px)

**Sichtbar in:** [iPad-Landscape Heute ▭](./ux-audit-screenshots/ipad-landscape__heute.png) — „Planüberblick"-Metriken über volle Breite gestreckt, alle Panels gestapelt.
**Richtung:** Breakpoint senken, sodass iPad Landscape (und ggf. Portrait) eine 2-Spalten-Aufteilung (Timeline links / Seitenpanels rechts) nutzt.

### 4.3 Drei konkurrierende Kopfzeilen
Oben stapeln sich Marke „Field Hub", Eyebrow „Heute zuerst", H2 „Training Operations" **und** zwei interne Untertitel — ohne klare Hierarchie.

- [`src/components/AppShell.tsx:30-44`](./src/components/AppShell.tsx#L30-L44)

**Richtung:** Auf eine klare Tab-Überschrift reduzieren (siehe [3.2](#32-topbar-titel-ist-statisch-training-operations--egal-welcher-tab)); Marke nur in der Sidebar, Untertitel weglassen oder stark kürzen.

### 4.4 Keine CSS-Transitions → abrupte Zustände
`index.css` enthält **0** `transition`/`animation`/`@keyframes`. Alle Hover-/Active-/Selektionswechsel springen hart. Für deinen Hover-Wunsch (Web) und für Touch-Feedback (iPad/iPhone) fehlt damit die wichtigste Politur.

**Richtung:** Dezente `transition` (≈120–160ms) auf Border/Background/Transform; subtiler Press-State (`:active`); `prefers-reduced-motion` respektieren. Da Hover auf Touch nutzlos ist, zusätzlich klare `:active`-States.

### 4.5 Optisch „busy" statt minimalistisch
- Sehr viele **Großbuchstaben-Eyebrows** über jedem Panel.
- **Vier Font-Gewichte** (700 / 800 / 850 / 900) gemischt — u. a. [`src/index.css:194`](./src/index.css#L194), [`src/index.css:277`](./src/index.css#L277), [`src/index.css:448`](./src/index.css#L448), [`src/index.css:581`](./src/index.css#L581).
- **Border + Schatten auf praktisch jeder Karte** ([`src/index.css:222-229`](./src/index.css#L222-L229)) → unruhig.

**Richtung:** Engere Typo-Skala, weniger Uppercase, gruppierte/ruhigere Flächen (Border ODER Schatten, nicht beides überall).

### 4.6 Viel wiederholter Pro-Tab-Boilerplate
Jeder Arbeits-Tab wiederholt: Session-Picker + Sync-Streifen + „Sync"/„Training"-Buttons + Kennzahlen-Block. Das ist über die Tabs hinweg redundant und erhöht die visuelle Last.

**Sichtbar in:** [Check-in 📱](./ux-audit-screenshots/iphone__checkin.png), [Nachbereitung 📱](./ux-audit-screenshots/iphone__nachbereitung.png), [Returner 📱](./ux-audit-screenshots/iphone__returner.png) — fast identische Kopfbereiche.
**Richtung:** Gemeinsame „Session-Kontextleiste" als eine Komponente; pro Tab nur noch der eigentliche Arbeitsinhalt.

### 4.7 Touch-Targets teils unter 44pt
Number-Chips und Pain-Scale-Chips sind kleiner als die Apple-HIG-Mindestgröße (44pt) — am Feld mit Daumen/Handschuh fummelig.

- [`src/index.css:794-800`](./src/index.css#L794-L800) (`.number-chip` 46px, `.pain-scale .number-chip` 42px Breite)

**Richtung:** Interaktive Chips auf ≥44×44px anheben.

---

## 5. Die drei explizit gewünschten Flows

### 5.1 „Was passiert, wenn ich ein PDF in der Bibliothek öffne?"
- PDF-Links sind echte `<a href={pdf.href} target="_blank" rel="noreferrer">` → öffnen einen **neuen Browser-Tab**. [`src/components/LibraryView.tsx:142`](./src/components/LibraryView.tsx#L142)
- Es gibt **keinen In-App-PDF-Viewer**; man verlässt den App-Kontext. In einer installierten iPhone-PWA (standalone) kann `target="_blank"` unschön aus der App herausspringen.
- Die aktiven PDFs sind per Service-Worker für Offline vorgecacht (Sprint 10), sodass sie am Feld ohne Netz verfügbar sein sollten.

**Bewertung:** Für ein MVP akzeptabel. Empfehlung: Hinweis „öffnet PDF in neuem Tab" und langfristig optional eine In-App-Vorschau.

### 5.2 „Was passiert, wenn ich synce?"
- Button „Jetzt synchronisieren" ([`SyncStatusBadge.tsx:53-57`](./src/components/SyncStatusBadge.tsx#L53-L57)) ruft `runManualSync` ([`App.tsx:132-144`](./src/App.tsx#L132-L144)) → `syncAllUserData` + lokales Refresh.
- Button ist deaktiviert, wenn offline / nicht eingeloggt / bereits am Syncen (`canSync`).
- **Schwächen:** das immer sichtbare Offline-Icon ([3.4](#34-offline-wolken-icon-ist-immer-sichtbar--auch-online)) und der Dev-Jargon ([3.3](#33-entwickler-jargon-in-der-coach-ui)). Es gibt **keine sichtbare Erfolgs-Rückmeldung** nach dem Sync (kein Toast) — der Status aktualisiert sich nur still.

**Empfehlung:** Klares Icon, klartextlicher Status, kurze Erfolgsmeldung nach manuellem Sync.

### 5.3 „Was passiert, wenn ich verschiedene Tage / Einheiten auswähle?"
- Funktioniert **sauber**: Der Session-Picker (`<select>` über alle 16 Einheiten KW25–KW31) setzt `selectedSessionId`, das in `localStorage` persistiert wird ([`App.tsx:35-46`](./src/App.tsx#L35-L46), [`App.tsx:146-148`](./src/App.tsx#L146-L148)).
- Die gewählte Einheit steuert konsistent Check-in, Training, Nachbereitung und Returner (alle hängen an `selectedSession`).
- Automatische „heutige" Einheit über `getRelevantSessions` (erste Einheit mit `date >= heute`) ([`src/content/sessions.ts:442-457`](./src/content/sessions.ts#L442-L457)).

**Kleiner Hinweis:** Eine einmal manuell gewählte (auch vergangene) Einheit bleibt nach Reload „kleben", selbst wenn längst eine neue Einheit aktuell wäre. Für den MVP gewollt; ggf. später ein „Heute"-Reset anbieten.

---

## 6. Beobachtungen pro View

### Heute ([📱](./ux-audit-screenshots/iphone__heute.png) · [▭ Portrait](./ux-audit-screenshots/ipad-portrait__heute.png) · [▭ Landscape](./ux-audit-screenshots/ipad-landscape__heute.png))
Gute Inhalte (Session-Karte, Planüberblick, Heute-Ablauf, Schnellzugriff, Safety, Material). Aber: einspaltig auf iPad ([4.2](#42-dashboard-auf-jedem-ipad-einspaltig)), viele gestapelte Panels = langes Scrollen, statische Topbar ([3.2](#32-topbar-titel-ist-statisch-training-operations--egal-welcher-tab)), Dev-Jargon in der Sync-Box.

### Spieler ([📱](./ux-audit-screenshots/iphone__spieler.png) · [▭](./ux-audit-screenshots/ipad-portrait__spieler.png))
- „Sprint 3"-Leak ([3.1](#31-dev-labels-sprint-28-stehen-live-in-der-ui)).
- Anlege-/Bearbeiten-Formular ist **immer ausgeklappt** unter der Liste → langer Scroll. Auf Mobile evtl. besser als Sheet/Modal.
- **Position** ist Freitext (Platzhalter „z. B. Prop, Lock, 9, Centre"), **Cluster** dagegen Dropdown → Inkonsistenz.
- Inaktive Spieler stehen ohne klare Trennung in derselben Liste.

### Check-in ([📱](./ux-audit-screenshots/iphone__checkin.png) · [▭](./ux-audit-screenshots/ipad-landscape__checkin.png))
- „Sprint 4"-Leak. Sauberer Empty-State mit Anleitung („Lege zuerst Spieler an …").
- Touch-Targets der Chips beachten ([4.7](#47-touch-targets-teils-unter-44pt)).

### Training ([📱](./ux-audit-screenshots/iphone__training.png) · [▭](./ux-audit-screenshots/ipad-landscape__training.png))
- „Sprint 5"-Leak. Nutzt als einzige Hauptansicht eine echte 2-Spalten-Aufteilung auf iPad (Timeline + Varianten/Mapping) — **gutes Vorbild** für die anderen Views. Auf iPhone sehr dicht/lang.

### Nachbereitung ([📱](./ux-audit-screenshots/iphone__nachbereitung.png) · [▭](./ux-audit-screenshots/ipad-landscape__nachbereitung.png))
- Zwei Leaks („Sprint 6" + „Sprint 8"). Größte Datei (749 Zeilen), viele Felder gleichzeitig → Überladungs-Risiko; Kandidat für progressive Offenlegung.

### Returner ([📱](./ux-audit-screenshots/iphone__returner.png) · [▭](./ux-audit-screenshots/ipad-landscape__returner.png))
- „Sprint 7"-Leak. Sehr gute, klare **Safety-Kopie** + Red-Flag-Liste — beibehalten.

### Bibliothek ([📱](./ux-audit-screenshots/iphone__bibliothek.png) · [▭](./ux-audit-screenshots/ipad-landscape__bibliothek.png))
- „Sprint 2"-Leak. Suche + Filter-Chips + Liste + Detail funktionieren. Detail-Fallback-Bug ([3.6](#36-bibliothek-detail-panel-zeigt-bei-0-treffern-trotzdem-ein-dokument)). Interne Scroll-Region (`library-list max-height: 610px`, [`src/index.css:459-466`](./src/index.css#L459-L466)) kann auf Mobile verschachteltes Scrollen erzeugen.

### Export ([📱](./ux-audit-screenshots/iphone__export.png) · [▭](./ux-audit-screenshots/ipad-landscape__export.png))
- Funktional vollständig (JSON-Backup, 4× CSV, Import mit Vorschau). Dev-Jargon im Import-Hinweis ([3.3](#33-entwickler-jargon-in-der-coach-ui)). Die 6 Zähler-Karten brauchen viel vertikalen Platz für kleine Zahlen → kompaktes Raster möglich.

---

## 7. Design-System – erste Beobachtungen

Quelle: [`src/index.css`](./src/index.css) (1423 Zeilen, zentrales Stylesheet — gut, dass alles an einem Ort liegt).

- **Farbpalette** (gut gewählt, beibehalten): `--brand #0f2f2e` (Dunkel-Teal), warmes Creme/Off-White (`--bg #f4f7f5`, `--surface #fffdf8`), Akzent/Orange `--focus #b75a2a`, Ampel grün/gelb/rot. [`src/index.css:1-23`](./src/index.css#L1-L23)
- **Radius** konsistent 8px (Pills 999px) — gut.
- **Schatten**: ein Token `--shadow`, aber überall (auch auf „soft"-Panels) → reduzieren.
- **Spacing** ad hoc (8/10/12/14/18/20/22/24px) → auf eine 4/8-Skala vereinheitlichen.
- **Typo**: zu viele Gewichte ([4.5](#45-optisch-busy-statt-minimalistisch)) → straffen.
- **Breakpoints**: 1240 / 980 / 560px — die iPad-relevanten Schwellen sind suboptimal gesetzt ([4.1](#41-ipad-portrait--reine-icon-navigation-ohne-labels), [4.2](#42-dashboard-auf-jedem-ipad-einspaltig)).

---

## 8. Teil 2 – Vertieftes Audit + Design-System

Ergebnis des Multi-Agent-Workflows: **23 Agenten**, 9 View-Audits + 3 Querschnitts-Audits + 2 Research-Agenten + adversariale Verifikation (0 von 58 Bug-Befunden widerlegt) → **35 priorisierte Punkte**. Ein direkter Vergleich mit dem Codex-Audit steht in [`AUDIT_VERGLEICH_CLAUDE_vs_CODEX_2026-06-14.md`](./AUDIT_VERGLEICH_CLAUDE_vs_CODEX_2026-06-14.md).

### 8.1 Kernbefund

Die App hat ein solides Offline-Fundament, eine stimmige Palette und durchdachte Safety-/Entscheidungslogik – **wirkt aber wie ein unfertiges Web-Dashboard statt wie ein natives iPad-Feldwerkzeug**. Größtes Problem: nichts ist auf die Zielhardware zugeschnitten (Dashboard auf **jedem** iPad einspaltig, Nav-Labels weg auf iPad-Portrait, keine iOS-Safe-Area, Dev-Gerüst „Sprint 2–8" + Roh-Enums „synced/centres/training" + `client_updated_at` über alle 8 Tabs). Zweitgrößte Chance: **Dichte & Hierarchie** – jeder Screen ist ein flacher Stapel gleich aussehender Karten ohne klare Primäraktion und ohne Press-/Transition-Feedback.

### 8.2 Design-Richtung (das „stimmige Paket")

Field Hub soll sich wie **eine ruhige, native iPadOS-App** anfühlen: *Content first, Chrome last.* Palette (Teal `#0f2f2e` auf Creme) bleibt, aber **Flächen flach**: statt 38px-Schatten auf jeder Karte nur Haarlinie + Whitespace; echte Elevation nur für **die eine** Hero-Karte und Sheets. Strikte Hierarchie: genau **eine** Primäraktion (`--focus`-Orange) und das Ampelsignal sind am lautesten; Referenz-Panels (Safety, Material, Speicherstatus) treten randlos zurück. iPad = erstklassig (2-Spalten + beschriftete Sidebar); iPhone = native Bottom-Tab-Bar mit Safe-Area + progressiver Offenlegung. System-Font, 6-stufige Typo-Skala, 4px-Raster, sanfte 140ms-Transitions mit Press-State.

### 8.3 Design-System (konkrete Token)

- **Farbe:** Palette behalten. `--focus #b75a2a` als **einzigen** Akzent für die EINE CTA pro Screen (Teal bleibt für Sekundär/Nav). Danger-/Warning-Token einführen (`--danger #8c2f24`, `--warning #8a5a12` …) und die 4 hartkodierten Rottöne ersetzen. Gelbe Aktiv-Ampel kontraststark (`#8a6209`, AA). Focus-Ring als `--ring`-Token. `-webkit-tap-highlight-color: transparent`.
- **Typografie:** System-Font-Stack führen (statt Inter-first). 9 Größen → **6-Stufen-Skala** (2 / 1.5 / 1.25 / 1 / 0.875 / 0.75rem). 4 Gewichte (700/800/850/900) → **3** (400 / 600 Labels / 700 Werte+Titel). Uppercase nur noch für **eine** Rolle (`.eyebrow`).
- **Spacing:** 4px-Token-Set `--s1..--s6` (4/8/12/16/20/24); alle 7/9/10px + 0.4/0.45rem-Streuwerte ersetzen. `.metric` 88→64px, `.player-list-item` 76→64px (mehr Kader auf einen Blick).
- **Flächen:** Eine Elevation-Strategie – `.panel { box-shadow:none }` + Haarlinie; Schatten nur für Hero/Sheets. Innere Karten randlos auf `--surface-strong`. `.panel.soft` als Default für Referenz-Panels. Zwei Radien (`--r-sm 6px`, `--r-md 10px`). **Safe-Area** via `viewport-fit=cover` + `env(safe-area-inset-*)`.
- **Navigation:** iPad – Sidebar nativer (randlose Rows, gefüllte Teal-Pille als Auswahl), **Labels auf iPad-Portrait behalten** (`.nav-button span{display:none}` aus dem 980px-Block löschen). iPhone – **fixe Bottom-Tab-Bar** (<560px) mit 5 Tages-Sektionen + „Mehr"; Topbar-H2 = Live-Tab-Titel; Session-Tabs vor Admin-Tabs gruppieren.
- **Motion:** EINE globale Transition (`background/border/color 140ms`, `transform 120ms`) + `:active { transform: translateY(1px) scale(.985) }` + `prefers-reduced-motion`-Reset. `focus-visible` per `--ring` überall ergänzen.

### 8.4 Priorisierte Roadmap (35 Punkte)

**🔴 P0 – Bugs / Leaks / Hardware (sofort, fast alle Aufwand S)**

| # | Punkt | Art |
|---|-------|-----|
| 1 | „Sprint 2–8"-Dev-Eyebrows aus allen Tabs entfernen | Bug |
| 2 | Topbar-Titel pro aktivem Tab setzen | Bug |
| 3 | 2-Spalten-Dashboard auf iPad (beide Ausrichtungen, Breakpoint ~760px) | Responsive |
| 4 | Nav-Labels auf iPad-Portrait behalten | Responsive |
| 5 | iOS-Safe-Area für installierte PWA (`viewport-fit=cover` + Insets) | Responsive (M) |
| 6 | **Returner-Empty-Entry-ID stabilisieren (Datenverlust bei Re-Render)** | Bug 🔴 |
| 7 | `client_updated_at`/„Konflikt-MVP"-Jargon aus Ruhe-UI entfernen | Bug |
| 8 | CloudOff-Icon + Roh-Status-Enum im Sync-Badge fixen | Bug |
| 9 | Roh-Sync-Status in allen Session-Views lokalisieren | Bug |
| 10 | Roh-Enum-Keys → deutsche Labels in Listen/Tags | Bug |
| 11 | Placeholder-Tag entfernen + „Nächste Sessions"-Deeplink reparieren | Bug |
| 12 | **Ampel-Override kann nie zu Auto zurück (Sicherheit)** | Bug 🔴 (M) |

**🟠 P1 – Hochwertige UX/Visual/Interaktion**

| # | Punkt | Art |
|---|-------|-----|
| 13 | Flächen flach – eine Elevation-Strategie | Visual (M) |
| 14 | Heute: ein Hero + zurückgenommene Sekundär-Panels | UX (M) |
| 15 | Transitions + Touch-Press-State + Tap-Highlight-Reset | Interaktion (S) |
| 16 | Progressive Offenlegung der Check-in-Zeile | Interaktion (L) |
| 17 | Nachbereitung: Akkordeon-Zeilen + nur Anwesende + Baseline nach unten | Interaktion (L) |
| 18 | Training-Quick-Actions: Aktiv-Zustand + entfernbar | Bug (M) |
| 19 | Pro-Save-Sync von UI-Disable/Blur entkoppeln | Bug (M) |
| 20 | Pending/Disabled-State auf Primär-Submit + Import | Interaktion (S) |
| 21 | Disabled-Styling für Chips + Sticky-Hover absichern | Bug (S) |
| 22 | Verschachteltes Scrollen auf Mobile raus + Tablet-2-Spalten | Responsive (S) |
| 23 | Schwache aktive gelbe Ampel kontraststark | Visual (S) |
| 24 | Spieler: list-first + Formular per Sheet + Inaktiv-Handling | UX (M) |
| 25 | Neuen Spieler selektiert lassen (Foto-Upload erscheint) | Bug (S) |
| 26 | Check-in-Freitext geht bei Session-Wechsel verloren | Interaktion (S) |
| 27 | System-Font + Gewichte zähmen + 6-Stufen-Typo | UX (M) |
| 28 | focus-visible + aria-live auf Primäraktionen/Meldungen | Interaktion (S) |

**🟡 P2 – Politur**

| # | Punkt | Art |
|---|-------|-----|
| 29 | Touch-Targets < 44px anheben | Responsive (S) |
| 30 | Redundante Sync-Flächen pro View zusammenführen | UX (M) |
| 31 | Kompakte Metriken auf Backup-/Zahlen-Panels | UX (M) |
| 32 | Bibliothek: Detail in den Viewport scrollen + „Quelle"-Pfad zurücknehmen | UX (M) |
| 33 | Sub-Copy reduzieren + Nav in Session vs. Admin gruppieren | UX (S) |
| 34 | „Einheit abschließen": Bestätigung, Feedback, Wieder-Öffnen | UX (S) |
| 35 | Native Sidebar + Single-Radius/Danger-Token-Cleanup | Visual (M) |

### 8.5 Quick-Wins (höchster Wert pro Aufwand zuerst)

1. **Reine Löschungen** entgerüsten sofort jeden Screen: 7× „Sprint N"-Eyebrows + „App-UI aus aktiver Quelle"-Tag + „Konflikt-MVP/client_updated_at"-Notiz (P0-1/7/11).
2. **Zwei winzige CSS-Edits** reparieren das Primärgerät iPad: Dashboard-Breakpoint auf 760px + `.nav-button span{display:none}` löschen (P0-3/4).
3. **Sync/Enum-Labels** mappen + CloudOff→Cloud → killt englische/kleingeschriebene Token app-weit (P0-8/9/10).
4. **Safe-Area** ergänzen → entsperrt die installierte iPhone-PWA (P0-5).
5. **Eine Transition-Regel** + `:active` + Tap-Highlight-Reset → ganze App fühlt sich nativ an (P1-15).
6. **Topbar-Titel-Map** → Orientierung zurück mit ~6 Zeilen (P0-2).
7. **Returner-Keys `entry.id`→`player.id`** → Ein-Zeilen-Fix gegen kritischen Datenverlust (P0-6).
