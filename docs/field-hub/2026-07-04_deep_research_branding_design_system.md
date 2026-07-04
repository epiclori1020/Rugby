# Deep-Research-Analyse für das Branding und Designsystem von Rugby S&C Field Hub

Quelle: vom Nutzer am 4. Juli 2026 bereitgestelltes GPT-Deep-Research-Ergebnis.

## Diagnose und Referenzen

**Leselogik dieser Analyse.**  
**Öffentlich belegbare Beobachtung** bedeutet: direkt aus offiziellen Produktseiten, App-Store-Einträgen, Help-Centern oder Richtlinien ableitbar. **Empfehlung** bedeutet: daraus für *Rugby S&C Field Hub* abgeleitet. **Zu prüfen** bedeutet: Hypothese, die du mit Screenshots, Clickdummies oder Feldtests validieren solltest. Wo Produkte hinter Login liegen, beziehe ich mich bewusst nur auf öffentlich sichtbare Informationen, Hilfedokumentation und offizielle Beschreibungen. citeturn4search1turn8view7turn24view3

**Executive Summary.**  
Die passende Hauptrichtung für *Rugby S&C Field Hub* ist **kein generisches Dashboard**, sondern eine **ruhige, native iPadOS-Performance-Konsole mit Field-Operations-DNA**. Die stärksten Benchmarks zeigen drei Dinge zugleich: Coach-Tools im Sport werden besser, wenn sie auf **tägliche Entscheidungen**, **sichtbare Statuslagen** und **wenig UI-Lärm** optimiert sind; Konsumenten-Health-Apps sind stark darin, komplexe Daten in **verständliche Tages-Signale und Trends** zu übersetzen; moderne Produktivitätsprodukte wie Linear und Things reduzieren visuelle Unruhe, erhöhen Hierarchie und verstecken Detailtiefe, bis sie wirklich gebraucht wird. Für deine App heißt das konkret: **List-first statt card wall, Session-first statt Bereichs-Silo, Ampel nur als sekundäre Abstraktion mit Begründung, Analyse klar getrennt vom Live-Flow, iPad-Sidebar plus dichter Coach-Arbeitsfläche, iPhone mit klarer Bottom-Tab-Bar und stark reduzierter Ebenentiefe.** Diese Richtung ist deutlich näher an BridgeAthletic, TeamBuildr Practice, Kitman-Labs-Statuslogik, Apple-Fitness-/Health-Zusammenfassungen, WHOOP/Oura-Readiness-Modellen, Linear-Hierarchie und Things-Task-Struktur als an klassischen SaaS-Admin-Dashboards. citeturn15view1turn15view0turn24view3turn18view0turn18view2turn15view10turn19view1turn20view1turn22view0

**Benchmark-Analyse.**

