# Deep-Research-Analyse für Rugby S&C Field Hub

Quelle: vom Nutzer am 4. Juli 2026 bereitgestelltes GPT-Deep-Research-Ergebnis.

## Strategische Einordnung

**Executive Summary**

Der Kernfehler der App ist **nicht primär die Technik**, sondern die Kombination aus **überfrachteter Informationsarchitektur, zu card-lastiger Darstellung, zu wenig klarer Hierarchie und zu wenig plattformgerechter Navigation für iPad und iPhone**. Die vorhandenen Funktionen wirken auf den Screenshots nicht grundsätzlich falsch, aber sie sind aktuell **zu gleichwertig nebeneinander gestellt**. Dadurch entsteht ein „Web-Dashboard“-Eindruck statt eines ruhigen, feldtauglichen Coach-Tools.

Für deinen Kontext ist das besonders relevant, weil die App nicht für langes Explorieren gebaut werden muss, sondern für **schnelle, sichere Entscheidungen vor, während und nach einer Einheit**. Apple empfiehlt für Top-Level-Navigation klare Hauptbereiche, Sidebars für reichere Hierarchien auf iPad und Tab Bars für Top-Level-Navigation; zu viele gleichrangige Bereiche erschweren das Auffinden von Inhalten. Material und Androids Adaptive-Layout-Guidance betonen zusätzlich, dass Layout-Entscheidungen an der **Fensterbreite** statt am Gerätetyp hängen sollen. WCAG 2.2 verschärft außerdem Anforderungen an Zielgrößen, Fokusdarstellung und Bedienbarkeit. citeturn8search0turn0search1turn10search0turn0search5turn11search1turn11search3

Die gute Nachricht: **Der Großteil deiner aktuellen Probleme ist in der bestehenden React-/TypeScript-/PWA-Architektur lösbar**, ohne Rewrite. Was zuerst fehlt, sind ein belastbares Designsystem, klare Screen-Rollen, reduzierte Hauptnavigation, adaptive iPad-/iPhone-Layouts, bessere Priorisierung pro Screen und sauberes Offline-/Sync-Feedback. PWAs können installierbar, offline-fähig und app-artig sein; für Offline, Caching und lokale Datenspeicherung sind Service Worker und IndexedDB die passenden Web-Bausteine. Gleichzeitig solltest du auf iOS/iPadOS **nicht** auf vollautomatische Background-Sync-Mechaniken vertrauen, weil die entsprechenden APIs nicht Baseline sind und Safari hier eingeschränkt bleibt. citeturn1search7turn1search11turn7search0turn7search1turn7search10turn9search0turn9search1turn9search4turn9search18

**Trennung zwischen Fakten, Empfehlungen und Annahmen**

| Typ | Was darunter fällt | In diesem Report |
|---|---|---|
| Research-basierte Fakten | Plattformregeln, Accessibility-Mindestwerte, PWA-Verhalten, Adaptive-Layout-Prinzipien | Immer mit Quellen belegt |
| Daraus abgeleitete Empfehlungen | Konkrete Regeln für Rugby S&C Field Hub | Direkt an deinen Feld-Workflow gekoppelt |
| Zu validierende Annahmen | Dinge, die anhand der sichtbaren Screenshots plausibel, aber nicht vollständig beweisbar sind | Als Annahmen kenntlich gemacht |

**Wichtige Annahmen, die du noch validieren solltest**

Erstens: Die Screenshots zeigen nur den sichtbaren Viewport. Ich gehe deshalb **nicht** davon aus, dass nicht sichtbare Funktionen fehlen. Zweitens: Ich leite aus den sichtbaren Mustern ab, dass die App derzeit zu viele gleichwertige Panels, zu viele Karten und zu wenig rhythmische Priorisierung nutzt. Drittens: Ich nehme an, dass Arwin am Feld häufig unter Zeitdruck und mit geteiltem Fokus arbeitet und daher von **einer task-zentrierten „Einheit“-Navigation** mehr profitiert als von zehn gleichrangigen Tabs. Diese Punkte sollten mit 3–5 feldnahen Beobachtungssessions geprüft werden.

## Screenshot-Audit und Reifegrad

**Bewertung der aktuellen App anhand der Screenshots**

Skala: **1 = schwach**, **10 = sehr gut**

| Bereich | Bewertung | Begründung |
|---|---:|---|
| iPad-Nutzbarkeit | **6/10** | Die iPad-Screens zeigen bereits Ansätze für produktives Arbeiten: Sidebar, breite Arbeitsfläche, klare Primärinhalte. Gleichzeitig konkurrieren oft Sidebar, Content-Karten und rechte Warnspalte miteinander. Das kostet Fokus. |
| iPhone-Nutzbarkeit | **5/10** | Die mobile Darstellung ist lesbar und die Touch-Flächen wirken meist ausreichend groß. Aber Hamburger-Navigation, hohe vertikale Kartenstapel und wiederholte Intro-/Meta-Blöcke drücken die Arbeitsgeschwindigkeit. |
| Native Feel | **4/10** | Farbklima und Ruhe sind grundsätzlich da, aber die Screens fühlen sich eher wie ein sauberes Web-Admin-Tool als wie ein iPadOS-/iPhone-Tool an: viel Border/Card-Chrome, wenig klare Primärnavigation, wenig systemnahe Informationsdichte. |
| Informationsarchitektur | **4/10** | Die aktuellen Haupttabs mischen Job-to-be-done, Datenobjekte und Verwaltung. Live-Workflow, Analyse und Admin sind nicht sauber getrennt. |
| Visuelle Hierarchie | **4/10** | Zu viele Karten sehen ähnlich wichtig aus. Es gibt mehrfach gleich starke Container, Chips und Button-Reihen, wodurch die Blickführung zerfasert. |
| Touch-/Field-Use-Tauglichkeit | **6/10** | Große Buttons sind vorhanden, aber besonders in Training und Nachbereitung ist die Menge an gleichartigen Buttons/Chips hoch. Auf dem Feld zählt nicht nur Treffergröße, sondern auch Entscheidungsreduktion. |
| Externe-Launch-Reife | **4/10** | Funktional offenbar weit, aber in der Wahrnehmung noch zu provisorisch: zu viel System-Komplexität in der Primärfläche, unklare Einordnung von Bibliothek/Export/Einstellungen und zu wenig „Produktreife“ im Navigationsmodell. |

**Was in den Screenshots konkret gut wirkt**

Auf iPad ist die Grundrichtung schon brauchbar: linke Navigation, große Arbeitsfläche, deutliche CTA-Flächen, sachliche Farbwelt. Auf iPhone sind Typografie und Tap-Flächen grundsätzlich nicht miniaturisiert. Besonders positiv: Warnungen werden sprachlich vorsichtig formuliert, und du markierst bereits, dass keine automatische medizinische Freigabe vorliegt. Das ist in diesem Kontext product-seitig sehr wichtig.

