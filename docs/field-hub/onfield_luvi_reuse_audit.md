# OnField LUVI Reuse Audit

Stand: 2026-07-06

## Zweck

Dieses Audit prueft, welche Muster aus dem Flutter-Projekt LUVI fuer OnField Coach in Sprint 20 sinnvoll wiederverwendet werden. LUVI liegt ausserhalb dieses Repos unter `/Volumes/Project_SSD/LUVI/app/luvi_app` und wurde nur lesend als Referenz genutzt.

Sprint 20 uebernimmt keine Flutter-Komponenten und portiert keinen Code. OnField bleibt Vite + React + TypeScript, PWA-first und operations-first. Wiederverwendet werden nur Arbeitsweisen, Audit-Formate, QA-Kriterien und Produktgrenzen, die zum OnField Coach MVP passen.

## Bewertungslogik

| Entscheidung | Bedeutung |
|---|---|
| uebernehmen | Direkt als Arbeits- oder QA-Muster in Sprint 20 oder spaeteren OnField-Dokumenten nutzen. |
| anpassen | Prinzip ist passend, aber Flutter-, Consumer-Health- oder LUVI-spezifische Teile werden nicht uebernommen. |
| nicht uebernehmen | Passt nicht zum OnField Coach MVP, wuerde Scope oder Architektur aufblasen oder widerspricht OnField-Guardrails. |

## Audit Matrix

