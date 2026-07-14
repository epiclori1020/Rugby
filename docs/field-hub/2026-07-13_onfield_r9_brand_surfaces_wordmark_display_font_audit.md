# OnField Redesign-v2 R9 – Brand-Surfaces, Wortmarke & Display-Font-Test

Stand: 2026-07-14

## Sprint-Scope

R9 macht OnField an den Produktkanten bewusst sichtbar: Wortmarke/Dot-Signature, Display-Font-Test, Welcome/Login, Browser-Install sowie der erlaubte Einstieg von Public/Kiosk. Live-Coaching bleibt ruhig. iPhone und iPad behalten denselben fachlichen Umfang.

Nicht Teil dieses Sprints sind R10+, eine externe Landingpage, neue Produkt- oder Markenarchitektur, neue Produktfelder/Datenmodelle, dauerhafte Supabase-/RLS-Aenderungen, operative Screen-Rewrites, neue PWA-Icons, eine kuenstliche Splash-Verzoegerung oder KI-generierte UI-Struktur.

## Bildgenerierung, Prompts und Auswahl

Werkzeug: integriertes OpenAI `image_gen`. Alle Richtungen wurden als textfreie Raster-Prototypen erzeugt. Nano Banana wurde nicht benoetigt; die folgenden provider-neutralen Prompts koennen dort unveraendert als Vergleichsbasis verwendet werden.

### Verwendete Prototyp-Prompts

**Field Ledger**

> Create a text-free landscape brand artwork for OnField, a PWA-first coaching instrument. Direction: Heritage Field Instrument / Field Ledger. Abstract field markings, coaching-ledger paper, chalk, quiet archival print texture and precise editorial composition. Palette: field graphite, warm off-white, controlled primary green and restrained oxblood accents. Leave calm negative space for real UI copy. Sport-generic; rugby may be implied only through abstract field geometry. No text, letters, numerals, logos, wordmarks, watermarks, people, clubs, dominant rugby ball, stadium, floodlights, neon, glossy sports-SaaS gradients, medical symbols or UI mockup. Premium, tactile, restrained and crop-safe for phone and tablet.

**Sideline Instrument**

> Create a text-free landscape brand artwork for OnField, a PWA-first coaching instrument. Direction: Heritage Field Instrument / Sideline Instrument. Precise scoreboard and measuring-instrument geometry, robust mechanical surfaces, subtle paper labels without glyphs, quiet technical order and generous negative space. Use field graphite, warm off-white, primary green and only a restrained oxblood accent. Sport-generic and crop-safe for phone and tablet. No text, letters, numerals, logos, people, clubs, dominant rugby ball, stadium, floodlights, neon, glossy SaaS gradients, medical symbols or UI mockup.

**Matchday Trace**

> Create a text-free landscape brand artwork for OnField, a PWA-first coaching instrument. Direction: Heritage Field Instrument / Matchday Trace. Reduced editorial composition built from movement traces, decision paths and abstract field lines, with controlled energy and quiet areas for real interface copy. Use field graphite, warm off-white, primary green and minimal oxblood. Sport-generic and crop-safe for phone and tablet. No text, letters, numerals, logos, people, clubs, dominant rugby ball, stadium, floodlights, neon, glossy sports-SaaS gradients, medical symbols or UI mockup.

### Finale Ueberarbeitung

> Refine the selected Field Ledger direction into a production-ready OnField signature artwork. Preserve the abstract field/ledger composition and tactile archival materiality, simplify noisy marks, remove every accidental glyph or logo-like shape, keep the main copy area calm, and make the crop resilient at 393 × 852 and 834 × 1194. Produce a light master in warm off-white, graphite and green with a very restrained oxblood trace, then a dark Field-Mode companion with the same visual identity in near-black graphite, muted green and restrained oxblood. No text, numerals, watermark, people, club identity, medical symbol, neon or UI controls.

### Bewertungsmatrix

| Richtung | Marke 25 | Eigenstaendigkeit 20 | Crop 15 | Textruhe 15 | Wortmarke/CTA 15 | PWA 10 | Gesamt |
|---|---:|---:|---:|---:|---:|---:|---:|
| Field Ledger | 24 | 18 | 14 | 14 | 14 | 10 | **94** |
| Sideline Instrument | 21 | 15 | 12 | 12 | 12 | 9 | 81 |
| Matchday Trace | 20 | 17 | 13 | 10 | 10 | 9 | 79 |

