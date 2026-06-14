# UX-Interaktionsaudit A/B/C - Rugby S&C Field Hub

Stand: 14. Juni 2026, abends

Scope: Spieler-Anlage, progressive Eingabe-UI, mobile Reaktionszeit, Speicher-/Auswahlfeedback, Check-in-Ampel und Safety-Auswahl. Die Audit-Abschnitte 1-8 beschreiben Befunde und Root Causes; Abschnitt 9 dokumentiert die anschliessende Umsetzung und Verifikation.

## 1. Methodik

- Code-Review der relevanten Views und Hooks:
  - `src/components/PlayersView.tsx`
  - `src/components/CheckInView.tsx`
  - `src/components/TrainingView.tsx`
  - `src/components/PostSessionView.tsx`
  - `src/components/ReturnerView.tsx`
  - `src/hooks/usePlayers.ts`
  - `src/hooks/useCheckIns.ts`
  - `src/hooks/useReturners.ts`
  - `src/domain/checkIn.ts`
  - `src/lib/checkInRepository.ts`
  - `src/index.css`
- Lokale Browser-Pruefung mit Vite Dev-Server.
- Visuelle Gegenpruefung gegen vorhandene Screenshots in `ux-audit-screenshots/`.
- Nicht-destruktive Funktionspruefung. Ich habe keine neuen Check-ins gespeichert und keine Produktivdaten absichtlich veraendert.
- Statische Verifikation:
  - `npm run typecheck`: gruen
  - `npm run lint`: gruen
  - `npm test`: 24 Testdateien, 127 Tests gruen
  - `npm run build`: gruen, PWA precache 32 Eintraege

## 2. Kritischer Nebenbefund: Stale PWA/Service-Worker kann alten UI-Code anzeigen

Beim lokalen Test gab es einen klaren Unterschied zwischen `127.0.0.1` und `localhost`.

- Auf `http://127.0.0.1:5173/` wurde im eingeloggten Browser ein alter Spieler-Screen gezeigt: das Spielerformular war dauerhaft offen und entsprach den vorhandenen Audit-Screenshots.
- Auf `http://localhost:5173/` wurde aktueller Dev-Code geladen, aber ohne die `127.0.0.1`-Auth-Session.
- Das README warnt bereits vor genau diesem Problem: alte PWA-/Service-Worker-Cache-Schichten koennen auf `127.0.0.1` alten Build-Code anzeigen.

Bewertung: Das ist eine plausible Erklaerung dafuer, dass du noch das "immer offene" Spielerformular siehst, obwohl die aktuelle Source-Datei `PlayersView.tsx` bereits ein Sheet-Modell enthaelt. Vor einer Umsetzung muss zuerst geklaert werden, ob dein iPhone/iPad die aktuelle Version oder einen alten PWA-Cache sieht.

Empfohlene Pruefung spaeter:

- Deploy-Version/Commit sichtbar machen, aber nicht als stoerendes Dev-Label.
- PWA-Update-/Reload-Hinweis einbauen, wenn eine neue Service-Worker-Version bereitsteht.
- Auf echten Geraeten einmal PWA neu laden/neu installieren und dann den Spieler-Screen erneut pruefen.

## 3. A - Eingabefenster / progressive Offenlegung

### A1. Spieler-Screen: Source ist teilweise verbessert, aber das Ziel ist noch nicht voll erreicht

Aktueller Source-Zustand:

- `isEditorOpen` startet mit `false` (`PlayersView.tsx:110`).
- Das Formular wird nur gerendert, wenn `isEditorOpen` true ist (`PlayersView.tsx:329-544`).
- `Neu` und Spieler-Listeneintraege oeffnen das Sheet explizit (`PlayersView.tsx:122-138`, `PlayersView.tsx:287-315`).

Das loest den alten Hauptfehler im Code: Das eigentliche Formular ist nicht mehr dauerhaft inline offen.

Noch offen gegen dein UX-Ziel:

- Wenn kein Editor offen ist, bleibt rechts trotzdem ein eigenes Panel `player-empty-detail` mit CTA "Neuen Spieler anlegen" stehen (`PlayersView.tsx:545-555`).
- Die Kaderliste bekommt dadurch nicht den vollen verfuegbaren Raum. Das Layout bleibt zweispaltig: `grid-template-columns: minmax(300px, 0.4fr) minmax(0, 0.6fr)` (`index.css:550-553`).
- Die Spieler-Liste hat eine interne Scrollbegrenzung `max-height: 620px; overflow: auto` (`index.css:577-582`). Bei vielen Spielern kann das auf iPad/iPhone wie ein Fenster im Fenster wirken.