| Pattern | LUVI-Quelle | OnField-Relevanz | Entscheidung | Begruendung | Umsetzungsfolge |
|---|---|---|---|---|---|
| Reuse Inventory mit Evidence-Spalten | `docs/audits/dashboard_reuse_inventory.md` | Hilft, LUVI-Muster nachvollziehbar statt gefuehlt zu bewerten. | uebernehmen | Die Struktur trennt Pattern, Quelle, Evidence und Risiko. Das passt zu Sprint 20, weil Beta-Readiness kein Bauchgefuehl sein soll. | Dieses Dokument nutzt eine explizite Pattern-/Quelle-/Entscheidungsmatrix. |
| Auth/Consent Audit Matrix | `docs/audits/AUTH_CONSENT_AUDIT.md` | Nuetzlich fuer externe Beta: welche Screens sind UI-only, welche sprechen Backend/Auth an, welche Tests existieren. | anpassen | OnField baut keine neuen Auth-Flows, aber die Matrix-Logik eignet sich fuer Beta-Go/No-Go und signed-in QA. | In `onfield_beta_readiness.md` wird eine Screen-/State-/Evidence-Matrix definiert. |
| Persistenz-/Resume-Audit | `docs/audits/WORKOUT_PERSISTENCE_AUDIT.md` | OnField ist offline-first; Beta muss wissen, ob Eingaben lokal bleiben, syncen und wieder erscheinen. | uebernehmen | Das LUVI-Audit trennt Soll, Ist, Findings, Evidence, Shipped und Deferred. Diese Struktur passt zu OnField Offline-/Sync-/Backup-Risiken. | Beta-Readiness enthaelt Offline-, Pending-, Retry-, Export- und Wiederaufnahme-Szenarien. |
| Definition of Done | `docs/definition-of-done.md` | Gute kompakte Release-Gate-Struktur. | anpassen | `flutter analyze` und Flutter-Tests passen nicht, aber Check-Layer und Review-Pflicht passen. | OnField nutzt `typecheck`, `lint`, `test`, `build`, Secret-Scan und PWA-Smoke als Sprint-20-Gates. |
| Privacy-/DSGVO-Checkliste | `docs/engineering/checklists/privacy.md` | Externe Beta braucht Datenschutz-Minimierung und klare Evidenzgrenzen. | anpassen | LUVI ist Health/FemTech mit staerkerer Compliance-Tiefe; OnField braucht MVP-gerechte Beta-Pruefung, keine vollstaendige Legal-Freigabe. | Beta-Doku markiert Privacy/Safety als operative Checkliste, nicht als juristische Endfreigabe. |
| Safety Scope SSOT | `docs/product/safety_scope.md` | Gute Trennung zwischen erlaubter Guidance und medizinischer Grenze. | anpassen | LUVI spricht Consumer-Health; OnField spricht Coach-Operations. Gemeinsames Prinzip: keine Diagnose, keine Behandlung, klare Ruecksprache. | Beta-Doku erzwingt OnField-Sprache: Coaching-Hinweis, keine medizinische Entscheidung. |
| A11y Semantics Reference | `docs/engineering/skill-references/a11y-audit.md` | Relevant fuer iPhone/iPad, Touch Targets, Labels und Fokus. | uebernehmen | Semantics-, Header-, Toggle-, Textfeld- und Touch-Target-Muster sind technologieuebergreifend als Pruefpunkte nutzbar. | Beta-Readiness fordert Screen-QA fuer Labels, Fokus, 44px/48px Touch Targets und Status nicht nur ueber Farbe. |
| Design Token Disziplin | `lib/core/design_tokens/README.md`, `lib/core/theme/app_theme.dart` | OnField hat bereits `--of-*` Tokens und ein Component Kit. | uebernehmen | Prinzip "keine zufaelligen Farben/Spacing in Screens" passt exakt zum OnField Designsystem. | Keine neuen Tokens in Sprint 20; LUVI bestaetigt nur die Pruefregel fuer spaetere UI-Sprints. |
| Safe-Area-/Bottom-CTA-Prinzip | `lib/features/auth/widgets/auth_bottom_cta.dart` | iPhone Home Indicator und Tastaturverhalten sind fuer PWA-Feldnutzung wichtig. | anpassen | Flutter-Code ist nicht portierbar, aber das Prinzip SafeArea + Keyboard-Inset + stabile CTA-Reserve passt. | Beta-QA prueft Bottom Nav, installierte PWA, Tastatur-/Form-Zustaende und Safe Areas. |
| Error Live Region | `lib/core/widgets/error_scaffold.dart` | OnField Fehler muessen coachnah und fuer Assistive Tech erfassbar sein. | anpassen | OnField hat eigene React-Komponenten; Prinzip `live region` und klare Recovery ist passend. | Beta-Doku prueft Fehlertexte, Retry und `aria-live`/sichtbare Rueckmeldung in relevanten Flows. |
| Auth Screen Shell | `lib/features/auth/widgets/auth_screen_shell.dart` | Gute mobile Form-Shell mit Scroll und Keyboard Dismiss. | nicht uebernehmen | Sprint 20 baut keine Auth-UI um. OnField Auth/Brand-Surfaces sind bereits Sprint-7-Stand. | Nur als spaetere Referenz fuer mobile Form-QA merken, kein Code/Design-Umbau. |
| Welcome/Auth Buttons | `lib/core/widgets/welcome_button.dart`, Auth Widgets | Loading, disabled und Semantics sind gute Prinzipien. | anpassen | LUVI-Button-Stil ist Consumer-Health und pink/magenta; OnField nutzt Field Graphite und bestehende Buttons. | Keine visuelle Uebernahme; Beta-QA prueft Loading/Disabled/Accessible Name. |
| LUVI Consumer-Health Palette | `lib/core/design_tokens/colors.dart` | Farb- und Tonalitaetskontext ist anders. | nicht uebernehmen | OnField hat Field Graphite. LUVI-Gold/Magenta/Cream wuerde OnField Richtung Consumer-Health verschieben. | Keine Farb-, Font- oder Hero-Uebernahme. |
| Lottie-/Video-/Hero-Assets | LUVI Assets in `assets/animations`, `assets/videos`, Welcome/Splash | Nicht noetig fuer Sprint 20. | nicht uebernehmen | Sprint 20 ist Beta-Readiness, keine Marketing- oder Splash-Produktion. Live-Coaching darf nicht hero-lastig werden. | Keine Bildtools, keine generierten Marketingassets, keine neuen Figma-Frames. |
| Riverpod/GoRouter Architektur | `lib/features/*`, `lib/core/navigation` | Technisch anderes Stack-Modell. | nicht uebernehmen | OnField ist React/Vite mit bestehender Navigation und kein Native-Rewrite-Sprint. | Keine Architekturuebernahme. Native wird nur ueber Entscheidungskriterien vorbereitet. |
| Edge-Function-Consent-Komplexitaet | LUVI `ConsentService`, Privacy Reviews, HMAC Runbook | Zu schwer fuer OnField Coach MVP. | nicht uebernehmen | OnField hat Consent als Status und keine digitale Consent-Signatur oder Edge Functions im Scope. | Keine Edge Functions, keine HMAC-Key-Rotation, keine neue Supabase-Komplexitaet. |
| SQLCipher/Secure Storage | LUVI native/mobile Sicherheitsstack | Nicht passend fuer PWA-first Sprint 20. | nicht uebernehmen | OnField nutzt browserseitige PWA/IndexedDB/Supabase. Native Storage ist erst bei Native-Entscheidung relevant. | Nur als spaeteres Native-Kriterium vormerken, keine Umsetzung. |
| Incident-/Key-Rotation Runbooks | LUVI `docs/runbooks/*` | Externe Beta braucht Incident-Grundregeln, aber keine Enterprise-Automation. | anpassen | 72h-Meldeweg, Eindämmung, Key-Rotation-Prinzip sind wichtig; konkrete LUVI-Automation ist zu schwer. | Beta-Doku enthaelt einfache Eskalations- und Secret-Rotationsregeln ohne neue Toolchain. |

