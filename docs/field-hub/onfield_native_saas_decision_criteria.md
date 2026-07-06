# OnField Native and SaaS Decision Criteria

Stand: 2026-07-06

## Zweck

Dieses Dokument legt fest, wann OnField Coach nach der externen Beta eine Native-App- oder OnField-Performance-Plattformentscheidung neu bewerten soll. Es ist kein Auftrag, Native, Flutter, React Native, Multi-Tenant-SaaS oder Plattformmodule in Sprint 20 zu bauen.

Aktueller Stand bleibt: OnField Coach ist PWA-first, OnField Rugby ist der erste Sport-Preset, und OnField Performance ist eine spaetere Plattformrichtung.

## Aktuelle Default-Entscheidung

| Thema | Default nach Sprint 20 |
|---|---|
| App-Technologie | Vite + React + TypeScript PWA bleibt aktiv. |
| Mobile Strategie | iPhone und iPad muessen fachlich denselben Funktionsumfang haben. |
| Native | Spaeter pruefen, aber nicht aus Gefuehl oder wegen einzelner UI-Wuensche. |
| SaaS | Spaeter als eigene OnField Performance Roadmap, nicht im Coach-MVP. |
| Supabase | Schlank, clientseitig, publishable key, RLS, keine neue Komplexitaet ohne eigenen Sprint. |

## Wann Native sinnvoll neu bewertet wird

Native/Flutter/React Native wird erst ernsthaft geprueft, wenn externe Beta-Daten wiederholt zeigen, dass PWA-first einen Kernflow nicht verlaesslich genug traegt.

### Starke Ausloeser

- Installierte PWA ist auf mehreren echten iPhone/iPad-Geraeten fuer Beta-Coaches nicht verlaesslich startbar.
- Offline-App-Shell, lokales Speichern oder Cache-Verhalten bleibt trotz PWA-Hardening unzuverlaessig.
- Kamera, Files, Push, Background Tasks, Share Sheet oder lokale Benachrichtigungen werden zu echten Kernanforderungen.
- iOS/Safari-Limits verhindern wiederholt Feldnutzung in Check-in, Training oder Nachbereitung.
- App-Store-, MDM- oder Vereinsgeraete-Verteilung wird Voraussetzung fuer reale Nutzung.
- Performance oder Touch-Verhalten bleibt auf echten Geraeten fuer 15-20 Spieler nicht akzeptabel.

### Schwache Ausloeser

Diese Punkte reichen alleine nicht fuer Native:

- Die PWA fuehlt sich weniger "appig" an als eine native App.
- Einzelne Coach-Wuensche nach App Store ohne Nutzungshindernis.
- Einzelne Browser-Caches oder lokale Setup-Probleme.
- Wunsch nach nativer Optik, bevor IA, Workflows und Beta-Daten stabil sind.
- Wiederverwendung vorhandener Flutter-Komponenten aus LUVI als Selbstzweck.

## Native Bewertungsmatrix

| Kriterium | PWA weiter | Native pruefen |
|---|---|---|
| Installation | Coaches koennen PWA installieren und wiederfinden. | Installation scheitert wiederholt trotz Anleitung. |
| Offline | App-Shell, lokale Daten und Backup reichen fuer Trainingstag. | Offline/Pending-Verhalten blockiert Kernflow wiederholt. |
| Geraete | iPhone/iPad-Paritaet funktioniert ueber responsive PWA. | Geraete-APIs oder OS-Integration werden Kernanforderung. |
| Distribution | Kontrollierte URLs und Accounts reichen. | App Store, TestFlight, MDM oder Managed Devices werden Pflicht. |
| Kosten | PWA-Hardening loest die Probleme. | Native loest belegte Probleme besser als weiteres PWA-Hardening. |
| Team-Fokus | Product/UX/Workflow sind noch groessere Risiken. | Workflows sind stabil, Plattformlimit ist das groesste Risiko. |

## LUVI als Native-Referenz

LUVI ist fuer OnField eine wertvolle Referenz fuer:

- mobile QA-Disziplin.
- Design-Token-Governance.
- Auth-/Consent-Audit-Matrizen.
- Privacy-/Safety-Runbooks.
- Persistenz- und Resume-Audits.
- Widget- und Semantics-Tests.

LUVI ist keine direkte Umsetzungsquelle fuer Sprint 20:

- Flutter Widgets werden nicht in React portiert.
- Riverpod/GoRouter ersetzen nicht die bestehende OnField-App-Architektur.
- LUVI Consumer-Health-Branding wird nicht uebernommen.
- Native Sicherheits- und Storage-Patterns werden erst relevant, wenn Native als Produktentscheidung belegt ist.

## Wann SaaS / OnField Performance sinnvoll wird

OnField Performance wird erst als eigene Plattform-Roadmap geplant, wenn externe Beta wiederholt Bedarf zeigt, der ueber den einzelnen Coach-Operations-MVP hinausgeht.

### Starke Ausloeser

- Mehrere Coaches pro Club brauchen getrennte Rechte, gemeinsame Teams oder Audit-Historie.
- Mehrere Organisationen oder Vereine sollen getrennt in einer Instanz arbeiten.
- Datenschutz- und Supportanforderungen brauchen formale Rollen, Verantwortlichkeiten und Prozesse.
- Presets fuer mehrere Sportarten muessen gepflegt, versioniert und ausgerollt werden.
- Zentrale Verwaltung, Billing, Support, App-Store-Listing oder SLA werden realer Vertriebspfad.
- Player Portal oder Team Engagement wird als eigenstaendiges Produktmodul validiert.

### Schwache Ausloeser

Diese Punkte reichen alleine nicht fuer SaaS:

- Ein einzelner Coach will mehrere Teams testen.
- Manuelle Accountanlage ist fuer eine kleine Beta unbequem.
- Ein einzelnes Feedback wuenscht Rollen oder Player-Zugang.
- OnField Performance klingt als Marke attraktiv, aber Coach-MVP-Daten fehlen.

## Spaetere Module

Folgende Module gehoeren nicht in Sprint 20 und nicht nebenbei in den Coach-MVP:

- Player Portal.
- Team Engagement.
- Leaderboards.
- Feeds.
- Challenges.
- Multi-Coach/Rollen.
- Multi-Sport Preset Management.
- Multi-Tenant Organisationen.
- Billing und Plaene.
- App-Store-Metadaten.
- Support- und Incident-Prozesse fuer oeffentliche Plattformnutzung.
- Finale Datenschutztexte und AVV-/DPA-Prozesse.

## Plattform-Roadmap Startpunkt

Eine spaetere OnField Performance Roadmap sollte erst erstellt werden, wenn:

- Beta-Feedback aus mindestens 3 externen Coach-Kontexten vorliegt.
- PWA-Grenzen nachweisbar von Produktwuenschen getrennt sind.
- klar ist, ob das naechste Problem Distribution, Rollen, Datenmodell, Multi-Sport oder Support ist.
- keine offenen Blocker in Check-in, Training, Nachbereitung, Spielerprofil, Backup oder Sync-Vertrauen bestehen.

## Nicht-Entscheidungen

- Dieses Dokument entscheidet nicht fuer Flutter, React Native oder native iOS.
- Dieses Dokument entscheidet nicht fuer Multi-Tenant SaaS.
- Dieses Dokument fuehrt keine neue Supabase-Architektur ein.
- Dieses Dokument ersetzt keine Datenschutz- oder Rechtsberatung.
- Dieses Dokument erlaubt nicht, spaetere Plattformmodule in Coach-Live-Flows einzubauen.
