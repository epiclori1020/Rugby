# OnField Tone of Voice

Stand: 2026-07-04

## Zweck

Dieses SSOT definiert die Sprache fuer OnField Coach. Es gilt fuer Coach-UI, Safety-Hinweise, Pain/Returner-Kontexte, Sync, Fehler, Empty States, Disabled States und Marketing-Surfaces.

## Verbindliche Regeln

- Coach-UI ist kurz, ruhig, konkret und handlungsnah.
- OnField spricht wie ein gutes Feld-Operations-Tool: sachlich, verantwortungsvoll, nicht dramatisch.
- Jeder Status braucht eine kurze Ursache oder einen klaren naechsten Schritt.
- Keine technischen Rohbegriffe, wenn eine Coach-nahe Formulierung moeglich ist.
- Keine Diagnose-, Clearance- oder automatische Freigabesprache.
- Safety-Hinweise markieren Verantwortungsgrenzen: Coaching-Hinweis, keine medizinische Entscheidung.
- Marketing-Sprache darf mehr Marke tragen, aber nicht laut, gamifiziert oder motivational ueberdreht werden.
- Live-Screens verwenden keine langen Erklaertexte. Details gehoeren in Sheet, Pane oder Hilfe.
- Disabled States muessen den Grund nennen.

## Coach-UI Sprache

Gut:

- `Einheit fortsetzen`
- `Naechsten offenen Punkt erfassen`
- `3 Aenderungen warten auf Sync`
- `Belastung heute begrenzen`
- `Ruecksprache empfohlen`
- `Modifizieren`
- `Stoppen und abklaeren`

Vermeiden:

- technische interne Begriffe wie `pending write queue`
- generische Fehler wie `Something went wrong`
- motivationale Sprueche
- alarmistische Warntexte ohne Handlung

## Safety, Pain und Returner

Zulaessige Formulierungen:

- `Hinweis fuer Coaching-Entscheidung. Keine medizinische Entscheidung.`
- `Schmerz 4/10 angegeben. Belastung modifizieren und beobachten.`
- `Kontakt heute begrenzen. Ruecksprache empfohlen, wenn Symptome steigen.`
- `Heute erlaubt: Sprint-Cap 60 Prozent. Heute absolviert: 40 Prozent.`
- `Stoppen und abklaeren, wenn Schmerz oder Unsicherheit zunimmt.`

Verbotene Beispiele:

- `cleared`
- `fit`
- `RTP approved`
- `Return-to-play freigegeben`
- `medizinisch freigegeben`
- Diagnoseformulierungen wie `Zerrung`, `Riss` oder `verletzt wegen ...`, sofern sie als App-Entscheidung wirken

## Ampel- und Statussprache

Ampel ist eine Coach-Synthese, keine Freigabe.

| Status | Beispiel | Regel |
|---|---|---|
| Gruen | `Gruen - normal planen` | Nur mit Kurzgrund oder fehlender Auffaelligkeit. |
| Gelb | `Gelb - Schmerz 4/10, modifizieren` | Immer mit Grund und Handlung. |
| Rot | `Rot - stoppen und abklaeren` | Keine Diagnose, klare Verantwortungsgrenze. |

## Sync- und Offline-Sprache

Gut:

- `Online`
- `Offline - Daten werden lokal gespeichert`
- `Lokal gespeichert`
- `3 Aenderungen warten auf Sync`
- `Zuletzt synchronisiert 16:24`
- `Konflikt bei 1 Datensatz - pruefen`
- `Sync fehlgeschlagen - erneut versuchen`

Vermeiden:

- `mutation failed`
- `service worker error`
- `IndexedDB write pending`
- reine Icons oder Dots ohne Text

## Fehler, Empty States und Disabled States

Fehler:

- Sage, was betroffen ist.
- Sage, was der Coach jetzt tun kann.
- Technische Details nur optional in Details.

Empty States:

- Ein Satz Zustand.
- Eine direkte naechste Aktion.
- Kein illustrativer oder marketinglastiger Text in Live-Flows.

Disabled States:

- Keine still deaktivierten Primaeraktionen.
- Beispiel: `Kein Netz - wird lokal gespeichert` statt grauem Button ohne Grund.

## Marketing-Sprache

Marketing-Surfaces duerfen OnField breiter erklaeren:

- ruhig
- robust
- coach-first
- field-ready
- sportartenuebergreifend

Marketing darf nicht behaupten, medizinische Entscheidungen zu treffen, Verletzungen zu verhindern oder Leistung zu garantieren.

## Nicht-Regeln

- Dieses Dokument ist kein Copydeck fuer jeden Screen.
- Begriffe duerfen je Sport-Preset angepasst werden, solange die Verantwortungsgrenzen bleiben.
- Medizinische Begriffe koennen in von Menschen eingegebenen Notizen vorkommen; die App darf sie nicht als eigene Entscheidung formulieren.

## Offene Fragen

- Welche Begriffe sollen fuer deutschsprachige und englischsprachige Varianten standardisiert werden?
- Braucht OnField vor externer Beta ein separates Privacy-/Consent-Copy-SSOT?
- Welche Safety-Hinweise sollen mit Physio/Medical abgestimmt werden?
