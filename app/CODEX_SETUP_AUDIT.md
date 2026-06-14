# Codex Setup Audit: Rugby S&C Field Hub

Stand: 13. Juni 2026

Ziel: Dieses Dokument beschreibt, welche Codex-/OpenAI-Möglichkeiten fuer die Umsetzung der Rugby-S&C-App genutzt werden sollten, welche optional sind und welche bewusst nicht genutzt werden sollten. Es ergaenzt `app/README.md` und `app/ROADMAP.md`.

## 1. Ergebnis in einem Satz

Das beste Setup ist kein grosses Agenten- oder Plugin-System, sondern ein schlankes, wiederholbares Codex-Setup:

- Git-Repo fuer Review, Diffs und spaetere Worktrees.
- repo-lokaler App-Skill unter `.agents/skills/` fuer konsistente Umsetzung.
- Browser Plugin fuer iPad/iPhone-nahe UI-Pruefung.
- Supabase Plugin/Skill fuer Auth, Postgres, RLS, Migrationen und iPad-iPhone-Sync.
- Vercel/React-Best-Practices und optional CodeRabbit/Codex Security fuer gezielte Reviews.
- Keine Figma-, Expo-, Agents-SDK- oder OpenAI-API-Komplexitaet im MVP, ausser der Nutzer entscheidet bewusst anders.

## 2. Offizielle Codex-/OpenAI-Quellenbasis

Verwendete offizielle Codex-Dokumentation:

- Codex Manual, `Agent Skills`: Skills sind wiederverwendbare Workflows mit `SKILL.md`; repo-lokal sucht Codex unter `.agents/skills`.
- Codex Manual, `Custom instructions with AGENTS.md`: Codex liest `AGENTS.md` zu Beginn einer Session; naehere Dateien ueberschreiben weiter entfernte.
- Codex Manual, `Model Context Protocol`: MCP verbindet Codex mit externen Tools und Kontext wie Figma, Browser, Docs oder Datenbanken.
- Codex Manual, `Plugins`: Plugins buendeln Skills, Apps und MCP-Server.
- Codex Manual, `Subagents`: Subagents helfen bei paralleler, read-heavy Analyse; sie sollen nur bei expliziter Aufforderung verwendet werden.
- Codex Manual, `Hooks`: Hooks koennen Validierung automatisieren, sind aber vor einem stabilen App-Projekt leicht Over-Engineering.
- Codex Manual, `Codex app features`: Codex App bietet Review, Worktrees, Browser, Automations, Git und Artefaktvorschau.
- Codex Manual, `In-app browser`: Browser Use ist fuer lokale Web-App-Tests, Screenshots, Klicks und visuelle Kommentare geeignet.
- Codex Manual, `Review`: Review Pane funktioniert auf Git-Basis und ist fuer Diffs/Inline-Kommentare nuetzlich.
- Supabase Docs, `Auth`: Supabase Auth integriert sich mit Postgres/RLS und kann Auth-Tokens fuer row-by-row Zugriff verwenden.
- Supabase Docs, `Row Level Security`: Tabellen in exposed schemas brauchen RLS; mit RLS und Policies wird Browser-Zugriff kontrolliert.
- Supabase Docs, `Local Development`: lokale Supabase-Entwicklung mit CLI/Docker ist fuer Migrationen und Tests vorgesehen.

Referenz-URLs:

- https://developers.openai.com/codex/codex-manual.md
- https://developers.openai.com/codex/skills
- https://developers.openai.com/codex/mcp
- https://developers.openai.com/codex/plugins
- https://developers.openai.com/codex/app/features
- https://developers.openai.com/codex/app/browser
- https://developers.openai.com/codex/app/review
- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/local-development

## 3. Lokaler Ist-Zustand

### Setup umgesetzt am 13. Juni 2026

- Git-Repository im Projektroot initialisiert.
- `.gitignore` angelegt.
- `data/.gitkeep` angelegt, damit `data/` als Struktur erhalten bleibt.
- Repo-lokaler Codex-Skill angelegt:
  - `.agents/skills/rugby-field-hub-implementation/SKILL.md`

### Bereits vorhanden