## Uebernommene Sprint-20-Prinzipien

- Jede Beta-Readiness-Aussage braucht Evidence: gepruefter Screen, Zustand, Geraet oder Testkommando.
- Privacy/Safety bleibt ein Release-Gate, aber Sprint 20 ersetzt keine juristische Endfreigabe.
- Offline-/Sync-/Resume-Verhalten wird als eigener Beta-Risikobereich behandelt.
- Accessibility wird nicht nur als Kontrastpruefung verstanden: Labels, Fokus, Touch Targets, Status mit Text und Error-Recovery gehoeren dazu.
- Keine technische Uebernahme aus LUVI, wenn sie OnField PWA-first, Coach-MVP oder Sprint-Scope aufblaeht.

## Nicht uebernommene Bereiche

- Flutter Widgets, Riverpod Provider, GoRouter Guards und native Mobile-Architektur.
- LUVI Branding, Consumer-Health-Visuals, Lottie/Video/Splash-Assets.
- Social Signup, Player/User-Portale oder offene Registrierung.
- Edge Functions, HMAC Consent Hashing, SQLCipher, native Secure Storage und komplexe Key-Rotation-Automation.

## Konsequenz fuer Sprint 20

LUVI verbessert Sprint 20 vor allem als Qualitaets- und Audit-Vorbild. Die OnField-Umsetzung bleibt bewusst schlank: drei Beta-/Entscheidungsdokumente, minimale README-Verlinkung, keine neue App-Architektur und keine neuen Runtime-Features.

## Sprint-25-Addendum: Designsystem, A11y & Responsive Hardening

Stand: 2026-07-07

Sprint 25 nutzt LUVI erneut nur lesend als Musterabgleich. Die Uebernahme bleibt auf robuste UI-/QA-Prinzipien begrenzt; OnField bleibt Vite + React + TypeScript, PWA-first und Field-Graphite-basiert.

| LUVI-Quelle | OnField-Entscheidung | Umsetzung in Sprint 25 | Begruendung |
|---|---|---|---|
| `lib/features/auth/widgets/rebrand/auth_button_base.dart` | anpassen | OnField-Buttons nutzen Loading-Copy, `aria-busy` und sichtbare Disabled-Gruende ueber bestehende `PrimaryButton`/`SecondaryButton`. | Das Semantik-Prinzip ist technologieuebergreifend; Flutter-Widget und LUVI-Visuals werden nicht portiert. |
| `test/features/auth/widgets/auth_button_base_test.dart` | uebernehmen als Testidee | Existing Core-Button-Tests bleiben Grundlage; Sprint 25 erweitert betroffene UI-Stellen statt neue Button-Architektur zu bauen. | LUVI bestaetigt, dass Loading/Disabled nicht nur visuell, sondern semantisch verifiziert werden muss. |
| `lib/core/design_tokens/breakpoints.dart` | anpassen | `744px` wird als Medium-QA-Viewport ergaenzt; OnField-SSOT bleibt `compact <600`, `medium 600-839`, `expanded >=840`. | LUVI `tabletSmall` ist als Split-/Tablet-kleine Breite praktisch, ersetzt aber nicht die OnField-Breakpoints. |
| `lib/core/design_tokens/sizes.dart` | uebernehmen als Guardrail | Touch Targets bleiben mindestens 44px; field-kritische Actions bleiben 48-56px. | Passt zu OnField PWA/A11y-SSOT und iPhone/iPad-Paritaet. |
| `lib/core/widgets/bottom_nav_layout_constants.dart` | anpassen | Bottom-Nav-/Safe-Area-Clearance wird in CSS und PWA-QA fuer Medium/iPhone weitergeprueft. | Prinzip passt; Flutter-Konstanten werden nicht uebernommen. |
| `test/dev/audit/ui_guard_audit_test.dart` | anpassen | Sprint 25 nutzt fokussierte CSS-/PWA-/Copy-Tests statt breitem, brittle Source-Scan. | OnField hat noch Legacy-Migration; ein zu breiter Gate wuerde alte bekannte Stellen blockieren statt Sprint-25-Risiken zu pruefen. |
| LUVI Palette, Glass/Hero/Lottie/Video Assets | nicht uebernehmen | Keine neuen Bild-KI- oder LUVI-Assets; maskable Icons werden deterministisch aus bestehendem OnField-Icon abgeleitet. | OnField Live-Flows muessen ruhig, operativ und reproduzierbar bleiben. |
| Riverpod/GoRouter/native Architektur | nicht uebernehmen | Keine Routing- oder Native-Architektur aus LUVI in Sprint 25. | Sprint 24 hat OnField-Routing bereits abgeschlossen; Sprint 25 ist UI-/A11y-/Responsive-Hardening. |