Field Ledger wurde ausgewaehlt, weil die Richtung auch in engem iPhone-Crop ruhig bleibt, UI-Typografie nicht imitiert und Rugby nur als Preset andeutet. Sideline Instrument war zu objekt-/fotolastig. Matchday Trace machte Oxblood zu dominant und dadurch zu leicht statusartig.

## Produktionsassets und Provenienz

| Asset | Groesse | Rolle |
|---|---:|---|
| `app/field-hub/src/assets/brand/onfield-signature-light.webp` | 37.906 Bytes | Light Brand-Surfaces |
| `app/field-hub/src/assets/brand/onfield-signature-dark.webp` | 21.442 Bytes | Field-Mode Brand-Surfaces |

Gesamt: 59.348 Bytes; damit liegen beide Dateien deutlich unter 250 KB je Asset und unter 500 KB gemeinsam. Beide sind textfrei. Wortmarke, Copy, Formulare, Status und Navigation bleiben echte React-/CSS-/Figma-Struktur. Es gibt kein Stock-Asset und keine fremde Vereinsmarke; die Rasterbilder wurden projektbezogen mit `image_gen` aus den dokumentierten Prompts erzeugt. Nur die beiden finalen WebP-Dateien liegen im Repo.

## Wortmarke und Typografie

- Wortmarke: Mixed Case `OnField•`; `Coach`, `Rugby` und `Performance` bleiben separate Descriptoren.
- Dot: Oxblood auf Brand-Surfaces, Primary Green im operativen Kontext; `aria-hidden`, dekorativ und ohne Statussemantik.
- Display: lokal gebundeltes `@fontsource/barlow-semi-condensed@5.2.7`, nur Latin 800, mit Systemfont-Fallback und `font-display: swap`.
- Lizenz: SIL Open Font License 1.1 (`OFL-1.1`), im installierten Fontsource-Paket dokumentiert.
- Wortmarke, Brand-Headlines, Hauptueberschriften und groessere Kennzahlen nutzen den Display-Token. Body, Formulare, Buttons, Labels und Navigation bleiben Systemfont.
- Keine neuen 850-/900-Gewichte; Mono-Labels wurden nicht ratifiziert.

## UX- und Pattern-Entscheidungen

- Hidden Route `#/welcome` ist die Coach-Auth-/First-Run-Kante. Direkt angeforderte Coach-Routen werden nach erfolgreichem Login wiederhergestellt.
- Public-Check-in und aktiver Kiosk-Lock haben Routing-Vorrang. Signed-in Welcome fuehrt zum gespeicherten Ziel oder zu Today.
- Welcome zeigt `Login → Spieler anlegen → Check-in oeffnen` und genau eine dominante Aktion. Hero, First-Run-Folge und Auth-Zustand liegen in genau einer zusammenhaengenden Brand-Surface statt in zwei gestapelten Brand-Cards; die Login-Aktion bleibt auf 375/393 px ohne Scrollzwang sichtbar.
- Missing-config und echtes Auth-Loading nutzen Brand-Surfaces, zeigen aber keine rohe Backend-/Env-Copy und keine kuenstliche Mindestdauer.
- No-Roster in Today bleibt ein ruhiger operativer Empty State mit direkter Aktion `Spieler anlegen`; kein Hero und keine Card-Wall.
- Public/Kiosk verwenden `texture` nur in der Namens-/Welcome-Stufe. Ab Readiness, Review und Abschluss gilt `artwork="none"`; Kiosk-Auto-Reset zeigt die Welcome-Texture erneut.
- Browser-Install zeigt eine dominante Aktion und danach nummerierte Safari-Schritte fuer iPhone und iPad. Standalone bleibt kompakt.
- `BrandSurface` hat `artwork="none"` als sicheren Default. Hero-/Texture-Nutzung ist immer explizit.

## Figma als primaere visuelle Referenz

- Datei: `https://www.figma.com/design/BBaL4jQKLHeOC7tP5lajdW?node-id=68-2`
- Page: `Redesign v2 R9 Brand Surfaces` (`68:2`)
- Sections: Wortmarke/Display (`68:3`), Artwork-Richtungen (`68:4`), iPhone-Matrix (`68:5`), iPad-Matrix (`68:6`), Integrity Gate (`68:7`) sowie der Audit-Closeout fuer Schutzraum, Mindestgroesse, Umlaut-/Ziffer-/Scoreboard-Proben und gewichtete Artwork-Matrix (`84:2`).
- Die widerspruechliche Display-Annotation `69:33` wurde korrigiert: grosse Scoreboard-/Metrikwerte sind erlaubt, Tabellen, Buttons, Labels und Fliesstext bleiben Systemfont.
- Matrizen: Auth Loading, Login, Missing Config, Install, Public Name, Kiosk Name, No Roster und ruhiger Today-Control in Light und Field Mode.
- Figma-Frames sind 393 × 852 und 834 × 1194. Die zusaetzlichen Breiten 375, 744 und 1194 werden im Browser-Gate gegen dieselben Zustands- und Tokenvertraege geprueft.