**Was in den Screenshots aktuell die größte Unruhe erzeugt**

Die stärkste Unruhe kommt aus vier Mustern:

Erstens wirken viele Container formal ähnlich, obwohl sie funktional sehr unterschiedlich sind. Ein Session-Panel, ein Warnpanel, eine PDF-Kachel und eine Quick-Action-Kachel konkurrieren visuell zu stark.

Zweitens ist die Informationsdichte auf iPad an mehreren Stellen paradox: nicht wirklich kompakt, aber trotzdem kognitiv dicht. Beispielhaft dafür sind die Training-Spielerkarten mit mehreren Statuschips **plus** mehreren Aktionsbuttons **plus** Warnhinweis **plus** Eingabefeld.

Drittens ist die Mobile-Navigation zu stark versteckt. Ein Coach-Tool, das regelmäßig in denselben 3–5 Bereichen genutzt wird, profitiert auf dem iPhone fast immer mehr von sichtbarer Top-Level-Navigation als von einem Hamburger-Menü. Nielsen Norman Group beschreibt diese Grundspannung bei Mobile Navigation klar: Entweder sparst du Platz, oder du verbesserst Auffindbarkeit; in produktiven Tools ist Discoverability meist wichtiger. citeturn1search1turn8search13

Viertens ist besonders die Nachbereitung als wiederholte Kartenserie für einzelne Spieler zu langatmig. NN/g empfiehlt für komplexe Formulare und Workflows progressive disclosure, klare Struktur und die Reduktion unnötiger Sichtbarkeit. Genau das fehlt hier stellenweise. citeturn8search2turn8search18turn6search25

## Guardrails für Mobile und iPad

**Research-basierte Mobile-/iPad-Guardrails**

Die folgende Tabelle trennt bewusst zwischen Mindestwerten aus Standards und den für **Rugby S&C Field Hub** sinnvollen Produktwerten.

