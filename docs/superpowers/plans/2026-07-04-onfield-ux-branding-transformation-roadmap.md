# OnField UX, Branding und App-Transformation Roadmap

Status: Planungsdokument, 2026-07-04
Produkt: OnField Coach, aktuell technisch noch `app/field-hub`
Erste Sportart: OnField Rugby
Ziel: Aus dem aktuellen Rugby S&C Field Hub eine ruhige, native, feldtaugliche, sportartenuebergreifend skalierbare Coach-App machen.

> Fuer kuenftige KI-Agenten: Dieses Dokument ist die zentrale Sprint-Roadmap. Vor Umsetzung eines Sprints zuerst den Memory-/Context-Router nutzen, dann nur die fuer den Sprint relevanten SSOTs laden und den jeweiligen Sprint-Scope strikt einhalten. Nicht versuchen, mehrere spaetere Sprints nebenbei mitzuerledigen.

## Kurzfassung der Zielentscheidung

Wir bauen die App nicht nur "schoener". Wir ordnen das Produkt neu.

Die Zielstruktur lautet:

- Hauptmarke: **OnField**
- Aktuelle App: **OnField Coach**
- Spaetere Plattform: **OnField Performance**
- Erste Sport-Konfiguration: **OnField Rugby**

Die App soll spaeter fuer alle Sportarten konfigurierbar sein. Rugby bleibt die erste reale Umsetzung, aber Begriffe, Positionen, Metriken, Session-Typen und Workflows duerfen nicht dauerhaft hart in die Produktlogik eingebrannt werden.

iPhone und iPad muessen fachlich dasselbe koennen. Der Unterschied liegt nur in Layout, Navigation und Interaktionsdarstellung:

- iPad: Sidebar + Content + optional Detailpanel.
- iPhone: Bottom Tab Bar + Stack/Sheets.
- Kein Feature darf nur auf iPad funktionieren.
- Kein Screen darf auf iPhone nur eine verkleinerte iPad-Version sein.

## Pflichtkontext und Context Routing

Ziel: Agenten sollen nicht blind die komplette Roadmap, beide Researches und alle SSOTs laden. Der Kontext muss gezielt geladen werden, damit Memory hilft statt Kontext-Bloat zu erzeugen.

Jeder Agent liest vor OnField-Arbeit immer:

1. `AGENTS.md`
2. `docs/field-hub/memory/index.md`
3. `docs/field-hub/onfield_current_state.md`
4. `docs/field-hub/onfield_decision_log.md`
5. den passenden OnField-Skill in `.agents/skills/...`

Danach entscheidet der Memory-/Context-Router, welche weiteren Dateien relevant sind.

Wenn SSOT-Dokumente aus Sprint 0B bereits existieren, werden sie nur geladen, wenn sie fuer die Aufgabe relevant sind:

- `docs/field-hub/onfield_product_brief.md`
- `docs/field-hub/onfield_brand_kit.md`
- `docs/field-hub/onfield_tone_of_voice.md`
- `docs/field-hub/onfield_design_system.md`
- `docs/field-hub/onfield_component_inventory.md`
- `docs/field-hub/onfield_sports_configuration_model.md`
- `docs/field-hub/onfield_pwa_accessibility_qa.md`
- `docs/field-hub/onfield_ai_agent_playbook.md`

Die langen Research-Dateien bleiben Quellenmaterial. Sie sind nicht Standard-Pflichtkontext fuer normale Implementierung.

## Was aus den Researches verbindlich genutzt wird

Aus dem UX-/UI-Research nutzen wir verbindlich:

- Top-Level-Navigation: `Heute`, `Einheit`, `Spieler`, `Analyse`, `Mehr`.
- `Check-in`, `Training`, `Nachbereitung` werden Unterbereiche von `Einheit`.
- iPhone braucht sichtbare Bottom Tab Bar statt Hamburger-only.
- iPad braucht Sidebar + Arbeitsflaeche + optional Detailpane.
- Check-in wird roster/list-first, nicht card-first.
- Nachbereitung wird task-queue-first.
- Training wird live-first mit aktuellem Block oben/sticky.
- Sync/Backup wird als kleine globale Statuslogik vereinheitlicht.
- Touch Targets mindestens 44 x 44 px, feldkritisch 48-56 px hoch.
- Status nie nur ueber Farbe, immer Farbe + Text + optional Icon.
- Medizinische Sprache bleibt vorsichtig: Hinweise, keine Diagnose, keine Freigabe.
- Offline/Pending/Sync muessen sichtbar und verstaendlich bleiben.

Aus dem Branding-/Designsystem-Research nutzen wir verbindlich:

- Richtung: ruhige iPadOS Performance Console mit Field-Operations-DNA.
- Primaere Referenzen: Linear fuer Hierarchie/Ruhe, Things fuer Today/List/Task-Logik, BridgeAthletic/TeamBuildr Practice fuer Coach/Tablet-Session-Perspektive, WHOOP/Oura fuer Status- und Trend-Abstraktion, Kitman fuer Player-Status/Kiosk/Staff-Logik.
- Designterritorium: 70 Prozent native, ruhige App-Shell; 30 Prozent robuste OnField-Marke.
- Palette als Startpunkt: `Field Graphite`.
- Systemfont fuer operative UI v1.
- Eigene Schrift erlaubt fuer Logo, App Icon, Marketing, Landingpage und spaeter getestete Display-Headlines.
- Cards werden reduziert. Listen, Rows, Panels, Sheets und Queues werden Primaerstruktur.
- Marketing-/Hero-Optik wird bewusst eingesetzt, aber nicht in Live-Coaching-Flaechen.

## Produkt-Guardrails

Diese Regeln gelten in jedem Sprint:

- Startscreen der App bleibt `Heute`, keine Marketing-Landingpage als In-App-Start fuer Coaches.
- Marketing/Hero-Optik gehoert auf Landingpage, Login, Welcome, Onboarding, Install-Screens, App Icon, Splash, Share Cards, leere Demo-Zustaende und ggf. Kiosk-Welcome.
- Live-Coaching-Flaechen duerfen nicht werblich wirken. Dort ist Marke ueber Tokens, Sprache, Icons, Statussystem, Header und Komponenten spuerbar.
- Jeder Screen hat genau eine dominante Primaerhandlung oberhalb der Falz.
- Live-Screens zeigen keine Analysecharts.
- Wiederkehrende Spieler-/Athletenobjekte sind standardmaessig Rows/Listen, keine grossen Cards.
- Bibliothek, Export/Backup und Einstellungen liegen unter `Mehr`, nicht in der Hauptnavigation.
- Returner/Reconditioning ist kein globaler Haupttab. Es erscheint in `Einheit`, im Spielerprofil und bei Bedarf unter `Mehr`.
- iPhone und iPad haben denselben Funktionsumfang.
- Rugby-Begriffe duerfen in OnField Rugby sichtbar sein, aber generische App-Komponenten sollen sportartenuebergreifend benannt werden.
- Keine Freigabe-Sprache wie "cleared", "fit", "Return-to-play freigegeben".
- Keine realen sensiblen Spielerdaten committen.
- Supabase Service Role Keys duerfen niemals in Client-Code oder Repo landen.

## OpenAI-/Codex-Research: Arbeitsmodell fuer KI-Agenten

Aus der offiziellen Codex-Dokumentation ergeben sich diese Arbeitsregeln:

- **AGENTS.md** bleibt fuer dauerhafte Repo-Regeln. Es soll kurz, praktisch und stabil bleiben.
- **SSOT-Dokumente** sind besser fuer grosse Produkt-, Brand-, Design- und QA-Regeln als ein riesiges AGENTS.md.
- **Skills** sind sinnvoll fuer wiederkehrende Arbeitsarten. Sie sollen fokussiert sein und nur die jeweils relevanten Referenzen laden.
- **MCP/Plugins** sind sinnvoll, wenn Codex externe Werkzeuge oder Kontext braucht, z.B. Figma, GitHub, Vercel, Browser/Chrome DevTools, Supabase oder OpenAI Docs.
- **Subagents** sind sinnvoll fuer read-heavy Aufgaben wie Inventar, QA-Audit, Test-Sichtung oder Research-Synthese. Fuer parallele schreibende UI-Umbauten sind sie riskant, weil Konflikte entstehen.
- **Worktrees** sind sinnvoll, wenn mehrere Sprint-Aufgaben parallel laufen sollen, ohne den lokalen Hauptcheckout zu stoeren.
- **Hooks** sind nach Sprint 0C/0D nur dort aktiv, wo sie stabilen Nutzen haben: Secret-Guardrails, Memory-Closeout-Erinnerung und lokale fail-open Runtime Memory.
- **Plugins** lohnen sich erst, wenn Skills/MCP/Workflows stabil sind oder im Team geteilt werden sollen.

Aktuelle Hook-Entscheidung:

- Sprint 0C hat minimale passive Codex-Hooks aktiviert.
- Sprint 0D hat lokales Codex-first Runtime Memory unter `.onfield-memory/` aktiviert.
- Runtime Memory darf lokale Captures, Daily Logs, Knowledge, Hot Cache, Reports, Backups und Orphans verwalten.
- Runtime Memory darf keine SSOTs, keinen Current State, keinen Decision Log und keine Roadmap automatisch ersetzen.

Empfohlene Tools/Plugins/Connectoren:

- Figma Plugin/MCP: fuer Designsystem, Design Kit, Mockups, Tokens, Komponentenbibliothek.
- Browser Plugin oder Chrome DevTools: fuer visuelle QA, Responsive Checks, Screenshots, DOM/CSS-Inspektion.
- GitHub Plugin/Connector: fuer Issues, PRs, Reviews, Sprint-Branches.
- Vercel Plugin/Connector: fuer Preview Deployments, Logs, Deployment-QA.
- Supabase Skill/MCP: fuer jede Auth-, Schema-, RLS- oder Sync-Aenderung.
- OpenAI Docs Skill/MCP: fuer aktuelle OpenAI-/Codex-Doku.
- CodeRabbit oder vergleichbare Review-Unterstuetzung: fuer groessere PR-Reviews.
- Sentry/Observability spaeter: fuer externe Beta, Fehler, Performance, Sync-Probleme.