| Produkt / App | Kategorie | Zielgruppe und öffentlich belegbare Beobachtung | Relevante Patterns für Rugby S&C Field Hub | Was wir lernen können | Was wir nicht übernehmen sollten | Relevanz |
|---|---|---|---|---|---|---|
| TeamBuildr | S&C / Workout Delivery | Mobile Strength-App für Coaches und Athlet:innen; nennt Workout-Delivery, 1RM-Tracking, Fortschrittsgrafen, Wearable Scores, Feed, Leaderboards, Messaging und Video Coaching. citeturn7view0turn11image1 | Session-Review mit Kernmetriken, Progression über Zeit, klare Coach/Athlete-Abgrenzung | Metriken nur dort zeigen, wo sie direkt eine Coaching-Entscheidung stützen | Feed, PR-Posts, Leaderboards und Social-Layer würden deinen Coach-Flow verwässern | 8/10 |
| TeamBuildr Practice | Practice Planning | App explizit für das Planen und Managen von Team-Trainings, inklusive Sessions, Drills und Tracking des Fortschritts. citeturn15view0turn13search5 | Session-Timeline, Drill-/Block-Organisation, coach-zentrierter Praxisfluss | *Einheit* als echtes Arbeitsobjekt denken, nicht nur als Menüpunkt | Zu drill-lastig werden; deine App ist kein vollständiger Practice-Planner | 10/10 |
| BridgeAthletic | S&C / Tablet Coach Tool | Offizielle App-Store-Beschreibung sagt ausdrücklich, dass Coaches Athlet:innen **nur auf dem Tablet** managen, Programme bauen und Workouts abschließen können; Release Notes nennen **anpassbare Blockfarben auf dem Tablet** zur besseren Sichtbarkeit und Organisation. citeturn13search3turn15view1 | Tablet-first Coach-Flächen, farbcodierte Sessionblöcke, gute Sichtbarkeit im Training | Dein iPad muss eine eigene Informationsdichte und Interaktionslogik bekommen, nicht nur „größeres Mobile“ sein | Purple-Marketing-Ästhetik und Weight-Room-Mentalmodell 1:1 übernehmen | 9/10 |
| CoachMePlus | Human Performance / AMS | Positioniert sich als „Keeping Coaches and Athletes Connected“, nennt Coaching Toolkit, Workout Builder, Dashboards, Wellness Questionnaires, Testing und Scheduling; betont Kommunikation und anwendungsnahe Datennutzung für Coaches. citeturn24view0turn24view1 | Wellness-Fragen, Testing, Scheduling, Coach-Kontext statt nur Datensammeln | Formulare, Testwerte und Kommunikation müssen im Produkt klar zusammenpassen | Zu schwere AMS-/Enterprise-Anmutung, zu viele Dashboard-Module gleichzeitig | 7/10 |
| Teamworks AMS / Smartabase | AMS / Performance + Medical | Zielt auf integrierte Performance-Teams, zentralisiert Gesundheits-, Medizin- und Performance-Daten und betont eine „360° View of Athletes“ mit Integrationen und Visualisierung von Metriken. citeturn7view2 | Holistische Spieleransicht, digitale Forms, Datenzusammenführung | Für spätere Mehrrollenfähigkeit wichtig: Spielerstatus, Formulare, Verlauf an einer Stelle bündeln | Die klinische und enterprise-lastige Wirkung ist für dein Coach-Tool zu schwer | 7/10 |
| Kitman Labs | Intelligence Platform / Talent Development | Beschreibt sich als „born from the field“, betont unified view statt Datensilos; öffentlich dokumentiert Daily Player Status, mobile/web/kiosk Forms, Coach-App mit Alerts, Participation Management und Group Reporting. citeturn24view2turn24view3 | Daily status, Kiosk, Participation-Logik, Staff-Alerts, Gruppenauswertungen | Sehr passend für Check-in, Returner, Public/Kiosk und später Multi-Staff-Nutzung | Nicht in Plattform-Komplexität, „all-in-one intelligence“-Schwere oder Medical-Nähe abrutschen | 9/10 |
| FYTT | S&C Automation | FYTT verspricht Zeitgewinn für Coaches, Excel-artige Programmierung, automatisierte Regeln und threshold-basierte Zuweisung von Athlet:innen in Trainingspfade. citeturn7view3turn1search9 | Regelbasierte Coach-Logik, Individualisierung, Routing nach Status | Deine Ampel- und Variantenlogik sollte als klare Coach-Regel wirken, nicht als undurchsichtiger Algorithmus | Spreadsheet-Charakter im Live-Use; das darf im Feld nicht nach Excel aussehen | 8/10 |
| Hudl / Sportscode | Video / Performance Analysis | Hudl und Sportscode betonen Video-Review, Notizen, Live-Breakdown und intuitive Workflows; die iOS-App nennt sogar Live-Breakdown und Statting direkt am Gerät. citeturn13search1turn15view2 | Strikte Trennung zwischen Live-Capture und tiefer Analyse | Analyse darf mächtig sein, aber nie den Feldmodus dominieren | Video-/Scout-Komplexität oder Multifunktions-Überladung im Live-Screen | 8/10 |
| Apple Health / Apple Fitness | Health / Summary + Trends | Health nennt ein zentrales, sicheres Daten-Hub, interaktive Charts, Highlights und Trendanalyse; Fitness nennt personalisierbare Summary, Training Load, Trends und Live-Metriken. citeturn18view0turn18view2turn18view3turn18view4 | Highlights statt Datenwände, Trends als Drill-down, personalisierbare Zusammenfassung | *Heute* sollte eher wie eine priorisierte Zusammenfassung wirken als wie ein Dashboard-Friedhof | Consumer-Wellness oder implizit medizinische Deutung | 9/10 |
| WHOOP | Readiness / Recovery | WHOOP gibt eine tägliche Recovery als Prozentwert und kategorisiert sie in Grün, Gelb oder Rot; dazu kommt die Koppelung an tägliche Belastbarkeit. citeturn15view10turn19view4 | Einfache Readiness-Abstraktion, klare Tageslesbarkeit | Ampel funktioniert nur dann, wenn sie Richtung gibt und nicht die einzige Information bleibt | Die App darf nicht so tun, als gäbe sie objektive Freigaben | 9/10 |
| Oura | Readiness / Trends | Oura gruppiert Karten nach Bereichen wie Readiness, Sleep, Activity und Stress; Trends zeigen leicht lesbare Grafiken mit Tages-, Wochen-, Monats- und Jahresansicht und Gegenüberstellung von aktuellem Wert und Durchschnitt. citeturn7view4turn19view0turn19view1turn19view2 | Bereichslogik, Verlaufsebenen, „heute“ vs. „Trend“ sauber getrennt | Spielerprofile und Analyse profitieren von kleinen Trendmodulen statt Full-BI | Zu viele Wellness-Kategorien und zu weiche Consumer-Anmutung | 8/10 |
| Garmin Connect | Health / Training Dashboard | Garmin beschreibt „Your day at a glance“, frei anordbare Inhalte, tiefergehende Analyse sowie Wochen-, Monats- und Jahresdurchschnitte. citeturn17view0 | Reorderbare Analyse-Module, Tagesüberblick plus längere Zeiträume | Analyse kann modularer und coach-fokussierter werden | Zu viele Sekundärmetriken im Live-Flow | 7/10 |
| TrainingPeaks | Planning / Trends / Load | TrainingPeaks spricht von „metrics that actually make sense“, Stacked Charts und klaren Trends; das mobile Update nennt „at-a-glance insight“ für Fitness, Form und Fatigue. citeturn15view5turn15view6 | Vorher/Nachher-Story, Verlauf statt isolierter Zahl, Load-Kontext | Analysekarten sollten immer Frage beantworten: „Was ist der nächste Coaching-Schritt?“ | Endurance-lastige Fachlogik oder zu hoher Chart-Anteil | 7/10 |
| Linear | Produktivitäts-UI / Design System | Linear reduzierte bewusst visuelles Rauschen, verbesserte Alignment, Hierarchie und Dichte der Navigation; es testete Sidebar, Tabs, Header und Panels mit Browser-/Native-Fit und arbeitet token-basiert an Farbe und Kontrast. citeturn20view1turn20view3turn20view5 | Low-noise shell, saubere vertikale/horizontale Ausrichtung, tokenisierte Farbsteuerung | Genau die richtige Referenz für dein „ruhig, professionell, nicht steril“ | Zu desktopig oder zu abstrakt werden; dein Produkt braucht stärkere Feldtauglichkeit | 10/10 |
| Things | Aufgaben / Tagesfokus | Things beschreibt To-dos als klare, ablenkungsarme Objekte; Details sind tuck-away; „Today“ gruppiert Kalenderevents oben und Aufgaben darunter; Headings strukturieren Projekte visuell sauber. citeturn22view0 | *Heute* als Tagesarbeitsliste, Headings, progressive disclosure, Drag-and-Drop-Platzierung | Sehr gutes Vorbild für coach-zentrierte Tagesstruktur und Detail-Sheets | Zu sanft oder lifestyleig werden; dein Produkt braucht mehr operative Schärfe | 9/10 |
| Todoist | Task / Cross-device | Todoist betont „professional power, no overhead“, List/Board/Calendar-Wechsel, Labels, Prioritäten sowie leichtgewichtige Navigation mit Favorites. citeturn22view1turn22view2 | Gespeicherte Filter, Favoriten, leichte Mehrgeräte-Synchronität | Für Analyse-Filter und *Mehr*-Bereich sehr brauchbar | Board-/PM-Semantik darf deinen Coach-Use-Case nicht übernehmen | 7/10 |
| Notion / Arc | Ruhige App Shell | Notion wirbt mobil mit „work without distractions“, Arc mit „clean and calm“, Spaces, Profiles und Split View. citeturn7view7turn7view8 | Ruhe, Fokus, wenige dominante UI-Linien | Nützlich als Shell- und Tonalitäts-Referenz | Nicht dokumentenzentriert oder browserartig werden | 6/10 |

**Öffentlich belegbare Muster, die sich quer durch die Benchmarks ziehen.**  
Erstens: Die besten Systeme machen **den heutigen Zustand** sofort lesbar, statt alles gleichrangig anzuzeigen. Apple Health/Fitness, WHOOP, Oura und Garmin arbeiten mit Highlights, Tageswerten und Trends als zweiter Ebene. Zweitens: Operative Tools trennen **Live-Entscheidung** und **Analyse-Raum**. Hudl/Sportscode und TrainingPeaks zeigen genau diese Logik. Drittens: Gute komplexe Produkte reduzieren die sichtbare UI-Struktur auf einige wenige verlässliche Anker — Sidebar, Tabs, Header, Panels, Listen — statt dutzender Kartentypen. Linear und Things sind dafür die stärksten Referenzen. citeturn18view0turn18view2turn15view10turn19view1turn17view0turn15view6turn15view2turn20view1turn22view0