| Bereich | Konkrete Regel | Empfohlener Wert | Warum wichtig | Quelle | Anwendung auf Rugby S&C Field Hub |
|---|---|---|---|---|---|
| Touch Targets | Interaktive Ziele nie kleiner als Apple-Minimum | **mind. 44 × 44 pt / CSS px** | Apple nennt 44 pt als sinnvolle Mindestgröße; WCAG 2.2 fordert mindestens 24 × 24 CSS px, aber das ist eher Unterkante als Komfortwert. | Apple UI Design Dos and Don’ts, Buttons; WCAG 2.2 citeturn0search0turn0search7turn0search5 | Für Live-Aktionen, Chips, Segmentbuttons und Row-Actions nicht kleiner bauen. |
| Touch Targets im Feldmodus | Feldkritische Aktionen größer als das Minimum | **52–56 px Höhe** | Material empfiehlt 48 dp; im Outdoor-/Stresskontext ist „größer als Minimum“ robuster. | Material / Android Accessibility citeturn4search17turn4search1turn4search5 | Training starten, Check-in, E2-Entscheidung, Risiko-Aktionen größer als normale UI-Buttons. |
| Abstand zwischen Targets | Kleine Targets nur mit klarer Trennung | **mind. 8 px Zwischenraum** | WCAG erlaubt kleinere Targets nur mit genügend Abstand; Google empfiehlt 8 dp Separation. | WCAG 2.2; Android Accessibility Help citeturn0search2turn4search5 | Besonders wichtig bei dicht gesetzten Chips und numerischen 0–10 Auswahlfeldern. |
| Typografie | Text nicht unter Apple-Leseschwelle; Feldmodus bewusst größer | **Body 16–17 px; Meta 13–14 px; nie < 11 pt** | Apple nennt 11 pt als Mindestlesbarkeit; für schnellen Außeneinsatz ist größer sinnvoller. | Apple UI Design Dos and Don’ts citeturn0search0 | Labels, Namen, Status und Hilfetexte auf iPhone mindestens 16/13 statt zu feiner Dashboard-Typografie. |
| Kontrast | Text und Fokusindikatoren kontraststark halten | **4.5:1 Text, 3:1 große Schrift/Fokus** | WCAG AA. | W3C Contrast Minimum; Focus Appearance citeturn5search1turn5search8turn11search3 | Pastell-Chips und dünne Outline-States nur verwenden, wenn Text/Outline die Werte sicher erreichen. |
| Fokus sichtbar | Tastatur-/Pointer-Fokus visuell klar | **sichtbarer Fokusring, nicht verdeckt** | WCAG 2.2 verlangt sichtbaren Fokus und dass Fokus nicht verdeckt wird. | W3C Focus Visible, Focus Not Obscured, Focus Appearance citeturn11search1turn11search0turn11search3 | Relevant für iPad mit Hardware-Keyboard/Trackpad und für Accessibility. |
| Breakpoints | Layout nach Fensterbreite, nicht Gerätelabel | **compact < 600, medium 600–839, expanded ≥ 840** | Adaptive Layouts sollen von verfügbarer Fläche ausgehen. | Android Adaptive Apps / Window Size Classes citeturn10search0turn4search0turn4search2 | Deine PWA soll auf iPad Split View ebenso sinnvoll reagieren wie auf Vollbild. |
| Navigation iPhone | Tab Bar nur für Top-Level-Bereiche verwenden | **4–5 Hauptbereiche** | Apple: Tab Bars sind für Top-Level-Navigation, nicht für Aktionen; zu viele Tabs erschweren Auffinden. | Apple Tab Bars; SwiftUI tab navigation snippet citeturn8search0turn8search10 | Heute, Einheit, Spieler, Analyse, Mehr statt 10 Haupttabs oder Hamburger-only. |
| Navigation iPad | Sidebar für reichere Hierarchie nutzen | **Sidebar + Content, optional Detailpane** | Apple empfiehlt Sidebar für Bereiche/top-level collections; iPadOS verbindet Tab Bar und Sidebar ergonomisch. | Apple Sidebars; iPad tab bar and sidebar citeturn0search1turn2search3turn8search20 | iPad sollte Primärgerät bleiben: links Navigation, Mitte Arbeit, rechts optional Detail/Inspektor. |
| Subnavigation | Verwandte Unteransichten über Segmented Control statt eigene Haupttabs | **2–4 Segmente** | Segmented Controls sind für eng verwandte Subviews gedacht. | Apple Segmented Controls citeturn12search2turn12search10 | In „Einheit“: Check-in / Training / Nachbereitung als Subnavigation, nicht als gleichrangige globale Bereiche. |
| Formulare | Labels über Feldern; Pflicht klar kennzeichnen; Fehler direkt am Feld | **Top-aligned labels, Pflichtmarkierung, Inline-Fehler** | NN/g empfiehlt mobile Labels oberhalb, klare Gruppierung und deutliche Pflichtfelder. | NN/g Forms Usability; Required Fields; Errors in Forms citeturn1search0turn1search4turn6search9 | Check-in und Nachbereitung dürfen nicht wie ein endloses technisches Formular wirken. |
| Progressive Disclosure | Erweiterte/seltene Optionen erst sekundär zeigen | **Default: nur primäre Entscheidungen sichtbar** | Reduziert Komplexität und Fehleranfälligkeit. | NN/g Progressive Disclosure; Cognitive Load in Forms citeturn8search2turn8search6turn8search18turn6search25 | Returner-Details, Medical-Notizen, tiefe Limits, PDFs, Export nicht immer offen zeigen. |
| Listen statt Karten | Für wiederkehrende Datensätze zuerst Listenmuster verwenden | **Roster/List-First, Cards nur für Highlights** | Listen eignen sich zum Finden und Handeln; Karten sollen nicht jede Datenliste ersetzen. | Apple Lists and Tables; Material Lists citeturn12search3turn0search12turn0search20 | Spielerlisten und offene Aufgaben in kompakter Liste, nicht überall als große Cards. |
| Karten | Pro Screen nur wenige großformatige Karten mit klarer Aufgabe | **1 primäre Karte + max. 2 sekundäre Module oberhalb der Falz** | Zu viele gleichartige Cards schwächen Hierarchie. | Apple Layout; NN/g Visual Hierarchy; Material Cards citeturn8search16turn8search12turn0search6 | „Heute“ darf nicht gleichzeitig Dashboard, Dokumentenablage und Warn-Feed sein. |
| Sheets | Sekundäre Aufgaben modal, aber leicht rückkehrbar | **Sheet für Details, Kommentare, Zusatzoptionen** | Apple: Sheets sind für einfache Aufgaben vor Rückkehr zum Parent. | Apple Sheets citeturn12search1turn6search15 | Auf iPhone Spieler-Detail, Warnhistorie, Exportoptionen, Konfliktauflösung als Sheet. |
| Safe Areas | Notch/Home-Indicator immer berücksichtigen | **viewport-fit=cover + env(safe-area-inset-*)** | PWA-/iOS-Layouts müssen Safe Areas aktiv einrechnen. | MDN env(); MDN Using Environment Variables; web.dev Enhancements; WebKit iPhone X citeturn2search1turn2search5turn1search14turn2search8 | Sticky-Header, Bottom Bar und Floating CTAs dürfen nie am Home Indicator kleben. |
| Installierbarkeit | iOS-Install nicht nur über Custom Prompt planen | **eigener Install-Hinweis + Safari-spezifische Hilfe** | `beforeinstallprompt` ist nicht überall verfügbar; iOS-Installationspfad unterscheidet sich. | MDN beforeinstallprompt; MDN installable PWAs; web.dev installation prompt citeturn9search2turn9search3turn9search6 | Für externe Nutzer klare „Auf Homescreen hinzufügen“-Microcopy und visuelle Anleitung. |
| Offline | Offline nie in Browser-Fehlerseite enden lassen | **custom offline state + read/write queue** | web.dev PWA Checklist und Offline-Fallback empfehlen eine eigene Offline-Erfahrung. | web.dev PWA checklist; offline fallback; MDN service workers citeturn7search18turn7search2turn7search10 | Deine App braucht immer: „lokal gespeichert / ausstehend / retry“. |
| Datenspeicherung | Strukturierte Offline-Daten in IndexedDB | **IndexedDB für Datensätze, Cache API für Assets** | MDN nennt IndexedDB als geeignete API für bedeutende strukturierte Daten. | MDN IndexedDB; web.dev offline data citeturn7search1turn7search4 | Deine Dexie-Architektur ist richtig; sie braucht UX-Härtung, nicht Ersatz. |
| Hintergrund-Sync | Nicht auf Safari-Background-Sync verlassen | **manuelle Sync-Kontrolle behalten** | Background Sync ist nicht Baseline und Safari unterstützt die API nicht zuverlässig. | MDN Background Sync; Can I Use; Periodic Background Sync citeturn9search0turn9search1turn9search4turn9search18 | Behalte Pending Queue, Retry-Mechanismen und sichtbaren manuellen Sync. |
| Loading States | Layoutnahe Skeletons statt Vollbild-Spinner | **Skeleton ab ca. 300 ms** | Skeletons reduzieren wahrgenommene Wartezeit. | NN/g Skeleton Screens; Progress Indicators citeturn5search6turn5search9 | Spielerlisten, Aufgabenlisten und Session-Detailblöcke beim Laden skeletonisieren. |
| Responsiveness | Interaktionen müssen schnell sichtbar reagieren | **INP-Ziel < 200 ms** | INP misst wahrgenommene Reaktionsfähigkeit. | web.dev INP; MDN INP glossary citeturn5search0turn5search2turn5search7 | Auswahl von E2, Statuswechsel, Check-in und Player-Flags sofort lokal bestätigen. |
| Empty States | Leere Zustände nicht leer lassen | **1 Satz + 1 direkte nächste Aktion** | NN/g: Empty States sollen Systemstatus erklären, Lernen unterstützen und direkten Einstieg bieten. | NN/g Empty States; Apple Writing citeturn6search0turn6search2 | „Noch keine Returner aktiv“ mit CTA „Spieler als Returner markieren“. |
| Statusmeldungen | Dynamische Hinweise zugänglich ankündigen | **status/live regions für Sync/Save/Error** | ARIA Live und `status` helfen Screenreadern bei dynamischen Änderungen. | MDN aria-live; status role citeturn11search2turn11search7turn11search13 | „3 Einträge lokal gespeichert“ und „Sync fehlgeschlagen“ sollten semantisch angekündigt werden. |
| Disabled States | Wenn disabled, Grund immer sichtbar machen | **Nie stillschweigend deaktivieren** | NN/g warnt vor toten, nicht erklärten Disabled States. | NN/g Button States; Disabled buttons topic citeturn5search16turn5search20 | Statt grauem „Sync“-Button lieber „Kein Netz – wird lokal gespeichert“. |

**Konkrete Guardrails, die du direkt als Produktregeln übernehmen solltest**

Für dein Tool reichen nicht „best practices“ im Abstrakten. Du brauchst **entscheidbare Regeln**:

- Eine Fläche ist erst dann „Live-tauglich“, wenn sie mit einer Hand, im Stehen und mit unterbrochener Aufmerksamkeit bedienbar bleibt.
- Ein Screen darf oberhalb der Falz nur **eine dominante Handlung** haben.
- Wenn ein Screen mehr als **einen Primärstatus**, **mehr als zwei CTA-Typen** oder **mehr als drei Kartenebenen** gleichzeitig zeigt, ist er zu komplex.
- Wiederkehrende Spielerobjekte gehören standardmäßig in **Listen/Rows**, nicht in große Einzelkarten.
- Alles, was nicht im 60-Sekunden-Workflow vor, während oder nach einer Einheit benötigt wird, gehört sekundär in **Sheet, Drawer, Accordion oder „Mehr“**.