## Vorher-/Nachher-Evidence

Ignored QA-Artefakte liegen unter `.tmp/onfield-qa/r9/` und enthalten keine Zugangsdaten oder realen Spieler-/Gesundheitsdaten.

Vorher, primaere Figma-Breiten:

- `before/iphone-light.png`, `before/iphone-dark.png`
- `before/ipad-light.png`, `before/ipad-dark.png`

Nachher, vollstaendige Welcome-Matrix:

- `after/light|dark/iphone-small__welcome.png` (375)
- `after/light|dark/iphone-large__welcome.png` (393)
- `after/light|dark/medium-744__welcome.png` (744)
- `after/light|dark/ipad-portrait__welcome.png` (834)
- `after/light|dark/ipad-landscape__welcome.png` (1194)

Vorher landete ein ausgeloggter Coach im ruhigen, aber markenarmen operativen Zustand. Nachher ist die Produktkante eine eigenstaendige Welcome/Login-Experience mit Field Ledger, Wortmarke, Display-Hierarchie und First-Run-Folge. Der Today-Control in Figma und die authentifizierte Browser-Matrix belegen, dass das Redesign nicht in Live-Coaching-Screens auslaeuft.

## Redesign Integrity Gate

| Gate | Ergebnis |
|---|---|
| Dominante Primaerhandlung | eine Login-/Install-/Empty-Aktion pro Zustand |
| Row-first / keine Card-Wall | operative Athlete-Flows unveraendert; Welcome/Auth ist eine zusammenhaengende Surface; No-Roster bleibt ein fokussierter Empty State |
| Token-/Typo-Audit | Display-/Artwork-Tokens; keine rohen Farben/Font-Sizes in neuen Komponenten; keine 850/900 |
| Status nicht nur Farbe | Dot ist explizit kein Status; fachliche Statuspatterns bleiben Text/Glyph/Form/Farbe |
| Oxblood-Grenze | nur Wortmarken-Dot/Editorial-Akzent auf erlaubten Brand-Surfaces |
| Copy/Trust | keine Diagnose-/Freigabesprache, keine rohe Env-/Backend-Copy |
| iPhone/iPad-Paritaet | identische Schritte/Aktionen; nur Komposition unterscheidet sich |
| Light/Field Mode | beide Modi in Figma und Browser geprueft |
| Font | lokaler 800-Schnitt geladen; blockierter Font-Fallback auf 375/393/834 ohne Overflow oder verdeckte Login-Aktion |
| Asset/PWA | WebP und WOFF/WOFF2 im Production-Build und Precache; Offline-Smoke gruen |

## Verifikation

- `qa:local`: Sicherheits-Audit, Typecheck, Lint, Unit-/Komponententests, Production-Build, PWA/Offline, Welcome-Matrix und Public-Error-Surfaces.
- `qa:beta`: kein Skip; R5-Responsive-Test, 110 authentifizierte Screen-/Theme-/Viewport-Kombinationen, vier Kiosk-Brand-Surfaces, fuenf direkte Coach-Deep-Links, vier Back-/Forward-Uebergaenge, signed-in Offline-Resume, erzwungener Lazy-Load-Fehlerzustand sowie echter Kiosk-Submit.
- Responsive: 375, 393, 744, 834, 840-Grenze und 1194; Light und Field Mode.
- Accessibility: gerenderter Kontrast, sichtbarer Tastaturfokus, Touch-Ziele, Safe-Area-/Bottom-Nav-Clearance, kein horizontales Overflow, Status nicht nur Farbe.
- Temporäre Remote-Mutation: synthetische, markierte Player/Entries; nur eigene IDs geloescht; Remote-Abwesenheit in `finally` verifiziert. Bestehende reale Daten wurden nicht geaendert. Credentials wurden nicht persistiert oder in Evidence ausgegeben.
- Authentifizierte Screenshot-Persistenz ist im QA-Script jetzt ein harter Blocker. Remote Login-Ziele brauchen HTTPS und eine exakte Origin-Allowlist; Preview-Child-Prozesse erhalten keine QA-Credentials.
- Physische iPhone-/iPad-Hardware stand in diesem Lauf nicht zur Verfuegung. Die PWA-/Responsive-Evidence stammt aus isoliertem Headless Chrome mit den verbindlichen CSS-Viewportgroessen; ein spaeterer Hardware-Smoke bleibt deshalb zusaetzliche, nicht vorgetaeuschte Evidence.
- Bekannte Build-Warnung: bestehender Main-Chunk liegt weiterhin knapp ueber 500 KB. R9 erweitert keine Architektur nur zur Beseitigung dieser Vorwarnung.