**Empfehlung.**  
Für *Rugby S&C Field Hub* sind die **primären Referenzen**: **Linear** für visuelle Disziplin und Hierarchie, **Things** für Today-/List-/Detail-Logik, **BridgeAthletic** und **TeamBuildr Practice** für die Coach-/Session-Perspektive auf Tablet, **WHOOP/Oura** für Status- und Trend-Abstraktion und **Kitman Labs** für Player-Status, Kiosk und Staff-Readiness-Modelle. Apple Health/Fitness ist kein Stilvorbild für Branding, aber ein sehr gutes Vorbild für ruhige Zusammenfassung, Trend-Drilldown und das Verhältnis zwischen Highlight und Detail. citeturn20view1turn22view0turn15view1turn15view0turn15view10turn19view1turn24view3turn18view0turn18view2

**Zu prüfen.**

| Hypothese | Warum sie wichtig ist | Wie du sie prüfen solltest |
|---|---|---|
| Ein dichter List-first-Check-in ist schneller als Card-basierte Player-Kacheln | Deine aktuelle App leidet laut Kontext unter zu vielen gleichartigen Karten | 2 Clickdummies gegeneinander testen: 12-Spieler-Check-in als Kartenwand vs. List+Detail |
| Coaches brauchen im Training mehr Sofortaktionen pro Spieler als mehr Metriken | Live-Flow ist dein Kernwert | Feldtest mit 2 Trainings: Anzahl der tatsächlich genutzten Actions vs. aufgerufenen Detailinformationen |
| Die Ampel wird nur akzeptiert, wenn darunter sofort die Gründe sichtbar sind | WHOOP/Oura abstrahieren stark; dein Use-Case braucht aber coachbare Begründung | Usability-Test: „Warum ist dieser Spieler heute gelb?“ muss in <2 Sekunden beantwortbar sein |
| Ein heller, kontrastreicher Light Mode ist auf dem Feld wichtiger als Dark Mode zum Start | Outdoor-/iPad-Nutzung priorisiert Lesbarkeit | On-field-Sichttest bei Sonne, Schatten und Abendlicht |
| Kiosk/Public Check-in braucht eine eigene UI und darf nie wie der Coach-Modus aussehen | Öffentliche Nutzung hat andere Privatsphäre- und Berührungsanforderungen | Test mit nicht eingewiesenen Spielern: Zeit bis erster erfolgreicher Check-in |
| Analyse auf dem iPhone muss stark gekürzt werden | Trend-Visualisierung ist nützlich, aber nicht live-kritisch | 5-Minuten-Test: Welche Analysefragen werden mobil tatsächlich gestellt? |

## Positionierung und Marke

**Design-Territorien.**

| Territorium | Kurzbeschreibung | Brand-Persönlichkeit | Farbwelt | Typografiegefühl | Komponentenstil | Vorteile | Risiken | Eignung |
|---|---|---|---|---|---|---|---|
| **iPadOS Performance Console** | Ruhiges, präzises Coach-Tool mit nativer iPad-Struktur, minimalem Chrome und hoher Informationsklarheit | souverän, konzentriert, vertrauenswürdig, präzise | warme Graus, tiefes Grün, zurückhaltendes Oxblood als Akzent | systemisch, lesbar, technisch sauber, nicht „sportfashion“ | Sidebar, dichte Listen, ruhige Chips, klare Sheets, wenig Schatten | höchste Professionalität, stärkster Native-Fit, leicht in PWA umsetzbar | kann zu generisch-Apple wirken, wenn Brand-Layer fehlt | **sehr hoch** |
| **Rugby Field Operations** | Spürbar feldtauglich, robuster, taktiler, etwas operatorischer | robust, direkt, pragmatisch, kontrolliert | Navy/Graphit, Grün, Amber, Oxblood | markanter, kompakter, etwas kräftiger | große Quick Actions, klare Zustandszonen, stärkere Statusflächen | passt perfekt zu Live-Training und Returner-Steuerung | kann zu taktisch, industriell oder „Coach-Board“ werden | **hoch** |
| **Calm Medical-Athletic Monitoring** | Mehr Fokus auf Readiness, Schmerz, Verlauf und sensible Kontexte | umsichtig, ruhig, vorsichtig, sachlich | weiche Graus, Petrol, gedeckte Semantics | sanft, ruhig, data-health orientiert | mehr Karten, weichere Flächen, stärkere Trendpräsenz | gut für sensible Daten und Nachbereitung | wirkt schnell klinisch oder zu weich für Feldarbeit | **mittel** |

**Empfehlung.**  
Die beste Richtung ist **eine Kombination aus Territorium A und B**: **A als Systembasis**, **B als Brand- und Interaktionsakzent**. Anders gesagt: Die App-Shell, Navigation, Typografie, Dichte und Detailbehandlung sollten stark an einer ruhigen iPadOS-/Linear-/Things-Logik hängen; Status, Schnellaktionen, Sessionblöcke und Returner-Steuerung dürfen sichtbar robuster und feldtauglicher wirken. Territorium C würde ich **nur als Mikro-Layer** für sensible Bereiche wie Readiness, Schmerz, Returner und Safety verwenden — vor allem in Sprache, Warnlogik und Semantik, nicht als Gesamtästhetik. Diese Kombination vermeidet die zwei größten Risiken deiner aktuellen Situation: Web-Dashboard-Chaos einerseits und sterile Kliniksoftware andererseits. citeturn20view1turn22view0turn15view1turn24view3turn19view1

**Brand Foundation.**

| Element | Empfehlung für Rugby S&C Field Hub |
|---|---|
| Markenversprechen | **„Bringt Trainingsstatus, Belastungssteuerung und nächste Coach-Entscheidung in ein ruhiges, feldtaugliches System.“** |
| Tonalität | kurz, klar, ruhig, verantwortungsvoll, nicht alarmistisch, nicht motivational-marketinglastig |
| Designprinzipien | **Session-first**, **List-first**, **eine Hauptentscheidung pro Screen**, **Status immer mit Begründung**, **Analyse als zweite Ebene**, **Offline-Vertrauen sichtbar machen**, **medizinische Sensibilität ohne Klinikästhetik** |
| Was die App ausstrahlen soll | professionell, robust, coach-first, moderne Gelassenheit, strukturierte Intensität, Verlässlichkeit |
| Was sie niemals ausstrahlen soll | Gamification, Marketing-SaaS, Kliniksystem, Entwickler-Prototyp, Spreadsheet-Frontend, Fan-Merch |
| Design-Adjektive | ruhig, sportlich, geerdet, fokussiert, präzise, robust, vertrauenswürdig |
| Anti-Adjektive | laut, verspielt, neonhaft, klinisch, überladen, generisch, nerdig-prototypisch |

**Empfehlung zur Brand-Persönlichkeit.**  
*Nicht* „High-tech Sports Science Platform“. *Auch nicht* „Motivierende Fitness-App“. Die richtige Persönlichkeit ist **„Calm intensity“**: Die App soll so wirken, als ob sie auf dem Feld schnelle, gute Entscheidungen unterstützt, ohne selbst Hektik zu erzeugen. Das ist näher an einem ruhigen Operations-Tool als an einer motivierenden Trainings-App. Die Benchmarks bestätigen genau diese Richtung: WHOOP und Oura abstrahieren Status stark; Apple bringt Ruhe in Metriken; Linear und Things bringen Ruhe in Struktur. Für dein Produkt ist diese Ruhe aber **kein Selbstzweck**, sondern Voraussetzung dafür, dass Entscheidungen vor, während und nach der Einheit schneller werden. citeturn19view4turn19view1turn18view0turn20view1turn22view0