- `AGENTS.md` im Projektroot mit Rugby-S&C-Kontext.
- `app/README.md` mit Produktziel und Architekturentscheidung.
- `app/ROADMAP.md` mit Sprint-Roadmap, Datenmodell, Akzeptanztest und MVP-Grenzen.
- `app/SUPABASE_SETUP_GUIDE.md` mit praktischer Supabase-Schritt-fuer-Schritt-Anleitung.
- Projekt-Playbooks unter `codex/skills/`:
  - `rugby-snc-research-synthesis`
  - `rugby-snc-annual-planning`
  - `rugby-snc-session-programming`
  - `rugby-snc-safety-review`
- Aktivierte Plugins in der lokalen Codex-Konfiguration:
  - Browser
  - GitHub
  - Vercel
  - Figma
  - OpenAI Developers
  - Supabase
  - CodeRabbit
  - Codex Security
  - Documents / Spreadsheets / Presentations
  - Expo
  - Linear
  - Life Science Research
- MCP-Konfiguration lokal vorhanden fuer:
  - Figma
  - Supabase
  - node_repl
  - Archon

### Weiterhin bewusst nicht vorhanden

- Kein App-Code.
- Kein `package.json`.
- Kein Vite-Projekt.
- Keine project-lokale `.codex/config.toml`.
- Keine project-lokalen Hooks.

## 4. Wichtigste Setup-Empfehlungen

### Empfehlung 1: Git vor App-Code initialisieren

Prioritaet: sehr hoch.

Warum:

- Codex Review Pane funktioniert sinnvoll auf Git-Basis.
- Diffs bleiben nachvollziehbar.
- Rueckrollen einzelner Aenderungen ist einfacher.
- Worktrees werden spaeter moeglich.
- CodeRabbit/GitHub-Workflows werden spaeter leichter.

Vorschlag:

- Git-Repo im Projektroot initialisieren.
- `.gitignore` anlegen fuer Node/Vite-Artefakte:
  - `node_modules/`
  - `dist/`
  - `.env`
  - `.env.*`
  - `.DS_Store`
  - lokale Cache-/Build-Dateien

Hinweis:

- Vor dem ersten Commit muss der Nutzer entscheiden, ob alte PDFs, Research-Rohdaten und private Trainingsdaten versioniert werden sollen.
- Sensible echte Spieler-Daten gehoeren nicht ins Repo.

### Empfehlung 2: Einen repo-lokalen App-Skill anlegen

Prioritaet: sehr hoch.

Warum:

- Die vorhandenen `codex/skills/` sind gute Playbooks, aber Codex auto-discovered Skills liegen laut Codex-Doku repo-lokal unter `.agents/skills`.
- Ein App-Skill zwingt neue Sessions, die richtige Roadmap, Architekturgrenzen und Safety-Regeln zu laden.
- Das reduziert Wiederholungen und verhindert, dass Codex Expo, einen eigenen Server, Edge Functions, freie Storage-Uploads oder einen Markdown-Parser zu frueh einbaut.

Vorschlag:

- `.agents/skills/rugby-field-hub-implementation/SKILL.md`

Inhalt des Skills:

- Immer zuerst lesen:
  - `AGENTS.md`
  - `app/README.md`
  - `app/ROADMAP.md`
  - `app/CODEX_SETUP_AUDIT.md`
  - `app/SUPABASE_SETUP_GUIDE.md`
  - `print_pdfs/00_manifest.txt`
- MVP-Architektur:
  - Vite + React + TypeScript.
  - PWA.
  - Supabase Auth + Postgres + RLS als Sync-Wahrheit.
  - IndexedDB/Dexie als Offline-Cache und Offline-Queue.
  - Kein eigener Server.
  - iPad/iPhone-Sync ist MVP-Bestandteil.
  - Manuelle TypeScript-/JSON-Content-Struktur, keine Parser-Pipeline.
- Pflichtregeln:
  - Startscreen ist Dashboard, keine Landingpage.
  - iPad-first, touch-first.
  - Sync-Status sichtbar: online/offline/synced/pending/error.
  - Export sichtbar.
  - Keine `service_role` Secrets im Frontend.
  - RLS auf allen dynamischen Tabellen.
  - Keine medizinische Freigabe.
  - Keine digitale Einwilligung im MVP.
  - Keine 30-m-/Bronco-Pflicht fuer KW25.

### Empfehlung 3: Browser Plugin als Pflicht-Review-Tool verwenden

Prioritaet: hoch.

Warum:

- Die App ist UI-/Workflow-lastig.
- Fehler werden eher visuell und ergonomisch auffallen als in komplexer Businesslogik.
- Codex kann mit Browser Use lokale Seiten oeffnen, klicken, Screenshots machen und Layoutprobleme finden.

Einsatz:

- Nach Sprint 1: Startscreen und Navigation pruefen.
- Nach Sprint 4: 20-Spieler-Check-in auf iPad-Breite pruefen.
- Nach Sprint 6: Nachbereitung und Carry-over pruefen.
- Nach Sprint 10: Desktop/iPad/iPhone-Viewport und Offline-Check.

Nicht noetig:

- Full CDP Developer Mode nur bei konkretem Performance-/Console-/Network-Problem.

### Empfehlung 4: Vercel/React-Best-Practices gezielt nutzen

Prioritaet: mittel-hoch.

Warum:

- Das Vercel-Plugin enthaelt React-/Frontend-nahe Skills.
- Fuer eine React/Vite-App ist ein Review nach groesseren TSX-/State-Aenderungen sinnvoll.

Einsatz:

- Nach Sprint 3-6, wenn Datenfluss und UI-Komponenten stehen.
- Fokus:
  - State-Komplexitaet.
  - Komponentenaufteilung.
  - unnötige Re-Renders.
  - klare Props/Types.
  - einfache Form-Logik.

Nicht verwenden:

- Next.js-spezifische Vercel-Skills, solange die App bewusst Vite bleibt.
- Deployment-/Vercel-Hosting-Skills im MVP, solange lokale Entwicklung und Supabase-Sync reichen.

### Empfehlung 5: Supabase Plugin/Skill gezielt nutzen

Prioritaet: hoch.

Warum:

- iPad und iPhone sollen denselben Datenstand haben.
- Supabase ist fuer diesen Bedarf die passende schlanke Sync-Schicht.
- Die Daten sind trainings- und gesundheitsnah; Auth und RLS duerfen nicht nachtraeglich improvisiert werden.

Einsatz:

- Sprint 0: Supabase-Skill/Docs lesen.
- Sprint 3: Auth, Tabellen, RLS, Policies, Migrationen und private Spielerprofilfotos via Supabase Storage.
- Sprint 3: Arwin anhand `app/SUPABASE_SETUP_GUIDE.md` aktiv durch Dashboard, URL, publishable key, `.env` und Auth-Entscheidungen fuehren.
- Sprint 4-9: Sync, Offline-Queue, Security-Check.

Nicht verwenden:

- keine Edge Functions im MVP.
- kein Storage im MVP ausser private Spielerprofilfotos mit Foto-Erlaubnis und Storage-Policies.
- kein Realtime im MVP, solange nur Arwin arbeitet.
- keine Spieler-Accounts.
- kein service-role Key im Client.

### Empfehlung 6: Codex Security erst nach Speicher/Export einsetzen

Prioritaet: mittel.

Warum:

- Der MVP speichert sensible trainings- und gesundheitsnahe Daten in Supabase und lokal im Cache.
- Die groessten Sicherheitshebel sind Datenminimierung, Auth, RLS, keine Diagnosefelder, kein `service_role` Key im Client und Export-Hinweise.

Einsatz:

- Nach Sprint 6 oder 9:
  - IndexedDB-Schema.
  - Supabase-Schema.
  - RLS-Policies.
  - Export/Import.
  - Sync-Status.
  - keine echten Spieler-Testdaten im Repo.

Nicht verwenden:

- Keine umfangreiche Security-Audit-Maschinerie vor dem ersten lokalen MVP.

### Empfehlung 7: CodeRabbit optional nach groesserem Diff

Prioritaet: mittel.

Warum:

- CodeRabbit kann als externe Review-Schicht fuer Code-Qualitaet helfen.
- Sinnvoll erst, wenn ein zusammenhaengender Code-Diff existiert.

Einsatz:

- Nach Sprint 6 oder vor einer finalen MVP-Abnahme.
- Fokus:
  - Bugs.
  - TypeScript-Probleme.
  - fehlende Tests.
  - edge cases bei Export/Import.

Nicht verwenden:

- Nicht fuer Planungs-MD.
- Nicht nach jedem kleinen Sprint, sonst erzeugt es zu viel Review-Rauschen.

### Empfehlung 8: Subagents nur auf ausdrueckliche Anweisung

Prioritaet: optional.

Warum:

- Codex-Doku sagt: Subagents sind gut fuer parallele, read-heavy oder klar getrennte Arbeiten, aber verbrauchen mehr Kontext/Tokens und sollen nicht automatisch gespawnt werden.

Gute Einsatzmuster fuer dieses Projekt:

- Explorer 1: Content-Mapping aus `templates/` und `plans/` in SessionDefinitions pruefen.
- Explorer 2: UX-/Workflow-Risiken gegen `app/ROADMAP.md` pruefen.
- Worker 1: Static content + Bibliothek.
- Worker 2: Supabase Schema/RLS + Dexie Offline-Cache.
- Worker 3: UI-Screens.

Regel:

- Nur nutzen, wenn der Nutzer explizit sagt: "nutze Subagents", "spawn Agenten", "parallelisieren".
- Bei parallelen Workern disjunkte Schreibbereiche festlegen.

### Empfehlung 9: Automations aktuell nicht noetig

Prioritaet: niedrig.

Warum:

- Das Projekt ist noch vor der Implementierung.
- Automations lohnen sich fuer wiederkehrende Checks, PR-Status, Langlaeufer oder regelmaessige Reports.

Spaeter sinnvoll:

- Woechentlicher Reminder, den lokalen Export/Backup zu pruefen.
- Nach Implementierung: wiederkehrender Build-/Lint-Check, falls das Projekt laenger aktiv bleibt.

Nicht jetzt:

- Keine Automation vor Git/App-Code.

### Empfehlung 10: Hooks aktuell nicht anlegen

Prioritaet: niedrig.

Warum:

- Hooks sind stark, aber in dieser Phase Over-Engineering.
- Sie muessen trusted/reviewed werden.
- Ein falscher Hook kann den Workflow eher bremsen.

Spaeter sinnvoll:

- `Stop`-Hook, der nach Code-Aenderungen daran erinnert, `npm run build` auszufuehren.
- `PostToolUse`-Hook, der grobe sensible Daten im `data/`-Ordner warnt.

Nicht jetzt:

- Keine Hooks, bevor App-Kommandos und Git-Struktur stabil sind.

## 5. Plugins und Tools: konkrete Bewertung fuer dieses Projekt

| Tool / Plugin | Nutzen fuer MVP | Empfehlung |
| --- | --- | --- |
| Browser | Sehr hoch fuer UI-/Viewport-/Interaktionspruefung | Aktiv nutzen |
| Vercel React Skills | Hoch fuer React-Review und Frontend-Best-Practices | Gezielt nutzen |
| Supabase | Hoch fuer iPad/iPhone-Sync, Auth, RLS, Migrationen | Aktiv nutzen, aber schlank |
| CodeRabbit | Mittel fuer externen Code-Review | Nach groesserem Diff nutzen |
| Codex Security | Mittel fuer Supabase-/RLS-/Export-/Privacy-Pruefung | Nach Speicher/Export nutzen |
| GitHub | Niedrig bis mittel, solange kein Remote/PR | Spaeter nutzen |
| Figma | Optional fuer Design-Mockups | Nur wenn vor Code ein Mockup gewuenscht ist |
| Expo | Nicht passend, da keine native App | Nicht nutzen |
| OpenAI Developers / Agents SDK | Nicht passend, da keine AI/API im MVP | Nicht nutzen |
| Documents/Spreadsheets/Presentations | Gering fuer App-Code | Nur fuer Export-/Dokument-Artefakte |
| Life Science Research | Nicht passend fuer App-Implementierung | Nicht nutzen |
| Linear | Nur falls Aufgabenmanagement in Linear gewuenscht | Nicht noetig |

## 6. Fertige UIs, Templates und Snippets

### Was wir nutzen sollten

- Vite React TypeScript Template.
- PWA-Grundlagen:
  - Web App Manifest.
  - Service Worker, bevorzugt ueber ein kleines PWA-Plugin, wenn es unkompliziert bleibt.
  - iOS-Meta-Tags.
- Dexie als leichter IndexedDB-Wrapper.
- `@supabase/supabase-js` fuer Auth und Daten-Sync.
- Supabase CLI/Migrationsstruktur fuer Schema/RLS.
- einfache eigene Komponenten:
  - AppShell.
  - TabNavigation.
  - SessionCard.
  - PlayerRow.
  - TrafficLightBadge.
  - QuickActionButton.
  - ExportPanel.
  - SafetyBanner.