Audit-Urteil:

- Aktueller Code: deutlich besser als der alte Screenshot.
- UX-Ziel "Kader bekommt den ganzen Platz, Eingabe erst nach CTA": noch nicht sauber erfuellt.
- Wenn du sieben Spieler hast, sollte der Default-Zustand wahrscheinlich eine reine Kaderansicht sein. Das Formular/Sheet sollte erst nach "Neu" oder "Bearbeiten" erscheinen.

### A2. Andere Screens mit dauerhaft sichtbaren Eingabeflaechen

Es gibt mehrere Screens, bei denen Eingabe-Controls sofort grossflaechig sichtbar sind. Das ist nicht immer falsch, aber bei vielen Spielern am Feld wird es schwer scanbar.

Hoch relevant:

- Check-in: Jede Spielerzeile zeigt sofort Anwesenheit, Readiness, Life, Schmerz, Ort, Returner, Safety, Laufbild, Ampel und Notiz (`CheckInView.tsx:139-292`).
- Nachbereitung: Jede Spielerzeile zeigt sofort sRPE, Post-Pain, E2, Hauptuebung, Last, Reps, RPE, Power/Sprint, Conditioning, Next Step und Notiz (`PostSessionView.tsx`).
- Returner: Jede Returner-Karte zeigt sofort sehr viele Cap-/Symptom-/Entscheidungsfelder (`ReturnerView.tsx:90-274`).
- Training: Spieler Quick Actions sind sofort sichtbar (`TrainingView.tsx:115-176`, `TrainingView.tsx:421-443`).

Audit-Urteil:

- Spieler-Screen sollte "list first" sein.
- Check-in sollte vermutlich "scan first, expand on demand" werden: pro Spieler kompakter Status + schnelle Primaeraktion, Details nur bei Tap.
- Nachbereitung und Returner sind die staerksten Kandidaten fuer progressive Offenlegung, weil die Feldanzahl sehr hoch ist.

## 4. B - Mobile Verzoegerungen und fehlendes Erfolgs-/Auswahlfeedback

### B1. Codepfad spricht gegen echte Minuten-Latenz bei lokalem Speichern

Spieler speichern:

- `usePlayers.save()` wartet auf `savePlayer`, danach `refreshLocalPlayers`, danach startet Sync nur non-blocking mit `void runBackgroundSync()` (`usePlayers.ts:98-107`).

Check-in speichern:

- `saveEntry()` erstellt ggf. den Session-Log, speichert lokal, setzt `entries` sofort, aktualisiert Sync-Overview und startet Background-Sync non-blocking (`useCheckIns.ts:144-170`).

Das sollte lokal normalerweise deutlich unter einer Sekunde sichtbar reagieren.

Wenn es auf dem iPhone "erst beim zweiten Mal" oder "nach Minuten" reagiert, sind die wahrscheinlichsten Ursachen:

1. Stale PWA/Service-Worker oder alter Deploy-Code.
2. Mobile Safari/PWA speichert oder laedt aus einem anderen Origin/Cache als der Test-Browser.
3. Supabase-/Netzwerk-Sync blockiert indirekt durch Re-Renders, Fehlerzustand oder alte Version, obwohl der aktuelle Code Background-Sync nicht awaitet.
4. Es fehlt optisches Sofortfeedback, dadurch wirkt eine erfolgreich gestartete Aktion wie "nicht reagiert".

### B2. Es gibt keinen per-action Saving/Saved-State

Viele Aktionen rufen `void saveEntry(...)` oder `void onPostSave(...)` auf, ohne pro Button/Zeile einen Zustand wie "speichert", "gespeichert" oder "lokal pending" zu setzen.

Beispiele:

- Check-in Buttons rufen direkt `onSave` auf (`CheckInView.tsx:140-264`).
- Returner-Entscheidung ruft `savePatch` direkt auf (`ReturnerView.tsx:235-253`).
- Nachbereitung ruft `void onPostSave` und `void onProgressSave` direkt auf (`PostSessionView.tsx`).