## Empfohlene neue SSOT-Dokumente

Ja, wir sollten weitere SSOT-Dokumente anlegen. Ohne diese Dokumente muessen Agenten jedes Mal die gesamte Research-Historie neu interpretieren.

### `docs/field-hub/onfield_decision_log.md`

Zweck:

- Dauerhaftes Entscheidungsgedaechtnis fuer OnField.
- Speichert aktive Entscheidungen, zurueckgestellte Entscheidungen und verworfene Optionen.

Muss enthalten:

- Markenarchitektur.
- Produkt-Guardrails.
- iPhone/iPad-Paritaet.
- PWA-first.
- Multi-Sport-Faehigkeit.
- Hero-/Marketing-Grenzen.
- Hook-Entscheidung.

### `docs/field-hub/onfield_current_state.md`

Zweck:

- Schneller Einstieg in den aktuellen App- und Roadmap-Zustand.
- Verhindert, dass neue Agenten den Ist-Zustand jedes Mal neu suchen muessen.

Muss enthalten:

- aktueller Produktname.
- technischer Ort.
- aktueller App-Zustand je Bereich.
- massgebliche Dokumente.
- naechste empfohlene Schritte.
- offene Risiken.

### `docs/field-hub/onfield_product_brief.md`

Zweck:

- Beschreibt OnField Coach in 1-2 Seiten.
- Klaert Zielgruppe, Job-to-be-done, Kernflows, Nicht-Ziele und Launch-Reife.
- Trennt OnField, OnField Coach, OnField Performance und OnField Rugby.

Muss enthalten:

- Brand Architecture.
- Feature-Paritaet iPhone/iPad.
- Sportartenuebergreifende Produktlogik.
- Warum PWA zuerst und Native spaeter.
- Aktuelle MVP-Grenzen.

### `docs/field-hub/onfield_brand_kit.md`

Zweck:

- Zentrale Brand-Richtung fuer OnField.

Muss enthalten:

- Markenversprechen.
- Design-Adjektive und Anti-Adjektive.
- Farbpalette `Field Graphite`.
- Logo-/App-Icon-Richtung.
- Wo Marketing-/Hero-Optik erlaubt ist.
- Wo Marketing-/Hero-Optik verboten ist.
- Schriftstrategie: Systemfont UI, Brand-Font nur fuer Logo/Marketing/Display-Test.

### `docs/field-hub/onfield_tone_of_voice.md`

Zweck:

- Einheitliche Sprache fuer Coach-UI, Safety, Sync, Fehler, Empty States, Marketing.

Muss enthalten:

- Kurz, ruhig, operativ.
- Keine Diagnose-/Freigabe-Sprache.
- Beispiele fuer Ampel, Pain, Returner, Sync, Fehler, Disabled States.
- Unterschied Coach-UI vs. Marketing.

### `docs/field-hub/onfield_design_system.md`

Zweck:

- Technische und visuelle Regeln fuer Tokens und Komponenten.

Muss enthalten:

- Farben.
- Typografie.
- Spacing.
- Radius.
- Borders.
- Elevation.
- Motion.
- Touch Targets.
- Breakpoints.
- Safe Areas.
- State Tokens.
- Accessibility-Regeln.

### `docs/field-hub/onfield_component_inventory.md`

Zweck:

- Liste aller geplanten UI-Komponenten mit Zweck, Einsatz, Nicht-Einsatz und betroffenen Screens.

Muss enthalten:

- App Shell.
- iPad Sidebar.
- iPhone Bottom Tab Bar.
- Topbar.
- Session Header.
- Player/Athlete Row.
- Task Queue Row.
- Status Chip.
- Traffic Light Chip.
- Safety Notice.
- Sync Status.
- Offline Banner.
- Number Scale.
- Pain Scale.
- Returner Cap Card.
- Sheets.
- Empty/Loading/Error States.

### `docs/field-hub/onfield_sports_configuration_model.md`

Zweck:

- Klaert, welche Teile generisch und welche sportartspezifisch sind.

Muss enthalten:

- Generische Kernobjekte: Athlete, Team, Session, Check-in, Training, Post-session, Reconditioning, Metric, Load, Readiness, Analysis, Library.
- OnField Rugby als erster Sport-Preset.
- Positionen und Begriffe fuer Rugby.
- Welche UI-Texte aus Config kommen sollten.
- Welche Domain-Logik vorerst noch hart bleiben darf.

### `docs/field-hub/onfield_pwa_accessibility_qa.md`

Zweck:

- QA-Checkliste fuer iPhone, iPad, PWA, Offline, Accessibility.

Muss enthalten:

- Viewports: iPhone klein/gross, iPad Portrait, iPad Landscape.
- Safe Areas.
- Bottom Bar/Home Indicator.
- Touch Targets.
- Fokuszustand.
- Kontrast.
- Offline.
- Pending Sync.
- Install.
- Kiosk.
- Empty/Error/Loading.

### `docs/field-hub/onfield_ai_agent_playbook.md`

Zweck:

- Einheitlicher Ablauf fuer Agenten, die Sprints umsetzen.

Muss enthalten:

- Welche Dateien vor welchem Sprint gelesen werden.
- Welche Tests pro Sprint laufen.
- Wann Browser/Playwright/Figma genutzt wird.
- Wie Sprints verifiziert werden.
- Wie keine ungewollten Scope-Erweiterungen entstehen.

## Empfohlene Skills

Ja, wir sollten Skills erstellen oder den bestehenden Skill erweitern.

### Bestehenden Skill anpassen

Datei:

- `.agents/skills/rugby-field-hub-implementation/SKILL.md`

Aenderung:

- Triggers auf OnField erweitern:
  - OnField
  - OnField Coach
  - OnField Rugby
  - Field Hub
  - app/field-hub
- Product Definition aktualisieren:
  - nicht mehr nur Rugby-spezifisch, sondern OnField Coach mit OnField Rugby als erster Konfiguration.
- UI Rules aktualisieren:
  - iPhone/iPad Funktionsparitaet.
  - Top-Level-Navigation.
  - Marketing/Hero nur an erlaubten Brand-Surfaces.

Warum:

- Der vorhandene Skill wird bereits passend geladen. Er sollte nicht weggeworfen, sondern weiterentwickelt werden.

### Neuer Skill: `onfield-roadmap-execution`

Pfad:

- `.agents/skills/onfield-roadmap-execution/SKILL.md`

Zweck:

- Wird bei jedem Sprint aus dieser Roadmap genutzt.

Muss Agenten zwingen:

- Memory Index und relevanten Sprint-Abschnitt lesen.
- Pflichtkontext aus dem Context Router lesen.
- Sprint-Scope restaten.
- Keine spaeteren Sprints nebenbei umsetzen.
- Tests/QA dokumentieren.

### Neuer Skill: `onfield-design-system`

Pfad:

- `.agents/skills/onfield-design-system/SKILL.md`

Zweck:

- Fuer Tokens, Komponenten, Brand Kit, Figma, visuelle QA.

Muss Agenten zwingen:

- Brand Kit und Designsystem-SSOT lesen.
- Keine zufaelligen Farben/Spacing/Radii einfuehren.
- Komponenten aus dem OnField Kit verwenden.
- iPhone/iPad pruefen.

### Neuer Skill: `onfield-screen-redesign`

Pfad:

- `.agents/skills/onfield-screen-redesign/SKILL.md`

Zweck:

- Fuer Screen-by-Screen Rollout.

Muss Agenten zwingen:

- Vorher Screen-Ziel, Primaerhandlung und Nicht-Ziele nennen.
- Betroffene Tests aktualisieren.
- Screenshots oder Browser-Check machen.
- Keine Card-Wall wieder einfuehren.

### Neuer Skill: `onfield-pwa-accessibility-qa`

Pfad:

- `.agents/skills/onfield-pwa-accessibility-qa/SKILL.md`

Zweck:

- Fuer visuelle QA, Accessibility, Safe Areas, PWA und Install-Polish.

Muss Agenten zwingen:

- iPhone und iPad pruefen.
- Touch Targets pruefen.
- Kontrast/Fokus/Safe Area pruefen.
- Offline/Sync-Zustaende pruefen.

## Sprint-Struktur

Jeder Sprint folgt diesem Muster:

1. Ziel kurz restaten.
2. Pflichtkontext lesen.
3. Nur Scope dieses Sprints umsetzen.
4. Tests/Typecheck/Lint nach Scope laufen lassen.
5. Bei UI: Dev Server starten und iPhone/iPad visuell pruefen.
6. Ergebnis dokumentieren: geaenderte Dateien, Tests, offene Risiken.

Empfohlene Standardbefehle fuer Code-Sprints:

```bash
cd app/field-hub
npm run typecheck
npm run test
npm run build
```

Bei UI-Sprints zusaetzlich:

```bash
cd app/field-hub
npm run dev
```

Dann iPhone und iPad ueber Browser/Simulator pruefen.

## Sprint 0A - OnField Memory System v1

Status: **abgeschlossen**
Commits: `e9d94d9` und Nachbesserung `cbebc37`

### Was genau machen wir?

Wir planen und verankern ein leichtes, LUVI-/Karpathy-inspiriertes Memory-System fuer OnField, bevor die grossen SSOTs gebaut werden.

Sprint 0A legt fest, wie kuenftige Agenten:

- passenden Kontext finden.
- Memory aktualisieren.
- Memory-Bloat vermeiden.
- alte oder ersetzte Informationen markieren.
- am Ende einer Session pruefen, ob Memory angepasst werden muss.

Umgesetzte Dateien aus Sprint 0A:

- `docs/field-hub/onfield_memory_governance.md`
- `docs/field-hub/memory/index.md`
- `docs/field-hub/memory/gotchas.md`

Umgesetzte Skill-/Workflow-Aenderungen aus Sprint 0A:

- Alle OnField-Skills bekommen eine Memory-Closeout-Regel.
- Der Memory Index wird als Context-Router eingefuehrt.
- `onfield_current_state.md` bleibt kurz und wird ersetzt statt endlos erweitert.
- `onfield_decision_log.md` bleibt fuer dauerhafte Entscheidungen.
- `gotchas.md` nimmt nur wiederkehrende oder riskante Fehler auf.
- Hook-Strategie ist dokumentiert; aktive Hooks wurden nicht eingerichtet.

### Wieso?

Arwin soll Memory nicht manuell entscheiden muessen. Das System soll Agenten selbststaendig dazu bringen, am Ende einer Aufgabe zu pruefen, ob eine Memory-Aktualisierung noetig ist.

Gleichzeitig darf Memory nicht zu Kontext-Bloat fuehren. Deshalb wird Memory als Router gebaut, nicht als grosses Archiv, das jeder Agent voll laden muss.

### Wo?

- `docs/field-hub`
- `docs/field-hub/memory`
- `.agents/skills/...`
- Roadmap-/Workflow-Dokumente
- Noch kein App-Code.

### Kontext fuer Agenten

Lies:

- `AGENTS.md`
- `docs/field-hub/onfield_current_state.md`
- `docs/field-hub/onfield_decision_log.md`
- diese Roadmap
- LUVI dient als Vorbild, aber OnField bekommt eine schlankere MVP-Version.

Nicht automatisch kopieren oder aktivieren:

- komplette LUVI-Script-Suite.
- grosse Agent-Memory-Struktur auf Vorrat.
- aktive Hooks ohne klaren Nutzen und Review.
- lokale ignored Dateien wie `.claude/settings.local.json` weder erstellen noch bearbeiten.

### Deliverables

- Memory Governance beschreibt klar, wann Memory geschrieben, ersetzt, ignoriert oder als obsolet markiert wird.
- Memory Index routet Agenten zu den relevanten SSOTs, Skills und Researches.
- Gotchas-Datei existiert fuer wiederkehrende Fehler und harte Lessons Learned.
- OnField-Skills enthalten eine verpflichtende Memory-Closeout-Pruefung.
- Roadmap-Pflichtkontext ist auf gezieltes Laden statt blindes Voll-Laden umgestellt.
- Hook-Strategie ist dokumentiert, ohne Vollautomatik oder unkontrolliertes Memory-Schreiben zu erzwingen.

### Akzeptanzkriterien

- Ein Agent kann erkennen, welche Dateien fuer eine konkrete Aufgabe geladen werden sollen.
- Ein Agent prueft am Ende jeder OnField-Aufgabe, ob Current State, Decision Log oder Gotchas aktualisiert werden muessen.
- Memory-Regeln verhindern, dass normale Chat-Zusammenfassungen, Roh-Outputs oder temporaere Ideen gespeichert werden.
- Current State, Decision Log und Gotchas haben klare getrennte Rollen.
- Das System reduziert Kontextverbrauch gegenueber blindem Laden der kompletten Roadmap und Researches.
- Sprint 0A setzt keine App-Features um.

## Sprint 0B - Research-Synthese und SSOT-Freeze

Status: **abgeschlossen**

### Was genau machen wir?

Wir vervollstaendigen die SSOT-Dokumente und ueberfuehren die beiden Deep Researches plus unsere Entscheidungen in klare, kuerzere Arbeitsdokumente.

Bestehende Memory-/Agentendokumente weiterfuehren:

- `docs/field-hub/onfield_decision_log.md`
- `docs/field-hub/onfield_current_state.md`
- `docs/field-hub/onfield_ai_agent_playbook.md`

Neue oder noch zu vervollstaendigende SSOT-Dateien:

- `docs/field-hub/onfield_product_brief.md`
- `docs/field-hub/onfield_brand_kit.md`
- `docs/field-hub/onfield_tone_of_voice.md`
- `docs/field-hub/onfield_design_system.md`
- `docs/field-hub/onfield_component_inventory.md`
- `docs/field-hub/onfield_sports_configuration_model.md`
- `docs/field-hub/onfield_pwa_accessibility_qa.md`

### Wieso?

Die Research-Dateien sind wertvoll, aber lang. Agenten brauchen kompakte, verbindliche SSOTs. Sonst interpretiert jeder Agent die Researches anders und die App wird wieder uneinheitlich.

### Wo?

- Nur `docs/field-hub`.
- Kein App-Code in diesem Sprint.

### Kontext fuer Agenten

Lies:

- beide Research-Dateien.
- `2026-07-04_ux_design_roadmap_principles.md`.
- dieses Roadmap-Dokument.

Wichtig:

- Research nicht komplett kopieren.
- Entscheidungen extrahieren.
- Klare Regeln schreiben.
- Offene Annahmen sichtbar markieren.

### Deliverables

- `onfield_decision_log.md` speichert die dauerhaften OnField-Entscheidungen.
- `onfield_current_state.md` speichert den aktuellen App-, Roadmap- und Risiko-Stand.
- Alle SSOT-Dateien existieren.
- Jede Datei hat Zweck, verbindliche Regeln und offene Fragen.
- Die SSOTs widersprechen sich nicht.
- In `onfield_ai_agent_playbook.md` steht, welche Datei fuer welchen Sprint relevant ist.

### Akzeptanzkriterien

- Ein neuer Agent kann aus den SSOTs in 10 Minuten verstehen:
  - Was OnField ist.
  - Welche Marke/Designrichtung gilt.
  - Welche Navigation gilt.
  - Welche iPhone/iPad-Regeln gelten.
  - Welche Sprache fuer Safety/Sync/Errors gilt.
  - Welche UI-Komponenten genutzt werden sollen.

## Sprint 0C - Hook Review & Automation Guardrails

Status: **abgeschlossen**

### Was genau machen wir?

Wir pruefen nach den ersten echten Memory- und SSOT-Arbeiten, ob minimale Hooks sinnvoll sind. Sprint 0C aktiviert nur Hooks, wenn sie klaren Nutzen bringen und keine blinde Memory-Automatik erzeugen.

Pruefen:

- Hat Memory-Closeout in Sprint 0B zuverlaessig funktioniert?
- Haben Agenten den Memory Index genutzt?
- Wurde Current State bei relevanten Aenderungen aktualisiert?
- Gab es wiederkehrende Fehler, die ein Hook verhindern koennte?

Moegliche Hook-Kandidaten:

- Stop-/PreCompact-Warnung: Memory-Closeout pruefen.
- Secret-Check: keine Supabase Service Role Keys oder andere Secrets.
- Safety-Copy-Check: keine medizinische Freigabe-/Diagnose-Sprache.
- SSOT-State-Check: Roadmap, Skills oder SSOTs geaendert, aber Current State nicht geprueft.

### Wieso?

Hooks koennen helfen, aber zu frueh aktivierte Hooks machen den Workflow schwerer und erzeugen falsche Sicherheit. Erst muss sich zeigen, welche Checks wirklich wiederkehrende Fehler verhindern.

### Wo?

- `docs/field-hub/onfield_ai_agent_playbook.md`
- `docs/field-hub/onfield_memory_governance.md`
- `.codex/hooks.json`
- kein App-Code

### Kontext fuer Agenten

Lies:

- `docs/field-hub/memory/index.md`
- `docs/field-hub/onfield_memory_governance.md`
- `docs/field-hub/memory/gotchas.md`
- `docs/field-hub/onfield_current_state.md`
- Ergebnisse aus Sprint 0B

Wichtig:

- Keine automatische Memory-Schreibung.
- Keine komplette LUVI `.claude/memory` Runtime kopieren.
- Keine Hooks aktivieren, nur weil sie technisch moeglich sind.
- Eine vorhandene ignored `.claude/settings.local.json` nicht bearbeiten oder committen.

### Deliverables

- Entscheidung: minimale passive Codex-Hooks sind aktiv.
- Rollback: `.codex/hooks.json` und `.codex/hooks/onfield_guardrails.sh` entfernen und die Sprint-0C-Entscheidung im Decision Log als ersetzt markieren.
- Memory Governance und Agent Playbook sind synchron.
- Sprint-0C-Hooks schreiben, loeschen oder ueberschreiben kein Memory. Sprint 0D erweitert dies spaeter auf lokale ignored Runtime-Artefakte unter `.onfield-memory/`, ohne SSOTs zu ersetzen.

### Akzeptanzkriterien

- Hook-Entscheidung ist im Decision Log dokumentiert.
- Keine blinde Memory-Automatik wurde eingefuehrt.
- `.codex/hooks.json` enthaelt nur minimale, gut begruendete Checks.
- Sprint 0C selbst fuehrt keine Runtime-Memory-Dateien ein. Sprint 0D fuehrt danach tracked Runtime-Scripts und ignored Runtime-Outputs ein.

## Sprint 0D - Local Runtime Memory

Status: **abgeschlossen**

### Was genau machen wir?

Wir ergaenzen nach Sprint 0C ein lokales, Codex-first Runtime-Memory-System. Es captured Stop/PreCompact-Events, redigiert vor Speicherung, schreibt Daily Logs, erzeugt deterministische Knowledge-Artikel, baut Index und Hot Cache, fuehrt Lint/Health Checks aus und unterstuetzt Backups/Recovery.

### Wieso?

Arwin ist einziger Developer und soll wenig Wartungsarbeit haben. Das System soll wiederkehrende Session-Informationen lokal erhalten, ohne alle Memories in jede Session zu laden oder SSOTs automatisch umzuschreiben.

### Wo?

- `.onfield-memory/`
- `.codex/hooks.json`
- Memory-/Agentendokumente unter `docs/field-hub`
- kein App-Code