## Designsystem und Navigationsmodell

**Design-System-Grundgerüst**

Das Designsystem sollte nicht „schöner“ werden, sondern **ruhiger, systematischer und feldtauglicher**. Dafür brauchst du keine große visuelle Revolution, sondern konsistente Tokens und klare Oberflächenrollen.

### Farben

Behalte die sportlich-sachliche Richtung mit dunklem Grün und warmen Off-White-Surfaces, aber reduziere die Zahl der semantisch ähnlichen Tints.

**Empfohlene Rollen**

| Rolle | Empfehlung |
|---|---|
| Primary | Dunkles Team-Grün für Primäraktionen und aktive Navigation |
| Surface | Warmes Off-White / sehr helles Grau für Flächen |
| Surface Alt | Minimal dunkler für gruppierte Blöcke |
| Border | Ruhiges, entsättigtes Grau-Grün |
| Success | Klar getrenntes Grün für „ok / synchronisiert / grün“ |
| Warning | Ocker/Amber für Beobachtung, nicht Alarmrot |
| Danger | Gedämpftes Rot nur für Stop/Klären/akute Eskalation |
| Info | Blau nur für technische Information, nie für medizinische Aussage |

**Regel:** Status nie nur über Farbe kommunizieren. Immer **Icon + Text + Farbe** kombinieren. Das ist sowohl für Nutzbarkeit als auch für Accessibility wichtig. citeturn5search1turn6search4

### Typografie

Für dein Setting ist Typografie weniger Branding als Orientierung.

| Ebene | iPhone | iPad |
|---|---:|---:|
| Screen-Titel | 32/38 | 36/42 |
| Abschnittstitel | 22/28 | 24/30 |
| Kartenheadline | 20/26 | 22/28 |
| Body | 17/24 | 17/24 |
| Meta/Label | 13/18 | 14/19 |
| Mikrotext | 12/16 | 12/16 |

**Regel:** Keine funktional wichtigen Texte in Mikrotext. Spielername, E2, Ampel, Warnung und Session-Kontext niemals kleiner als Body/Meta.

### Spacing

Nutze ein striktes 4er-System.

| Token | Wert |
|---|---:|
| xs | 4 |
| sm | 8 |
| md | 12 |
| lg | 16 |
| xl | 24 |
| xxl | 32 |

**Produktregel:**  
iPhone horizontal padding **16 px**, iPad **24 px**, Expanded iPad-Content max. **1200–1360 px Content-Breite**, sonst wird die Fläche „leergezogen“ statt strukturiert.

### Radius, Border, Elevation

Dein aktueller Stil arbeitet stark mit Kontur und mildem Radius. Das ist gut, aber noch zu „boxy“.

| Element | Empfehlung |
|---|---|
| Buttons/Inputs | 12 px Radius |
| Cards/Panels | 16 px Radius |
| Pills/Chips | volle Rundung |
| Border | 1 px, leise |
| Shadow | nur 0–1 Stufe, fast unsichtbar |

**Regel:** Verwende **Surface-Unterschiede und Abstände** stärker als Schatten. Apple setzt stark auf Materialität und Ebenenbeziehung, aber nicht auf aggressive Web-Card-Schatten. citeturn12search9turn8search16

### Motion und Feedback

Motion soll in dieser App nicht verspielt sein, sondern **Sicherheit** vermitteln.

| Fall | Empfehlung |
|---|---|
| Tap / Selection | 120–160 ms |
| Sheet / Drawer | 180–240 ms |
| Screen transition | 200–280 ms |
| Save feedback | sofort visuell, Sync sekundär |

**Regel:** Keine langen Fade-Ins. Wichtiger ist, dass Zustandsänderungen direkt sichtbar sind und später synchronisiert werden. Das unterstützt das wahrgenommene Performancegefühl und INP-Zielwerte. citeturn5search0turn5search2

**Informationsarchitektur**

Die aktuelle Navigation ist für die Menge an Funktionen zu flach und zu ungruppiert. Sie vermischt:

- **workflow-basierte Schritte**: Check-in, Training, Nachbereitung
- **Objekte**: Spieler
- **Analyse**: Auswertung
- **Verwaltung**: Bibliothek, Export, Einstellungen
- **Sonderfall**: Returner

Das ist genau die Art von Mischung, bei der Tab Bars oder Sidebars semantisch verwässern. Apple betont, dass Tabs echte Top-Level-Bereiche abbilden sollen; Sidebars sind geeignet, wenn Hierarchie reicher wird. citeturn8search0turn0search1turn8search8

### Empfohlene iPad-Struktur

**Primärbereiche in der Sidebar**

- **Heute**
- **Einheit**
  - Vorbereitung
  - Check-in
  - Training
  - Nachbereitung
- **Spieler**
- **Analyse**
- **Mehr**
  - Returner
  - Bibliothek
  - Export & Backup
  - Einstellungen

**Begründung**

„Einheit“ ist in deinem Produkt der eigentliche Arbeitscontainer. Check-in, Training und Nachbereitung sind keine separaten Welten, sondern Zustände derselben Einheit. Auf iPad ergibt deshalb eine **workflow-zentrierte zweite Ebene** mehr Sinn als zehn globale Bereiche.

**Wichtige Produktentscheidung:**  
**Returner gehört nicht mehr als globaler Hauptbereich in die erste Reihe.** Returner ist wichtig, aber funktional ein Sondermodus innerhalb von Einheit **und** Spielerprofil. Er verdient eigene Ansichten, aber nicht die gleiche Prominenz wie der Kernworkflow.

### Empfohlene iPhone-Struktur

**Bottom Tab Bar**

- **Heute**
- **Einheit**
- **Spieler**
- **Analyse**
- **Mehr**

**In „Einheit“ als Subnavigation**

- Check-in
- Training
- Nachbereitung

**Returner**
- als Filtermodus in Check-in/Training
- plus eigener Bereich im Spielerprofil
- optional zusätzlich unter „Mehr“, falls häufig direkt angesteuert

**Warum diese Struktur besser ist**

Sie trennt:
- **Was jetzt ansteht** → Heute
- **Was ich jetzt tue** → Einheit
- **Mit wem ich arbeite** → Spieler
- **Was ich später auswerte** → Analyse
- **Was administrativ ist** → Mehr

Damit wird die App deutlich näher an Apple-/iPadOS-Navigation und an mobile Discoverability. Hamburger-only auf dem iPhone ist für ein wiederholt genutztes Produktivtool hier die schwächere Lösung. citeturn1search1turn8search13turn8search20

## Workflow- und View-Empfehlungen

Die folgenden Empfehlungen sind eine Synthese aus dem Screenshot-Audit und den oben genannten Plattform-/UX-Regeln. Bei den App-spezifischen Umbauten handelt es sich um **abgeleitete Empfehlungen**, nicht um wörtliche Vorgaben aus einzelnen Quellen. Die übergeordneten Prinzipien dafür sind jedoch klar durch Apple, WCAG, MDN, web.dev und NN/g gedeckt. citeturn0search1turn8search0turn8search2turn6search25turn7search18

