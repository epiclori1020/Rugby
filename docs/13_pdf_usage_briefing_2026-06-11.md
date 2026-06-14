# PDF-Nutzungsbriefing print_pdfs

Stand: 13. Juni 2026

Hinweis: Der Ordner `print_pdfs/` wurde auf eine einzige Zeitachsen-Struktur umgestellt. Diese Datei beschreibt, was du wann nutzt. Der alte Stand liegt vollstaendig in `print_pdfs_ALT_archiv_2026-06-13/`.

## Ordnerstruktur

- `1_DIESE_WOCHE_drucken/` = Di 16.06 + Do 18.06 ausdrucken.
- `2_NACHSCHLAGEN_ipad_nicht_drucken/` = Rueckhand am iPad, nicht drucken.
- `3_AB_KW26_BIS_URLAUB/` = laufende Trainingstage bis zum Urlaub.
- `4_URLAUB_AUGUST/` = 3.-24. August, wenn Arwin weg ist.
- `5_NACH_URLAUB_ab_kw35/` = Platzhalter, Block wird noch erstellt.
- `_ARCHIV_nicht_drucken/` = alte Fassungen, ignorieren.

## Diese Woche drucken (Ordner 1)

1. `1_DIENSTAG_trainingsplan` - 1x.
2. `2_COACH_SCRIPT_di_do` - 1x (gilt Di + Do).
3. `3_DIENSTAG_checkin_3x` - 2-3x (fuer ~20 Spieler).
4. `4_DONNERSTAG_trainingsplan` - 1x.
5. `5_OPTIONAL_einwilligung_20x` - nur falls Unterschriften noetig.
6. `6_NOTFALL_admin_vor_dienstag` - 1x. Notfall- und Kontaktfelder vor Dienstag ausfuellen: verantwortlicher Coach, Vereinsansprechperson, Physio/Arzt erreichbar, Erste-Hilfe-Material, Rettungszugang.

## Aktive Logik Di/Do

Dienstag 16. Juni:

- Onboarding + Training.
- Kein Testtag, kein 30 m, kein Bronco, keine offiziellen Vergleichswerte.

Donnerstag 18. Juni:

- Training + optionale Mini-Baseline.
- Mini-Baseline nur, wenn Gruppe ruhig und sicher ist: Broad Jump 2 Versuche + Med-Ball Chest Pass 2 Versuche.
- Kein 30 m, kein Bronco.

Bronco:

- Nicht in KW25/KW26 nachholen. Nur spaeter, wenn der Benchmark wirklich gebraucht wird.

## Am Platz dokumentieren

Auf dem Check-in-/Beobachtungsblatt:

- Name.
- Position.
- Readiness 1-5.
- Schmerz 0-10 + Ort.
- Life-Flag kurz.
- Returner/Limit.
- Ampel.
- Auffaellige Bewegungsnotiz.
- sRPE + Pain/Issue nach der Einheit.

Nicht erfassen: Test-/Rankingdaten oder organisatorische Messdetails.

## Ab KW26 bis Urlaub (Ordner 3)

- KW25-27 und KW28-31 One-Page Field Cards.
- Progression-Tracker (2-3x drucken).
- Variantenkarte A+/A/B/C/D.
- Exercise-Pool-Mapping.
- optionale Detail-Coach-Cards und Pre-August-Gesamtueberblick als Backup.

## August (Ordner 4)

- `august_ablauf` und `august_remote_feedback`.
- Erst kurz vor der Augustpause relevant.

## Wichtig

`print_pdfs/` wird vom Skript `scripts/export_print_pdfs.py` erzeugt. Inhalte werden nicht von Hand im PDF-Ordner geaendert, sondern in den Markdown-Quellen; danach das Skript neu laufen lassen.