Vorhandenes Feedback:

- Aktive Button-Klassen fuer manche Auswahlzustaende.
- `sync-pill` pro Zeile.
- Globaler Sync-Strip.
- CSS `:active` Press-State und Transitions (`index.css:148-160`, `index.css:810-824`).

Fehlend:

- Kein lokaler "saving/saved just now"-Impuls pro Button/Zeile.
- Kein `aria-live` fuer gespeicherte Aktionen.
- Kein haptisches Feedback. Es gibt keinen `navigator.vibrate`-Aufruf.
- Keine Submit-Sperre beim Spielerformular; der Speichern-Button bleibt waehrend `handleSubmit` klickbar (`PlayersView.tsx:503-507`).

### B3. Spieler-Speicherhinweis verschwindet praktisch

`handleSubmit()` setzt `formNotice`, schliesst danach aber das Sheet (`PlayersView.tsx:185-192`). Die Notice wird innerhalb des Formulars gerendert (`PlayersView.tsx:538`). Nach dem Schliessen ist sie fuer den Nutzer nicht mehr sichtbar.

Audit-Urteil:

- Der Speichervorgang kann erfolgreich sein, aber die UI bestaetigt es nicht nachvollziehbar.
- Das passt exakt zu deinem Feedback: "Ich sehe nicht, ob die Interaktion erfolgreich abgeschlossen wurde."

### B4. Mobile Performance sollte gezielt gemessen werden

Fuer eine spaetere Umsetzung nicht raten, sondern messen:

- Tap bis sichtbarer Buttonzustand: Ziel < 100-150 ms.
- Tap bis IndexedDB write abgeschlossen.
- IndexedDB write bis React State aktualisiert.
- Background-Sync Dauer separat.
- Echte iPhone-PWA, iPad-PWA, Browser-Safari und Desktop getrennt messen.

Messpunkte:

- `savePlayer` / `refreshLocalPlayers` / `runBackgroundSync`.
- `ensureSessionLog` / `saveCheckInEntry` / `getCheckInSyncOverview`.
- `saveReturnerEntry` / `refreshReturners`.
- `savePostSessionEntry`, `saveProgressEntry`, `saveBaselineEntry`.

## 5. C - Ampel, Safety und Default-Auswahl

### C1. Ampel wird automatisch vorbelegt und optisch als Auswahl dargestellt

Root Cause:

- `emptyCheckInDraft` startet mit `trafficLight: null`, `trafficLightSuggestion: null` (`checkIn.ts:111-123`).
- `buildEmptyEntry()` ruft aber sofort `applySuggestedTrafficLight(...)` auf (`checkInRepository.ts:459-464`).
- `applySuggestedTrafficLight()` setzt nicht nur `trafficLightSuggestion`, sondern auch `trafficLight`, solange kein manueller Override existiert (`checkIn.ts:183-190`).
- Im UI wird ein Traffic-Chip aktiv, wenn `entry.trafficLight === trafficLight` (`CheckInView.tsx:258-264`).

Ergebnis:

- Ein neuer/noch nicht aktiv bearbeiteter Spieler kann sofort "Gruen" aktiv zeigen.
- Bei Returner/offen kann sofort Gelb/Rot entstehen, je nach Spielerstatus und Flags.
- Fachlich ist ein automatischer Vorschlag sinnvoll, aber visuell wirkt er wie eine bereits vom Coach getroffene Auswahl.

Das ist genau der Konflikt, den du beschreibst.

Empfohlene spaetere Designentscheidung:

- `trafficLightSuggestion` weiter anzeigen.
- `trafficLight` fuer echte Coach-Auswahl separat lassen.
- Traffic-Chips nur aktiv markieren, wenn der Coach aktiv gewaehlt hat oder wenn klar "Auto" als Modus markiert ist.
- Row-Farbe darf optional den Vorschlag zeigen, aber die Buttons sollten nicht so aussehen, als haette der Coach schon geklickt.

### C2. "Gruen bleibt markiert, obwohl Rot gewaehlt wurde" ist im aktuellen Source nicht erwartbar

Im aktuellen Code kann nur ein Traffic-Chip aktiv sein, weil die Klasse direkt an `entry.trafficLight === trafficLight` haengt (`CheckInView.tsx:259-260`). Wenn Rot erfolgreich gespeichert wurde, sollte Gruen nicht aktiv bleiben.

