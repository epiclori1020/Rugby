# UX-/Design-Roadmap-Prinzipien fuer Field Hub

Quelle: Nutzerentscheidung am 4. Juli 2026 nach erster UX-Research-Auswertung.

Diese Datei haelt verbindliche Leitplanken fuer die spaetere Roadmap fest. Sie ersetzt noch keine Sprintplanung. Nach dem zweiten Research zu Design, Branding und Design Kit wird daraus eine konkrete Umsetzungsroadmap abgeleitet.

## Verbindliche Produkt-Reihenfolge

Die App soll nicht nur optisch verbessert werden. Die Reihenfolge bleibt:

1. **Neue Informationsarchitektur planen und implementieren**
   - Top-Level: Heute, Einheit, Spieler, Analyse, Mehr.
   - Check-in, Training und Nachbereitung gehoeren logisch zu einer Einheit.
   - Bibliothek, Export und Einstellungen sind Verwaltung.
   - Ziel: groesstes Orientierungsproblem loesen.

2. **Einheit-Container bauen**
   - In Einheit: Subnavigation Check-in, Training, Nachbereitung.
   - Coach-Denke: vor dem Training, waehrend des Trainings, nach dem Training.
   - Ziel: weniger Kontextspruenge und ein klarer Session-Workflow.

3. **Check-in weiter verschlanken**
   - Roster zuerst.
   - Public-Link, Reset, alte Warnungen und technische Details in sekundaere Bereiche oder Sheets.
   - Ziel: Check-in in 1-2 Minuten feldtauglich machen.

4. **Nachbereitung zur echten Aufgabenqueue machen**
   - `MissingValuesPanel` ist der richtige Anfang.
   - Fehlende Pflichtwerte werden Hauptworkflow.
   - Optionale Dinge gehoeren darunter oder in Details.
   - Ziel: Nach dem Training fuehren, nicht alles gleichzeitig zeigen.

5. **Training live-fokussieren**
   - Aktueller Block ganz nach oben und sticky.
   - Spieleraktionen kontextuell.
   - Exposures und Mapping sekundaer.
   - Ziel: kein Dashboard-Lesen im Live-Coaching.

6. **Sync/Backup vereinheitlichen**
   - Kleine globale Statusleiste.
   - Details nur bei Bedarf.
   - Manuelle Sync-Logik behalten, weil Background Sync nicht verlaesslich genug ist.
   - Ziel: Vertrauen schaffen, ohne Screens technisch zu dominieren.

## Warum ein neues Design trotzdem Pflicht ist

Design Kit und Branding sind nicht Kosmetik. Sie sind Produktstruktur.

Ein gutes Design Kit soll helfen bei:

- **Vertrauen:** Die App wirkt reifer und externer nutzbar.
- **Native Feel:** iPad/iPhone fuehlen sich weniger nach Web-Dashboard an.
- **Klarheit:** Wiederkehrende Elemente sehen gleich aus und verhalten sich gleich.
- **Schnelligkeit:** Der Coach erkennt schneller, was Aktion, Status oder Warnung ist.
- **Skalierung:** Neue Features werden nicht jedes Mal neu oder anders gestaltet.
- **Externer Launch:** Branding macht die App glaubwuerdiger, nicht nur schoener.

## Design-Research- und Design-Kit-Pfad

Parallel zur IA-Arbeit soll ein eigener Designstrang entstehen:

1. **Benchmark/Moodboard**
   - 8-12 Referenzen aus S&C, AMS, iPadOS, Task-Apps, Health/Fitness.
   - Muster extrahieren, nicht kopieren.

2. **Brand-Richtung definieren**
   - Arbeitsrichtung: Rugby Performance Operations.
   - Ruhig, robust, sportlich.
   - Nicht verspielt, nicht enterprise-kalt, nicht marketingartig.

3. **Design Tokens**
   - Farben.
   - Typografie.
   - Spacing.
   - Radius.
   - Elevation.
   - Statusfarben.
   - Motion.

4. **Komponenten-Kit**
   - Buttons.
   - Segmented Controls.
   - Player Rows.
   - Status Chips.
   - Warning Cards.
   - Sheets.
   - Bottom Tabs.
   - Sidebar.
   - Task Queue.
   - Sync Badge.

## Wichtige Nutzerentscheidung: Design nicht nur lokal pilotieren

Nach Definition von Brand-Richtung, Tokens und Core Components soll das Design **Screen fuer Screen konsequent ausgerollt** werden.

Das bedeutet:

- Nicht nur drei Screens redesignen und den Rest im alten Stil lassen.
- Erst die Designrichtung an Kernflows validieren.
- Danach alle Hauptscreens systematisch umbauen:
  - Heute.
  - Einheit / Check-in.
  - Einheit / Training.
  - Einheit / Nachbereitung.
  - Spieler.
  - Analyse.
  - Mehr / Bibliothek / Export / Einstellungen.
  - Kiosk/Public Check-in.