**Empfehlungen pro View**

| View | Hauptproblem | Was bleiben soll | Was vereinfacht werden sollte | Was in Details/Sheet/Accordion gehört | Wichtigste Primäraktion | iPad-Layout-Idee | iPhone-Layout-Idee |
|---|---|---|---|---|---|---|---|
| Heute | Zu viel Dashboard-Charakter, mehrere konkurrierende Module | Session-Kontext, Ziele, Schnellzugriffe, Warnungen | PDFs, Warnfeed und Systeminfos entkoppeln; weniger Karten oberhalb der Falz | Warnhistorie, Quellen, Dokumentenliste, Backup-Details | **Einheit fortsetzen** oder **Check-in öffnen** je Status | 2-Spalten: links Session/CTA, rechts kompakte Tageshinweise | Hero-Card + 1 CTA + darunter kompakte Tagesliste |
| Spieler | Gefahr von Verwaltungs- statt Einsatzsicht | Spielerstamm, Verlauf, Consent, Status | Profil nicht mit zu vielen Adminfeldern starten | Consent-Historie, Medienfreigaben, Rohdaten, Export | **Spieler öffnen** / **Neuen Spieler anlegen** | List-Detail: links Liste, rechts Profil | Liste, Profil als Push oder Sheet |
| Check-in | Zu viele Chips/Karten, langsam scannbar | Suchfeld, Filter, Status, Ampel | Karten durch dichtere Roster-Ansicht ersetzen | Coach-Notiz, Schmerzort, Returner-Details, Vorwarnungs-Historie | **Spieler check-in abschließen** | Links Roster, rechts Detailpane des selektierten Spielers | Kompakte Liste; Tap öffnet Bottom Sheet |
| Training | Aktueller Block ist gut, aber Spieleraktionen sind visuell zu dicht | Aktuelle Phase, Grenzen, Quick Actions, Exposures | Nur kontextrelevante Spieleraktionen sichtbar; lange Beschreibungen einklappen | Voller Blockplan, Beobachtungsdetails, Exercise Mapping | **Blockstatus setzen** oder **Spieler limitieren** | Oben aktueller Block sticky; unten geteilte Ansicht Spielerliste + Detail | Sticky Current Block; Spieleraktionen als Sheet/Drawer |
| Nachbereitung | Wiederholte Pflichtkarten pro Spieler erzeugen Erschöpfung | Pflicht vs optional, sRPE, Post-Pain, E2 | Queue statt endlose Feed-Karten; Dauer nur einmal pro Session | Progression, Mini-Baseline, längere Notizen | **Nächsten offenen Punkt erfassen** | Links Aufgabenqueue, rechts Eingabepane | Wizard-/Queue-Modus: jeweils 1 Spieler/1 Aufgabe |
| Returner | Eigener Bereich hat derzeit Übergewicht | Limits, Symptome, nächste Entscheidung | Returner stärker in Live-Flow und Spielerprofil verankern | Kontakt-Notizen, Red-Flag-Liste, Detailhistorie | **Heutige Freigabe als Trainingshinweis setzen** | Kompakte Returner-Board-Ansicht mit Statusleiste | Filteransicht in Einheit + Deep Link ins Profil |
| Analyse | Gefahr, in Live-Flow hineinzuwachsen | Team-/Spieleranalyse, Zeitfilter, Links zu Rohdaten | KPI-Set klein halten, keine „Dashboard-Wand“ | Fortgeschrittene Filter, Export, Rohdatenansicht | **Zeitraum/Cluster filtern** | Desktopartige Analysefläche mit 2-Zonen-Layout | Nur Kerncharts/KPIs; tiefe Filter in Sheet |
| Bibliothek | Zu prominent für Primärnavigation | Backup-PDFs, Skripte, Mapping | Nicht als Hauptbereich in Live-Navigation | Dokumentenmetadaten, ältere Versionen | **Unterlage öffnen** | Sekundärbereich unter Mehr | Nur unter Mehr |
| Export | Zu technisch in der Hauptnavigation | JSON/CSV, letzter Export, Sync-Status | Nicht in Primärnavigation | Import-Vorschau, Konfliktdetails, Dateihistorie | **Export starten** | Admin-/Utility-Bereich | Unter Mehr, mit wenigen klaren Aktionen |
| Einstellungen | Sollte kein Arbeitsbereich sein | App-Settings, Datenschutz, Install-Hilfe | Sichtbarkeit reduzieren | Debug, erweiterte Sync-Infos, Entwickleroptionen | **Einstellungen speichern** | Unter Mehr | Unter Mehr |

**Empfohlene Hauptworkflows**

### Vor dem Training

„Heute“ sollte kein Sammelscreen sein, sondern ein **Operational Briefing**. Zeige nur:
- nächste/relevante Einheit
- 1 CTA zum Fortsetzen
- Material-/Dokumentenstatus in kompakter Form
- Anzahl offener Warnungen
- Anzahl offener Nachbereitungspunkte
- Netz-/Sync-Status als kleine technische Leiste

Was nicht auf die Startfläche gehört: volle Quellenlisten, lange Warnfeeds, mehrere gleich große Dokumentenkarten.

### Check-in

Die Check-in-Ansicht sollte von **„Karten entdecken“** zu **„Roster abarbeiten“** wechseln.

**Besseres Muster**
- Standardansicht: kompakte Spielerliste
- pro Zeile: Name, Position, Präsenz, Ampel, Returner-Status
- Tap auf Zeile öffnet Detail
- Quick Actions direkt in der Zeile nur für 1–2 häufige Aktionen
- alles Weitere im Detailpane / Sheet

Das reduziert Scrollhöhe, erhöht Scanbarkeit und macht alphabetische oder clusterbasierte Bearbeitung schneller.

### Live-Training

Der Trainingsscreen ist am nächsten am Kernprodukt. Genau deshalb muss er radikal priorisiert werden.

**Oben immer sticky**
- aktuelle Phase
- Fortschritt in Blockfolge
- relevante Limits/Warnungen in maximal 2 kompakten Badges
- 1 dominante Statusgruppe für den Block

**Darunter**
- Spielerliste mit Risikofokus
- Auswahl eines Spielers öffnet Aktionen
- nicht für jeden Spieler gleichzeitig 5 Maßnahmen-Buttons sichtbar

**Regel:** Spieleraktionen erst dann voll sichtbar machen, wenn der Coach bewusst einen Spieler fokussiert. Sonst wächst das UI in permanente Alarmbereitschaft.

### Nachbereitung

Die größte UX-Chance liegt hier. Statt einer langen Kette ähnlicher Pflichtkarten braucht die App eine **Aufgabenqueue**.