Wenn du auf dem Geraet trotzdem Gruen und Rot gleichzeitig oder Gruen trotz Rot siehst, spricht das eher fuer:

- alten/stalen App-Code,
- eine nicht ankommende Save-Aktion,
- sehr spaete State-Aktualisierung,
- oder ein CSS-/Cache-Problem im installierten PWA-Build.

Das ist ein wichtiger Kandidat fuer eine echte iPhone-PWA-Reproduktion.

### C3. Safety "Keine Red Flag" ist fachlich default und optisch sogar als danger aktiv

Root Cause:

- `emptyCheckInDraft.redFlag` ist `'none'` (`checkIn.ts:118`).
- Die Safety-Buttons setzen fuer jede aktive Option dieselbe Klasse: `segmented active danger` (`CheckInView.tsx:226-233`).

Ergebnis:

- "Keine Red Flag" ist von Anfang an aktiv.
- Weil `danger` immer angehaengt wird, kann sogar die harmlose Option optisch wie ein Danger-Button wirken.

Audit-Urteil:

- Dein Einwand ist berechtigt.
- Fachlich darf "none" als interner Default existieren.
- Visuell sollte "Keine Red Flag" aber nicht als Gefahr/aktive Auswahl wirken, bevor der Coach bewusst etwas gewaehlt hat.

Empfohlene spaetere Designentscheidung:

- `redFlag` intern weiter default `none`, aber separaten UI-State `safetyTouched` oder `redFlagWasChecked` fuehren.
- Alternativ "Safety unauffaellig" als neutralen Status anzeigen und nur echte Red-Flag-Optionen als Buttons hervorheben.
- `danger` nur fuer `head_neck_neuro` und `acute_instability`, nicht fuer `none`.

### C4. Returner ist anders zu bewerten

Bei Returner ist die Vorbelegung fachlich nachvollziehbar, weil sie aus dem Spielerprofil kommt:

- `buildEmptyEntry()` uebernimmt `player.returnerStatus` (`checkInRepository.ts:461-464`).
- Wenn ein Spieler als Returner/offen angelegt wurde, ist ein aktiver Returner-Hinweis im Check-in sinnvoll.

Audit-Urteil:

- Returner darf Default-Zustand behalten.
- Ampel und Safety sollten anders behandelt werden, weil sie session-/tagesbezogene Coach-Entscheidungen oder Pruefungen sind.

## 6. Priorisierte Problem-Liste

P0 - Vor jeder UX-Umsetzung klaeren:

1. Stale PWA/Service-Worker/Deploy-Version verifizieren. Aktueller Code und sichtbarer `127.0.0.1`-Zustand widersprechen sich.
2. Auf echtem iPhone reproduzieren: Spieler speichern, Check-in Auswahl, Ampel Rot, Safety Red Flag.
3. Keine Produktivdaten fuer Tests verwenden oder vorher einen Testmodus/Testaccount definieren.

P1 - UX/Interaktion:

1. Spieler-Screen wirklich list-first machen: Kader nimmt den Raum ein, Empty-Detail-Panel entfernen oder stark reduzieren.
2. Spieler-Save mit sichtbarem Ergebnis nach geschlossenem Sheet versehen.
3. Per-row/per-button Feedback fuer Check-in, Training, Nachbereitung, Returner und Baseline einfuehren.
4. Doppel-Taps/Mehrfach-Saves durch per-action saving state absichern.
5. Haptik optional nutzen, aber nur als Zusatz zu optischem Feedback.

P1 - Ampel/Safety:

1. Ampel-Vorschlag und Coach-Auswahl visuell trennen.
2. Safety "Keine Red Flag" nicht als danger-active darstellen.
3. Initialzustand fuer Safety/Ampel als "noch nicht aktiv geprueft" darstellen, ohne fachliche Defaults zu verlieren.

P2 - Informationsarchitektur:

1. Check-in-Zeilen progressiv machen: kompakte Zeile + Details nur bei Tap.
2. Nachbereitung und Returner in Abschnitte oder Detail-Sheets zerlegen.
3. Interne Scrollfenster bei Kaderlisten auf Mobile/iPad reduzieren.

## 7. Was bereits positiv ist

