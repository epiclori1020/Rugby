# OnField KW30 Donnerstag Integration Design

Datum: 21. Juli 2026

Status: vom Nutzer freigegeben

## Ziel

Die bestehende generische OnField-Session fuer Donnerstag, 23. Juli 2026, wird durch den aktuell ausgearbeiteten kontrollierten KW30-Off-Season-Entwicklungsreiz ersetzt. Zusaetzlich wird die heutige Session vom Dienstag, 21. Juli 2026, auf die tatsaechlich vorgesehene Session 4B mit den bereits vorhandenen Unterlagen vom 16. Juli umgestellt. Kompaktplan, Check-in/Nachbereitung und insbesondere die Deep Playbooks werden als aktive Offline-PDF-Unterlagen in OnField Coach integriert und aus Einheit sowie Bibliothek erreichbar gemacht.

## Verbindlicher Scope

- Die kanonische Session-ID `kw30-do-2026-07-23` bleibt stabil, damit bestehende lokale und synchronisierte Session-Bezuege nicht brechen.
- Die kanonische Session-ID `kw30-di-2026-07-21` bleibt ebenfalls stabil. Ihr Inhalt wird auf die bereits geplante und heute auszufuehrende Session 4B umgestellt; die Session-ID und das heutige Datum bleiben erhalten.
- Die bereits vorhandenen KW29-Donnerstag-PDFs werden als aktives 4B-Paket typisiert und sowohl der historischen Session vom 16. Juli als auch der heutigen Session vom 21. Juli zugeordnet.
- Titel, Zusammenfassung, Ziele, Timeline, Materialien, Safety Notes und Coach Notes der Session werden auf den neuen 90-Minuten-Plan aktualisiert.
- Die drei aktiven PDFs werden mit stabilen `/library/`-URLs nach `app/field-hub/public/library/` uebernommen:
  - Training kompakt.
  - Check-in und Beobachtung, zwei Seiten.
  - Deep Playbook, 16 Seiten.
- `pdfRefs.ts` erhaelt drei neue typisierte Referenzen. Das Deep Playbook wird in der Reihenfolge der Session-PDFs zuerst angeboten, danach Kompaktplan und Check-in/Nachbereitung.
- `library.ts` erhaelt ein aktives KW30-Donnerstagspaket mit kurzen App-Inhalten zu Ablauf, Hauptprogression, Safety und Kuertzungslogik.
- Session und relevante Timeline-Bloecke referenzieren dieses Bibliothekspaket. Dadurch erscheint es automatisch unter `Heute relevant` fuer die gewaehlte Session und bleibt unter `Aktive Plaene` auffindbar.
- Die bestehende App-UI und der bestehende PDF-Viewer werden wiederverwendet. Es entsteht keine Markdown-/PDF-Parser-Pipeline, kein Backend, kein neues Datenmodell und keine neue Navigation.
- iPhone und iPad erhalten identische Inhalte und Funktionen; nur die bestehende responsive Darstellung unterscheidet sich.

## Session-Abbildung

### Dienstag 21. Juli

Die heutige App-Session nutzt die vollstaendige 4B-Charakteristik: Check-in und RAMP, A-Skip und kontrollierte Speedqualitaet, kurzer Power-Primer, zwei Kraftsaetze bei RPE 6-7, clusterspezifische Robustheit sowie nur optionale extensive Tempoarbeit. OnField zeigt damit heute nicht mehr die alte harte 5A-Vorschau.

Die PDF-Reihenfolge fuer heute ist Deep Playbook, Training kompakt und Check-in/Beobachtung. Die PDF-Dateien behalten ihr fachlich korrektes Erstellungsdatum 16. Juli; die App bezeichnet die aktive Session klar als heutige Session 4B.

### Donnerstag 23. Juli

Die Timeline wird von drei groben Altbloecken auf die acht Coach-Bloecke des aktuellen Plans erweitert:

1. Check-in, 0-5 Minuten.
2. RAMP/Mobility, 5-14 Minuten.
3. Track und COD Prep, 14-22 Minuten.
4. Speed/COD, 22-35 Minuten.
5. Power, 35-43 Minuten.
6. Kraft-Pods, 43-69 Minuten.
7. Cluster und Robustheit, 69-79 Minuten.
8. Ball-in-Play plus Abschluss, 79-90 Minuten.