Die spaetere Sprint-Roadmap soll diese Entscheidung beruecksichtigen.

## Neue Branding-Vorgaben vom 4. Juli 2026

- Die App soll ab sofort unter dem Arbeitsnamen **OnField** weitergedacht werden.
- iPhone ist nicht nur Nebenschauplatz. Die Roadmap muss iPhone explizit mitplanen:
  - **Funktionsparitaet mit iPad:** iPhone muss fachlich exakt dasselbe koennen wie iPad.
  - Unterschiede duerfen nur Layout, Navigationstiefe und Interaktionsdarstellung betreffen, nicht den Funktionsumfang.
  - sichtbare Bottom-Tab-Navigation.
  - stark reduzierte Ebenentiefe.
  - schnelle Check-in-/Kiosk-/Review-Flows.
  - keine reine iPad-Verkleinerung.
- Eine Marketing-/Hero-Optik soll bewusst integriert werden, wo sie sinnvoll ist:
  - externe Landingpage.
  - App-Store-/PWA-Install-Auftritt.
  - Login/Welcome/Onboarding.
  - leere Demo-/First-Run-Zustaende.
  - App-Icon, Splash, Share-Cards und Brand-Material.
- Im eigentlichen Live-Coaching darf Marketing-Optik nicht die Arbeit verdecken. Dort soll die Marke spuerbar sein, aber ueber Sprache, Tokens, Iconografie, Header, Statussystem und klare Komponenten statt ueber grosse Werbeflaechen.
- Eigene Schrift bleibt ausdruecklich moeglich fuer:
  - Logo.
  - App-Icon/Branding.
  - Landingpage/Marketing.
  - spaeter getestete Display-Headlines.
  - Der operative UI-Text bleibt zunaechst systemfont-basiert, bis eine Brand-Font auf Lesbarkeit und Feldtauglichkeit getestet ist.

## Marken- und Plattformarchitektur

Die Marke wird sportartenuebergreifend gedacht:

1. **OnField** als Hauptmarke.
2. **OnField Coach** fuer die aktuelle Coach-App.
3. **OnField Performance** als spaetere SaaS-/Produktplattform.
4. **OnField Rugby** als erste sportartspezifische Auspraegung.

Wichtige Konsequenz:

- Rugby ist die erste reale Konfiguration, aber nicht die Grenze des Produkts.
- Die spaetere Plattform soll fuer alle Sportarten anpassbar sein.
- Sportartenspezifische Inhalte, Begriffe, Positionen, Metrics, Session-Typen und Workflows sollen perspektivisch konfigurierbar werden.
- Kernkonzepte wie Spieler/Athlet, Einheit, Check-in, Training, Nachbereitung, Returner/Reconditioning, Load, Readiness, Testing, Analyse, Sync und Export bleiben sportartenuebergreifend.

## Roadmap-Konsequenz

Die finale Roadmap soll beide Straenge verbinden:

- **Struktur/IA-Stream:** Navigation, Einheit-Container, Workflow-Fuehrung.
- **Design-System-Stream:** Branding, Tokens, Komponenten, visuelle Sprache.

Umsetzung soll nicht als reine Lackierung erfolgen. Jede Design-Aenderung muss eine Workflow-Rolle haben: schneller, klarer, nativer, vertrauenswuerdiger oder weniger fehleranfaellig.

## Keine spaeteren Optionen abschneiden

Mehrere Punkte gelten als Sequenzierungsentscheidungen, nicht als dauerhafte Verbote.

- **UI-Libraries:** Eine grosse externe UI-Library soll nicht blind die Hauptloesung fuer den aktuellen Coach-MVP werden. Die Option fuer SaaS/App-Store bleibt offen. Zuerst muessen Brand, Tokens, IA und Kernkomponenten definiert werden. Danach kann bewusst geprueft werden, ob eine Headless-/Component-Library, eine SaaS-UI-Library oder spaeter native Komponenten in React Native/Flutter sinnvoll sind.
- **Brand-Font:** Keine eigene Brand-Font vor Launch bedeutet: Der operative UI-Text soll zuerst mit Systemfont laufen, weil Lesbarkeit, iOS-Naehe und Stabilitaet wichtiger sind. Eine eigene Schrift fuer Logo, App-Icon, Marketing, Landingpage oder spaeter ausgewaehlte Display-Elemente bleibt moeglich.
- **Leaderboards / Feed / Social Features:** Diese Features werden nicht als Teil des aktuellen Coach-Operations-Kerns umgesetzt. Fuer ein spaeteres SaaS-/App-Store-Produkt koennen Team-Engagement, Player Portal, PRs, Feeds oder Challenges als eigene Produktmodule geprueft werden. Sie duerfen aber nicht den Safety-, Returner- und Coach-Workflow verwässern.