## Visuelles System

**Farbkonzept.**  
Öffentlich belegbar ist vor allem die funktionale Rolle von Farbe: WCAG verlangt, dass Farbe nie allein Information trägt; Text braucht mindestens 4.5:1 Kontrast auf AA-Niveau; Focus-Indikatoren und Targets brauchen ebenfalls klare Lesbarkeit; Material und Apple koppeln Farbe an Zustände und Touch-Ziele, nicht an Dekoration. Für deine App folgt daraus: Farbe muss **führen**, aber nie **erklären müssen**. Ampel ist erlaubt, aber nie ohne Text, Icon oder Grund. citeturn26view2turn8view9turn14search16turn9search9turn10search4

| Palette | Tokens | Warum sie passt | Risiken | Accessibility-Hinweise | Empfehlung |
|---|---|---|---|---|---|
| **Field Graphite** | Primary **#1F6B5C**; Secondary **#7A1F2B**; Background **#F4F5F3**; Surface **#FFFFFF**; Border **#D9DED8**; Text **#131815**; Muted **#5E6961**; Success **#1D7A46**; Warning **#D39A2B**; Danger **#B42318**; Info **#155EEF**; Focus Ring **#005FCC** | Ruhig, sportlich, nicht klinisch; das Grün wirkt performance-orientiert, das Oxblood bringt Rugby-Erdung ohne Fan-Shop-Gefühl | Wenn Secondary zu dominant eingesetzt wird, wird die App zu „Teamfarbe statt Produktsystem“ | Text auf Background und Surface liegt deutlich über AA; Warning braucht **dunklen** Text statt weißen Text; Ampel nur mit Label/Icon kombinieren. citeturn8view9turn26view2turn23search0 | **Beste Light-Mode-Option für v1** |
| **Donau Night Light** | Primary **#18324B**; Secondary **#2F6A5A**; Background **#F7F7F4**; Surface **#FFFFFF**; Border **#D8DCD6**; Text **#0F1720**; Muted **#5B6773**; Success **#1F8A55**; Warning **#C88A1A**; Danger **#B42318**; Info **#1D4ED8**; Focus Ring **#005FCC** | Etwas formeller und erwachsener; gute Nähe zu Performance/Analytics, ohne Enterprise-Grau zu werden | Kann bei zu viel Navy zu kalt wirken | Gute Kontraste, aber in langen Listen auf ausreichend hellen Flächen bleiben | Sehr gute Alternative, wenn du bewusster Richtung „Performance Console“ willst |
| **Oxblood Performance** | Primary **#7B2331**; Secondary **#2D6658**; Background **#F6F3F1**; Surface **#FFFFFF**; Border **#DED7D4**; Text **#171415**; Muted **#6B5D5B**; Success **#1E7A4E**; Warning **#D6A539**; Danger **#B42318**; Info **#155EEF**; Focus Ring **#005FCC** | Mehr Charakter, mehr Rugby, stärkeres Wiedererkennungspotenzial | Höheres Risiko, zu markenhaft und zu wenig neutral für längere Arbeitssessions zu wirken | Funktioniert nur, wenn Oxblood sparsam bleibt: App Icon, Primäraktionen, ausgewählte Statusflächen | Nur sinnvoll, wenn du sehr bewusst eine stärkere Eigenmarke willst |

**Empfehlung.**  
Nimm **Field Graphite** als Hauptpalette. Sie trifft deinen Zielmix am besten: ruhig, sportlich, moderat markant, nicht medizinisch, nicht generisch. Sekundärfarbe Oxblood würde ich in der Fläche sehr sparsam nutzen: Primärbuttons bleiben grün; Oxblood wird Brand-Akzent für App-Icon, aktive Session-Highlights, Returner- oder „Coach Decision“-Akzente. Warning und Danger bleiben semantisch eigenständig und werden **nie** durch die Brandfarben ersetzt. Das verhindert semantische Verwirrung. citeturn23search0turn8view10

**Optionaler Dark Mode.**  
Nicht sofort. Linear zeigt zwar, wie gut Light und Dark token-basiert parallel gepflegt werden können, aber genau das funktioniert nur sauber mit einem reifen Token-System und ausreichend QA. Für deinen ersten großen Redesign-Schritt würde ich **Light Mode priorisieren** und Dark Mode erst nach stabilen Kernflows und echten Feldtests nachziehen. citeturn20view1turn20view5

**Typografie.**  
Öffentlich belegbar ist: SF Pro ist die Systemschrift für Apple-Plattformen; SF Symbols ist darauf abgestimmt und richtet sich in Gewichtung und Größen sauber an Text aus. Für deine primäre iPad-/iPhone-Nutzung ist das ein großer Vorteil. citeturn9search2turn26view5

| Bereich | Empfehlung |
|---|---|
| Font-Richtung | **Systemfont zuerst.** In CSS: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| Systemfont vs. eigene Font | **Systemfont jetzt.** Keine eigene Brand-Schrift vor externem Launch |
| iOS/PWA-Native-Fit | Systemfont bringt sofort iOS-Nähe, bessere Lesbarkeit, bessere Dynamic-Type-Nähe und weniger Rendering-Risiko |
| Zahlen | **Tabular numerals** für Scores, Load, Reps, Cap-Werte, Verlaufstabellen |
| Überschriftenstil | Semibold, aber nicht fett-lastig; Screen-Titel klar größer als Section-Titel |
| Einsatzregeln | Nie mehr als drei sichtbare Textgewichte pro Screen; Metrikzahlen dürfen semibold sein, Labeltext normal bis medium |

**Empfohlene Typoskala.**

| Ebene | iPhone | iPad | Einsatz |
|---|---:|---:|---|
| Display / Hauptscreen | 28 / 32 | 34 / 40 | Heute, Einheit, Spielerprofil |
| Titel | 22 / 28 | 28 / 34 | Hauptsektionen innerhalb eines Screens |
| Section Title | 18 / 24 | 22 / 28 | Listenabschnitte, Paneltitel |
| Body | 16 / 22 | 17 / 24 | Standardtext, Labels, Hilfetexte |
| Secondary | 14 / 20 | 15 / 22 | Metadaten, Cluster, Position, Zeit |
| Caption | 12 / 16 | 13 / 18 | Helper, Sync-Hinweise, Badges |
| Metric XL | 24 / 28 | 28 / 32 | Session Load, sRPE, Attendance |
| Metric M | 18 / 22 | 20 / 24 | Status-Werte, kleinere KPIs |

**Layout- und Spacing-System.**