Die stabilen Block-Keys werden aus Session-ID und neuen semantischen Slugs gebildet. Exposure Tags, Bibliotheksreferenzen und kurze Feld-Cues werden pro Block gesetzt. Der App-Inhalt bildet die im Kompaktplan festgelegten Dosen ab, ohne das komplette Deep Playbook als UI-Text zu duplizieren.

## Sicherheits- und Inhaltsregeln

- Kein Max-Sprint, Timing-Rennen, Max-Lift, Bronco oder Full Contact.
- Fly nur fuer gruene, symptomfreie und technisch stabile Speed/Space Backs.
- COD bleibt geschlossen und geplant; kein reaktiver oder harter 90-/180-Grad-Cut.
- Hauptlift drei Arbeitssaetze bei RPE 7; kein Grind. A+ bleibt individuell und ist kein Teamdefault.
- Zwei Ball-in-Play-Serien sind die Obergrenze; bei Zeitdruck wird zuerst die zweite Serie gestrichen.
- Contact Prep bleibt Kontaktindex 0-1.
- Returner-Caps fuer Speed, COD/Deceleration, Conditioning und Kontakt bleiben getrennt.
- Kopf-, Nacken-, Schwindel- oder neurologische Warnzeichen bedeuten Stopp, medizinische Abklaerung und keine Rueckkehr am selben Tag. OnField erteilt keine medizinische Freigabe.

## Datenfluss und Offline-Verhalten

Die statische `SessionDefinition` bleibt die Arbeitsgrundlage fuer Heute, Einheit, Check-in, Training und Nachbereitung. PDF-Referenzen zeigen ausschliesslich auf gleichnamige lokale Assets in `public/library`. Der bestehende PWA-Build nimmt PDFs in den Precache auf; `prewarmPdfAssets` bleibt unveraendert. Dynamische Spieler- und Sessiondaten werden nicht migriert, weil die Session-ID bestehen bleibt.

## Fehler- und Fallbackverhalten

- Fehlende PDF-Dateien werden durch den bestehenden Library-Integrity-Test blockiert.
- Unbekannte Bibliotheksreferenzen und instabile Block-Keys werden durch bestehende Content-Tests blockiert.
- Der bestehende PDF-Viewer behaelt Loading-, Timeout-, Direkt-oeffnen- und Schliessen-Verhalten.
- Wenn der neue Plan am Feld gekuerzt werden muss, bleiben Check-in, Speed-/Power-Qualitaet, sichere Hauptkraft und Abschlussdaten erhalten; die Reihenfolge der Kuertzungslogik steht im App-Inhalt und Deep Playbook.

## Teststrategie

1. Neue Content-Tests werden zuerst geschrieben und muessen vor der Implementierung wegen fehlender KW30-Referenzen fehlschlagen.
2. Die Tests pruefen:
   - dass `kw30-di-2026-07-21` Session 4B statt der alten Session 5A anzeigt und auf das vollstaendige 4B-PDF-Paket verweist;
   - die acht erwarteten stabilen Block-Keys;
   - Datum, Titel, Hauptdosen und Safety Notes der Session;
   - Reihenfolge und Erreichbarkeit der drei PDF-Referenzen;
   - Existenz der drei Assets in `public/library`;
   - Erreichbarkeit des KW30-Bibliothekspakets aus Session und Bloecken.
3. Danach laufen mindestens fokussierte Tests, Typecheck, Lint, Build und `qa:local`.
4. Die gebaute App wird auf iPhone- und iPad-Viewport geoeffnet. Geprueft werden Session-Auswahl, Timeline, `Heute relevant`, Library-Detail und eingebettetes Deep Playbook.

## Lieferung

Alle neuen Trainingsquellen, erzeugten PDFs, App-Assets, Content-Aenderungen, Tests und gegebenenfalls qualifizierende Memory-Updates werden gemeinsam auf `main` committed. Erst nach erfolgreicher Verifikation wird `main` zu `origin/main` gepusht und die lokale App auf der verifizierten Route angezeigt.