**Neues Modell**
- Session-Dauer oben einmalig
- darunter „Offene Pflichtaufgaben“
- sortiert nach: fehlend → auffällig → optional
- System führt durch offene Einträge
- pro Schritt nur ein klarer Task

So wird Nachbereitung zu einer geführten Abschlussroutine statt zu einem Spreadsheet in Kartenform.

### Returner

Returner sollte eine **funktionale Ebene**, keine eigene Welt sein. Drei Stellen reichen:
- im Spielerprofil
- als Filter/Detailmodus in Check-in
- als Limit-/Hinweis-Overlay in Training

Nur wenn du mehr als einige aktive Returner parallel steuerst, lohnt zusätzlich ein fokussiertes Returner-Board.

### Spielerprofil

Das Profil sollte nicht mit Stammdaten beginnen, sondern mit **arbeitsrelevanter Kurzsicht**:
- aktueller Status
- letzte Teilnahme
- aktuelle Limits
- Verlauf kurz
- offene Themen

Darunter erst Historie, Tests, Consent, Fotos, Langnotizen.

### Analyse

Analyse muss bewusst als **separater Modus** gehalten werden. Keine Analysecharts auf Live-Screens. Kein KPI-Wachstum im Training- oder Check-in-Screen. Analyse darf Querverweise bieten, aber nicht die Primärbedienung verstopfen.

### Export, Backup, Offline, Konflikte

Export und Sync gehören zusammen in **„Backup & Sync“** unter „Mehr“.  
Im Alltag braucht es keinen dauernd sichtbaren technischen Block pro Screen, sondern:

- kleine Statuszeile im Header/Footer
- Detailsheet bei Tap
- klare Formulierungen wie  
  - „Lokal gespeichert“  
  - „3 Änderungen ausstehend“  
  - „Zuletzt synchronisiert 16:24“  
  - „Konflikt bei 1 Datensatz – prüfen“

### Public-/Kiosk-Check-in

Der Public-/Kiosk-Flow sollte **eine eigene abgespeckte Route** bekommen, nicht bloß die normale Check-in-Ansicht mit weniger Elementen.  
Regel:
- minimale Navigation
- große Touch-Ziele
- ein linearer Schrittfluss
- keine Coach-Admininformationen
- klare Rückkehr in Coach-Modus

## Native Feel, Launch-Reife und Plattformstrategie

**Was ein gutes User Interface in diesem konkreten Field-Use-Kontext ausmacht**

Ein gutes UI für einen S&C-Coach am Feld ist nicht „visuell beeindruckend“, sondern erfüllt sechs Dinge gleichzeitig:

Es ist **sofort lesbar**, auch wenn jemand gerade zwischen Gespräch, Material, Spielern und Wetter wechselt.

Es ist **entscheidungsarm**: nicht möglichst viele Optionen sichtbar, sondern genau die nächsten zwei bis drei sinnvollen.

Es ist **handlungsorientiert**: Statuswechsel, Limits, Follow-ups und Rückkehr in den Flow sind schneller als Suchen und Editieren.

Es ist **robust gegen schlechte Konnektivität**: keine Unsicherheit darüber, ob Daten verloren sind.

Es ist **professionell zurückhaltend**: eher Team-Operations-Tool als Fitness-App oder Analytics-Spielplatz.

Und es ist **sprachlich vorsichtig**, besonders rund um Schmerzen, Red Flags und Returner. Hinweise ja, Diagnosen und Clearance nein.

**Native Feel Checkliste**

Die App fühlt sich nativ an, wenn …

- die Hauptnavigation pro Gerätetyp erwartbar ist: **Sidebar auf iPad, Tab Bar auf iPhone**. citeturn0search1turn8search0turn8search20
- der Screen-Aufbau nicht wie eine Website, sondern wie eine App-Arbeitsfläche wirkt: **weniger Card-Tapete, mehr klare Inhaltszonen**.
- Detailaufgaben als **Sheet/Pane** erscheinen und die Rückkehr zum Kontext leicht bleibt. citeturn12search1turn6search15
- Touch, Pointer und Tastatur auf iPad sinnvoll zusammenspielen. Apple beschreibt iPad-Pointer explizit als Ergänzung zu Touch, nicht als Ersatz. citeturn12search0turn12search22turn12search25
- Safe Areas, Status-Bar-Kontrast und Home-Indicator sauber behandelt sind. citeturn2search5turn1search14turn2search8
- Lade- und Speichervorgänge app-typisch wirken: kein Browser-Offline-Fehler, direkte lokale Bestätigung, späterer Sync. citeturn7search18turn7search10turn7search1
- Inhalte in Listen und Detailpaneele übergehen, statt ständig neue Seiten mit ähnlichen Karten zu öffnen.
- visuelle Zustände konsistent sind: aktiv, selektiert, gespeichert, ausstehend, Fehler. Material fordert konsistente State-Anwendung über Komponenten hinweg. citeturn6search4
- Texte knapp, direkt und operativ sind. Apple betont nützliche, kontextgerechte Sprache auch für Empty States und Systemtexte. citeturn6search2

**Externe-Launch-Checkliste**

Die App ist bereit für externe Nutzer, wenn …

- die Hauptnavigation auf **maximal 5 Top-Level-Bereiche** reduziert ist.
- „Einheit“ als gemeinsamer Container für Check-in, Training und Nachbereitung funktioniert.
- Bibliothek, Export und Einstellungen nicht mehr in der Hauptarbeitsnavigation liegen.
- jeder Screen genau **eine** dominante Primäraktion hat.
- Check-in und Nachbereitung nicht mehr als Card-Feeds, sondern als **Roster- bzw. Queue-Workflows** funktionieren.
- Offline/Pending/Sync als **kleine, verständliche Zustandslogik** sichtbar ist.
- der Public-/Kiosk-Check-in als eigener abgespeckter Flow existiert.
- Fehlermeldungen klar sagen, was passiert ist und wie weitergeht. NN/g empfiehlt genau diese Recoverability. citeturn6search6turn6search9
- Disabled States selten sind und immer begründet werden. citeturn5search16turn5search20
- Fokuszustände, Kontraste und Touch-Ziele systematisch geprüft sind. citeturn0search7turn0search5turn11search1turn11search3
- Install- und Safe-Area-Verhalten auf iPhone/iPad-PWA händisch getestet ist. `beforeinstallprompt` reicht auf iOS nicht als alleiniges Modell. citeturn9search2turn9search3turn9search6

**PWA vs. Native App**

### Was zuerst in der bestehenden PWA verbessert werden sollte

Zuerst verbessern solltest du:

- IA und Top-Level-Navigation
- adaptive Layouts für iPad/iPhone
- Roster-/Queue-Muster statt Card-Überladung
- Offline-/Sync-Kommunikation
- Install-Hinweise für iOS-PWA
- visuelle Zustände, Fokus/Accessibility und Safe Areas
- Performancegefühl bei Interaktionen