| Element | Empfehlung |
|---|---|
| Raster | **4px Basiseinheit**, Layoutsprünge primär in 8px |
| iPhone Horizontal Padding | 16px Standard, 20px auf Detail-Screens |
| iPad Horizontal Padding | 24px Standard im Content, 28–32px in Detailpanels |
| Vertikaler Rhythmus | 8 / 12 / 16 / 24 als Hauptstufen |
| Card-Abstand | 12px iPhone, 16px iPad |
| Listen-Dichte Standard | 60–68px Zeilenhöhe |
| Live-Modus-Dichte | 64–72px Zeilenhöhe, maximal zwei sichtbare Metazeilen |
| Analyse-Modus-Dichte | 72–88px Blöcke, mehr Luft für Filter/Charts |
| iPad Breiten | Sidebar **280–320px**; Main Content **520–760px**; Optional Detail **360–420px** |
| iPhone Content-Breite | Vollbreite mit klaren Sections; keine Multi-Column-Illusionen |
| Surface-Hierarchie | Default über **Border und Tonwert**, nicht über viele Schatten |
| Radius-System | 10 / 14 / 18 / 24; keine willkürliche Radius-Mischung |
| Schatten | Nur für Sheets, Popovers, Dialoge; **keine Shadow-Party** auf jeder Card |

**Empfehlung.**  
Dein Kernproblem „zu viele gleichartige Karten“ löst du nicht mit hübscheren Karten, sondern mit **einer strengeren Hierarchie der Container**. NN/g beschreibt Cards als kurze, konzeptionell zusammengehörige Informationseinheiten; Things und Linear zeigen dagegen, dass in komplexen Arbeitsprodukten **Listen, Header, Panels und Detail-Sheets** oft die stärkere Primärstruktur sind. Für Field Hub sollten Cards deshalb **sekundär** sein: für fokussierte Metriken, Empty States, Analyse-Module und Confirmation-Objekte. **Spieler, Check-ins, Tasks, Queues, Session-Blöcke und Beobachtungen gehören primär in Reihen und Listen.** citeturn8view11turn22view0turn20view1

## Komponenten und Screens

**Öffentlich belegbare Systemregeln, die für dein Kit relevant sind.**  
Apple beschreibt Tab Bars als Navigation zwischen Hauptbereichen, Sheets als gute Form für einfache, rückkehrfähige Teilaufgaben, und iPadOS kombiniert Tab Bar und Sidebar explizit für flexible große Layouts. Material beschreibt Chips als Set-Komponenten und Cards als scannbare Einheiten für ein Thema. NN/g trennt Statusindikatoren von Validierungen und Notifications. Für *Rugby S&C Field Hub* heißt das: **Bottom Tab Bar nur für Top-Level-Navigation, Sidebar für iPad-Hauptstruktur, Sheets für Aufgaben und Details, Chips für Filter/Status, Cards nur für fokussierte Informationen, Banner für Systemzustände, Listen für operative Arbeit.** citeturn6search1turn6search7turn8view5turn10search1turn10search2turn8view10

**Komponenten-Kit.**

| Komponente | Zweck und wann verwenden | Wann nicht verwenden | Visueller Stil und Interaktion | Accessibility | Beispiel in Field Hub |
|---|---|---|---|---|---|
| App Shell | Grundstruktur der App | Nicht pro Bereich neu erfinden | iPad: Sidebar + Content + optional Detail; iPhone: Tabs + Stack | Safe areas sauber, State pro Navigation erhalten | Heute / Einheit / Spieler / Analyse / Mehr |
| iPad Sidebar | Top-Level-Navigation und schnelle Kontextwechsel | Nicht für Inline-Aktionen | Ruhige Liste mit Icon + Label + optional Badge | 44x44 pt Targets als Apple-Regel; deutlicher Active State citeturn9search9 | Heute, Einheit, Spieler, Analyse, Mehr |
| iPhone Bottom Tab Bar | Peer-Navigation zwischen 4–5 Hauptbereichen | Nicht für Unterbereiche oder Filter | 5 Tabs max, persistenter Zustand pro Tab | große Targets, Labels nicht nur Icons | Heute, Einheit, Spieler, Analyse, Mehr |
| Topbar | Screen-Kontext, Suche, Filter, Sync, Overflow | Nicht als zweites Navigationssystem | Niedrige Höhe, max. eine Primäraktion | klare Titelhierarchie, Fokus sichtbar | „Einheit heute“, Sync-Status, Filter |
| Session Header | Schnell lesbare Session-Zusammenfassung | Nicht mit Charts aufblasen | Datum, Gruppe, Ort, Attendance, offene Tasks, CTA | erster Fokusanker, hohe Kontraste | „U22 Dienstag 18:30, 22 erwartet, 17 eingecheckt“ |
| Primary Button | Eine Hauptentscheidung pro Screen | Nicht mehrfach im selben sichtbaren Bereich | Filled Primary, großzügige Höhe | 44x44 pt minimum, besser größer bei Feldaktionen citeturn9search9turn26view3turn10search4 | „Check-in starten“, „Nachbereitung abschließen“ |
| Secondary Button | Alternative ohne Dominanz | Nicht als gleich starke zweite Primäraktion | Tonal oder Outline | ausreichender Kontrast | „Show details“, „Spielerprofil öffnen“ |
| Destructive Button | Löschungen, Import überschreiben, Queue verwerfen | Nicht für normale Warnhinweise | Rot nur hier bewusst dominant | Dialog mit klarer Sprache | „Export wirklich überschreiben?“ |
| Segmented Control | Wechsel zwischen engen Submodi | Nicht für 4+ lose Kategorien | Eingelassen, kompakt, zustandsklar | aktive Auswahl zusätzlich textlich markieren | Check-in / Training / Nachbereitung |
| Filter Chips | Temporäre Filter als Set | Nicht als Hauptnavigation | Outlined/Tonal; horizontal scrollbar auf iPhone | Status nie nur per Farbe | Position, Cluster, Returner, Attendance |
| Status Chip | Kompakter Zustand | Nicht bei erklärungsbedürftigen Safety-Fällen allein | Icon + Text + tonaler Background | WCAG: Farbe nie allein citeturn26view2 | „Aktiv“, „Inaktiv“, „Consent offen“ |
| Traffic Light Chip | Coach-Zusammenfassung für Tagesbelastbarkeit | Nicht als medizinische Freigabe | Grün/Gelb/Rot plus textliche Kategorie und Kurzgrund | nie nur Farbe; Icon/Label/Phrase nötig | „Gelb — Schmerz 4/10, modifizieren“ |
| Player Row | Primäre operative Basiseinheit | Nicht durch Cards ersetzen | Avatar/Initialen, Name, Position, Statusstack, Quick Action | volle Zeile tappable, Targets getrennt | Spielerliste im Check-in |
| Player Detail Sheet | Vertiefung ohne Screenwechsel im Flow | Nicht als dauerhafte Hauptstruktur | iPad Side Sheet, iPhone Bottom Sheet / Full-height Sheet | Fokus nach Öffnen sauber setzen | Verlauf, Notizen, letzte Pain-Werte |
| Warning Banner | Sofort sichtbare, nicht-blockierende Warnung | Nicht für irreversible Entscheidungen | Inline oberhalb des betroffenen Bereichs | Farbe + Icon + Text | „3 offene Nachbereitungen“ |
| Safety Notice | Sensibler Hinweis mit klarer Verantwortungsgrenze | Nicht als Toast | Fester Baustein unter Session Header oder im Player Sheet | ruhige Warnfarbe, klare Sprache | „Hinweis für Coaching-Entscheidung, keine medizinische Freigabe“ |
| Sync Status | Vertrauen in Offline/Sync | Nicht in Einstellungen verstecken | Kompakter Chip oder Topbar-Item | zusätzlich textlich: online/syncing/offline | „Offline · 6 Änderungen in Queue“ |
| Offline Banner | Globaler Systemstatus | Nicht als kleiner Dot allein | Persistenter Banner bis Verbindung zurück ist | muss screen-reader-lesbar sein | „Offline — Daten werden lokal gespeichert“ |
| Task Queue Row | Sichtbarkeit für Pending Writes | Nicht im Alltag dominant | Zeile mit Typ, Zeit, Status, Retry | Fehler klar unterscheidbar | „Check-in Anna K. wartet auf Sync“ |
| Metric Card | Eine fokussierte Kennzahl | Nicht als Default-Container für alles | große Zahl, kleiner Kontext, ein Unterwert | Titel immer sichtbar | Team-Readiness-Schnitt, offene Returner |
| Analysis Card | Analysemodul mit kurzer Aussage | Nicht im Live-Modus | Chart + 1 Satz Erkenntnis + Drilldown | Reihenfolge logisch, kontrastreiche Charts | „Gelb-Anteil stieg in 2 Wochen von 18% auf 31%“ |
| Form Field | Standard für Datenaufnahme | Nicht mit Placeholder-only beschriften | Label oben, Helper darunter, Error inline | Mobile-Form-Regeln von NN/g beachten citeturn8view12turn8view13 | Coach-Notiz, Schmerzort |
| Number Scale | Readiness 1–5, sRPE etc. | Nicht als Drop-down | horizontal tappable scale, klar selektierter Zustand | große Tap-Flächen, numerisch + verbales Label | „Readiness 2 = niedrig“ |
| Pain Scale | Schmerz separat und sensibler | Nicht mit Ampel verschmelzen | 0–10 Skala, Body Area separat, Kontext „vor/nach“ | neutrale Sprache, keine Diagnosewörter | „Pain 5/10, Hamstring rechts“ |
| Returner Cap Card | Grenzen und Ist-Werte im Blick | Nicht als Textblock | Allowed vs Completed in klaren Zeilen/Balken | Zahlen + Text + Status | Sprint-Cap, COD-Cap, Kontakt-Cap |
| Empty State | Führt aus Leere in Handlung | Nicht als Illustration-only | 1 Satz, 1 CTA, 1 Hilfetext | keine leeren Metaphern | „Noch keine Einheit geplant — neue Einheit anlegen“ |
| Loading / Skeleton | Wahrnehmung von Fortschritt | Nicht als Spinner für große Listen | Zeilen-/Panel-Skeletons in finaler Form | Layout shift minimieren | Spielerliste lädt |
| Error State | Wiederanlauf ermöglichen | Nicht technisch roh formulieren | kurzer Fehlertext + Retry + optional Details | Fehlermeldung nicht nur Toast | „Sync fehlgeschlagen — erneut versuchen“ |
| Confirmation Dialog | Kritische Bestätigung | Nicht für harmlose Zustandswechsel | kurz, eindeutig, 1 Primary + 1 Cancel | Fokusfalle sauber, Kontext nennen | JSON-Import überschreibt lokale Daten |