- optional `lucide-react` fuer klare Icons.

### Was wir eher nicht nutzen sollten

- shadcn/ui als Pflicht.
- grosses Component Framework.
- komplexes Dashboard-Template.
- Chart-Library im MVP.
- Auth-Template.
- Supabase-Starter.
- Next.js-Starter.
- Expo-Starter.

Begruendung:

- Die App braucht schnelle, robuste Field-UI, keine SaaS-Oberflaeche.
- Wenige eigene Komponenten sind wartbarer als ein grosses UI-System.
- Supabase wird gezielt fuer Sync/Auth/RLS genutzt, nicht als Anlass fuer ein grosses Starter-Template.
- Das Datenmodell, RLS und der Workflow sind wichtiger als fertige Optik.

## 7. Empfohlene Reihenfolge vor der neuen Implementierungs-Session

1. Dieses Dokument lesen.
2. Pruefen, dass der Skill `.agents/skills/rugby-field-hub-implementation/SKILL.md` geladen ist.
3. Pruefen, dass Git aktiv ist und keine echten Spieler-/Gesundheitsdaten gestaged sind.
4. Neue Codex-Session starten mit dem expliziten Prompt:
   - "Nutze den repo-lokalen Rugby Field Hub Skill und den Supabase Skill, lies `app/README.md`, `app/ROADMAP.md`, `app/CODEX_SETUP_AUDIT.md` und `app/SUPABASE_SETUP_GUIDE.md`, und beginne mit Sprint 0-1. Supabase ist fuer Auth/RLS/iPad-iPhone-Sync eingeplant; Storage nur fuer private Spielerprofilfotos nach Foto-Erlaubnis, aber kein eigener Server, kein Realtime, keine Spieleraccounts."

## 8. Empfohlener Prompt fuer die neue Codex-Session

```text
Bitte implementiere den Rugby S&C Field Hub gemaess `app/README.md`, `app/ROADMAP.md`, `app/CODEX_SETUP_AUDIT.md` und `app/SUPABASE_SETUP_GUIDE.md`.

Nutze zuerst Sprint 0 und Sprint 1.

Wichtig:
- App unter `app/field-hub/`.
- Vite + React + TypeScript.
- PWA-MVP, iPad-first.
- Supabase Auth + Postgres + RLS fuer iPad/iPhone-Sync.
- Kein eigener Server, keine Edge Functions, kein Realtime im MVP. Supabase Storage nur fuer private Spielerprofilfotos nach Foto-Erlaubnis.
- IndexedDB/Dexie fuer Offline-Cache und Offline-Queue.
- Fuehre mich bei Supabase Schritt fuer Schritt durch Dashboard, Projekt, URL, publishable key, `.env`, Auth und RLS. Sag mir genau, welche Seite ich oeffnen und welchen Wert ich wohin einfuegen muss. Niemals service-role Keys verlangen.
- Keine automatische Markdown-/PDF-Parser-Pipeline; statische Inhalte erstmal manuell als TypeScript/JSON strukturieren.
- Keine digitale Einwilligung; nur Consent-Status.
- Keine medizinische Freigabe durch die App.
- Startscreen ist das Heute-Dashboard, keine Landingpage.

Nach Sprint 1 bitte Build/Start pruefen und mir eine kurze Review geben, bevor du Sprint 2 beginnst.
```

## 9. Setup-Bewertung

Aktueller Zustand nach Setup: 9/10.

Warum:

- Fachlicher Kontext und Roadmap sind sehr gut vorbereitet.
- Die richtigen Plugins sind installiert.
- Browser/Vercel/Supabase/CodeRabbit/Security sind verfuegbar.
- Git ist initialisiert.
- `.gitignore` schuetzt lokale Build-Artefakte, Secrets und echte Daten im `data/`-Ordner.
- Der repo-lokale App-Skill ist angelegt und fuer neue Sessions auffindbar.
- Es gibt bewusst noch keine technische App-Struktur, weil die Implementierung erst in der naechsten Session starten soll.

Warum nicht 10/10:

- Der Skill wird erst in einer neuen Codex-Session automatisch in den Kontext aufgenommen.
- Noch kein erster Commit existiert; der Nutzer sollte vor einem Commit bewusst entscheiden, welche PDFs/Research-Dateien versioniert werden.
- Die App-Kommandos koennen erst nach Sprint 1 dokumentiert werden.