### Wichtig

- Codex-first, Claude-Hook-Paritaet spaeter.
- Auto-Compile ist throttled und fail-open.
- Der Compiler ist deterministisch lokal; Hooks starten kein `codex exec`.
- Generated Runtime Knowledge ist on-demand Kontext, kein SSOT.
- Current State, Decision Log, Roadmap und SSOTs bleiben manuelle Memory-Closeout-Entscheidungen.

### Deliverables

- Lokale Runtime-Struktur mit Scripts, Tests und Config.
- `SessionStart`, `Stop` und `PreCompact` Hooks fuer Hot Cache und Capture.
- Redaction vor jeder lokalen Speicherung.
- Daily Logs, Knowledge Index, Hot Cache, Lint Reports, Backups, Orphans und Recovery.

### Akzeptanzkriterien

- SessionStart laedt nur kleinen Hot Cache.
- Stop/PreCompact schreiben redigierte lokale Daily Logs.
- Compile/Index/Hot Cache laufen nur bei Bedarf und blockieren Codex nicht.
- Fake Secrets erscheinen nicht in generierten Outputs.
- Runtime schreibt keine OnField-SSOTs automatisch.

## Sprint 1 - Agenten-Setup Review & Finalisierung

### Was genau machen wir?

Wir pruefen und finalisieren die bereits angelegte KI-Arbeitsumgebung nach Sprint 0A/0B/0C/0D. Dieser Sprint baut nicht alles neu, sondern beseitigt Luecken, Widersprueche und veraltete Agentenregeln.

Arbeiten:

- Bestehenden Skill `.agents/skills/rugby-field-hub-implementation/SKILL.md` auf Aktualitaet pruefen.
- OnField-Skills auf Kontext-Routing, Trigger, Done Definition und Memory Closeout pruefen.
- Neuen Skill `.agents/skills/onfield-runtime-memory/SKILL.md`, Runtime FAQ, Memory Index Routing, Agent Playbook und Hook-/Runtime-Memory-Governance gegeneinander pruefen.
- `AGENTS.md` auf Laenge, Relevanz und Widersprueche pruefen.
- `docs/field-hub/onfield_ai_agent_playbook.md` gegen Memory Index und Roadmap pruefen.
- Hook- und Runtime-Memory-Entscheidung aus Sprint 0C/0D respektieren.

### Wieso?

Ein grosser Teil des Agenten-Setups ist bereits durch Sprint 0A erledigt. Sprint 1 dient deshalb als Review- und Finalisierungssprint, damit spaetere App-Sprints nicht von veralteten Skill- oder Kontextregeln ausgebremst werden.

### Wo?

- `.agents/skills/...`
- `AGENTS.md`
- `docs/field-hub/onfield_ai_agent_playbook.md`
- Kein App-Code.

### Kontext fuer Agenten

Codex/OpenAI-Recherche beachten:

- Skills fuer wiederkehrende Workflows.
- AGENTS.md fuer dauerhafte Repo-Regeln.
- MCP/Plugins fuer externe Werkzeuge.
- Subagents nur fuer read-heavy Aufgaben.
- Worktrees fuer parallele Sprint-Arbeit.
- Hook- und Runtime-Memory-Entscheidung aus Sprint 0C/0D respektieren; keine zusaetzliche Hook-Automatik ohne neue Entscheidung.

### Deliverables

- Alle OnField-Skills sind synchron mit Memory Index und Roadmap.
- `AGENTS.md` bleibt kurz und verweist auf Memory/SSOTs statt lange Regeln zu duplizieren.
- Agent Playbook, Current State und Decision Log widersprechen sich nicht.
- Hook- und Runtime-Memory-Entscheidung aus Sprint 0C/0D ist umgesetzt oder bewusst nicht umgesetzt.

### Akzeptanzkriterien

- Wenn ein User "OnField Coach Screen redesignen" sagt, laedt Codex den passenden Skill.
- Kein Skill zwingt Agenten, alle langen Research-Dateien immer voll zu laden, wenn SSOTs reichen.
- Kein komplexes Agenten-Framework wird eingefuehrt.
- Falls Hooks oder Runtime Memory existieren, sind sie aus Sprint 0C/0D begruendet, minimal und dokumentiert.

## Sprint 2 - Produktarchitektur und Informationsarchitektur spezifizieren

### Was genau machen wir?

Wir planen die neue App-Struktur detailliert, bevor wir Code umbauen.

Festlegen:

- Hauptbereiche:
  - `Heute`
  - `Einheit`
  - `Spieler`
  - `Analyse`
  - `Mehr`
- Unterbereiche von `Einheit`:
  - `Check-in`
  - `Training`
  - `Nachbereitung`
- Unterbereiche von `Mehr`:
  - `Bibliothek`
  - `Export & Backup`
  - `Einstellungen`
  - optional `Returner/Reconditioning Board`
- Returner/Reconditioning als Kontext:
  - Spielerprofil.
  - Einheit/Check-in Filter.
  - Einheit/Training Limits.
  - optional Mehr-Unterseite.

Dokumentieren:

- Route-/State-Mapping fuer aktuelle React-App.
- Alte Tabs auf neue Bereiche mappen.
- iPhone und iPad Navigationsmodell.
- Back/Close-Verhalten fuer Sheets.
- Welche Screens eigene Route bleiben duerfen.

### Wieso?

Die groesste Unruhe kommt aus der aktuellen flachen Navigation mit 10 gleichwertigen Tabs. Wenn die IA nicht zuerst stimmt, macht das neue Design nur ein schoeneres Chaos.

### Wo?

- Hauptdokument: `docs/field-hub/onfield_product_brief.md`
- Ergaenzung: `docs/field-hub/onfield_component_inventory.md`
- Code nur lesen:
  - `app/field-hub/src/App.tsx`
  - `app/field-hub/src/components/AppShell.tsx`
  - `app/field-hub/src/components/MainNavigation.tsx`

### Kontext fuer Agenten

Aktuell hat `App.tsx` noch 10 Tabs:

- `heute`
- `spieler`
- `check-in`
- `training`
- `nachbereitung`
- `returner`
- `analysis`
- `bibliothek`
- `export`
- `einstellungen`

Ziel ist nicht, Funktionen zu loeschen. Ziel ist, sie anders zu gruppieren.

### Deliverables

- IA-Spezifikation mit altem und neuem Mapping.
- Liste, welche Komponenten spaeter geaendert werden.
- Liste offener UX-Fragen, falls es welche gibt.

### Akzeptanzkriterien

- Fuer jede bestehende Funktion ist klar:
  - Wo sie im neuen System lebt.
  - Wie sie auf iPhone erreichbar ist.
  - Wie sie auf iPad erreichbar ist.
  - Ob sie Primaerflow oder Utility ist.

## Sprint 3 - OnField Brand Foundation und Marketing-/Hero-System

### Was genau machen wir?

Wir definieren die Marke OnField als nutzbares Brand Kit.

Festlegen:

- OnField Markenversprechen.
- OnField Coach Produktbeschreibung.
- OnField Performance Plattformlogik.
- OnField Rugby erster Sport-Preset.
- Brand-Adjektive:
  - ruhig
  - robust
  - sportlich
  - fokussiert
  - praezise
  - vertrauenswuerdig
- Anti-Adjektive:
  - laut
  - verspielt
  - klinisch
  - generisch
  - dashboardig
  - prototypisch
- Hero-Optik fuer erlaubte Flaechen.
- Logo-/Icon-Richtung.
- Schriftstrategie.

### Wieso?

Du willst, dass die Marke ab sofort sichtbar und spuerbar ist. Das ist richtig. Aber die Marke muss wissen, wo sie stark sein darf und wo sie sich zuruecknehmen muss. Sonst blockiert sie Live-Coaching.

### Wo?

- `docs/field-hub/onfield_brand_kit.md`
- `docs/field-hub/onfield_tone_of_voice.md`
- Figma Brand Board oder gleichwertiges Designsystem-Artefakt.
- Noch kein App-Code, ausser falls nur Metadaten/Name im Manifest vorbereitet werden.

### Kontext fuer Agenten

Marketing/Hero-Optik ist sinnvoll auf:

- externer Landingpage.
- Login/Welcome.
- Onboarding.
- PWA Install.
- App Store spaeter.
- Empty Demo States.
- Kiosk-Welcome.
- App Icon.
- Splash Screen.
- Share Cards.

Marketing/Hero-Optik ist nicht sinnvoll auf:

- Live Training.
- Check-in Roster.
- Nachbereitungsqueue.
- Safety-Hinweisen.
- Sync-Konflikten.

### Deliverables

- Brand Kit mit klaren Regeln.
- Tone of Voice mit UI-/Marketing-Beispielen.
- Liste der Brand Surfaces.
- Figma Brand Board oder dokumentiertes Ersatzartefakt mit Markenrichtung, Farben, Typografie, Hero-Beispielen und App-Icon-Richtung.
- Klare Trennung zwischen Brand-Surfaces und Live-Coaching-Surfaces.

### Akzeptanzkriterien

- Ein Agent kann klar beantworten:
  - Wie sieht OnField aus?
  - Wie spricht OnField?
  - Wo darf die Marke laut sein?
  - Wo muss sie ruhig bleiben?

## Sprint 4 - Design Tokens und Theme Foundation

### Was genau machen wir?

Wir bauen die visuelle Grundlage in Code.

Arbeiten:

- OnField Tokens definieren:
  - Farben.
  - Textfarben.
  - Surfaces.
  - Borders.
  - Statusfarben.
  - Fokus.
  - Spacing.
  - Radius.
  - Motion.
  - Elevation.
- Bestehende Root-CSS-Variablen kontrolliert auf OnField-Tokens umstellen.
- Keine Screen-spezifischen Einzelwerte einfuehren.
- Keine Dark-Mode-Umsetzung in diesem Sprint.