**Screen-Design-Richtung.**

| Screen | Primäre Aufgabe | iPad-Idee | iPhone-Idee | Wichtige Komponenten | Was bewusst nicht sichtbar sein soll |
|---|---|---|---|---|---|
| Heute | Nächste relevante Coach-Handlung zeigen | Oben Session Header, darunter zweispaltig: „Jetzt wichtig“ links, „Risiken / offene Punkte“ rechts | Ein klarer vertikaler Ablauf: Session, offene Tasks, Schnellaktionen | Session Header, Metric Cards, Warning Banner, Sync Status | keine Trendcharts, keine Dokumentenwand, keine 8 gleichen Cards |
| Einheit / Check-in | Anwesenheit und Tagesstatus erfassen | Linke Player-Liste, rechte Detail-/Check-in-Fläche; Kiosk-Umschalter klar getrennt | Liste mit aufklappbaren Player Rows oder Player Sheet | Player Row, Number Scale, Pain Scale, Traffic Light Chip, Safety Notice | Teamanalyse, Export, Bibliothek |
| Einheit / Training | Live-Steuerung am Feld | Session-Timeline oben, darunter Player-Liste plus Quick Actions; optional Detailpanel | Segmentiert: „Spieler“ / „Blöcke“ | Session Header, Player Row, Quick Actions, Returner Cap Card | Charts, historische Trends, zu tiefe Formulare |
| Einheit / Nachbereitung | Session beenden und nächste Entscheidung festhalten | Roster links, Eingabe rechts; oben Teamzusammenfassung | Schrittweise Erfassung pro Spieler, dann Team-Summary | Number Scale, Metric Card, Player Detail Sheet | Exercise Library, historische Vollanalyse |
| Spieler | Profil, Verlauf, Testwerte, History | Liste links, Profil/Verlauf rechts; Tabs im Profil | Liste → Profil → Tabs/Segments | Player Row, Player Detail Sheet, Analysis Card, Form Fields | Live-Warnbanner aus anderer Session |
| Analyse | Team-/Spieleranalyse mit klaren Fragen | Filterspalte links, modulare Analysekarten mittig, Detailpanel rechts | 1 Insight pro Screen oder klare vertikale Reihenfolge | Filter Chips, Analysis Cards, Trend-Module | Check-in-Fragen, Live-Quick-Actions |
| Mehr / Bibliothek / Export / Einstellungen | Utility, Referenz, Backoffice | grouped list mit Unterseiten, nicht dashboardisiert | einfache grouped lists | List Rows, Confirmation Dialog, Empty States | Hauptmetriken oder primäre Coach-Aktionen |
| Kiosk / Public Check-in | schneller, sicherer, öffentlicher Self-Check-in | Vollbildmodus ohne Sidebar, große Schrittflächen, Auto-Reset | iPhone eher sekundär; wenn nötig stark vereinfachte Wizard-Variante | große Number Scales, Confirmation, Privacy-Hinweis | Coach-Notizen, Spielerhistorie, Team-Analyse |

