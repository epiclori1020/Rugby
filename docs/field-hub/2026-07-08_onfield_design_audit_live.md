# OnField Coach — Design-/UX-/Branding-Audit + Live-Durchgang (2026-07-08)

Stand: 2026-07-08 · Typ: Audit-/Evidence-SSOT (agentenlesbar) · Modus: Read-only (kein App-Code geaendert)

## Zweck & Nutzung fuer Agenten

Dies ist die konsolidierte, verbindliche Audit-Grundlage fuer den OnField-Redesign-Zyklus, aus zwei Durchgaengen: (1) statische Code-/Design-Analyse, (2) **Live-Durchgang mit echtem Login und echten Daten** (20 Spieler). Sie ergaenzt — und widerspricht nicht — den bestehenden SSOTs. Reihenfolge fuer Agenten: zuerst `AGENTS.md` + `memory/index.md` + `onfield_current_state.md` + `onfield_decision_log.md`, dann dieses Dokument fuer Redesign-/UX-/Branding-Arbeit, dann die Fach-SSOTs (`onfield_brand_kit.md`, `onfield_design_system.md`, `onfield_tone_of_voice.md`, `onfield_component_inventory.md`, `onfield_luvi_reuse_audit.md`).

Menschen-Report (ausfuehrlich, gleiche Befunde): `app/field-hub/DESIGN_AUDIT_2026-07-08.md`. Bei Konflikt gilt **dieses** Dokument als kanonische Agent-Fassung.

---

## 0. TL;DR — die 5 Dinge, die ein Agent wissen muss

1. **Kein neues Designsystem noetig — Execution-Drift beheben.** Das dokumentierte Designsystem (`onfield_design_system.md`) ist gut. Der Code implementiert es an entscheidenden Stellen **nicht**. Der groesste Qualitaetssprung ist: das eigene Spec endlich umsetzen.
2. **P0-Blocker existieren** (Launch-relevant): Kiosk-Exit ohne Schloss (Datenschutz/Sicherheit), stilles Autosave ohne Feedback, Returner im „Mehr"-Overflow, Roh-/Dev-Copy an der Oberflaeche. Siehe §4.
3. **Der Nutzer will ab 2026-07-08 einen echten Redesign-Zyklus, keine weitere CSS-Anpassung.** Zielrichtung: *Execute + Elevate Field Graphite* (§6). Ambitionsstufe A vs. B ist vom Nutzer zu bestaetigen.
4. **iPhone/iPad-Paritaet ist erfuellt** (eine responsive PWA, kein Feature-Gating) und bleibt Pflicht. Problem ist nicht Paritaet, sondern iPad-first-Dichte am iPhone. Siehe §5.
5. **Marke bleibt strategisch stabil** (OnField / Field Graphite / Calm Intensity / operations-first). Differenzierung kommt aus **Craft + Signature-Hebeln**, nicht aus Neon. Was „laut/neon/dashboardig" waere, wuerde dokumentierte Entscheidungen ueberschreiben (nur mit expliziter Nutzer-Ratifizierung).

---

## 1. Kern-Diagnose: Execution-Drift (Spec vs. Code)