### Wieso?

Ohne Tokens wird jeder Screen einzeln "designt". Das fuehrt genau zu der aktuellen Unruhe. Tokens machen das Design wiederholbar und spaeter uebertragbar auf Flutter/React Native/SaaS.

### Wo?

- `app/field-hub/src/index.css`
- Optional neu:
  - `app/field-hub/src/design/tokens.css`
  - `app/field-hub/src/design/tokens.ts`
- Dokumentation:
  - `docs/field-hub/onfield_design_system.md`
- Figma Token Sheet oder gleichwertiges Token-Artefakt.

### Kontext fuer Agenten

Startpalette aus Research:

- Primary: `#1F6B5C`
- Secondary/Oxblood: `#7A1F2B`
- Background: `#F4F5F3`
- Surface: `#FFFFFF`
- Border: `#D9DED8`
- Text: `#131815`
- Muted: `#5E6961`
- Success: `#1D7A46`
- Warning: `#D39A2B`
- Danger: `#B42318`
- Info: `#155EEF`
- Focus Ring: `#005FCC`

Regel:

- Warning niemals mit weissem Text verwenden, wenn Kontrast nicht sicher ist.
- Status immer Text + Farbe + optional Icon.

### Deliverables

- Tokenisierte CSS-Grundlage.
- Dokumentierte Token-Namen.
- Figma Token Sheet oder dokumentiertes Ersatzartefakt fuer Farben, Typografie, Spacing, Radius, Borders, Elevation, Motion und Statusfarben.
- Alte Variablen entweder gemappt oder sauber ersetzt.
- Keine willkuerlichen neuen Farben in Screen-CSS.

### Akzeptanzkriterien

- `rg "#[0-9A-Fa-f]{3,6}" app/field-hub/src` zeigt keine neuen unerklaerten Screen-Hexwerte.
- Code-Tokens und Designsystem-Artefakt sind logisch aufeinander abbildbar.
- Fokuszustand bleibt sichtbar.
- Safe Areas bleiben erhalten.
- Typecheck/build laufen.

## Sprint 5 - Core Component Kit

### Was genau machen wir?

Wir bauen die wiederverwendbaren OnField-Komponenten, bevor wir Screens umbauen.

Komponenten:

- `AppShell`
- `MainNavigation`
- `OnFieldTopbar`
- `SessionHeader`
- `PrimaryButton`
- `SecondaryButton`
- `SegmentedControl`
- `StatusChip`
- `TrafficLightChip`
- `SafetyNotice`
- `SyncStatus`
- `OfflineBanner`
- `PlayerRow` oder generisch `AthleteRow`
- `TaskQueueRow`
- `NumberScale`
- `PainScale`
- `Sheet`
- `EmptyState`
- `Skeleton`
- `ErrorState`

### Wieso?

Screen-by-screen Rollout funktioniert nur, wenn die Bausteine feststehen. Sonst entstehen neue Spezialkomponenten pro Screen und die App bleibt inkonsistent.

### Wo?

Empfohlen:

- `app/field-hub/src/components/ui/`
- `app/field-hub/src/components/onfield/`
- Figma Component Sheet oder gleichwertiges Komponenten-Artefakt.

Bestehende Komponenten pruefen:

- `SyncStatusBadge.tsx`
- `SessionPicker.tsx`
- `LiveSessionStepper.tsx`
- `PlayerEditorForm.tsx`
- bestehende Chips/Buttons/Scales in Screen-Dateien.

Tests:

- Bestehende Component Tests erweitern.
- Neue Tests fuer relevante Komponenten.

### Kontext fuer Agenten

Generische Komponenten sollen moeglichst nicht Rugby-spezifisch heissen. Beispiel:

- Besser `AthleteRow` als `RugbyPlayerCard`.
- Besser `ReconditioningCapCard` als `ReturnerRugbyCapCard`, wenn sportartenuebergreifend moeglich.

Aber:

- OnField Rugby darf im Text weiterhin "Spieler", Positionen und Rugby-Kontext nutzen.

### Deliverables

- Komponentenstruktur.
- Component Inventory aktualisiert.
- Figma Component Sheet oder dokumentiertes Ersatzartefakt fuer App Shell, Sidebar, Bottom Tab, Topbar, Session Header, Athlete Row, Status Chip, Traffic Light Chip, Safety Notice, Sync Badge, Sheet, Task Queue Row, Number Scale sowie Empty/Error/Loading States.
- Erste Komponenten nutzen Tokens.
- Bestehende Screens muessen noch nicht voll umgebaut sein.

### Akzeptanzkriterien

- Komponenten haben klare Props und keine versteckte globale Logik.
- Komponenten sind im Code und im Designsystem-Artefakt konsistent benannt.
- Touch Targets sind >= 44 x 44 px.
- Komponenten sehen auf iPhone und iPad nicht kaputt aus.
- Tests/typecheck/build laufen.

## Sprint 6 - App Shell und Navigation implementieren

### Was genau machen wir?

Wir bauen die neue globale Navigation.

Implementieren:

- Neue Top-Level-Struktur:
  - `Heute`
  - `Einheit`
  - `Spieler`
  - `Analyse`
  - `Mehr`
- `Einheit` enthaelt Subnavigation:
  - `Check-in`
  - `Training`
  - `Nachbereitung`
- `Mehr` enthaelt:
  - `Bibliothek`
  - `Export & Backup`
  - `Einstellungen`
  - ggf. `Returner/Reconditioning`
- iPad:
  - Sidebar.
  - Content.
  - optional Detailbereich.
- iPhone:
  - Bottom Tab Bar.
  - Unterbereiche ueber Segmented Control, Stack oder Sheet.
- Kein Hamburger-only als Hauptnavigation.

### Wieso?

Das loest das groesste Orientierungsproblem. Die App fuehlt sich sofort mehr nach nativer App und weniger nach Web-Dashboard an.

### Wo?

- `app/field-hub/src/App.tsx`
- `app/field-hub/src/components/AppShell.tsx`
- `app/field-hub/src/components/MainNavigation.tsx`
- `app/field-hub/src/index.css`
- Tests:
  - `AppShell.test.tsx`
  - `MainNavigation.test.ts`
  - ggf. neue Routing-/Navigationstests.

### Kontext fuer Agenten

Wichtig:

- Keine Funktion loeschen.
- Alte Tabs werden nur umgruppiert.
- `Check-in`, `Training`, `Nachbereitung` bleiben erreichbar.
- `Returner`, `Bibliothek`, `Export`, `Einstellungen` bleiben erreichbar, aber nicht als Top-Level.
- iPhone und iPad muessen beide alle Funktionen erreichen.

### Deliverables

- Neue App Shell.
- Neue Navigation.
- Mobile Bottom Tab.
- iPad Sidebar.
- Tests fuer neues Mapping.

### Akzeptanzkriterien

- Auf iPhone sind genau 5 Top-Level-Bereiche sichtbar.
- Auf iPad ist die Sidebar sichtbar.
- Alle alten Hauptscreens sind weiter erreichbar.
- URL/State-Verhalten ist stabil.
- Typecheck/test/build laufen.

## Sprint 7 - OnField Hero-, Welcome-, Install- und Branding-Surfaces

Status: Abgeschlossen am 2026-07-05.

### Was genau machen wir?

Wir integrieren die Marke sichtbar dort, wo sie sinnvoll ist.

Moegliche Surfaces:

- Login/Auth Panel.
- First-run Welcome.
- Demo Empty State.
- PWA Install Hinweis.
- Kiosk/Public Welcome.
- App Manifest Name/Icon.
- Splash/Icon Assets.
- Optionale externe Landingpage spaeter.

Nicht Teil dieses Sprints:

- Live Training visuell "heroifizieren".
- Grosse Marketingflaechen in Check-in/Nachbereitung.

### Wieso?

Du willst OnField ab sofort als Marke spuerbar machen. Das ist wichtig fuer Vertrauen, externen Launch und spaeter SaaS/App Store. Gleichzeitig darf die Marke den Coach-Flow nicht bremsen.

### Wo?

- `app/field-hub/index.html`
- `app/field-hub/public/`
- `app/field-hub/src/components/AuthPanel.tsx`
- `app/field-hub/src/components/PublicCheckInView.tsx`
- `app/field-hub/src/components/KioskCheckInView.tsx`
- `app/field-hub/src/components/TodayDashboard.tsx` nur fuer Empty/Welcome-Zustaende, nicht fuer dauerhaften Live-Flow.
- `app/field-hub/src/index.css`

### Kontext fuer Agenten

OnField ist Hauptmarke. Aktuelle App kann in UI als "OnField Coach" erscheinen. Rugby-spezifisch darf "OnField Rugby" nur dort stehen, wo der Sport-Preset gemeint ist.

### Deliverables

- App Name/Manifest auf OnField Coach vorbereiten.
- Brand-Surface-Komponenten.
- Hero-Optik fuer erlaubte Flaechen.
- Keine Stoerung der Live-Flows.

### Akzeptanzkriterien

- Coach startet weiterhin auf `Heute`.
- Brand ist sichtbar, aber Live-Screens bleiben ruhig.
- PWA Install/Icons passen zur neuen Marke.
- Build laeuft.

## Sprint 8 - Einheit-Container als Kernworkflow

### Was genau machen wir?

Wir bauen `Einheit` als echten Arbeitscontainer.

Inhalt:

- Session-Auswahl.
- Session Header.
- Subnavigation:
  - Check-in.
  - Training.
  - Nachbereitung.
- Gemeinsamer Kontext:
  - aktuelle Session.
  - offene Warnungen.
  - offene Nachbereitung.
  - Sync Status.
  - Reconditioning/Returner-Hinweise.

### Wieso?

Der Coach denkt in Ablauf: vorher, waehrenddessen, danach. Aktuell sind diese Schritte zu sehr getrennte Tabs. `Einheit` macht daraus einen echten Flow.