**Empfehlung zur Behandlung von Ampelstatus, Schmerz, Returner und Safety.**  
Hier musst du gestalterisch sehr diszipliniert sein. WHOOP zeigt, wie stark eine Ampel als Tagesabstraktion sein kann; WCAG verlangt aber, dass Farbe nie allein Information trägt; NN/g trennt Statusindikatoren von Notifications. Für *Field Hub* heißt das: **Ampel = kompakte Coach-Synthese**, aber immer mit **Text und Grund**. Schmerz wird **nicht** im gleichen visuellen Stil wie ein Team-Status behandelt; Schmerz bekommt eine eigene, ruhigere Erfassung mit Zahl, Ort und Zeitpunkt. Returner wird **nicht** als „Grün/Gelb/Rot“, sondern als **Cap-/Allowed-vs.-Completed-Logik** dargestellt. Safety-Hinweise erscheinen als standardisierte, ruhige Notice mit klarer Verantwortungsgrenze. Formulierungen wie **„Cleared“, „fit“, „Return-to-play freigegeben“** sollten in deiner UI nicht vorkommen. Stattdessen: **„heute normal / modifizieren / stoppen & abklären“**, **„Rücksprache empfohlen“**, **„Belastung begrenzen“**, **„heute erlaubt“**, **„heute absolviert“**. citeturn19view4turn26view2turn8view10

## Native Gefühl und Produktentscheidungen

**Native Feel Guide — Die App fühlt sich nativ an, wenn …**

| Plattform | Checkliste |
|---|---|
| iPad | … die App mit Sidebar und klarer Content-Fläche arbeitet; … Details in Side Sheets oder Split-Panes erscheinen statt als neue chaotische Screens; … es nur wenige stabile Navigationsanker gibt; … Touch-Ziele groß genug sind; … Quick Actions am Kontext hängen und nicht als schwebende Web-Buttons aussehen; … Toolbars und Header knapp bleiben. citeturn8view5turn5search3turn5search23turn9search9 |
| iPhone | … die Hauptnavigation in einer Bottom Tab Bar mit 4–5 Peers liegt; … Unteraufgaben als Sheets oder klare Stacks kommen; … Formulare streng einspaltig sind; … eine sichtbare Hauptaktion pro Screen existiert. citeturn6search1turn10search3 |
| PWA | … die App installiert als eigenständiges Fenster startet; … Browser-Chrome verschwindet; … Offline-Verhalten sichtbar und verlässlich ist; … Back-/Close-Navigation innerhalb der App bewusst berücksichtigt wird; … der Installationszustand im UI mitgedacht ist. citeturn8view7turn8view8turn8view6turn6search5 |
| spätere native App | … Farben, Typo, Radius, Spacing, Elevation, States und Motion bereits als semantische Tokens definiert sind; … Komponenten 1:1 benannt und dokumentiert sind; … Plattformnavigation nur eine Darstellungsebene ist und nicht die Produktlogik trägt. citeturn20view5turn26view4 |

**Design-Do-and-Don’t-Liste.**

| Do | Don’t |
|---|---|
| Mach Listen zur primären Arbeitsfläche | Baue wieder eine Kachelwand aus gleichwertigen Cards |
| Gib jeder View genau eine Primärhandlung | Zeige mehrere gleich starke CTAs auf engem Raum |
| Nutze Status als Text + Farbe + Icon | Verlasse dich auf Grün/Gelb/Rot allein |
| Halte *Heute* operativ und priorisiert | Verwandle *Heute* in eine KPI-Startseite |
| Trenne Live-Flow und Analyse strikt | Zeige Charts in Check-in- oder Training-Live-Screens |
| Nutze iPad-spezifische Dichte | Skaliere nur die Mobile-UI hoch |
| Nutze systemnahe Typografie und Ikonografie | Mische zufällige Icon-Sets und Webfonts |
| Baue klare Offline-/Sync-Vertrauenssignale | Verstecke Sync-Probleme in Einstellungen |
| Verwende Sheets für Details und Kurzaufgaben | Navigiere für jede Kleinigkeit auf neue Vollscreens |
| Formuliere Safety-Hinweise verantwortungsvoll | Verwende Freigabe- oder Diagnose-Sprache |

**Entscheidungsmatrix.**

| Entscheidung | Empfehlung | Begründung | Aufwand | Risiko | Wann umsetzen |
|---|---|---|---|---|---|
| Neue Farbwelt | **Ja** | Ohne neue Farb- und Surface-Hierarchie bleibt die App chaotisch | mittel | niedrig | sofort |
| Systemfont vs. eigene Font | **Systemfont** | stärkster iOS/PWA-Fit, geringstes Risiko, bessere Lesbarkeit | niedrig | niedrig | sofort |
| Mehr iPadOS-Stil vs. eigener Rugby-Stil | **70/30 zugunsten iPadOS** | Native Shell + eigener Akzent ist stabiler als Voll-Branding | mittel | mittel | sofort |
| Cards reduzieren | **Ja** | NN/g + dein Problemgefühl sprechen klar dagegen, alles zu cardifizieren | mittel | niedrig | sofort |
| Bottom Tab Bar auf iPhone | **Ja** | Top-Level-Peer-Navigation passt exakt | niedrig | niedrig | mit App-Shell |
| Sidebar auf iPad | **Ja** | Coach-Tool auf iPad profitiert maximal davon | mittel | niedrig | mit App-Shell |
| Dark Mode | **Später** | Zu viel Design-/QA-Aufwand vor Kernredesign | mittel | mittel | nach Kernflows |
| Design Library in Figma | **Ja, jetzt** | Tokens und Komponenten müssen vor CSS-Refactor definiert sein; Apple bietet dafür offizielle iOS/iPadOS-Ressourcen in Figma | mittel | niedrig | sofort citeturn26view4 |
| Bestehende CSS nur weiterentwickeln vs. UI-Komponentenbibliothek | **Komponentenbibliothek einführen** | Sonst reproduzierst du Inkonsistenz; Linear zeigt den Vorteil tokenisierter Systeme | mittel bis hoch | mittel | früh |
| Eigene Brand-Schrift | **Nein vor Launch** | bringt wenig Mehrwert, erhöht Inkonsistenz | niedrig | mittel | frühestens später |
| Dark-mode-spezifische Semantics | **Nein vor Launch** | erst wenn Light-Mode-System stabil steht | mittel | mittel | später |
| App-Icon / Install-Branding neu | **Ja** | PWA-Install-Erlebnis ist Teil des Produktvertrauens | mittel | niedrig | vor externem Launch |

**Design-Entscheidungen, die vor externem Launch fallen müssen.**  
Vor einem externen Launch solltest du **nicht** mehr offenlassen: Hauptnavigationsmodell, Farbpalette, Statussprache, Komponentenbasis, Check-in-/Training-/Nachbereitung-Shell, Offline-/Sync-Kommunikation und Kiosk-Privatsphäre. Diese Punkte prägen das Produktvertrauen stärker als zusätzliche Features. Ein unfertiger Export-Screen ist verkraftbar. Eine unklare Tagesansicht oder missverständliche Safety-Sprache ist es nicht. citeturn24view3turn18view0turn19view4turn20view1