Das alles ist in deiner aktuellen Architektur sehr gut machbar. PWAs können installiert werden und, richtig gebaut, appähnlich wirken; Service Worker und IndexedDB sind dafür geradezu Standardbausteine. citeturn1search7turn1search11turn7search0turn7search1turn7search10

### Welche Probleme ein Rewrite nicht löst

Ein Rewrite zu Flutter oder React Native löst **nicht automatisch**:

- eine schlechte Informationsarchitektur
- unklare Verantwortlichkeiten pro Screen
- fehlende Hierarchie
- zu viele gleichzeitig sichtbare Entscheidungen
- ein überladenes Nachbereitungsmodell
- einen unklaren Unterschied zwischen Live-Flow und Analyse

Wenn das Produktmodell chaotisch ist, wird es nativ nur **nativ-chaotisch**.

### Wann Flutter oder React Native sinnvoll wäre

Ein nativer Schritt wird erst dann strategisch sauber, wenn mindestens einer dieser Fälle eintritt:

- du willst bewusst in App Store / MDM / institutionelle Verteilung
- du brauchst tiefe OS-Integration, die mit Web-APIs nicht stabil genug abbildbar ist
- du brauchst Hintergrundverhalten, auf das gerade iOS-PWAs schwer verlässlich setzen können
- du brauchst später erweiterte Hardware- oder Plattformfeatures, die produktkritisch werden

Relevant ist hier vor allem, dass Background Sync im Web nicht überall robust verfügbar ist und Safari/iOS Einschränkungen hat. Genau deshalb ist deine aktuelle manuelle Sync-Logik produktisch sinnvoll. citeturn9search0turn9search1turn9search4turn9search18

### Welche Qualität vorher erreicht sein sollte

Bevor du über Flutter oder React Native nachdenkst, sollte die App bereits diese Produktqualität erreichen:

- klare IA
- klarer Kernworkflow
- stabile Offline-/Sync-UX
- bewiesene Feldtauglichkeit
- sauberes Designsystem
- gute iPad-Primärnutzung
- gute iPhone-Zweitnutzung
- klare Rollen-/Rechte- und Externenlogik

Sonst investierst du in Technologie, bevor das Produktmodell wirklich sitzt.

## Priorisierte Roadmap und Coding-Regeln

**Priorisierte Roadmap**

| Priorität | Maßnahme | Warum | Erwarteter Effekt | Aufwand | Risiko | Akzeptanzkriterium |
|---|---|---|---|---|---|---|
| P0 | Top-Level-Navigation auf 5 Bereiche reduzieren | Aktuelle IA ist Hauptursache der Unruhe | Sofort besseres Verständnis und schnellere Nutzung | M | Mittel | iPhone: Heute, Einheit, Spieler, Analyse, Mehr; iPad analog gruppiert |
| P0 | „Einheit“ als Workflow-Container einführen | Check-in/Training/Nachbereitung gehören produktisch zusammen | Weniger Kontextsprünge | M | Mittel | Einheit kann Session auswählen und Status des Flows zeigen |
| P0 | Check-in von Karten zu Roster/List-Detail umbauen | Aktuelle Spielerkarten sind zu scan-lastig | Schnellere Feldbedienung | M | Niedrig | Coach kann 20 Spieler in < 2 Minuten sichten/öffnen |
| P0 | Nachbereitung in Aufgabenqueue umstellen | Derzeit längster kognitiver Schmerzpunkt | Weniger Ermüdung, höherer Completion-Count | L | Mittel | Offene Pflichtwerte werden priorisiert, optionales blockiert nicht |
| P0 | Bibliothek, Export, Einstellungen unter „Mehr“ verschieben | Admin darf den Live-Flow nicht überladen | Ruhigere Primärnavigation | S | Niedrig | Diese Bereiche sind aus Main-Tabs entfernt |
| P0 | Kompakte Offline-/Sync-Statusleiste definieren | Vertrauen in Datenhaltung ist kritisch | Weniger technische Unruhe, mehr Sicherheit | M | Niedrig | Jeder Screen zeigt denselben kompakten Statusmechanismus |
| P1 | Design Tokens für Spacing, Typo, Radius, State Colors | Ohne System bleibt jede View einzeln gebaut | Konsistenz und höhere Reife | M | Niedrig | Alle Hauptscreens nutzen gemeinsames Token-Set |
| P1 | Sichtbare iPhone-Tab-Bar statt Hamburger-only | Discoverability und Geschwindigkeit steigen | Besseres Mobile-Feeling | M | Mittel | iPhone hat persistente Bottom Navigation |
| P1 | Training auf „Current Block + Player Drawer“ umbauen | Aktuell zu viele gleichzeitige Aktionen | Schnelleres Live-Coaching | L | Mittel | Spieleraktionen erscheinen kontextuell statt permanent |
| P1 | Warnungen priorisieren und aggregieren | Warnfeed ist visuell zu dominant | Weniger Alarmmüdigkeit | M | Niedrig | Warnungen nach kritisch/offen/zuletzt gruppiert |
| P1 | Empty, Loading, Error, Disabled States systematisch bauen | Reifegrad entsteht an den Kantenfällen | Weniger Prototyp-Eindruck | M | Niedrig | Jeder Hauptscreen hat definierte Zustände |
| P2 | iPad List-Detail- und Supporting-Pane-Muster ausbauen | iPad ist Primärgerät | Klarere nativen Arbeitsfläche | L | Mittel | iPad nutzt Sidebar + Content + optional Detail konsistent |
| P2 | Pointer-/Keyboard-Feinschliff für iPad | Steigert Professionalität auf iPad | Höherer Native Feel | M | Niedrig | Fokus, Tastaturkürzel, Trackpad-Nutzung getestet |
| P2 | PWA-Hardening für iOS: Safe Areas, Install-Hilfe, Standalone-Polish | Externe Nutzer brauchen robuste Installation | Reiferes PWA-Erlebnis | M | Mittel | Install-Hinweis, Safe-Area-Abstände und Home-Screen-Flow dokumentiert |
| P2 | Content-Redesign „Heute“ | Startscreen bestimmt Produktwahrnehmung | Ruhigerer erster Eindruck | M | Niedrig | „Heute“ zeigt nur operational relevante Module |
| P3 | Rollenmodell für weitere Coaches/Physio vorbereiten | Externe Öffnung braucht Rollenklarheit | Saubere Skalierung | M | Mittel | Rechte-/Sichtbarkeitskonzept dokumentiert |
| P3 | Native-App-Entscheidung nach echter Nutzungsmessung treffen | Technologie erst nach Produktfit | Besserer Investitionszeitpunkt | S | Niedrig | Entscheidung basiert auf klaren Kriterien, nicht Gefühl |
| P3 | App-Store-/Native-Vorbereitung | Erst sinnvoll nach Produktreife | Sauberer nächster Schritt | L | Mittel | PWA erfüllt vorher definierte Qualitätskriterien |