- Aktueller Source hat Spieler-Sheet statt dauerhaftem Inline-Formular.
- Ampel-Auto-Reset existiert bereits (`CheckInView.tsx:269-278`, `checkIn.ts:196-205`).
- Returner-Feld-Keys wurden bereits stabilisiert (`returnerEntryKey.ts`).
- CSS hat mittlerweile Touch-Press-State und Transitions.
- Tests decken Ampellogik, Repository-Logik und Returner-Key-Stabilitaet ab.

## 8. Konkrete naechste Audit-Schritte vor Implementierung

1. Echten Geraetezustand festhalten: installierte PWA-Version, URL/Origin, Cache/Service Worker, letzter Deploy.
2. Einen Testcoach/Testdatensatz definieren.
3. Mobile Timing messen:
   - Spieler anlegen: Tap Speichern bis Liste aktualisiert.
   - Check-in Readiness: Tap bis Chip aktiv.
   - Ampel Rot: Tap bis Gruen nicht mehr aktiv und Rot aktiv.
   - Safety Red Flag: Tap bis Status sichtbar.
4. Danach erst UX-Umsetzung planen.

## 9. Umsetzungsstatus 2026-06-14

Umgesetzt:

1. Bottom-Navigation entfernt. Die App nutzt wieder die linke Navigation. Auf Desktop/iPad bleibt sie sichtbar; auf schmalen iPhone-Breiten oeffnet ein Button oben links eine linke Drawer-Navigation.
2. Spieler-Screen list-first gemacht. Das leere Standard-Detail-/Formularpanel wird nicht mehr beim Einstieg gerendert; das Spielerformular erscheint erst nach `Neu` oder nach Auswahl eines Spielers als Sheet.
3. Spieler-Speichern bekommt sichtbares und haptisches Feedback. Der Speichern-Button zeigt `Speichert...`, ist waehrenddessen deaktiviert und nach erfolgreichem Speichern bleibt eine Meldung im Kaderbereich sichtbar.
4. Check-in-Auswahlen bekommen per Row sichtbares Feedback (`Speichert...`, danach gespeicherter oder nicht gespeicherter Status) und nutzen optional `navigator.vibrate`.
5. Ampel-Vorschlag und Coach-Auswahl sind visuell getrennt. Ein automatisch gruener Vorschlag markiert den gruenen Chip nicht mehr als aktive Coach-Auswahl.
6. Safety `Keine Red Flag` bleibt neutral. Nur echte Red-Flag-Optionen koennen als `danger active` erscheinen.
7. Konkurrierende lokale Check-in-Saves fuer denselben Spieler und dieselbe Session werden im Repository sequenziert, damit schnelle Mehrfachaktionen lokal keinen zweiten `player_session_entries`-Datensatz erzeugen.

Bewusst nicht umgesetzt:

- Eine Bottom-Bar, die beim Scrollen erscheint/verschwindet. Recherche und aktuelle App-Struktur sprechen dagegen: acht Ziele sind fuer eine Bottom-Bar zu viele, und versteckte Navigation ist weniger gut auffindbar. Empfohlen und umgesetzt ist stattdessen links sichtbar bzw. links als Drawer auf iPhone.

Verifikation:

- `npm run typecheck`
- `npm run lint`
- `npm test` mit 26 Testdateien und 133 Tests
- `npm run build`
- Browser-QA auf frischem lokalen Port: Desktop/iPad ohne Bottom-Bar, Sidebar sichtbar, kein horizontaler Overflow; iPhone-Breite mit Menu-Button, Drawer, Backdrop-Schliessen, Tab-Auswahl schliesst Drawer, geschlossener Drawer ist `visibility:hidden`/`pointer-events:none`, kein horizontaler Overflow.

Einschraenkung der visuellen Browser-QA:

- Auf Port 5173 war ein alter PWA-Service-Worker/Cache aktiv und lieferte sichtbar einen alten Bundle-Stand. Die aktuelle UI wurde deshalb auf einem frischen Dev-Port geprueft. Geschuetzte Spieler-/Check-in-Inhalte waren dort nicht eingeloggt sichtbar; diese Zustaende sind ueber React-Render-Tests und Unit-Tests abgedeckt.
- Ein sichtbarer App-Version-/Update-Hinweis gegen stale PWA-Code ist noch nicht umgesetzt und bleibt ein eigener P1-QA-Punkt.
