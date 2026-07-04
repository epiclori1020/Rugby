# OnField Sports Configuration Model

Stand: 2026-07-04

## Zweck

Dieses SSOT klaert, welche Teile von OnField generisch sind und welche Teile sportartspezifisch konfiguriert werden sollen. OnField Rugby ist der erste reale Preset, aber nicht die generische Produktarchitektur.

## Verbindliche Regeln

- Generische Architektur nutzt sportartenuebergreifende Begriffe.
- Rugby-spezifische Inhalte gehoeren in OnField Rugby, Content-Konfiguration oder spaetere Preset-Dateien.
- Generische Komponenten duerfen nicht hart auf Rugby-Positionen, Rugby-Metriken oder Rugby-Workflows begrenzt werden.
- Sport-Konfiguration darf den Coach-Workflow anpassen, aber nicht iPhone/iPad-Paritaet brechen.
- Safety- und Verantwortungsgrenzen gelten fuer alle Sportarten.

## Generische Kernobjekte

| Objekt | Bedeutung |
|---|---|
| Athlete | Person, die in Einheiten beobachtet, gesteuert oder ausgewertet wird |
| Team | organisatorische Gruppe |
| Session | konkrete Einheit oder Termin |
| Check-in | Vorab-Erfassung von Anwesenheit und Tagesstatus |
| Training | Live-Steuerung und Dokumentation waehrend der Einheit |
| Post-session | Nachbereitung, Pflichtwerte, Review und offene Aufgaben |
| Reconditioning | belastungsbezogene Rueckfuehrung in Trainingsteile |
| Metric | Messwert oder Skala |
| Load | Belastung oder Belastungsindikator |
| Readiness | Tagesstatus oder Einsatzbereitschaft als Coach-Synthese |
| Analysis | Rueckblick, Trends, Filter und Auswertung |
| Library | Inhalte, Templates, Dokumente und Referenzen |
| Sync | lokaler Speicher-, Pending- und Remote-Zustand |
| Export | Datenausgabe und Backup |

## OnField Rugby Preset

OnField Rugby darf enthalten:

- Rugby-Positionen: Front Row, Locks, Back Row, Halves, Centres, Back Three.
- Rugby-nahe Gruppen: Forwards, Backs, Position Groups.
- Rugby-spezifische Session-Typen, Kontaktphasen, Speed/COD/Conditioning/Contact Caps.
- Rugby-spezifische Labels fuer Blocks, Exposures und Returner-Kontexte.
- Inhalte aus Rugby Donau S&C, sofern keine sensiblen echten Spielerdaten committed werden.

## Texte und Inhalte aus Konfiguration

Perspektivisch konfigurierbar sein sollten:

- Sportname und Preset-Name.
- Positionsliste und Position Groups.
- Session-Typen und Blocknamen.
- Metric-Namen, Skalenlabels und Helper-Texte.
- Ampel-/Readiness-Kurztexte.
- Returner/Reconditioning-Cap-Kategorien.
- Library-Kategorien und Vorlagen.
- Kiosk/Public-Check-in-Texte.

## Vorerst hart bleiben darf

Im Coach-MVP darf noch hart im Code oder Content bleiben:

- bestehende Rugby-Begriffe in aktuellen Screens, bis ein eigener Refactor-Sprint sie extrahiert.
- bestehende lokale Datenformate, wenn kein Migrationssprint geplant ist.
- vorhandene Returner-Felder, solange die UI keine generische Multi-Sport-Konfiguration verspricht.
- App-Pfade unter `app/field-hub`, solange Produkt-SSOTs OnField-Naming fuehren.

Diese Toleranz ist keine Dauerentscheidung. Neue generische Architektur soll nicht weiter Rugby hart einbrennen.

## Nicht-Regeln

- Sprint 0B baut keine Config-Engine.
- Sprint 0B fuehrt keine Datenmigrationen ein.
- Sprint 0B benennt keine bestehenden Code-Types um.
- Multi-Sport-Faehigkeit ist eine Produkt- und Architekturleitplanke, kein aktuelles SaaS-Feature.

## Offene Fragen

- Welche Sportart wird nach Rugby als erstes genutzt, um die Abstraktion zu testen?
- Wie werden Preset-Inhalte spaeter versioniert?
- Welche bestehenden Datenfelder muessen vor Multi-Sport-Refactor als Rugby-spezifisch markiert werden?