**Codex-/Claude-ready Guardrails**

Die folgende Liste ist absichtlich knapp, konkret und überprüfbar formuliert.

- Alle interaktiven Ziele müssen mindestens **44 × 44 px** groß sein; feldkritische Ziele standardmäßig **52–56 px** hoch.
- Zwischen kleinen interaktiven Zielen müssen mindestens **8 px Abstand** liegen.
- Die App verwendet adaptive Layouts nach Fensterbreite: **compact < 600 px**, **medium 600–839 px**, **expanded ≥ 840 px**.
- iPhone verwendet eine sichtbare **Bottom Tab Bar** mit maximal **5 Top-Level-Bereichen**.
- iPad verwendet eine **Sidebar** für Hauptbereiche und mindestens eine separate Content-Fläche.
- Die globale Navigation enthält nur: **Heute, Einheit, Spieler, Analyse, Mehr**.
- **Check-in, Training und Nachbereitung** sind Unterbereiche von **Einheit**, keine eigenständigen globalen Hauptbereiche.
- **Bibliothek, Export/Backup und Einstellungen** dürfen nicht in der primären Live-Navigation liegen.
- **Returner** ist standardmäßig ein Modus innerhalb von **Einheit** und **Spielerprofil**, nicht primär ein globaler Haupttab.
- Jeder Screen hat oberhalb der Falz genau **eine dominante Primäraktion**.
- Kein Screen zeigt oberhalb der Falz mehr als **eine primäre Karte** und **zwei sekundäre Module**.
- Wiederkehrende Spielerobjekte werden standardmäßig als **Liste/Row** dargestellt; große Cards sind nur für Highlights oder ausgewählte Details erlaubt.
- Mobile Formulare verwenden **Labels oberhalb** der Eingabefelder.
- Pflichtfelder werden eindeutig markiert; Fehler erscheinen **inline am Feld** mit konkreter Korrekturhilfe.
- **Progressive Disclosure** ist Standard: seltene oder erweiterte Optionen gehören in Sheet, Drawer, Accordion oder Sekundärscreen.
- **Live-Coaching-Screens zeigen keine Analysecharts**.
- Lange Dokumentenlisten, Warnhistorien und technische Logs gehören nicht in die Standardansicht eines Arbeitsflows.
- Offline-/Sync-Status muss auf jedem Screen sichtbar, aber nicht dominant sein: **lokal gespeichert / ausstehend / zuletzt synchronisiert / Konflikt**.
- Die App darf niemals die Standard-Browser-Offline-Seite zeigen; es muss immer ein eigener Offline-Zustand vorhanden sein.
- Zustandsänderungen werden **optimistisch lokal bestätigt**; Remote-Sync ist nachgelagert.
- Background Sync auf iOS/Safari wird **nicht** vorausgesetzt; die App behält eine sichtbare Pending-Queue und einen manuellen Retry.
- Alle dynamischen Save-/Sync-/Fehlermeldungen werden für Assistive Technologies über geeignete Status-/Live-Regionen angekündigt.
- Textkontrast muss mindestens **4.5:1** erfüllen; große Schrift und Fokusindikatoren mindestens **3:1**.
- Safe Areas müssen über `viewport-fit=cover` und `env(safe-area-inset-*)` berücksichtigt werden.
- Bottom Bars und Floating Actions dürfen nie am iPhone-Home-Indicator kleben.
- Der Kiosk-/Public-Check-in ist eine **eigene Route** mit minimaler Navigation und ohne Coach-Admininhalte.
- Medizinische Aussagen müssen immer als **Hinweis** formuliert sein, niemals als Diagnose oder Return-to-Play-Freigabe.
- „D/Rot“ oder vergleichbare Zustände dürfen sprachlich nie wie eine medizinische Freigabe wirken.
- Install-Hinweise für iOS dürfen sich nicht auf `beforeinstallprompt` verlassen; es muss eine Safari-kompatible Anleitung geben.
- Wenn ein Button disabled ist, muss der Grund sichtbar erklärt werden; unsichtbar deaktivierte Primäraktionen sind unzulässig.
- Für Ladezustände über ca. **300 ms** sind **Skeletons** statt Vollbild-Spinner zu verwenden.
- Zielwert für wahrgenommene Reaktionsfähigkeit: **INP < 200 ms** bei den wichtigsten Interaktionen.

**Quellen mit URLs**

Die wichtigsten Primärquellen für diese Analyse sind Apple HIG, W3C/WCAG, Material/Android, MDN, web.dev und Nielsen Norman Group. Die Empfehlungen oben stützen sich vor allem auf diese Quellen. citeturn0search0turn0search1turn0search5turn10search0turn7search0turn5search0turn1search0turn6search0

```text
Apple Human Interface Guidelines
https://developer.apple.com/design/human-interface-guidelines
https://developer.apple.com/design/tips/
https://developer.apple.com/design/human-interface-guidelines/tab-bars
https://developer.apple.com/design/human-interface-guidelines/sidebars
https://developer.apple.com/design/human-interface-guidelines/buttons
https://developer.apple.com/design/human-interface-guidelines/segmented-controls
https://developer.apple.com/design/human-interface-guidelines/lists-and-tables
https://developer.apple.com/design/human-interface-guidelines/sheets
https://developer.apple.com/design/human-interface-guidelines/pointing-devices

Apple iPad navigation references
https://developer.apple.com/documentation/uikit/elevating-your-ipad-app-with-a-tab-bar-and-sidebar
https://developer.apple.com/videos/play/wwdc2024/10147/

WCAG / W3C
https://www.w3.org/TR/WCAG22/
https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html

Material / Android Adaptive Design
https://m3.material.io/
https://developer.android.com/develop/adaptive-apps/guides/use-window-size-classes
https://developer.android.com/guide/topics/ui/accessibility/apps

MDN / Web Platform
https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation
https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Environment_variables/Using
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env
https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live
https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role

web.dev
https://web.dev/learn/pwa/progressive-web-apps
https://web.dev/learn/pwa/enhancements
https://web.dev/articles/pwa-checklist
https://web.dev/articles/offline-fallback-page
https://web.dev/articles/inp
https://web.dev/explore/how-to-optimize-inp

Nielsen Norman Group
https://www.nngroup.com/articles/web-form-design/
https://www.nngroup.com/articles/required-fields/
https://www.nngroup.com/articles/errors-forms-design-guidelines/
https://www.nngroup.com/articles/mobile-navigation-patterns/
https://www.nngroup.com/articles/progressive-disclosure/
https://www.nngroup.com/articles/button-states-communicate-interaction/
https://www.nngroup.com/articles/empty-state-interface-design/
https://www.nngroup.com/articles/skeleton-screens/
https://www.nngroup.com/articles/visual-hierarchy-ux-definition/
https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/
```