### Wo?

- Neu empfohlen:
  - `app/field-hub/src/components/SessionWorkspace.tsx`
  - `app/field-hub/src/components/SessionHeader.tsx`
- Bestehend:
  - `CheckInView.tsx`
  - `TrainingView.tsx`
  - `PostSessionView.tsx`
  - `SessionPicker.tsx`
  - `App.tsx`

### Kontext fuer Agenten

In diesem Sprint geht es um Container und Kontext, nicht um finalen Check-in/Training/Nachbereitung-Umbau. Die bestehenden Screens koennen vorerst eingebettet werden.

### Deliverables

- `Einheit` zeigt den aktuellen Session-Kontext.
- Subnavigation funktioniert auf iPhone und iPad.
- Bestehende Check-in/Training/Nachbereitung-Views sind erreichbar.

### Akzeptanzkriterien

- Kein Nutzer muss zwischen drei globalen Tabs springen.
- iPhone kann dieselben Unterbereiche bedienen.
- iPad nutzt breitere Arbeitsflaeche sinnvoll.
- Tests/typecheck/build laufen.

## Sprint 9 - Check-in Roster-first Redesign

Status: Abgeschlossen am 2026-07-05.

### Was genau machen wir?

Wir bauen Check-in als schnelle Roster-Arbeitsflaeche.

Umbau:

- Roster/List zuerst.
- Jede Zeile zeigt:
  - Name.
  - Position/Gruppe.
  - Anwesenheit.
  - Tagesstatus/Ampel mit Grund.
  - Returner/Reconditioning Hinweis, falls relevant.
  - 1-2 Quick Actions maximal.
- Tap auf Row oeffnet Detail Sheet oder Detailpane.
- Public Link, Reset, alte Warnungen, technische Details wandern in sekundaeere Bereiche/Sheets.

### Wieso?

Check-in muss in 1-2 Minuten funktionieren. Kartenwaende und technische Panels bremsen. Der Coach braucht erst Uebersicht, dann Details.

### Wo?

- `app/field-hub/src/components/CheckInView.tsx`
- `app/field-hub/src/domain/checkIn.ts`
- `app/field-hub/src/domain/checkInWarningGuidance.ts`
- `app/field-hub/src/hooks/useCheckIns.ts`
- `app/field-hub/src/components/PublicCheckInSharePanel.tsx`
- Tests:
  - `CheckInView.test.tsx`
  - `CheckInView.publicShare.test.tsx`
  - Domain-Tests fuer Check-in.

### Kontext fuer Agenten

Die aktuelle Check-in-Datei hat bereits Finder/Row/Sheet-Ansaetze. Diese nicht wegwerfen, sondern zu einem klaren Hauptworkflow ausbauen.

Wichtig:

- Public/Kiosk bleibt getrennt.
- Reset darf erreichbar bleiben, aber nicht dominant.
- Alte Warnungen sind wichtig, aber nicht Hauptflaeche.
- Sync bleibt sichtbar, aber kompakt.

### Deliverables

- Check-in Hauptflaeche ist Roster-first.
- Player/Athlete Detail als Sheet/Pane.
- Public Link/Reset sekundar.
- Mobile und iPad UX getestet.

### Akzeptanzkriterien

- Ein Coach kann 15-20 Spieler schnell sichten.
- Auf iPhone sind Rows gut tappable.
- Keine Card-Wall.
- Ampel hat immer Text/Grund.
- Tests/typecheck/build laufen.

## Sprint 10 - Training Live Mode Redesign

### Was genau machen wir?

Wir bauen Training als Live-Coaching-Flaeche.

Umbau:

- Aktueller Block ganz oben.
- Block/Phase sticky oder immer schnell erreichbar.
- Darunter operative Spieler-/Athletenliste.
- Spieleraktionen kontextuell:
  - erst bei Auswahl sichtbar.
  - nicht fuer jeden Spieler alle Buttons permanent anzeigen.
- Exposures, Mapping, lange Hinweise, Historie und tiefe Details sekundar.
- Returner/Reconditioning Caps sichtbar, wenn relevant.

### Wieso?

Im Training hat der Coach keine Zeit fuer Dashboard-Lesen. Die App muss den naechsten Live-Schritt zeigen.

### Wo?

- `app/field-hub/src/components/TrainingView.tsx`
- `app/field-hub/src/components/LiveSessionStepper.tsx`
- `app/field-hub/src/components/ExposureReviewPanel.tsx`
- `app/field-hub/src/domain/training.ts`
- `app/field-hub/src/domain/liveSession.ts`
- `app/field-hub/src/domain/exposures.ts`
- Tests:
  - `TrainingView.sessionBlocks.test.tsx`
  - `training.test.ts`
  - `liveSession.test.ts`
  - `exposures.test.ts`

### Kontext fuer Agenten

Live-Screen-Regeln:

- Keine Analysecharts.
- Keine Dokumentenlisten.
- Keine grossen Marketingelemente.
- Eine dominante Live-Aktion.
- Spieleraktionen erst nach Fokus.

### Deliverables

- Training zeigt Live-Block zuerst.
- Spieleraktionen sind fokussiert.
- Exposures/Mapping sind sekundar.
- iPhone kann alles bedienen, nur ueber Sheets/Stacks statt breitem Detailpane.

### Akzeptanzkriterien

- Coach sieht aktuelle Phase ohne Scrollen.
- Keine ueberladene Button-Wand.
- Returner Caps sind eindeutig, aber nicht alarmistisch.
- Tests/typecheck/build laufen.

## Sprint 11 - Nachbereitung als echte Aufgabenqueue

### Was genau machen wir?

Wir bauen die Nachbereitung zu einem gefuehrten Abschlussworkflow um.

Umbau:

- Session-Dauer einmal oben.
- Hauptbereich: offene Pflichtaufgaben.
- `MissingValuesPanel` wird Kern des Workflows.
- Reihenfolge:
  - fehlende Pflichtwerte.
  - auffaellige Werte.
  - optionale Werte.
- Pro Schritt nur eine klare Aufgabe.
- Spieler/Athlet Detail in Sheet/Pane.
- Optionale Progression, Mini-Baseline, Notizen und Historie sekundar.

### Wieso?

Nach dem Training ist Energie niedrig. Die App muss fuehren, nicht alles gleichzeitig zeigen. Eine Queue macht Completion wahrscheinlicher.

### Wo?

- `app/field-hub/src/components/PostSessionView.tsx`
- `app/field-hub/src/domain/postSessionMissingValues.ts`
- `app/field-hub/src/domain/postSessionCompletion.ts`
- `app/field-hub/src/hooks/usePostSession.ts`
- `app/field-hub/src/hooks/usePostSessionCompletionOverview.ts`
- Tests:
  - `PostSessionView.test.tsx`
  - `postSessionMissingValues.test.ts`
  - `postSessionCompletion.test.ts`

### Kontext fuer Agenten

Die existierende `MissingValuesPanel`-Logik ist ein guter Anfang. Nicht ersetzen, sondern zur Hauptstruktur machen.

Sprint 8 zeigt Nachbereitungsstatus im Einheit-Container noch als groben Kontext. Sprint 11 soll die Queue dagegen praezise auf einzelne offene Spieler-/Pflichtaufgaben herunterbrechen, nicht nur Blocker-/Advisory-Gruppen zaehlen.

### Deliverables

- Queue-first UI.
- Klare Completion-Anzeige.
- Optionale Bereiche sekundar.
- iPhone Wizard/Sheet-Flow.
- iPad Queue + Detailpane.

### Akzeptanzkriterien

- Ein Coach weiss sofort, was noch fehlt.
- Optionales blockiert Pflichtabschluss nicht.
- Keine endlose Kartenserie.
- Tests/typecheck/build laufen.

## Sprint 12 - Spieler/Athletenbereich und sportartenuebergreifende Profile

### Was genau machen wir?

Wir bauen `Spieler` als sportartenuebergreifenden Athlete-Bereich mit Rugby-Preset.

Umbau:

- Liste zuerst.
- Profil als Detail.
- Oben im Profil:
  - aktueller Status.
  - letzte Teilnahme.
  - aktuelle Limits.
  - offene Themen.
  - kurzer Verlauf.
- Darunter:
  - Historie.
  - Tests.
  - Consent.
  - Fotos, falls erlaubt.
  - Langnotizen.
- Begriffe intern generischer denken:
  - Athlete/Player je nach Config.
  - Positionen aus Sport-Preset.

### Wieso?

Spielerprofile sind spaeter zentral fuer SaaS, Multi-Sport und externe Nutzung. Sie duerfen nicht nur Rugby-Verwaltung sein.

### Wo?

- `app/field-hub/src/components/PlayersView.tsx`
- `app/field-hub/src/components/PlayerEditorForm.tsx`
- `app/field-hub/src/domain/players.ts`
- `app/field-hub/src/domain/playerProfile.ts`
- `app/field-hub/src/hooks/usePlayers.ts`
- `app/field-hub/src/hooks/usePlayerProfiles.ts`
- Tests:
  - `PlayersView.test.tsx`
  - `playerProfile.test.ts`
  - `playerRepository.test.ts`

### Kontext fuer Agenten

Keine echten sensiblen Spielerdaten committen. Keine Diagnosen. Consent bleibt Status, kein digitaler Signaturflow.

### Deliverables

- List-detail Spielerbereich.
- Profil startet arbeitsrelevant, nicht admin-lastig.
- Erste generische Begriffsstruktur dokumentiert.

### Akzeptanzkriterien

- iPhone kann jedes Profil oeffnen und bearbeiten.
- iPad nutzt Liste + Detail sinnvoll.
- Rugby-Positionen bleiben als OnField Rugby Preset erhalten.
- Tests/typecheck/build laufen.

## Sprint 13 - Analyse als separater, ruhiger Auswertungsraum

### Was genau machen wir?

Wir bauen Analyse bewusst als zweiten Modus, getrennt vom Live-Flow.

