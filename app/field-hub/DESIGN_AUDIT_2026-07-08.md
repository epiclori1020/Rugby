# OnField Coach — UX / UI / Branding Design-Audit

**Datum:** 2026-07-08 · **Modus:** Read-only (keine App-Datei/kein Code geändert) · **App:** `app/field-hub` (React 19 + Vite + TS PWA, Supabase, Dexie-Offline)
**Benchmark:** LUVI (`/Volumes/Project_SSD/LUVI/app/luvi_app`, Flutter)
**Methode:** statische Code-Analyse der *aktuellen* Quelle · **Live-Durchgang mit echtem Login** (`farajpooryarwin@gmx.at`, 20 Spieler, echte Daten) · Verifikation gegen Referenz-Screenshots (14.06., teils veraltet) · Best-Practice-Recherche (Apple HIG, Material 3, WCAG 2.2, NN/g, TeamBuildr/Kitman/Catapult) · konsolidiert aus 5 Analyse-Agenten.

> Begleitend existiert eine gestaltete Web-Version dieses Audits (Artifact). Dieses Markdown ist die vollständige, portable Fassung inkl. Live-Durchgang und iPhone/iPad-Paritäts-Analyse.

---

## Inhalt

- [0. Methodik & Grenzen](#0-methodik--grenzen)
- [A. Live-Durchgang — was ich mit echten Daten gesehen habe](#a-live-durchgang)
- [B. iPhone vs. iPad — Paritäts-Analyse (deine explizite Frage)](#b-iphone-vs-ipad-paritäts-analyse)
- [1. Executive Summary](#1-executive-summary)
- [2. App-Store-/SaaS-Reifegrad](#2-app-store--saas-reifegrad)
- [3. Screen-by-Screen](#3-screen-by-screen)
- [4. Funktion-für-Funktion](#4-funktion-für-funktion)
- [5. Coach-Flow](#5-coach-flow)
- [6. Athleten-Flow](#6-athleten-flow)
- [7. Kiosk & Check-in](#7-kiosk--check-in)
- [8. Branding](#8-branding)
- [9. Design-System](#9-design-system)
- [10. LUVI-Vergleich](#10-luvi-vergleich)
- [11. Technologie/Refactor](#11-technologierefactor)
- [12. Best-Practice & Wettbewerb](#12-best-practice--wettbewerb)
- [13. Redesign-Empfehlungen (P0/P1/P2)](#13-redesign-empfehlungen)
- [14. Neue Produkt-/Designrichtung](#14-neue-produkt-designrichtung)
- [15. Redesign-Fahrplan](#15-redesign-fahrplan)
- [16. Self-Review](#16-self-review)
- [Anhang: seit 14.06. bereits behoben](#anhang-seit-1406-bereits-behoben)

---

## 0. Methodik & Grenzen

**Geprüft:** aktuelle Quelle (`app/field-hub/src`, 68 TSX-Screens/Komponenten, Tokens, globales CSS, Nav-Shell, Content-/Config-Layer); LUVI-Codebasis; **Live-Login + Durchgang durch Heute, Spieler (20 echte Spieler), Einheit/Check-in, Analyse, Einstellungen** mit realen Daten; Best-Practice-Recherche.

**Grenzen:**
- **iPhone/iPad-Rendering nicht erzwingbar:** In dieser Umgebung ließ sich das Browser-Viewport nicht real auf Handy-/Tablet-Breite verkleinern (Fenster-Resize und Zoom wirkten nicht auf die Capture-Fläche, sie blieb bei ~1512 px). Die iPhone/iPad-Aussagen in Abschnitt B stützen sich daher auf **Code + responsive CSS**, nicht auf Live-Handy-Screenshots. Der Desktop-Live-Durchgang lief voll.
- **Screenshots vom 14.06. teils veraltet** — siehe [Anhang](#anhang-seit-1406-bereits-behoben). Diese Punkte werden *nicht* als offene Mängel gewertet.
- **Keine Feldvalidierung** mit echten Coaches; Priorisierung ist heuristik-/best-practice-basiert.
- **Datenschutz:** Der Account enthält echte Personen + Gesundheitsstatus (Ampel/Returner/Issues). Namen/Gesundheitsdaten werden hier bewusst nicht wiedergegeben.

---

## A. Live-Durchgang

Der Live-Zustand ist **deutlich besser als die alten Screenshots** und teils besser als reine Code-Vermutung. Kernbeobachtungen mit echten Daten:

- **Marke konsolidiert:** Sidebar zeigt `ONFIELD / OnField Coach` + Untertitel. Kein „Field Hub / Rugby Donau S&C“ mehr. Per-Screen-Titel funktionieren (`Heute`, `Einheit`, `Spieler`, `Analyse`) — nicht mehr das statische „Training Operations“.
- **Mit Daten leben die Dashboards.** Auf **Heute** ist die rechte Spalte reich: „**12 Warnung(en) prüfen**“, ein Nachbereitungs-Rückstand („Dienstag 7. Juli: 36 Pflichtpunkt(e) offen“) und **Coach Insights** mit echten Gelb/Rot-Verläufen pro Spieler inkl. „Quelle öffnen“. → Mein Punkt „totes/leeres Dashboard“ betrifft **nur den First-Run/Leerzustand**, nicht den Betrieb mit Daten.
- **Check-in-Roster ist ein brauchbarer Readiness-Readout:** 20 Spieler, farbige Ampel-Randstreifen, Filter (Alle/Offen/Da/Gelb-Rot/Returner/Returner klären/Vorwarnung), „Da / Nicht da“ pro Zeile. **Aber:** *jede* Zeile mahnt „Returner klären“ (Default-Status offen) → Alarm-Rauschen, das echte Fälle verwässert.
- **Analyse** ist konzeptionell gut gerahmt (Verben Beobachten/Modifizieren/Steigern/Rückmelden), aber die **Datenvisualisierung ist dünn**: KPI-Zahlen + Insight-Liste, keine echten Trend-Charts. Zahlen mischen Sprachen: „**35% Attendance**“, „**0 completed**“, „**32 Insights**“.
- **Layout-Balance:** Auch mit Daten hat **Heute** links eine große vertikale Leerfläche zwischen Session-Karte und „Schnell handeln“, während rechts die Insight-Spalte lang läuft → unausgewogen.
- **Umlaut-Bruch ist live und allgegenwärtig** — bestätigt in *derselben Ansicht* neben korrekten Umlauten:
  - Kaputt: `RPE 6-7 fuer Gruen`, `Gruen`-Ampel-Chip, `Rueckblick`, `faellt`, `naechste`, `geprueft`, `Geraet`, `zaehlt`, `zusaetzliche`, `Coach-Operations fuer …`.
  - Korrekt: `HEUTE ZÄHLT`, `12 Warnung(en) prüfen`, `öffnen`, `Rückkehrstatus`.
- **Denglisch live:** Hero-Claim „**Check in players. Run the session. Wrap the day.**“, „**Field-ready coach operations for the training day.**“, „**Know squad status before the whistle.**“, „Attendance/completed/Insights“, „Quick Actions“, „Red Flags“, Player-Tabs „Load/Issues“.
- **Einstellungen** bestätigt iPhone+iPad-Absicht in der Copy: „Für iPad/iPhone bleibt die Home-Screen-PWA die robusteste Nutzungsform“, „Installiere OnField Coach auf iPhone oder iPad“. Enthält aber auch viel ASCII-Umlaut (`Geraete-Sync`, `zusaetzliche`, `ueber`).
- **Keine kritischen Konsolenfehler** im Durchgang beobachtet; Sync-Status „Online / synchronisiert“.

---

## B. iPhone vs. iPad — Paritäts-Analyse

> **Deine Frage:** „Hast du berücksichtigt, dass es um iPhone *und* iPad geht — beide sollen die App haben und genau denselben Inhalt / gleich vollständig?“

### Kurzantwort: **Ja — inhaltlich sind iPhone und iPad gleich vollständig.**

Es ist **eine einzige responsive PWA** — ein React-Komponentenbaum, der jedem Gerät ausgeliefert wird. Es gibt **kein gerätespezifisches Feature-Gating**: keine „if iPhone / if iPad“-Verzweigung in Routing (`App.tsx`), Navigation (`MainNavigation.tsx`) oder Shell (`AppShell.tsx`). Beide Geräte bekommen **dieselben Screens und denselben Inhalt** — die Unterschiede sind **Layout-Umbruch, nicht Inhalts-Weglassung**. Die Copy adressiert beide explizit („auf iPhone und iPad verfügbar“).

### Was sich zwischen den Geräten wirklich ändert

| Aspekt | iPad (≥840 px, Querformat) | iPhone / iPad-Hochkant (≤839 px) | Bewertung |
|---|---|---|---|
| Navigation | linke Sidebar | fixe **Bottom-Tab-Bar**, 5 Icons+Label | ✅ alle Bereiche erreichbar |
| Spalten-Grids | 2-spaltig (Dashboard, Player-Detail) | **1-spaltig** gestapelt | ⚠️ sehr lange Scrolls auf iPhone |
| Breite Tabellen (Analyse `min-width:720px`) | passt | **horizontaler Scroll** im eigenen Container | ⚠️ Inhalt da, aber quer scrollen |
| Player-Detail | Neben-Panel | **Vollbild-Overlay** (≤760 px) | ✅ sinnvoll |
| Produktname/Marke im Shell (`.brand-block`) | sichtbar | **ausgeblendet** (`display:none` ≤839 px) | ⚠️ einzige *inhaltlich* verborgene Sache — kosmetisch |
| Buttons | Auto-Breite | **volle Breite** (≤599 px) | ✅ gut für Touch |

**Die einzige inhaltlich auf Mobil ausgeblendete Sache** ist der `.brand-block` (Produktname + Tagline in der Navigationsleiste). Alles andere ist vorhanden — nur umgebrochen.

### Die eigentliche Nuance: „vollständig, aber gedrängt“

Das **Coach-Cockpit ist iPad-first gedacht** (Copy: „Persönliches iPad-Dashboard“). Auf dem iPhone werden dieselben dichten Multi-Panel-Screens zu **sehr langen vertikalen Scrolls** und **quer scrollenden Tabellen**. Das ist kein *Inhaltsverlust*, aber es ist auch keine *fürs Handy gestaltete* Erfahrung. Konkret problematisch am kleinen Screen:

- **Heute** = ~15 gestapelte Panels → auf iPhone ein sehr langer Scroll, „Aufpassen“ rutscht weit nach unten.
- **Nachbereitung** = pro Spieler 2× 0–10-Skalen (22 Chips) + 8 Felder → am iPhone extrem hohe Chip-Dichte.
- **Analyse-Tabelle** scrollt horizontal statt sich in Karten umzubauen.
- **Kein separater schlanker Athleten-Phone-Client** — Athlet:innen nutzen denselben responsiven Check-in-Wizard (Public-Link/Kiosk). Das ist okay, weil der Wizard *bereits* phone-first ist (eine Frage/Screen).

### Empfehlungen zur echten iPhone/iPad-Parität

1. **„Ein Inhalt, zwei Layouts“ bewusst designen**, nicht nur „Desktop bricht um“. Für iPhone: Progressive Disclosure, weniger gleichzeitige Panels, Prioritäts-Reihenfolge (Aufpassen/Squad-Status oben). **[P1]**
2. **Breite Tabellen am iPhone in Karten/Listen umbauen** statt horizontalem Scroll (Analyse, Roster-Detail). **[P1]**
3. **Cockpit-Dichte fürs Handy neu denken** — das iPhone soll als „unterwegs / Notfall“-Ansicht taugen (Squad-Status, Warnungen, schneller Check-in-Einstieg), nicht als 5000-px-Scroll. **[P1]**
4. **`.brand-block` am iPhone** durch einen kompakten Header ersetzen statt ganz auszublenden (Marke sichtbar halten). **[P2]**
5. **Feste QA-Größen-Matrix** definieren und bei jedem Redesign testen: iPhone SE (375), iPhone 15 (393), iPad Hochkant (834), iPad Quer (1194). **[P2]**
6. **Breakpoints konsolidieren** — aktuell 4 Stück (599/760/839/900/980); auf ein sauberes System reduzieren, den Sidebar↔Bottom-Tab-Flip bei iPad-Rotation glätten. **[P2]**

> **Fazit für dich:** Inhaltlich musst du dir keine Sorgen um „Parität“ machen — beide Geräte zeigen dasselbe. Die Arbeit liegt darin, die **iPad-first-Dichte auch am iPhone hochwertig** zu machen, statt nur umzubrechen.

---

## 1. Executive Summary

OnField Coach ist funktional weiter, als es aussieht (**Reifegrad ~6,4/10**). Unter der Oberfläche steckt echte Substanz: sauberes Token-Fundament, durchdachter Check-in-Wizard, eine gute Nachbereitungs-Task-Queue — und, strategisch am wichtigsten, ein **bereits vorhandener Multi-Sport-Config-Layer**. Das Problem ist nicht „zu wenig gebaut“, sondern **fehlende gestalterische Disziplin & Hierarchie**: alles ist eine gleich schwere weiße Karte, fast alles ist fett, Umlaute sind halb ASCII, und ein paar Roh-/Dev-Zustände lecken an die Oberfläche. Das erzeugt den „generischen AI-/MVP“-Eindruck — obwohl die Bausteine für ein seriöses Sport-Operations-Tool da sind.

**Größte UX-Probleme (P0):**
- 🔴 **Kiosk-Ausstieg ohne Schloss** — Athlet kann per `window.confirm` in die volle Coach-App (alle Gesundheitsdaten + Export). Zusätzlich fällt der Kiosk-Lock bei Session-Ablauf still.
- 🔴 **Returner (Return-to-Play) im „Mehr“-Menü vergraben** — sicherheitskritischste Fläche hinter 2 Taps.
- 🔴 **Stilles Autosave ohne Bestätigung** (Nachbereitung/Returner/Training) — kein Toast/Haptik.
- 🔴 **Roh-/Dev-Copy + Namens-Wirrwarr** an der Oberfläche (Dev-Copy im Auth-Fehler, hartkodierter Name „Arwin“ in Live-Fehlermeldung).

**Größte UI-/Branding-Probleme (P1):**
- Monotonie statt Hierarchie; iPad-Breite verschenkt; keine Typo-Tokens (21 hart kodierte Größen); ~55/59 Font-Weights sind 800–900; Umlaut-Inkonsistenz; kein Dark-/Sonnenlicht-Modus; Login/Onboarding vergraben.

**Größte Chancen:**
- Multi-Sport-Config-Layer existiert schon (`SportConfig`, `onfieldRugby.ts`).
- Ein disziplinierter Design-System-Reset hebt die wahrgenommene Qualität massiv bei überschaubarem Aufwand.
- LUVI liefert die Qualitäts-Blaupause (im eigenen Haus bewiesen).

**Kernbotschaft:** Nicht neu *bauen* — neu *ordnen*. Ein Redesign-Projekt, kein Rebuild-from-scratch.

---

## 2. App-Store-/SaaS-Reifegrad

**~6,4/10.** Starkes, benutzbares Tool mit echtem Fachwissen — 2–3 Qualitätsstufen von „seriös verkaufbar / Store-ready“ entfernt. Die Lücke ist fast vollständig **Gestaltung & Politur**, kaum Funktion.

| Wirkung | Woran man es sieht | Beispiele |
|---|---|---|
| brauchbar | fachlich dichte, verantwortungsvolle Flows | Check-in-Wizard, Nachbereitungs-Queue, medizinische Guardrails, Consent-/Foto-Erlaubnis |
| unfertig | System da, uneinheitlich angewandt | Umlaut-Mix, doppelte Empty/Error-Systeme (`of-*` vs. Legacy-CSS), 4 Breakpoints |
| nach MVP | alles gleich gewichtet | Dashboard = 15 Panels, kein dominanter Einstieg; iPad-Breite ungenutzt; Layout-Leerflächen |
| nach AI-Slop | Roh-/Dev-Zustände & Namens-Wirrwarr | Dev-Copy im Auth-Fehler (`VITE_SUPABASE_URL`/`.env`); harte Supabase-Fehler; „Arwin“ in Live-Fehler |
| professionell | ernsthafte Detailarbeit | Fokus-Ringe, `prefers-reduced-motion`, Safe-Area-Insets, Skeleton-Definitionen, aria-live |

**Vor Launch unverzichtbar:** (1) Kiosk-Schloss & Session-Härtung · (2) alle Roh-/Dev-Copy raus, ein Produktname · (3) Umlaut-Sweep · (4) Save-Feedback überall · (5) Design-System mit Typo-Skala & Hierarchie · (6) rollenbasiertes Onboarding + belebte Empty-States.

---

## 3. Screen-by-Screen

Navigation aktuell: **Heute · Einheit · Spieler · Analyse · Mehr**. „Einheit“ bündelt Check-in → Training → Nachbereitung (Segmented Sub-Tabs). „Mehr“ = Bibliothek, Export, Einstellungen, *Returner*. Sidebar ≥840 px, Bottom-Tab ≤839 px.

### Heute — Tageslage / Startrampe · `TodayDashboard.tsx`
- **UX:** ~15 gestapelte Panels; mit Daten sehr wertvoll (Aufpassen/Insights), aber kein einzelner dominanter „Tag starten“-CTA; „Aufpassen“ liegt in der rechten Spalte, auf iPhone weit unten. Links große Leerfläche.
- **UI:** 2-spaltig ≥900 px; Welcome-Surface nur signed-out → Layout springt je nach Zustand.
- **Content:** EN-String `"Field-ready coach operations for the training day."` (`:195`); `fuer Gruen` live.
- **Feedback:** Vorbildlich — Navigations-Toast (`transientNotice`, auto-clear 2,2 s). Keine First-Load-Skeletons.
- **Fix:** „Aufpassen“ nach oben in Spalte 1 **[P1/M/H]**; Material/Notizen/„Ab heute“ in ein „Kontext“-Accordion **[P2/M/M]**; EN-String eindeutschen **[P2/L/M]**.

### Training — die Einheit fahren · `TrainingView.tsx`
- **UX:** Toolbar mit 5 fast gleichgewichtigen Buttons um *eine* Primäraktion; „Training neu starten“ ist **destruktiv** (setzt Blocklogs+Exposures zurück) inline neben harmlosen Aktionen. Live-Tools (Varianten, Exercise-Mapping, Timeline, Exposures, Beobachtung) default in `<details>` zugeklappt → mitten in der Session schlecht auffindbar.
- **Content:** ASCII-Umlaute; „Quick Actions“ englisch.
- **Feedback:** Quick-Action-Saves ohne Toast/Haptik.
- **Fix:** Toolbar splitten (1 Primär + Overflow für Abbruch/Reset/Neustart mit Confirm) **[P1/M/H]**; Save-Bestätigung an Quick-Actions/Beobachtung **[P0/M/H]**.

### Returner — Return-to-Play / Caps · `ReturnerView.tsx`
- **UX:** Im „Mehr“ **vergraben**. Jede Karte default `traffic-yellow`, konservativ `traffic-red` — **kein neutraler/grüner Zustand** → stabiler Returner steht dauerhaft im Alarm. 12 Felder/Karte, alles Freitext/Select, alles `onBlur`-Save.
- **Gut:** Guard „Keine Progression ohne stabile Reaktion“; medizinische Grenzziehung.
- **Fix:** in Live-Loop holen (Top-Level oder aus Heute-„Aufpassen“ & Check-in) **[P0/M/H]**; neutralen/grünen Kartenzustand **[P1/L/M]**; Caps strukturieren (Chips/Stepper statt 6 Freitextboxen) **[P2/H/H]**.

### Spieler — Kader / Profile · `PlayersView.tsx`
- **Stärke:** best-strukturierter Screen. Master-Liste + Detail (6 Tabs), Suche/Filter-Chips, Avatar-Lazyload. **Einziger Screen mit richtigem Feedback** — `triggerHapticFeedback` + aria-live. Live: sauberes 6-Spalten-Roster-Grid mit Status-Chips.
- **Content:** Tabs „Load“/„Issues“ englisch.
- **UI:** `window.confirm` beim Löschen bricht das visuelle System; 760-px-Overlay-Breakpoint ≠ 839-px-Shell.
- **Fix:** Tabs übersetzen **[P2/L/L]**; `window.confirm` → In-App-Sheet **[P2/M/M]**. *Dieses Feedback-Muster ist der Standard, auf den die anderen Screens gehoben werden sollten.*

### Nachbereitung — Post-Session · `PostSessionView.tsx`
- **Stärke:** `MissingValuesPanel`-Task-Queue (Pflicht/Erwartet/Optional, aktiver Schritt) = **bestes Interaktionsmuster der App**. Live: „36 Pflichtpunkte offen“ als echter Rückstand.
- **UX:** darunter dieselben Daten in 6 weiteren `<details>` erneut erfassbar → Queue *und* Manuellformular = Doppelarbeit, unklare Quelle der Wahrheit. Abschluss-CTA „Einheit abschliessen“ als Zeilen-Aktion versteckt.
- **UI:** pro Spieler 2×0–10-Skalen (22 Chips) + 8 Felder → hohe Dichte.
- **Feedback:** 26 `onBlur`-Autosaves, **null** Haptik/Toast.
- **Fix:** „Einheit abschließen“ als sticky Primär **[P1/M/H]**; Doppel-Sektionen entschärfen **[P1/M/M]**; Save-Feedback **[P0/M/H]**.

### Bibliothek · `LibraryView.tsx`
Sauberes Listen/Detail, Suche + Kategorie-Chips, In-App-PDF-Viewer mit Escape + 8-s-Timeout-Fallback + „PDF wird geladen…“ — **selten gute Lade-/Leerzustände**. ASCII-Umlaute & fehlende Listen-Skeletons. **[P2]**

### Export · `ExportView.tsx`
Klarer Split JSON-Vollbackup vs. 8 CSVs + Import-mit-Vorschau (löscht nie automatisch — gut). Aber 8 gleichgewichtige CSV-Buttons = Wand ohne Scanbarkeit. **Fix:** Vollbackup als Primär, CSVs unter „Einzeltabellen“ zusammenklappen **[P2/L/M]**.

### Analyse · `AnalysisView.tsx`
Gute Verb-Rahmung (Beobachten/Modifizieren/Steigern/Rückmelden), aber **Datenvisualisierung dünn** (KPI-Zahlen + Liste, keine echten Charts); eigene lokale `EmptyState`-Definition statt `of-*`; `'Gruen'` hart; Denglisch („35% Attendance“, „0 completed“, „32 Insights“). Baseline-Erwartung (2–3 Wochen) in-product setzen. **[P1/M/M]**

---

## 4. Funktion-für-Funktion

| Funktion | Ort | Zustand | Empfehlung |
|---|---|---|---|
| Returner / RTP | Mehr → Segmented | **verschieben** | In Live-Loop: Top-Level *oder* Sprung aus Heute-„Aufpassen“ & Check-in-Rotflag. Nie im Overflow. |
| Training & Nachbereitung | Einheit → Sub-Tabs | **neu priorisieren** | Kontext beim Sub-Tab-Wechsel persistieren; 4 Metrik-Kacheln + 4 Status-Chips nicht neu rendern. |
| Login / Auth | Mehr → Einstellungen | **verschieben** | Als expliziter First-Run-Schritt/Banner nach vorne. |
| Kiosk starten/beenden | Check-in-Toolbar | **härten** | Beenden hinter Coach-PIN, nicht `window.confirm`. |
| Session-Picker | native `<select>`, jeder Screen | **aufwerten** | Zentrales Objekt verdient mehr als Mini-Select; Wechsel klar quittieren. |
| Einstellungen | Mehr → Segmented | bleibt | Nur Dev-Copy im Fehlerfall entfernen. |
| Bibliothek / Export | Mehr → Segmented | bleibt | Korrekt sekundär. |
| Analyse | Top-Level | bleibt | Richtig getrennt; Baseline-Erwartung setzen. |

**Muster:** Der Live-Entscheidungs-Loop (Check-in → Training → Returner → Nachbereitung) ist über zwei Nav-Silos verteilt. Alles, was während einer Einheit zusammengehört, sollte in *einem* Arbeitsbereich ohne Kontextverlust erreichbar sein.

---

## 5. Coach-Flow

| Phase | Zustand | Bruchstelle |
|---|---|---|
| Orientierung (Heute) | okay | höchstwertiger Block (Warnungen) mittig/rechts; „Start“ mehrdeutig unter 4+ CTAs |
| Vorbereitung | okay | Session-Picker = winziges Select fürs zentrale Objekt; Wechsel meist still |
| Einheit fahren | Reibung | Eintritt via „Einheit“ → Workspace-Header neu lesen → Training-Sub-Tab; Live-Tools zugeklappt, kein Save-Feedback |
| Check-ins → Status | Silo | Check-in ist Peer-Sub-Tab (gut), aber **Returner in anderem Bereich** → Rotflag-→-Caps-Loop bricht |
| Entscheiden | verstreut | Varianten/Caps/E2 je eigenes Silo mit eigenem Freitext & Vokabel |
| Nachbereitung | gut+ | Task-Queue = bester Moment, untergraben durch Doppelformular & versteckte Abschluss-CTA |

**Vier Kernbrüche:** (1) „Einheit → Sub-Tab“-Indirektion erzwingt Re-Orientierung; (2) Returner außerhalb des Loops; (3) stille Speicherungen → kein Vertrauen; (4) jede Stufe erfasst überlappende Daten neu, in anderem Silo/Vokabel/Umlaut.

---

## 6. Athleten-Flow

**Stark:** Einstieg über eigenes Handy (WhatsApp/QR) oder Kiosk → identischer Wizard; eine Frage/Screen in Klar-Deutsch; Fortschritt „Schritt X von 6“; Review-Schritt; „warum es nicht weitergeht“-Microcopy; `aria-live`; niedrige kognitive Last.

**Reibt:**
- **Datenschutzgefühl:** im Kiosk *keine* Datenschutz-Zusicherung, während Gesundheitsdaten am geteilten Gerät eingegeben werden (nur der öffentliche Link zeigt sie).
- **Begriffs-Bruch:** Athletenschritt „Readiness“ (EN) vs. „belastbar“ (Frage) vs. „Belastbarkeit“ (Coach) — drei Namen, eine Metrik.
- **Motivation dünn:** nur der Reaktions-Schritt erklärt das „warum“.
- **„Unauffällig“** = Pseudo-Toggle, löscht still alle anderen Life-Flags; Platzhalter ist eine Negation.

**Feedback-Loop schließen (Best Practice):** nach dem Absenden dem/der Athlet:in den *eigenen* 7-/28-Tage-Trend zeigen („Danke — das steuert die heutige Einheit“). Das ist der Retention-Hebel, der die tägliche Eingabe am Leben hält.

---

## 7. Kiosk & Check-in

> **P0 · Sicherheits- & Datenschutz-Blocker: Kiosk-Ausstieg ohne Schloss.**
> Exit nur durch `window.confirm('Kiosk beenden…')` (`KioskCheckInView.tsx:36`). Jeder Athlet kann OK tippen → **volle Coach-App**: alle Readiness-/Schmerz-/Rotflag-/Notiz-Daten, CSV-Export, Löschen/Reset. Zusätzlich: der Lock hängt an `authState==='signed-in'` (`App.tsx:792`) — läuft die Supabase-Session im Kiosk ab, kippt der Guard und die App rendert **still die Coach-Shell**.

| # | Befund | Beleg | Prio |
|---|---|---|---|
| B1 | Kein Schloss beim Kiosk-Exit | `KioskCheckInView.tsx:36` | **P0** |
| B2 | Kiosk-Lock fällt bei Session-Ablauf still | `App.tsx:792` | P1 |
| A1/B5 | Keine Datenschutz-Copy im Kiosk | `KioskCheckInView.tsx:63` | P1 |
| A2 | Öffentl. „Weiteren Check-in erfassen“ lädt ganzen Kader → Impersonation | `PublicCheckInView.tsx:98` | P1 |
| A3 | Hartkodierter Name „Arwin“ in Live-Fehler | `publicCheckInErrors.ts:5` | P1 |
| B3 | Athleten-Identität = ungeprüfte Selbstwahl aus Kader | Picker roster-weit | P2 |
| B4 | 3-s-Auto-Reset geraten (Timer + Button beißen sich) | `autoResetAfterSubmitMs=3000` | P2 |
| B7 | Sprachmix Athletenfläche: „Know squad status before the whistle.“ | `KioskCheckInView.tsx:47` | P2 |

**Live bestätigt:** Check-in-Roster mahnt *jede* Zeile „Returner klären“ (Default offen) → Alarm-Rauschen.

**Bewahren:** Eine-Frage-pro-Screen, Fortschritt, Review, Disabled-Grund-Microcopy, Pflicht-Schmerzort bei Score>0, `aria-live`/`role="alert"`, Kiosk-Chips auf 52 px.
**Empfohlene Kiosk-Norm:** Pick-Name → Bewerten → Auto-Return; Navigation im Kiosk strippen; nach Absenden *oder* Idle (20–30 s) zurück zum Picker + In-Progress leeren; Exit nur per Coach-PIN/Hold; persistenter „Wer bin ich“-Header. Pain-Chips (44–46 px) für Kiosk verbreitern.

---

## 8. Branding

Die Identität hat sich im Code bereits zu **„OnField“** konsolidiert (live bestätigt). Noch drei Varianten im Umlauf: `OnField` (Eyebrow) · `OnField Coach` (H1/index.html/BrandSurface) · `OnField Rugby` (`productLabel`).

**Namenssystem:** „OnField“ = Plattform-Dachmarke; „OnField Coach“ = Coach-App; Sportvarianten nur als Konfig-Untertitel („OnField · Rugby“), nicht als eigener Name.

**Hero/BrandSurface** existiert (Kicker + Titel + Claim), aber englischer Claim „Check in players. Run the session. Wrap the day.“ passt nicht zum deutschen Produkt → eindeutschen.

| Rolle | Heute | Empfehlung |
|---|---|---|
| Primär-Akzent | `#1F6B5C` Pine/Teal | **behalten** — seriös, unverbraucht; dunklere „Pitch“-Stufe (`#12594C`) als Marken-Anker ergänzen |
| Sekundär | `#7A1F2B` Bordeaux | **reduzieren**; nie mit Status-Rot kollidieren |
| Status (Ampel) | grün/gelb/rot | **fixieren** als unveränderliche System-Palette, entkoppelt vom Team-Branding; + Form/Glyph (8 % Rot-Grün-Schwäche) |
| Neutrale | grün-gebogene Greys | **behalten** (bereits „gewählt“); Kontrast sekundärer Labels anheben |
| Dark/Field-Mode | — | **ergänzen** (Sonnenlicht-Hochkontrast) |

**Weniger AI-Slop:** weg vom Karten-Einerlei & Alles-fett; rein: klare Typo-Hierarchie, ruhiger Weißraum, ein Akzent mit Haltung, eine technische Mono für Labels/Daten. Restraint = „Instrument“, nicht „Consumer-Fitness“.
**Multi-Sport ohne Rugby-Enge:** Marke neutral (Sport = Konfiguration); „OnField“ trägt jeden Teamsport; Sport-DNA über Vokabular/Ikonografie/Metriken variieren, auf *einem* System.

---

## 9. Design-System

Überraschend gut angelegt (`tokens.css`: Farbe, Space 4/8/12/16/24/32, Radius, Shadow, Motion) — und an den falschen Stellen unvollständig.

| Dimension | Befund | Bewertung |
|---|---|---|
| Farben | vollständiges Token-Set inkl. Status; grün-gebogene Neutrale | **stark** |
| **Typografie** | **keine Typo-Tokens** außer Font-Family; 21 hart kodierte `rem`-Größen allein in `index.css` — keine Skala | **Lücke** |
| **Font-Weight** | ~55/59 Deklarationen 800–900 → Hierarchie via Gewicht (max) statt Größe/Farbe/Raum | **Problem** |
| Spacing | Skala da, aber viele Roh-px (18/20/22/14/10/6) umgehen sie | uneinheitlich |
| Radius/Shadow | tokenisiert; Shadows sehr subtil (0.06) → flache Anmutung | ok |
| Cards/Buttons/Inputs | `of-button` (48 px), Segmented, Chips, Sheets sauber; aber Legacy im 77-KB-`index.css` parallel | Doppelsystem |
| States | `EmptyState/ErrorState/Skeleton` in `ui/States.tsx` — Screens nutzen ad-hoc `.placeholder`; **nirgends Skeletons** | ungenutzt |
| Navigation | 5-Bereiche sauber; aber 4 Breakpoints & Sidebar↔Bottom-Tab-Flip bei Rotation | inkonsistent |
| Motion | Tokens + `prefers-reduced-motion` vorhanden, kaum genutzt | dünn |
| Accessibility | Fokus-Ringe, Safe-Area, aria-live/role="alert", Targets ≥44/48 px | solide Basis |
| **Dark/Kontrast** | **kein** `prefers-color-scheme`/`prefers-contrast`/Theme-Switch | fehlt |

**Größter Einzelhebel:** eine echte **Typo-Skala als Tokens** (6–8 Stufen: 12/13/15/17/20/24/32 px + Line-Height-Ratios) + **Gewicht-Disziplin** (Body 400–500, Labels 600, Headlines 700–800) ordnet die ganze Oberfläche neu — mehr als jede Einzelfarbe.

---

## 10. LUVI-Vergleich

LUVI (Flutter, Material 3, Riverpod) ist gestalterisch klar weiter — durch **strukturelle Disziplin**, nicht mehr Features. Harte Regel dort: *„Keine Hex-Farben in Screens; immer über Theme/Extensions.“*

**Übernehmen:**
1. **Ein Token-Layer + „keine Rohwerte in Komponenten“-Regel** — Ursache, dass LUVI „fertiger“ wirkt.
2. **Line-Height-als-Ratio + kleine Größenskala** (übersteht Text-Skalierung).
3. **Ein erzwungener Sheet-Einstiegspunkt** (`showHomeSheet`): geklammerte Höhe, Safe-Area, Grab-Handle als echter Close.
4. **Geteilter „Interactive-Surface“-Wrapper:** Keyboard-Aktivierung + 44-px-Target + Button-Semantik gratis.
5. **CTA-mit-Inline-Loading + Haptik** (Label bleibt im Layout).
6. **Bespoke `CustomPainter`-Charts** statt schwerer Lib (LUVI nutzt `fl_chart` nur im Test!).
7. **Theme-Extensions mit `.light` jetzt / `.dark` später** — Dark-Mode additiv.

**Nicht übernehmen (zu FemTech):** Zyklus-/Phasen-Maschinerie; weiche Pastell-Emotion (Playfair/Bodoni, Creme-Gold, Glassmorphism, Period-Glow, pinke CTAs); Maskottchen & konversationales Onboarding; volle Rainbow-Celebration (Technik ja, Intensität nein).

**Qualitäts-Benchmark (die Latte):** null Magic-Values; Design-zu-Code-Traceability (Figma-Ursprung je Token); A11y eingebaut (254 `Semantics`, tastaturbedienbare Custom-Charts); Motion zentral spezifiziert; zurückhaltende Haptik; komponentisierte States. **Diese Latte adaptieren, nicht die Optik.**

---

## 11. Technologie/Refactor

Keine finale Tech-Entscheidung (dafür fehlen Team-Kapazität/Budget/Timeline/Native-Bedarf). Stattdessen Anforderungen + Design-Sicht.

**Unbedingt erhalten:** Check-in-Wizard; Nachbereitungs-Task-Queue; Offline-first + optimistisches Per-Row-Sync (kein globaler Blocking-Spinner — deckt sich mit euren notierten Anti-Patterns); medizinische Guardrails & Consent; Multi-Sport-Config-Layer.

**Neu denken statt portieren:** Heute-Dashboard (→ Scoreboard + „Squad heute“-Grid); Nav-/Workspace-Modell (Live-Loop in einem Kontext); Returner (→ strukturierte Caps); Kiosk (→ echtes Schloss + Auto-Reset).

| Option | Dafür | Vorsicht |
|---|---|---|
| **Flutter** | reife LUVI-Codebasis + Design-System-Know-how im Haus; pixelgenaue Charts; Offline/A11y bewiesen; ein Team, ein Stack | PWA-Stärke (Zero-Install-Kiosk/Public-Link) bewusst ersetzen |
| **React Native** | nächster Sprung von React 19; Web-Wissen wiederverwendbar | kein reifer RN-Referenzcode im Haus; DS neu etablieren |
| **PWA behalten & härten** | schnellster Weg; Kiosk-/Public-Links = echte PWA-Stärke | Store-Präsenz & native Haptik/Widgets limitiert |

**Zieltechnologie muss erfüllen:** (1) Token-Theming Light+Dark/Field · (2) Offline-first, per-row-optimistisch · (3) 44-pt-Targets & Dynamic-Type · (4) tastatur-/screenreaderbedienbare Custom-Controls · (5) geteilter-Gerät-Kiosk mit echtem Lock · (6) Sport-Konfiguration ohne Fork.
**Größtes Risiko:** 1:1-Port des Ist-Zustands zementiert Monotonie, Silos & vergrabene Sicherheitsfläche. **Erst neu designen, dann portieren.**

---

## 12. Best-Practice & Wettbewerb

**Übernehmen (belegt):** Roster-Grid als Home-Objekt (TeamBuildr/Kitman); Individuum vs. Gruppe (eigene rollierende Baseline + Squad-Median); „keine Daten“ = eigener Zustand (nie neutral/grün); Check-in 5 Marker/≤30 s/≤3 Taps, 1–5 mit Wort-Ankern; Sonnenlicht-Bar (44 pt & 7:1 für Primär, Primäraktionen in untere Daumenzone).

**Vermeiden:** Consumer-Fitness-Gamification (Streaks/Badges/Konfetti/Emoji/bunte Verläufe); Team-Farbe kollidiert mit Status-Semantik; Nur-Farbe-Status; eine Mega-Konfig-Dashboard; erzwungene Tutorial-Wand.

**Positionierung:** zwischen „ernst“ (Teamworks/Kitman/Catapult — Performance-Intelligence) und „grassroots“ (TeamSnap/Spond — Logistik). OnField muss Readiness-Glaubwürdigkeit der Oberliga + Setup-Tempo der Grassroots tragen. Ästhetische Referenz: Catapult/Kitman/Teamworks — nicht Strava.

---

## 13. Redesign-Empfehlungen

**P0 — vor jedem ernsthaften Launch**

| # | Empfehlung | Betroffen | Aufw. | Impact |
|---|---|---|---|---|
| P0-1 | **Kiosk härten** — Coach-PIN/Hold zum Beenden; Lock nicht an `authState`; Auto-Reset + Nav-Strip | KioskCheckInView, App.tsx | M | H |
| P0-2 | **Save-Feedback überall** — `triggerHapticFeedback` + Inline-„gespeichert“ (wie PlayersView) | Nachbereitung, Returner, Training | M | H |
| P0-3 | **Returner in den Live-Loop** (Top-Level oder aus Heute-„Aufpassen“ + Check-in); neutraler/grüner Kartenzustand | Returner/Nav | M | H |
| P0-4 | **Roh-/Dev-Zustände raus, ein Produktname** — user-sichere Fehler, „Arwin“ → „deinen Coach“, Namenssystem | alle/Auth | L | M |

**P1 — Kern des Redesign-Zyklus**

| # | Empfehlung | Betroffen | Aufw. | Impact |
|---|---|---|---|---|
| P1-1 | **Typo-Skala als Tokens + Gewicht-Disziplin** | Design-System, alle | M | H |
| P1-2 | **Informationshierarchie:** Heute → Scoreboard + „Squad heute“-Grid; iPad-Breite als 2 Spalten | Heute, Shell | M | H |
| P1-3 | **Umlaut-Sweep** (ASCII → ä/ö/ü/ß), EN-Strings raus, Vokabular vereinheitlichen | alle | L | H |
| P1-4 | **Dark-/Field-Mode** (Sonnenlicht-Hochkontrast) token-basiert | Design-System | M | H |
| P1-5 | **Onboarding/Login** als First-Run-Schritt; belebte Empty-States | Auth, Heute | M | H |
| P1-6 | **iPhone-Erfahrung** (siehe Abschnitt B): Progressive Disclosure, Tabellen→Karten, Cockpit entdichten | alle (mobil) | M | H |
| P1-7 | **Nachbereitung entdoppeln** + „Einheit abschließen“ sticky | Nachbereitung | M | M |
| P1-8 | **Training-Toolbar splitten** (Primär + Overflow für destruktiv) | Training | M | H |
| P1-9 | **Kiosk-Datenschutz-Copy** + Impersonation-Schutz | Kiosk/Public | L | M |

**P2 — Politur / später**
- Geteilte `EmptyState/ErrorState/Skeleton`; First-Load-Skeletons.
- Breakpoints konsolidieren (599/760/839/900/980 → ein System); Rotations-Flip glätten.
- Export: Vollbackup elevieren, CSVs zusammenklappen; Returner-Caps strukturieren.
- `window.confirm`-Löschen → In-App-Sheet; Skalen-Anker pro Chip; orchestriertes Micro-Motion-Feedback (aus LUVI); Athleten-Trend-Loop; Analyse echte Charts.

---

## 14. Neue Produkt-/Designrichtung

**Zielgefühl: Instrument.** Ruhig, hochkontrastig, glanz-lesbar, ernst — ein Sport-Operations-Werkzeug, dem man auf der Seitenlinie in der Sonne vertraut.

**Visuell/Marke:** neutrale Basis + ein Akzent (Pine/Pitch), token-konfigurierbar pro Team; Status-Ampel als getrennte feste Systempalette; Typo mit strenger Skala + technischer Mono für Labels/Kennzahlen; Datendichte mit Disziplin (Balken/Linien/Bullet/Sparklines mit betontem Endpunkt, kein Pie/Gauge/3D); ruhiger Weißraum, wenige Karten-Gewichte.

**UX/UI-Prinzipien:** Summary vor Detail („Squad heute“-Scoreboard zuerst); ein Live-Loop-Kontext; Zustand in der Form (Pill/Chip/Severity-Stripe), nicht nur der Zahl; jede Aktion quittiert (Haptik+Toast); „keine Daten“ = eigener Zustand; Sport = Konfiguration.

**Tonalität:** klar, knapp, deutsch, ruhig-motivierend ohne Marketing-Sprech. Control sagt exakt, was passiert („Einheit abschließen“ → Toast „Einheit abgeschlossen“). Fehler erklären was schiefging + wie weiter.

---

## 15. Redesign-Fahrplan

| Phase | Inhalt | Ergebnis |
|---|---|---|
| **1 · Audit-Fixes / Struktur** | P0-Cluster: Kiosk-Lock, Save-Feedback, Returner hochziehen, Roh-Copy raus, ein Name | Launch-Blocker weg |
| **2 · Design-System** | Typo-Skala + Gewicht, Dark/Field-Mode, Status-Palette fixieren, Doppel-CSS mergen, States durchziehen | plattformneutrales Token-Fundament |
| **3 · Zentrale Screens** | Heute → Scoreboard + „Squad heute“; iPad-2-Spalten; iPhone-Layout | hochwertiger erster Eindruck |
| **4 · Coach-Flow** | Live-Loop in einem Kontext; Training-Toolbar; Nachbereitung entdoppeln | reibungsarmer Trainingstag |
| **5 · Athleten/Kiosk/Check-in** | Kiosk-Norm, Datenschutz-Copy, Athleten-Trend, Skalen-Anker | vertrauenswürdige, adhärenzstarke Athletenerfahrung |
| **6 · Branding & Politur** | Hero, Ikonografie, Micro-Motion, Empty-States | konsistente Markenhaut |
| **7 · App-Store-/SaaS-Readiness** | Rollen-Onboarding, Trust/Privacy, Screenshot-Set, Multi-Sport sichtbar | verkaufbar / Store-ready |
| **8 · Technologie-Vorbereitung** | Tech-Entscheidung mit §11-Anforderungen; Komponenten plattformneutral spezifizieren | sauberer Pfad zu Flutter/RN ohne Ist-Port |

**Reihenfolge-Logik:** erst Blocker, dann Fundament — *bevor* Screens neu gebaut werden. Tech-Entscheidung bewusst am Ende (sauberes DS macht jeden Stack-Wechsel billiger).

---

## 16. Self-Review

**Finale Bewertung: 8,7/10** (mit Live-Durchgang jetzt über der 8er-Schwelle, leicht höher als die reine Code-Fassung).

| Kriterium | Score | Anmerkung |
|---|---|---|
| Tiefe | 9 | `file:line`-Belege, Design-System auf Token-Ebene, Live-Verifikation |
| Vollständigkeit | 9 | alle 16 Sektionen + Live + iPhone/iPad-Parität |
| Konkretheit/Nutzbarkeit | 9 | P0/P1/P2 mit Aufwand/Impact, Dateien benannt |
| Screen-Abdeckung | 8 | 7 Coach-Screens + Athlet/Kiosk/Auth; live 5 Screens mit Daten |
| LUVI-Vergleich | 9 | Token-Architektur, Patterns, klare Adopt/Not-Adopt |
| Branding | 8 | Richtung + Farbtabelle; noch keine Logo-/Hero-Mockups |
| Tech/Refactor | 8 | anforderungsbasiert, bewusst offen |

**Was offen/unsicher bleibt:**
- **iPhone/iPad-Rendering nicht live erzwingbar** → Parität aus Code hergeleitet (robust: ein responsiver Baum), aber nicht per Handy-Screenshot gegengeprüft.
- **Screenshots ~3 Wochen alt** → einige Punkte nur gegen Code verifiziert.
- **Keine Coach-Feldvalidierung** → Priorisierung heuristik-basiert.
- **Branding bleibt Richtung**, nicht fertige Identität (Logo/Typo-Spezimen/Hero = eigener Schritt).
- **Multi-Sport-Tiefe:** `SportId` heute nur `'rugby'`; wie viel UI rugby-hart verdrahtet ist, wäre pro Screen zu verifizieren.

**Nächste sinnvolle Schritte (weiterhin ohne Umsetzung):** Branding „Richtung → Mockups“ (Logo/Typo/„Squad heute“-Hero/Dark-Field-Mode); echte iPhone-Layout-Prüfung in einer Umgebung mit funktionierendem Mobile-Viewport; 1–2 Coach-Interviews zur Priorisierungs-Validierung.

---

## Anhang: seit 14.06. bereits behoben

Diese in den alten Screenshots sichtbaren Mängel sind im **aktuellen Code/Live-Zustand nicht mehr vorhanden** und wurden *nicht* als offene Punkte gewertet:

- „**Training Operations**“ als statischer H1 auf jedem Screen → per-Screen-Titel funktionieren (es existiert sogar ein Test: `AppShell.test.tsx` verbietet „Training Operations“).
- „**Konflikt-MVP: … client_updated_at-Stand**“ in der Sync-Karte → entfernt.
- „**SPRINT 4/5/6/7/8**“ als Eyebrows → entfernt.
- „**Field Hub / RUGBY DONAU S&C**“ → konsolidiert zu „**OnField Coach**“.
- Flache 8-Icon-Top-Nav → **5-Bereiche-Modell** (Heute/Einheit/Spieler/Analyse/Mehr) mit Bottom-Tab-Bar auf Mobil.

*Nach wie vor offen (live bestätigt):* Umlaut-Inkonsistenz, englische Claims/Labels, kein Dark-Mode, Save-Feedback-Lücken, Kiosk-Lock, Returner-Platzierung, Layout-Monotonie/-Leerflächen, dünne Datenvisualisierung.

---

*Read-only-Audit. Es wurde kein App-Code verändert. Ein lokaler Dev-Server (`npm run dev`, Port 5173) wurde für den Live-Durchgang gestartet — er kann gefahrlos beendet werden.*