Der Nutzer ist mit dem inkrementell angepassten Ist-Zustand unzufrieden („wirkt noch wie MVP/AI-Slop"). Ursache ist **nicht** eine falsche Strategie, sondern: **Restraint ohne Craft liest sich als bland, nicht als premium** — und der Code weicht von seinem eigenen dokumentierten Designsystem ab.

| Dokumentierte Regel (SSOT) | Code-Realitaet (verifiziert) | Konsequenz |
|---|---|---|
| Typo-Skala Display→Caption + Metric XL/M, iPhone/iPad (`onfield_design_system.md`) | **Keine Typo-Tokens** in `tokens.css`; 21 hart kodierte `rem`-Groessen allein in `index.css` | keine echte Hierarchie |
| „Maximal drei sichtbare Textgewichte pro Screen" | **~55 von ~59** Font-Weight-Deklarationen sind 800–900 (alles fett) | Hierarchie kollabiert; „schreit" |
| „Zahlen … nutzen tabular numerals" | punktuell vorhanden, nicht als Signature/Scoreboard genutzt | verschenkte Sport-DNA |
| „Live-Coaching ist list-/row-first. Cards sind sekundaer." + Guardrail „Athletenobjekte sind Rows, nicht Card-Walls" | Alles ist gleich schwere weisse Karte (Heute ~15 Panels, Dashboard-Monotonie) | wirkt MVP, keine Fuehrung |
| „Jede View hat genau eine dominante Primaerhandlung oberhalb der Falz." | Training-Toolbar: 5 fast gleichgewichtige Buttons; Heute: kein dominanter CTA | Orientierungslosigkeit |
| Tone of Voice (Deutsch, eine Vokabel) | Umlaut-Mix (`Gruen`, `fuer`, `Rueckblick`) + Denglisch (`Check in players`, `35% Attendance`, `Red Flags`, `Quick Actions`) | „unfertig", inkonsistent |
| „Status nie nur ueber Farbe" | groesstenteils erfuellt (Text+Farbe, Ampel-Chips) | ok |
| Dark Mode „nach Kernflow-Redesign" (deferred) | nicht implementiert | jetzt faellig (Redesign startet) |

> **Merksatz fuer Agenten:** „Baut nicht ein neues System — baut das, das ihr schon spezifiziert habt, und ergaenzt 3–5 Signature-Hebel." Das ist der Unterschied zwischen „noch eine Anpassung" und „echtem Redesign-Resultat".

---

## 2. Live-Durchgang (mit echten Daten)

Login `farajpooryarwin@gmx.at`, 20 echte Spieler, Sync „Online/synchronisiert". (Screenshots vom 14.06. sind veraltet; Live-Zustand ist besser — siehe §8.)

- **Marke konsolidiert** live: `ONFIELD / OnField Coach`, per-Screen-Titel funktionieren.
- **Mit Daten leben die Dashboards:** Heute rechts reich (`12 Warnung(en) pruefen`, Nachbereitungs-Rueckstand `36 Pflichtpunkte offen`, Coach-Insights mit Gelb/Rot-Verlaeufen pro Spieler + Quelle). → „totes Dashboard" gilt **nur** fuer den Leer-/First-Run-Zustand.
- **Check-in-Roster** = brauchbarer Readiness-Readout (Ampel-Randstreifen, Filter, Da/Nicht-da). **Aber:** *jede* Zeile mahnt „Returner klaeren" (Default offen) → Alarm-Rauschen.
- **Analyse:** gute Verb-Rahmung (Beobachten/Modifizieren/Steigern/Rueckmelden), aber **duenne Datenvisualisierung** (KPI-Zahlen + Insight-Liste, keine echten Trend-Charts).
- **Layout-Balance:** auch mit Daten grosse Leerflaeche in Heute links; unausgewogene Spalten.
- **Umlaut-/Denglisch-Bruch live bestaetigt** in denselben Views (z.B. `RPE 6-7 fuer Gruen` neben `HEUTE ZAEHLT`/`pruefen`).
- **Keine kritischen Konsolenfehler** beobachtet.

**Grenze:** iPhone/iPad-Rendering war in der Audit-Umgebung nicht real erzwingbar (Fenster-Resize/Zoom wirkten nicht auf die Capture-Flaeche, blieb ~1512px). Paritaet daher aus Code hergeleitet (robust), nicht per Handy-Screenshot gegengeprueft.

---

## 3. Staerken (bewahren, als Qualitaets-Anker nutzen)

- **Check-in-Wizard** (`SelfCheckInFlow`): eine Frage/Screen, Fortschritt, Review, Disabled-Grund-Microcopy, `aria-live`. Vorbild.
- **Nachbereitungs-Task-Queue** (`PostSessionView` `MissingValuesPanel`): severity-ranked, aktiver Schritt. Bestes Interaktionsmuster der App.
- **PlayersView**: `triggerHapticFeedback` + `aria-live` + Lazy-Avatar. Einziger Screen mit richtigem Save-Feedback → Referenzmuster fuer alle anderen.
- **Bibliothek-PDF-Viewer**: Escape + 8s-Timeout-Fallback + expliziter Lade-/Leerzustand.
- **Medizinische Guardrails** (Returner/Training: „RTP bleibt medizinisch"), Consent-/Foto-Erlaubnis.
- **Token-Fundament** (Farbe/Space/Radius/Shadow/Motion) + Fokus-Ringe + `prefers-reduced-motion` + Safe-Area.
- **Multi-Sport-Config-Layer** (`SportConfig`, `onfieldRugby.ts`) — strategisch wichtig, siehe `onfield_sports_configuration_model.md`.

---

## 4. Priorisierte Backlog (P0/P1/P2)

### P0 — vor jedem ernsthaften Launch
| # | Fix | Betroffen | Aufw | Impact |
|---|---|---|---|---|
| P0-1 | **Kiosk haerten** — Coach-PIN/Hold zum Beenden (nicht `window.confirm`); Lock nicht an `authState` koppeln; Auto-Reset + Nav-Strip | `KioskCheckInView.tsx:36`, `App.tsx:792` | M | H |
| P0-2 | **Save-Feedback ueberall** — `triggerHapticFeedback` + Inline-„gespeichert" (wie PlayersView) auf onBlur/Quick-Actions | Nachbereitung, Returner, Training | M | H |
| P0-3 | **Returner in den Live-Loop** (Top-Level oder aus Heute-„Aufpassen" + Check-in-Rotflag); neutraler/gruener Kartenzustand | Returner/Nav | M | H |
| P0-4 | **Roh-/Dev-Copy raus** — user-sichere Auth-Fehler (kein `VITE_SUPABASE_URL`/`.env`), Supabase-Fehler mappen, hartkodierten Namen „Arwin" entfernen (`publicCheckInErrors.ts:5`) | Auth, Public | L | M |

### P1 — Kern des Redesign-Zyklus
| # | Fix | Betroffen | Aufw | Impact |
|---|---|---|---|---|
| P1-1 | **Typo-Skala als Tokens + Gewicht-Disziplin** (Body 400–500, Labels 600, Headlines 700–800; max. 3 Gewichte) — das dokumentierte Spec umsetzen | Design-System, alle | M | H |
| P1-2 | **Row-first + Hierarchie:** Heute → „Squad heute"-Scoreboard/Roster; Card-Walls zu Rows; iPad-Breite als 2 Spalten; eine Primaerhandlung/View | Heute, Shell, alle | M | H |
| P1-3 | **Umlaut-Sweep** (ASCII→ä/ö/ü/ß), EN-Strings raus, Vokabular vereinheitlichen (Readiness=Belastbarkeit) | alle | L | H |
| P1-4 | **Dark-/Field-Mode** token-basiert (Sonnenlicht-Hochkontrast) — deferred Entscheidung wird jetzt faellig | Design-System | M | H |
| P1-5 | **Onboarding/Login** als First-Run-Schritt; belebte, dreifach-nuetzliche Empty-States | Auth, Heute | M | H |
| P1-6 | **iPhone-Erfahrung** (Progressive Disclosure, Tabellen→Karten, Cockpit entdichten) — siehe §5 | alle (mobil) | M | H |
| P1-7 | **Tabular „Scoreboard"-Numerals + Display-Headline-Font** (Signature; Brand-Font fuer Headlines nach Test erlaubt) | Design-System, Metriken | M | H |
| P1-8 | **Training-Toolbar splitten** (1 Primaer + Overflow fuer destruktiv); **Nachbereitung entdoppeln** + „Einheit abschliessen" sticky | Training, Nachbereitung | M | M |
| P1-9 | **Kiosk-Datenschutz-Copy** + Impersonation-Schutz (oeffentl. „nochmal" entfernen); Athleten-Trend-Loop nach Absenden | Kiosk/Public/Check-in | L | M |

### P2 — Politur / spaeter
- Geteilte `EmptyState/ErrorState/Skeleton` statt ad-hoc; First-Load-Skeletons.
- Breakpoints konsolidieren (599/760/839/900/980 → ein System); Rotations-Flip glaetten.
- Export: Vollbackup elevieren, CSVs zusammenklappen; Returner-Caps strukturieren (Chips/Stepper statt 6 Freitextboxen).
- `window.confirm`-Loeschen → In-App-Sheet; Skalen-Anker pro Chip; orchestriertes Micro-Motion + Haptik (aus LUVI); Analyse echte Charts (CustomPainter-/leichte SVG-Charts, kein schweres Chart-Lib).

---

## 5. iPhone/iPad-Paritaet (kanonische Antwort)

**Inhaltlich gleich vollstaendig — bestaetigt.** Eine responsive PWA (ein React-Baum, kein geraetespezifisches Feature-Gating in Routing/Nav/Shell). Beide Geraete zeigen dieselben Screens/denselben Inhalt; Unterschiede sind Layout-Umbruch, nicht Weglassung. Deckt die Pflicht-Regel aus `AGENTS.md`/Decision Log.

- Nav: Sidebar ≥840px → fixe **Bottom-Tab-Bar** (5 Icons+Label) ≤839px.
- Grids → 1-spaltig; breite Tabellen (Analyse `min-width:720px`) → horizontaler Scroll im eigenen Container.
- Einzige inhaltlich mobil ausgeblendete Sache: `.brand-block` (Produktname im Shell, `display:none` ≤839px) — kosmetisch.
- **Eigentliches Problem = iPad-first-Dichte am iPhone:** dieselben Multi-Panel-Screens werden zu sehr langen Scrolls + quer scrollenden Tabellen („vollstaendig, aber gedraengt"). Kein separater schlanker Athleten-Phone-Client (Athleten nutzen den ohnehin phone-first Check-in-Wizard).
- **To-do:** „ein Inhalt, zwei Layouts" bewusst designen; Tabellen am iPhone in Karten/Listen; Cockpit-Dichte fuers Handy entzerren; feste QA-Groessen iPhone SE 375 / iPhone 15 393 / iPad hoch 834 / iPad quer 1194.

---

## 6. Redesign-Zielrichtung: „Execute + Elevate Field Graphite"

Empfohlene Richtung (Ambitionsstufe A). Sie behaelt Strategie/Marke (`onfield_brand_kit.md`) und liefert trotzdem einen sichtbaren Qualitaetssprung, weil sie (a) das dokumentierte System endlich umsetzt und (b) bereits erlaubte/zurueckgestellte Premium-Hebel aktiviert.

**Die 5 Signature-Hebel (differenzieren, ohne Neon):**
1. **Typo als Star:** Display-Headline-Font (nach Test; erlaubt) + **oversized tabular „Scoreboard"-Numerals** als Marken-Signature fuer Scores/Load/Minuten. (Spec verlangt tabular nums; Brand Kit erlaubt Display-Font.)
2. **Oxblood besitzen:** `#7A1F2B` ist distinktiv (Heritage-Sport, kaum ein Wettbewerber nutzt Burgunder) — auf Brand-Surfaces selbstbewusst als Editorial-Signature einsetzen. Nie als Status.
3. **Dark „Field Mode"** als erstklassige, cinematische Brand-/Sideline-Flaeche (zurueckgestellte Entscheidung, jetzt faellig).
4. **Signature-Device = Field-as-layout + Readiness-Dot** (Field-DNA in Struktur/Zonen, nicht als Wallpaper — deckt Guardrail).
5. **Craft:** strenge Typo-Skala, max. 3 Gewichte, 3-Tier-Surface-Gewichtung (Cockpit-Chrome / „Live"-Karten / ruhiger Grund), grosszuegiger Weissraum, row-first Live-UI.

**Live-Screens bleiben ruhig/operativ** (Brand Kit): Signature-Craft heisst Hierarchie/Type/Numerals/Row-first — **nicht** laute Flaechen, Claims oder Neon in Live-Flows.

### Ambitions-Fork (durch Nutzer zu bestaetigen)
- **Route A — Execute + Elevate (empfohlen):** obiges. Grosser sichtbarer Sprung, treu zu „Calm Intensity", geringes Strategie-Risiko. Loest „wirkt wie MVP" ueber Craft + Signature.
- **Route B — New Territory:** bewusster Bruch mit „ruhig/anti-neon" zu einer lauteren, staerker akzentuierten Identitaet. Mehr Differenzierung, **aber** ueberschreibt dokumentierte Entscheidungen (anti-neon, Oxblood-nicht-laut, ruhige Live-Flows) und riskiert die Consumer-Fitness-/Enterprise-Fallen, die der Brand Kit bewusst vermeidet. Nur mit expliziter Ratifizierung + Decision-Log-Update.

**Status:** Redesign-Scope ist entschieden (echter Redesign statt Anpassung). Visuelle Ambitionsstufe A/B ist offen bis zur Nutzer-Bestaetigung.

---

## 7. LUVI-Benchmark (Kurz; Detail: `onfield_luvi_reuse_audit.md`)
Uebernehmen: „keine Rohwerte in Komponenten"-Regel; Line-Height-als-Ratio + kleine Skala; ein erzwungener Sheet-Einstiegspunkt; geteilter Interactive-Surface-Wrapper (44px + Keyboard + Semantik); CTA-mit-Inline-Loading + Haptik; bespoke CustomPainter-Charts; Theme-Extensions `.light` jetzt / `.dark` spaeter; komponentisierte States. Nicht uebernehmen: Zyklus-/FemTech-Optik, Pastell/Glassmorphism, Maskottchen, volle Rainbow-Celebration.

## 8. Grenzen / Provenienz
- **Kein Live-Handy-Viewport** erzwingbar → Paritaet aus Code (robust), nicht per Screenshot.
- **Screenshots 14.06. veraltet** — bereits behoben und **nicht** als Mangel gewertet: statischer H1 „Training Operations", „Konflikt-MVP/client_updated_at", „SPRINT X", „Field Hub/Rugby Donau S&C", flache 8-Icon-Top-Nav. (Test verbietet „Training Operations".)
- Keine Coach-Feldvalidierung; Priorisierung heuristik-/best-practice-basiert.
- Branding = Richtung, keine fertige Identitaet (Logo/Typo-Spezimen/Hero = eigener Schritt).
- Datenschutz: echte Personen/Gesundheitsdaten im Account; hier keine Namen/Gesundheitsdaten wiedergegeben.

## 9. Cross-Referenzen
`AGENTS.md` (OnField App Work) · `onfield_brand_kit.md` · `onfield_design_system.md` · `onfield_token_sheet.md` · `onfield_tone_of_voice.md` · `onfield_component_inventory.md` · `onfield_luvi_reuse_audit.md` · `onfield_sports_configuration_model.md` · `onfield_decision_log.md` · Menschen-Report: `app/field-hub/DESIGN_AUDIT_2026-07-08.md`.