Umbau:

- Kleine, klare KPI-Auswahl.
- Filter als Chips/Sheets.
- Jede Analysekarte beantwortet eine Coach-Frage:
  - beobachten?
  - modifizieren?
  - steigern?
  - rueckmelden?
- Keine Live-Quick-Actions.
- Kein Training/Check-in Formular in Analyse.
- iPhone zeigt komprimierte Kerninsights, aber alle Funktionen bleiben erreichbar.

### Wieso?

Analyse ist wertvoll, aber sie darf Live-Coaching nicht verstopfen. Sie muss Entscheidungen vorbereiten, nicht den Feldmodus dominieren.

### Wo?

- `app/field-hub/src/components/AnalysisView.tsx`
- `app/field-hub/src/components/PlayerAnalysisCharts.tsx`
- `app/field-hub/src/domain/analysis.ts`
- `app/field-hub/src/domain/loadAnalysis.ts`
- `app/field-hub/src/domain/playerAnalysis.ts`
- Tests:
  - `AnalysisView.test.tsx`
  - `analysis.test.ts`
  - `loadAnalysis.test.ts`
  - `playerAnalysis.test.ts`

### Kontext fuer Agenten

Kein Chart-Wachstum ohne klare Frage. Keine schweren Dashboard-Waende.

### Deliverables

- Analyse-Screen mit klarer Hierarchie.
- Filterlogik sauber.
- iPhone funktionsgleich, nur anders gestapelt.

### Akzeptanzkriterien

- Keine Analyseelemente werden in Live-Screens verschoben.
- Jede Kennzahl hat Kontext.
- Tests/typecheck/build laufen.

## Sprint 14 - Mehr: Bibliothek, Export/Backup, Einstellungen

### Was genau machen wir?

Wir machen `Mehr` zu einer klaren Utility-Zone.

Umbau:

- Bibliothek wird Referenzbereich, nicht Hauptnavigation.
- Export und Backup werden zusammen gedacht.
- Einstellungen bleiben ruhig und administrativ.
- Debug/technische Details in sekundare Bereiche.
- Import/Export mit klaren Confirmations.

### Wieso?

Admin-Funktionen sind wichtig, aber sie duerfen den Coach-Flow nicht dominieren. `Mehr` raeumt die Hauptnavigation auf.

### Wo?

- `app/field-hub/src/components/LibraryView.tsx`
- `app/field-hub/src/components/ExportView.tsx`
- `app/field-hub/src/components/SettingsView.tsx`
- `app/field-hub/src/lib/csvExport.ts`
- `app/field-hub/src/lib/backupRepository.ts`
- Tests:
  - `LibraryView.test.tsx`
  - `SettingsView.test.tsx`
  - `csvExport.test.ts`
  - `backupRepository.test.ts`

### Kontext fuer Agenten

Technische Begriffe fuer Coach-UI uebersetzen:

- Nicht "pending write queue".
- Besser "wartet auf Sync".
- Nicht "JSON conflict object".
- Besser "1 Konflikt muss geprueft werden".

### Deliverables

- `Mehr` gruppiert Utilities.
- Bibliothek/Export/Einstellungen sind nicht mehr Top-Level.
- Backup/Sync-Sprache ist coachnah.

### Akzeptanzkriterien

- Alle Utility-Funktionen bleiben erreichbar.
- Hauptnavigation bleibt auf 5 Bereiche reduziert.
- Tests/typecheck/build laufen.

## Sprint 15 - Public/Kiosk Check-in als eigene Experience

### Was genau machen wir?

Wir bauen Public/Kiosk als eigene reduzierte UI, nicht als normale Coach-Ansicht mit versteckten Elementen.

Umbau:

- Vollbild-Flow.
- Grosse Touch-Ziele.
- Minimale Navigation.
- Privacy-Hinweis.
- Auto-Reset nach Abschluss.
- Keine Coach-Notizen.
- Keine Historie.
- Keine Team-Analyse.
- Klare Rueckkehr in Coach-Modus.

### Wieso?

Spieler/Athleten nutzen Kiosk anders als Coaches. Sie brauchen einen simplen, sicheren Flow. Datenschutz und Verstaendlichkeit sind wichtiger als Funktionsdichte.

### Wo?

- `app/field-hub/src/components/KioskCheckInView.tsx`
- `app/field-hub/src/components/PublicCheckInView.tsx`
- `app/field-hub/src/components/SelfCheckInFlow.tsx`
- `app/field-hub/src/domain/publicCheckIn.ts`
- `app/field-hub/src/lib/publicCheckInRepository.ts`
- Tests:
  - `KioskCheckInView.test.tsx`
  - `PublicCheckInView.test.tsx`
  - `SelfCheckInFlow.test.tsx`
  - `publicCheckIn.test.ts`
  - `test:e2e:kiosk`

### Kontext fuer Agenten

Kiosk darf Brand/Hero am Start nutzen, aber nur wenn der eigentliche Check-in danach schnell und schlicht ist.

### Deliverables

- Eigene Kiosk/Public Experience.
- OnField Branding am Welcome.
- Reduzierter Check-in Flow.
- E2E-Kiosk-Smoke laeuft.

### Akzeptanzkriterien

- Nicht eingewiesene Person kann Check-in abschliessen.
- Keine privaten Coach-Daten sichtbar.
- Touch-Ziele gross genug.
- Tests/typecheck/build/e2e laufen.

## Sprint 16 - Sportarten-Konfiguration und OnField Rugby Preset

### Was genau machen wir?

Wir extrahieren sportartspezifische Begriffe und Presets schrittweise.

Ein Config-Modell definieren:

- Sport-ID.
- Produktlabel.
- Athlete/Player Labels.
- Positionen/Groups.
- Session-Typen.
- Metriklabels.
- Traffic-Light-Texte.
- Reconditioning/Returner-Begriffe.
- Library-Kategorien.
- Optional sportartspezifische Safety-Copy.

Erster Preset:

- OnField Rugby.

### Wieso?

Du willst spaeter alle Sportarten bedienen. Dafuer darf die Produktstruktur nicht unbewusst Rugby-only bleiben.

### Wo?

Empfohlen neu:

- `app/field-hub/src/config/sports.ts`
- `app/field-hub/src/config/onfieldRugby.ts`
- `app/field-hub/src/config/labels.ts`

Bestehend pruefen:

- `app/field-hub/src/content/*`
- `app/field-hub/src/domain/*`
- `app/field-hub/src/components/*`

Dokument:

- `docs/field-hub/onfield_sports_configuration_model.md`

### Kontext fuer Agenten

Nicht alles sofort generisch machen. Zu viel Abstraktion waere riskant. Ziel ist ein sauberer Anfang:

- UI-Labels und Positionen zuerst.
- Fachlogik nur dort abstrahieren, wo es klar ist.
- Rugby-Content bleibt erhalten.

### Deliverables

- SportConfig-Typ.
- OnField Rugby Config.
- Erste UI-Bereiche nutzen Config-Labels.
- Dokumentierte Grenzen.

### Akzeptanzkriterien

- Rugby funktioniert wie vorher.
- Ein spaeterer Sport-Preset ist vorstellbar, ohne alle Komponenten umzubenennen.
- Tests/typecheck/build laufen.

## Sprint 17 - Sync/Backup/Offline vereinheitlichen

### Was genau machen wir?

Wir vereinheitlichen Sync, Backup und Offline-Kommunikation.

Umbau:

- Globaler kompakter Sync-Status.
- Detailsheet bei Tap.
- Einheitliche Begriffe:
  - lokal gespeichert.
  - wartet auf Sync.
  - zuletzt synchronisiert.
  - Konflikt pruefen.
  - offline.
- Manuelle Retry-Funktion.
- Keine Annahme, dass iOS Background Sync verlaesslich ist.
- Keine technische Dominanz auf Live-Screens.

### Wieso?

Vertrauen in Datenhaltung ist kritisch. Sync darf aber nicht jeden Screen in ein technisches Dashboard verwandeln.

### Wo?

- `app/field-hub/src/components/SyncStatusBadge.tsx`
- `app/field-hub/src/lib/syncLabels.ts`
- `app/field-hub/src/lib/pendingWriteSync.ts`
- `app/field-hub/src/lib/syncRepository.ts`
- `app/field-hub/src/lib/backgroundSync.ts`
- `app/field-hub/src/domain/sync.ts`
- `app/field-hub/src/domain/syncPlanning.ts`
- Tests:
  - `SyncStatusBadge.test.tsx`
  - `pendingWriteSync.test.ts`
  - `syncRepository.test.ts`
  - `backgroundSync.test.ts`
  - `syncPlanning.ts` Tests, falls vorhanden.

### Kontext fuer Agenten

Research-Regel:

- Background Sync auf iOS/Safari nicht voraussetzen.
- Pending Queue und manueller Retry bleiben.
- Dynamische Meldungen sollten fuer Assistive Technologies angekuendigt werden.

### Deliverables

- Einheitliche Sync-Komponente.
- Einheitliche Texte.
- Globaler Status in App Shell.
- Detailansicht fuer Queue/Konflikte.

### Akzeptanzkriterien

- Jeder Hauptscreen zeigt Sync kompakt.
- Kein Screen zeigt rohe technische Queue-Begriffe.
- Offline-Status ist klar.
- Tests/typecheck/build laufen.

## Sprint 18 - Accessibility, PWA und Install Polish

### Was genau machen wir?

Wir machen die App fuer externe Nutzer robuster.

Pruefen und verbessern:

- Touch Targets.
- Fokuszustand.
- Kontrast.
- Safe Areas.
- Bottom Bar/Home Indicator.
- iOS Standalone Mode.
- PWA Manifest.
- App Icon.
- Install-Hilfe fuer iOS.
- Offline Fallback.
- Loading/Empty/Error/Disabled States.

### Wieso?