## Zwischenzeitlich blockierte Gates und Aufloesung

- Ein lokaler Preview-Start wurde einmal durch die Sandbox (`listen EPERM`) blockiert. Derselbe unveraenderte Test lief mit der vorgesehenen lokalen Port-Freigabe gruen; kein App-Workaround wurde eingebaut.
- Der erste R5-Beta-Versuch hatte keine kontrollierte Fixture. Der Test erzeugt nun ausschliesslich synthetische, markierte Daten, verfolgt IDs, raeumt in `finally` auf und prueft die Remote-Abwesenheit.
- Die authentifizierte Visual-QA enthielt alte Copy- und Empty-State-Annahmen. Sie prueft nun stabile Screen-Vertraege fuer leere wie befuellte Accounts.
- Ein Success-Text hatte gerendert 4,35:1 auf der Primary-Scoreboard-Flaeche. Die Komponente nutzt jetzt den vorhandenen semantischen Success-Text-Token und erreicht das Ziel, ohne die Statuslogik zu aendern.
- Der Lazy-Error-Test war nach dem Screen-Sweep gecacht und damit `skipped`. Der isolierte Test umgeht Service Worker und Cache; ein Skip blockiert das Beta-Gate.
- Der Abschlussaudit fand einen CSS-Cascade-Fehler, der Public/Kiosk-Texture trotz korrekter Klasse ueberschrieb. Die Variant-Regel veraendert den Background nicht mehr; Kiosk prueft den berechneten Asset-Background. Public Invalid-Link ist bewusst artworkfrei und zeigt keine parallele Loading-/Marketing-Copy.
- Der Abschlussaudit fand zwei gestapelte Welcome/Auth-Heroes. Auth wird auf Welcome nun als funktionaler Teil derselben Brand-Surface komponiert; Komponenten- und Browser-Evidence pruefen genau eine Hero-Surface.
- Zwei Beta-Versuche blieben rot: zuerst wegen case-sensitivem Titelvergleich bei visuell transformierter Copy, danach wegen erwarteter Offline-Netzfehler im globalen Browserfehlerfilter. Beide Ursachen wurden im QA-Harness isoliert behoben; nur der danach vollstaendig gruene Lauf gilt als Gate.

## Bewusste Planabweichungen

- `PlaceholderView.tsx` blieb unveraendert, weil die Komponente in keinem aktiven R9-Pfad gerendert wird.
- `PwaUpdateNotice.tsx`, Manifestname, Farben und Icons blieben unveraendert. Das Notice ist operativ; der OS-Splash bleibt nativ und ohne kuenstliche Startverzoegerung.
- Persistierte Before-Screenshots existieren fuer die primaeren 393-/834-Figma-Breiten; die zusaetzlichen drei Breiten wurden nachher persistiert und vorher/nachher fachlich ueber denselben Browser-Vertrag vermessen. Eine nachtraeglich rekonstruierte Baseline wurde nicht als originale Vorher-Evidence ausgegeben.
- Die vollstaendig persistierte 5×2-Browsermatrix konzentriert sich auf das neutrale Welcome/Login. Auth-Loading, Missing-config, Install, Public/Kiosk-Welcome und No-Roster sind in den primaeren 393-/834-Figma-Frames sowie in Komponenten-/gezielten Browservertraegen belegt, aber nicht als eigene neutrale 5×2-Screenshotserie dupliziert. Das vermeidet einen produktiven QA-Harness nur fuer Screenshots und wird als bewusste Evidence-Grenze offengelegt.
- Kein separates physisches Geraetegate wurde als bestanden behauptet, weil in diesem Lauf keine Hardware bereitstand.

## Offene Grenze

R10 bleibt fuer den spaeteren breiten States-/Polish-Sweep zustaendig. R9 zieht keine Analyse-, Utility-, Error-/Offline- oder Live-Screen-Umbauten vor.
