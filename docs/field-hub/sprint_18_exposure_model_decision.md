# Sprint 18 Exposure Model Decision

Stand: 21. Juni 2026

## Entscheidung

Sprint 18 nutzt **Option B: kompakte Player-Session-Summary** ueber die neue Tabelle
`player_exposure_summaries`.

Option A, detaillierte `player_exposures` als Zeile pro Spieler, Session, Block und
Exposure-Typ, wird bewusst nicht umgesetzt.

## Begruendung

- `session_block_logs` speichert seit Sprint 16 bereits die Blockebene: Block-Key,
  Reihenfolge, Status, Grund und Notiz.
- Sprint 18 soll vor allem beantworten, welche Trainingsreize ein Spieler in einer
  Einheit tatsaechlich bekommen hat und wo Luecken entstehen, z. B. kein Speed in
  den letzten Einheiten.
- Eine detaillierte Block-Exposure-Tabelle wuerde die Zeilenanzahl um Spieler x
  Bloecke x Tags erhoehen, ohne dass die aktuelle MVP-UI diese Granularitaet nutzt.
- Die kompakte Summary ist besser fuer iPad/iPhone-Sync, Backup, CSV und Player
  Detail geeignet.

## Gewaehltes Modell

`player_exposure_summaries` enthaelt eine Zeile pro Coach-User, Session und Spieler.
Die Exposure-Typen werden als Status-Spalten gespeichert:

- `none`
- `completed`
- `reduced`
- `skipped`

Die automatische Ableitung kommt aus:

- `SessionBlock.exposureTags`
- `session_block_logs.status`
- Anwesenheit in `player_session_entries`
- Spieler-Limits wie `kein_sprint`, `kein_cond`, D/Rot/klaeren/physio
- neuesten Returner-Caps

Manuelle Coach-Overrides werden pro Exposure-Typ in `manual_overrides` gespeichert
und bleiben bei erneuter Default-Erzeugung erhalten.

## Sicherheitsgrenze

Exposure Tracking ist Trainingsdokumentation. Es impliziert keine medizinische
Freigabe und ersetzt keine Physio-/Medical-Entscheidung.