Externe Nutzer verzeihen weniger. Eine PWA muss installiert, offline und auf iPhone/iPad kontrolliert wirken.

### Wo?

- `app/field-hub/index.html`
- `app/field-hub/public/`
- `app/field-hub/src/index.css`
- `app/field-hub/src/pwaConfig.test.ts`
- `app/field-hub/src/components/PwaUpdateNotice.tsx`
- `app/field-hub/src/hooks/useStoragePersistence.ts`
- `app/field-hub/vite.config.ts`
- `docs/field-hub/onfield_pwa_accessibility_qa.md`

### Kontext fuer Agenten

Vorher in Sprints entstandene UI muss jetzt systematisch getestet werden:

- iPhone klein.
- iPhone gross.
- iPad Portrait.
- iPad Landscape.
- Offline.
- Installiert/Standalone.

### Deliverables

- QA-Dokument aktualisiert.
- PWA/Install/UI-Kanten poliert.
- Fehler-/Empty-/Loading-Zustaende konsistent.

### Akzeptanzkriterien

- Kein Button klebt am Home Indicator.
- Fokus ist sichtbar.
- Kontrast ist ausreichend.
- Offline endet nie in Browser-Fehlerseite.
- Typecheck/test/build laufen.

## Sprint 19 - Screen-by-Screen Full Rollout und visuelle QA

### Was genau machen wir?

Wir pruefen alle Hauptscreens nach dem Umbau und korrigieren Inkonsistenzen.

Screens:

- Heute.
- Einheit / Check-in.
- Einheit / Training.
- Einheit / Nachbereitung.
- Spieler.
- Analyse.
- Mehr / Bibliothek.
- Mehr / Export & Backup.
- Mehr / Einstellungen.
- Public Check-in.
- Kiosk Check-in.

Pruefen:

- iPhone.
- iPad Portrait.
- iPad Landscape.
- leere Daten.
- volle Daten.
- offline.
- pending sync.
- error state.

### Wieso?

Du willst den Design-Rollout bewusst global, Screen fuer Screen. Dieser Sprint verhindert, dass alte Muster in Nebenbereichen uebrig bleiben.

### Wo?

- Ganze App unter `app/field-hub/src`.
- Screenshots optional in `app/field-hub/ux-audit-screenshots/` oder neuem QA-Ordner, wenn sinnvoll.
- QA-Dokumente in `docs/field-hub`.

### Kontext fuer Agenten

Nicht neue Features bauen. Nur visuelle/UX-Konsistenz, Bugs, fehlende States und Regressionen beheben.

### Deliverables

- QA-Matrix mit Status pro Screen.
- Screenshot-Set oder Browser-Kommentare.
- Liste geloester Inkonsistenzen.
- Liste verbleibender Risiken.

### Akzeptanzkriterien

- Kein Hauptscreen wirkt wie alte App.
- Keine Card-Wall auf Live-Screens.
- iPhone kann alles.
- iPad nutzt Breite sinnvoll.
- Tests/typecheck/build laufen.

## Sprint 20 - Externe Beta Readiness und Plattform-Entscheidungsvorbereitung

### Was genau machen wir?

Wir bereiten einen kontrollierten externen Test vor.

Arbeiten:

- Beta-Checkliste.
- Bekannte Risiken.
- Datenschutz-/Safety-Copy Review.
- Onboarding fuer externe Coaches.
- Install-Anleitung.
- Feedback-Kanal.
- Kriterien fuer spaetere Native-App-Entscheidung.
- Kriterien fuer spaetere SaaS-Module.
- Ausgangspunkt fuer eine spaetere eigene OnField Performance Plattform-Roadmap.

### Wieso?

Nach dem Redesign soll die App nicht nur intern gut aussehen, sondern extern nutzbar sein. Gleichzeitig soll Native/SaaS nicht aus Bauchgefuehl entschieden werden.

### Wo?

- `docs/field-hub/onfield_beta_readiness.md`
- `docs/field-hub/onfield_native_saas_decision_criteria.md`
- spaeter eigenes Dokument fuer Plattform-/SaaS-Roadmap, wenn Beta-Reife erreicht ist.
- ggf. README/Install-Doku in `app/field-hub`.

### Kontext fuer Agenten

Native App spaeter ist offen, aber kein Sprint-Ziel. SaaS spaeter ist offen, aber kein Sprint-Ziel. Erst Beta-Qualitaet beweisen.

### Deliverables

- Beta Readiness Dokument.
- Native/SaaS Entscheidungskriterien.
- Klarer Vermerk: Multi-Tenant, Rollen, Billing, Organisationen, Datenschutztexte, App-Store-Metadaten und Support gehoeren in eine spaetere eigene Plattform-Roadmap.
- Liste spaeterer Module:
  - Player Portal.
  - Team Engagement.
  - Leaderboards.
  - Feeds.
  - Challenges.
  - Multi-Coach/Rollen.
  - Multi-Sport Preset Management.

### Akzeptanzkriterien

- Klarer Plan fuer externe Nutzer.
- Klarer Plan, wann Native/Flutter/React Native sinnvoll wird.
- Keine spaeteren Optionen wurden verbaut.

## Was wir bewusst weglassen, bis die Basis sitzt

### Dark Mode

Warum nicht jetzt:

- Er verdoppelt QA-Aufwand.
- Light Mode ist fuer Feld/Outdoor aktuell wichtiger.
- Tokens muessen erst stabil sein.

Spaeter moeglich:

- Ja, nach Kernflows und Token-Stabilitaet.

### Native Rewrite

Warum nicht jetzt:

- Ein Rewrite loest keine schlechte IA.
- Ein Rewrite loest keine unklare UX.
- PWA kann jetzt schon sehr viel verbessern.

Spaeter moeglich:

- Ja, wenn App Store, MDM, tiefere OS-Integration oder zuverlaessiger Hintergrundbetrieb produktkritisch werden.

### Grosse externe UI-Library als Hauptloesung

Warum nicht jetzt:

- Die Gefahr ist ein generischer SaaS-Look.
- OnField braucht eigene Semantik fuer Coach, Field, Safety, Sync und Reconditioning.
- Erst Tokens/Komponenten definieren, dann bewusst entscheiden.

Spaeter moeglich:

- Ja, als Headless- oder Komponentenbasis, wenn sie OnField-Tokens sauber traegt.

### Eigene Brand-Font im operativen UI

Warum nicht jetzt:

- Lesbarkeit, iOS-Naehe und Feldtauglichkeit sind wichtiger.
- Systemfont reduziert Risiko.

Trotzdem jetzt moeglich:

- Logo.
- App Icon.
- Marketing.
- Landingpage.
- Splash.
- spaeter getestete Display-Headlines.

### Leaderboards, Feed, Social Features

Warum nicht jetzt:

- Sie gehoeren nicht zum Coach-Operations-Kern.
- Sie wuerden Safety, Returner und Training-Flow verwässern.

Spaeter moeglich:

- Ja, als eigenes Modul fuer OnField Performance oder Player/Team Engagement.

### Player Accounts

Warum nicht jetzt:

- Erhoeht Datenschutz-, Auth-, Rollen- und Support-Komplexitaet.
- Public/Kiosk Check-in deckt MVP-Bedarf besser ab.

Spaeter moeglich:

- Ja, wenn Player Portal als klares Produktmodul definiert ist.

## Empfohlene Sprint-Reihenfolge

Nicht springen, ausser es gibt einen klaren Grund.

1. Sprint 0A: OnField Memory System v1. **Abgeschlossen.**
2. Sprint 0B: Research-Synthese und SSOT-Freeze. **Abgeschlossen.**
3. Sprint 0C: Hook Review & Automation Guardrails. **Abgeschlossen.**
4. Sprint 0D: Local Runtime Memory. **Abgeschlossen.**
5. Sprint 1: Agenten-Setup Review & Finalisierung. **Abgeschlossen.**
6. Sprint 2: IA-Spezifikation.
7. Sprint 3: Brand Foundation.
8. Sprint 4: Tokens.
9. Sprint 5: Core Components.
10. Sprint 6: App Shell/Navigation.
11. Sprint 7: Hero/Brand Surfaces.
12. Sprint 8: Einheit Container.
13. Sprint 9: Check-in.
14. Sprint 10: Training.
15. Sprint 11: Nachbereitung.
16. Sprint 12: Spieler/Athleten.
17. Sprint 13: Analyse.
18. Sprint 14: Mehr/Utility.
19. Sprint 15: Public/Kiosk.
20. Sprint 16: Sport Config.
21. Sprint 17: Sync/Backup.
22. Sprint 18: PWA/A11y.
23. Sprint 19: Full Rollout QA.
24. Sprint 20: External Beta.

## Definition of Done fuer die gesamte Roadmap

Die Roadmap ist erfolgreich umgesetzt, wenn:

- Die App heisst und wirkt wie OnField Coach.
- OnField Rugby ist als erste Sport-Konfiguration erkennbar.
- iPhone und iPad haben vollen Funktionsumfang.
- iPhone nutzt Bottom Tab Bar.
- iPad nutzt Sidebar.
- Hauptnavigation hat 5 Bereiche.
- Einheit fuehrt Check-in, Training und Nachbereitung zusammen.
- Check-in ist roster-first.
- Training ist live-first.
- Nachbereitung ist queue-first.
- Spielerprofile sind arbeitsrelevant und sportartenuebergreifend gedacht.
- Analyse ist getrennt vom Live-Flow.
- Mehr enthaelt Verwaltung.
- Sync/Offline ist global, klein und verstaendlich.
- Brand/Hero ist sichtbar an sinnvollen Stellen.
- Live-Screens bleiben ruhig und operativ.
- Design Tokens und Komponenten sind dokumentiert.
- PWA, Safe Areas, Touch Targets, Fokus, Kontrast und Offline sind geprueft.
- Externe Beta kann starten, ohne dass die App wie ein Prototyp wirkt.