## Roadmap und Guardrails

**Roadmap-Vorschlag.**

| Sprint | Ziel | Deliverables | Erfolgskriterium |
|---|---|---|---|
| Sprint 0 | Research-Synthese und Scope-Freeze | Benchmark-Board, Flow-Prio, Annahmenliste, Screen-Inventar | Alle Redesign-Entscheidungen auf 5 Kernflows fokussiert |
| Sprint 1 | App Shell und Navigation | iPad Sidebar-Muster, iPhone Tab-Bar, Screen-Mapping auf Heute / Einheit / Spieler / Analyse / Mehr | Kein Screen ohne klare primäre Zugehörigkeit |
| Sprint 2 | Brand Foundation | Naming-Usage, Tonalität, App-Icon-Richtung, Territorium-Entscheid | Team kann „Was ist die App visuell?“ in 2 Sätzen beantworten |
| Sprint 3 | Tokens | Farbe, Typo, Spacing, Radius, Borders, Elevation, Motion, Semantic States | Erste 3 Screens nutzen nur Tokens, keine Einzelfallwerte |
| Sprint 4 | Core Components | App Shell, Topbar, Buttons, Rows, Chips, Forms, Sheets, Banners, Sync/Offline | Komponentenbibliothek deckt 70–80 % der UI ab |
| Sprint 5 | Heute + Einheit Shell | Heute, Session Header, Check-in- und Training-Grundlayout | Tagesarbeit in einem Flow statt in Bereichssprüngen möglich |
| Sprint 6 | Check-in + Nachbereitung | Number Scales, Pain, Ampel, Safety Notice, Session-Ende | Vollständiger Vorher/Nachher-Session-Flow auf iPad testbar |
| Sprint 7 | Training Live Mode + Kiosk | Quick Actions, Returner Caps, Kiosk-Modus, öffentliche Privacy-Logik | Feldtest mit echter Einheit ohne UI-Blocker |
| Sprint 8 | Spieler + Analyse + Mehr | Spielerprofil, Verlauf, Trendmodule, Export/Backup, Bibliothek, Settings | Analyse ist nützlich, aber operativ klar zweitstufig |
| Sprint 9 | Cross-device QA | iPad/iPhone Responsive QA, Installability, Offline/Queue, Empty/Error States | PWA fühlt sich installiert konsistent an citeturn8view7turn8view8turn8view6 |
| Sprint 10 | External Launch Polish | Copy Review, A11y QA, Contrast, Touch Targets, Privacy Copy, Beta Packaging | Produkt wirkt intern und extern konsistent und vertrauenswürdig |

**Empfehlung zur Reihenfolge.**  
Ich habe die Reihenfolge bewusst leicht gegenüber deiner Vorlage verschoben: **App Shell vor Screen-Redesign**, weil Navigation, Container-Hierarchie und Dichte alle folgenden Sprints bestimmen. Genau das zeigen auch die Linear-Redesign-Milestones: erst Stress-Tests, dann Verhaltensdefinitionen der Hauptkomponenten, danach Chrome-/Sidebar-/Header-Refresh, dann Rollout. citeturn20view1

**Codex-/Claude-ready Design Guardrails.**

1. Verwende auf dem iPhone **maximal 5 Top-Level-Navigationspunkte**: **Heute, Einheit, Spieler, Analyse, Mehr**.  
2. Verwende auf dem iPad **Sidebar + Content + optional Detail**, nicht dieselbe Struktur wie auf dem iPhone.  
3. Jeder Screen bekommt **genau eine primäre Handlung**.  
4. **Player Rows sind Standard.** Cards nur für fokussierte Metriken, Empty States, Analysemodule und Dialogkontext.  
5. Kein Live-Screen darf mehr als **eine kleine Team-Zusammenfassung** oberhalb der operativen Liste zeigen.  
6. **Keine Analysecharts** auf Check-in- oder Training-Live-Screens.  
7. Status nie nur über Farbe kommunizieren; immer **Farbe + Text + optional Icon**.  
8. Verwende für Ampelstatus niemals Freigabe-Sprache wie „cleared“, „fit“, „RTP approved“.  
9. Safety- und Medical-Hinweise immer mit Zusatz: **„Hinweis für Coaching-Entscheidung, keine medizinische Diagnose/Freigabe.“**  
10. Touch Targets: **mindestens 44×44**, feldkritische Actions **48–56 hoch**. citeturn9search9turn26view3turn10search4  
11. Labels stehen **über** Eingabefeldern, nicht im Feld als einzige Beschriftung. citeturn8view12turn8view13  
12. Formfehler immer **am Feld** anzeigen; globale Fehlerzusammenfassung nur ergänzend. citeturn8view13  
13. Verwende **Systemfont und SF Symbols** für v1. citeturn9search2turn26view5  
14. Keine dekorativen Gradients, Orbs, Glassmorphism-Spielereien oder Marketing-Hero-Flächen.  
15. Keine verschachtelten Cards innerhalb von Cards.  
16. Keine zufällige Mischung aus Radius-, Shadow- und Border-Stilen.  
17. Offline- und Sync-Zustände sind **sichtbar im Hauptprodukt**, nicht nur in Einstellungen.  
18. Der Kiosk-Modus ist eine **eigene UI**, ohne Coach-Notizen, Historie oder Analyse.  
19. Verwende semantische Tokens: `bg/base`, `surface/default`, `surface/raised`, `text/primary`, `text/secondary`, `accent/primary`, `status/success`, `status/warning`, `status/danger`, `focus/ring`.  
20. Komponenten werden plattformneutral benannt und dokumentiert, damit sie später in React, Flutter oder React Native sauber abbildbar bleiben.  
21. Live-Modus = **höhere Dichte, weniger Deko**. Analyse-Modus = **mehr Luft, mehr Kontext, mehr Filter**.  
22. Auf *Heute* werden nur Dinge gezeigt, die eine Coach-Handlung auslösen: **nächste Einheit, offene Checks, Warnungen, Schnellaktionen, Sync/Backup**.  
23. *Mehr* ist eine Utility-Zone. Bibliothek, Export/Backup und Einstellungen dürfen nie die Hauptnavigation dominieren.  
24. Keine technischen Rohbegriffe in der Coach-UI, wenn eine Coach-nahe Formulierung existiert. Statt „pending write queue“: **„wartet auf Sync“**.  
25. Nutze Motion sparsam: **120–180 ms** für Buttons/Selections, **220–280 ms** für Sheets/Panel-Übergänge; nie spielerisch-federnd auf kritischen Screens.  
26. Jede Statusentscheidung braucht eine sichtbare Ursache oder einen Drilldown dorthin.  
27. Jeder Analysebaustein endet mit einer klaren Coach-Frage: **„beobachten, modifizieren, steigern, rückmelden?“**  
28. Vor externem Launch dürfen keine Screens mehr auftauchen, die wie Admin-Backend, Template-UI oder unfertiger Dev-Prototyp wirken.
