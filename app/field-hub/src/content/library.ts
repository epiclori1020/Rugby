import { activePdfRefs, pdfRefs } from './pdfRefs'
import type { LibraryCategory, LibraryItem } from './types'

export const libraryCategories: LibraryCategory[] = [
  'Heute relevant',
  'Aktive Pläne',
  'Playbooks',
  'Varianten',
  'Exercise Mapping',
  'Consent/Datenschutz',
  'Quellen',
  'Archiv',
]

export const libraryItems: LibraryItem[] = [
  {
    id: 'coach-script-kw25',
    category: 'Playbooks',
    title: 'Coach-Skript KW25: Dienstag V2',
    summary:
      'Aktuelles Deep-Playbook fuer Dienstag 16. Juni: Onboarding, Ampel, Returnergrenzen und Coach-Wording.',
    sourcePath: 'docs/16_unit_1_v2_deep_playbook_2026-06-16.styled.pdf',
    tags: ['KW25', 'Dienstag', 'Wording', 'Ampel', 'Returner', 'Concussion'],
    sections: [
      {
        title: 'Dienstag Startansage',
        body: [
          'Heute ist kein Testabend: kennenlernen, Positionen verstehen, Bewegung sehen und direkt sauber trainieren.',
          'Es gibt kein Ranking, kein Aussortieren, keine Bestzeiten.',
          'Ehrliche Rueckmeldung zu Schmerz, Returnerstatus, Kopf/Nacken oder Physio-Limits ist Trainingssteuerung, kein Minuspunkt.',
        ],
      },
      {
        title: 'Ampel-Sprache',
        body: [
          'Gruen = normaler Plan. Gelb = sinnvoll reduzieren. Rot = heute kein normales Training und erst klaeren.',
          'Rot bei Kopf, Nacken, Schwindel, neurologischen Symptomen, akuter Instabilitaet oder starkem neuem Schmerz ist kein S&C-Thema.',
          'Concussion-Verdacht: sofort raus, kein Same-Day-Return, medizinisch klaeren, keine Ersatzuebung anbieten.',
        ],
      },
      {
        title: 'Donnerstag Startansage',
        body: [
          'Heute trainieren wir normaler, aber weiter kontrolliert.',
          'Broad Jump und Med-Ball Chest Pass nur als einfache Startwerte, nur wenn Ablauf und Gruppe ruhig sind.',
          'Wenn es nicht passt, fallen Werte weg. Niemand holt irgendetwas nach.',
        ],
      },
    ],
    pdfRefs: [pdfRefs.kw25TuesdayCoachScript],
  },
  {
    id: 'coach-script-donnerstag-backup',
    category: 'Playbooks',
    title: 'Coach-Skript Donnerstag/Backup',
    summary:
      'Aelteres Di/Do-Skript bleibt als Donnerstag- und Backup-Unterlage verfuegbar, getrennt vom neuen Dienstag-V2-Skript.',
    sourcePath: 'templates/kw25_coach_script_2026-06-16_18.md',
    tags: ['KW25', 'Donnerstag', 'Backup', 'Wording', 'Ampel'],
    sections: [
      {
        title: 'Nutzung',
        body: [
          'Fuer Dienstag ist das neue V2-Deep-Playbook die aktive Unterlage.',
          'Diese Datei bleibt fuer Donnerstag und als Rueckhand-Backup sichtbar.',
          'Bei Widerspruch gilt fuer Dienstag das V2-Deep-Playbook.',
        ],
      },
    ],
    pdfRefs: [pdfRefs.kw25CoachScript],
  },
  {
    id: 'deep-playbook-donnerstag-kw25',
    category: 'Playbooks',
    title: 'Donnerstag Deep Playbook: Einheit 2',
    summary:
      'Ausfuehrliche Vorbereitungsfassung fuer Donnerstag 18. Juni: Training, optionale Mini-Baseline, App-Dokumentation, Wording, Uebungen und Fallbacks.',
    sourcePath: 'docs/18_unit_2_deep_playbook_2026-06-18.styled.pdf',
    tags: ['KW25', 'Donnerstag', 'Deep Playbook', 'Wording', 'Mini-Baseline', 'App'],
    sections: [
      {
        title: 'Aktive Nutzung',
        body: [
          'Diese PDF ist die Deep-Prep-Version fuer Donnerstag, nicht das Klemmbrett-Miniplan-Blatt.',
          'Am Platz bleiben Donnerstag-Trainingsplan und Kompaktkarte die kurzen Referenzen.',
          'Die Deep-PDF erklaert jeden Block mit Wording, Zweck, Beobachtung, Entscheidung und Fallback.',
        ],
      },
      {
        title: 'Donnerstag-Kern',
        body: [
          'Normaler Donnerstag-Plan: Check-in, Warm-up, Speed, optionale Mini-Baseline, Kraft-Pods, Microdose, Easy Tempo optional und Abschluss.',
          'Mini-Baseline nur wenn Ablauf, Sicherheit und Gruppe ruhig genug sind.',
          'Kein Bronco, kein 30-m-Test, kein Ranking und keine Nachholbelastung.',
        ],
      },
      {
        title: 'App-Fokus',
        body: [
          'App-Dokumentation fuer Ampel, Reaktion auf Dienstag, Schmerz, Returner, Anpassungen, sRPE und Pain/Issue.',
          'Keine Diagnosen und keine medizinischen Freigaben dokumentieren.',
        ],
      },
    ],
    pdfRefs: [pdfRefs.kw25ThursdayDeepPlaybook],
  },
  {
    id: 'kw26-tuesday-active-pack',
    category: 'Aktive Pläne',
    title: 'Dienstag 23.06: aktives PDF-Paket',
    summary:
      'Aktuelle iPad- und Druckunterlagen fuer die einzige KW26-Einheit: Training kompakt, Check-in/Beobachtung und Deep Playbook.',
    sourcePath: 'plans/offseason_coach_sheets/KW26_basis_1.md',
    tags: ['KW26', 'Dienstag', '23.06', 'Training kompakt', 'Check-in', 'Deep Playbook'],
    sections: [
      {
        title: 'Am Feld',
        body: [
          'Training kompakt ist die kurze Klemmbrett-Referenz.',
          'Check-in + Beobachtung ist auf zwei Querformatseiten gebaut: Seite 1 Check-in, Seite 2 Beobachtung/Nachbereitung.',
          'Deep Playbook ist Vorbereitung/iPad-Referenz, nicht Pflichtdruck.',
        ],
      },
      {
        title: 'Kernentscheidungen',
        body: [
          'Donnerstag faellt aus und wird nicht am Dienstag nachgeholt.',
          'Kein Team-Broad-Jump-Retest, kein Bronco, kein Max-Sprint und kein Max-Deadlift.',
          'Artur, Christopher, David und DAmore sind als konkrete Nachhol-/Korrekturfaelle abgebildet.',
        ],
      },
    ],
    pdfRefs: [
      pdfRefs.kw26TuesdayTrainingCompact,
      pdfRefs.kw26TuesdayCheckIn,
      pdfRefs.kw26TuesdayDeepPlaybook,
    ],
  },
  {
    id: 'kw27-tuesday-active-pack',
    category: 'Aktive Pläne',
    title: 'Dienstag 30.06: aktives PDF-Paket',
    summary:
      'Aktuelle iPad- und Druckunterlagen fuer KW27 Session 2A: Training kompakt, Check-in/Beobachtung und Deep Playbook.',
    sourcePath: 'plans/offseason_coach_sheets/KW27_tuesday_training_compact_2026-06-30.md',
    tags: ['KW27', 'Dienstag', '30.06', 'Training kompakt', 'Check-in', 'Deep Playbook', 'Cluster'],
    sections: [
      {
        title: 'Am Feld',
        body: [
          'Training kompakt ist die kurze Klemmbrett-Referenz.',
          'Check-in + Beobachtung ist als zweiseitige Querformat-PDF gebaut.',
          'Deep Playbook ist Vorbereitung/iPad-Referenz und erklaert Wording, Zweck, Beobachtung, Entscheidung und Fallbacks.',
        ],
      },
      {
        title: 'Kernentscheidungen',
        body: [
          'Mobility/Activation aus dem 23.06-Deep-Playbook bleibt als klarer Einstieg erhalten.',
          'Track/Acceleration ist cluster-spezifisch: Collision Forwards kurz, Hybrid 10-20 m, Speed/Space Backs smooth build-ups.',
          'A-March bleibt fuer Dienstag aktiv; A-Skip wird erst fuer Donnerstag eingeplant.',
          'Kraft-Pods laufen mit 2 Runden als Default. Conditioning wird zuerst gekuerzt und ist kein Finisher.',
        ],
      },
    ],
    pdfRefs: [
      pdfRefs.kw27TuesdayTrainingCompact,
      pdfRefs.kw27TuesdayCheckIn,
      pdfRefs.kw27TuesdayDeepPlaybook,
    ],
  },
  {
    id: 'kw27-thursday-active-pack',
    category: 'Aktive Pläne',
    title: 'Donnerstag 02.07: aktives PDF-Paket',
    summary:
      'Aktuelle iPad- und Druckunterlagen fuer KW27 Session 2B: Training kompakt, Check-in/Beobachtung und Deep Playbook.',
    sourcePath: 'plans/offseason_coach_sheets/KW27_thursday_training_compact_2026-07-02.md',
    tags: ['KW27', 'Donnerstag', '02.07', 'Training kompakt', 'Check-in', 'Deep Playbook', 'Primer'],
    sections: [
      {
        title: 'Am Feld',
        body: [
          'Training kompakt ist die kurze Klemmbrett-Referenz fuer Session 2B.',
          'Check-in + Beobachtung ist als zweiseitige Querformat-PDF gebaut, mit separatem Check-in- und Beobachtungszettel.',
          'Deep Playbook erklaert A-Skip-Einfuehrung, Speed-Primer, Kraftsignal, Robustheit, Tempo-Fallback und Safety-Grenzen.',
        ],
      },
      {
        title: 'Kernentscheidungen',
        body: [
          'Donnerstag bleibt Primer: Qualitaet und Frische statt zweiter Hauptreiz.',
          'A-Skip wird erstmals eingefuehrt, aber klein und technisch.',
          'Speed/Max-V-Annaeherung ist cluster-spezifisch: Collision Forwards kurz smooth, Hybrid smooth, Speed/Space Backs build 20 + fly 10 nur Gruen.',
          'Kraftsignal laeuft mit 2 Saetzen Default @ RPE 5-6. Tempo ist optional und wird zuerst gestrichen.',
        ],
      },
    ],
    pdfRefs: [
      pdfRefs.kw27ThursdayTrainingCompact,
      pdfRefs.kw27ThursdayCheckIn,
      pdfRefs.kw27ThursdayDeepPlaybook,
    ],
  },
  {
    id: 'spieler-briefing-start',
    category: 'Quellen',
    title: 'Spieler-Briefing: S&C Start',
    summary:
      'Kurze Spieler-Erklaerung: kein Testtag, warum Check-in und Ampel wichtig sind, was gemeldet werden soll.',
    sourcePath: 'templates/unit_1_player_briefing_2026-06-16.md',
    tags: ['Spieler', 'Briefing', 'KW25', 'Check-in', 'Ampel'],
    sections: [
      {
        title: 'Was heute passiert',
        body: [
          'Kurzer Check-in, Positionen, Readiness, Warm-up, einfache Bewegungschecks, Techniktraining und kontrollierte Laeufe ohne Zeitmessung.',
          'Dienstag ist nicht Aussortieren, kein Charaktertest, kein Maximaltest und kein Ranking.',
        ],
      },
      {
        title: 'Warum es wichtig ist',
        body: [
          'Das Training soll besser dosiert werden: voll belastbare Spieler, gelbe Spieler und Returner brauchen unterschiedliche Entscheidungen.',
          'Schmerz, Kopf-/Nackensymptome, Physio-Limits und starke Alltagsbelastung sollen direkt gemeldet werden.',
        ],
      },
      {
        title: 'Ampel fuer Spieler',
        body: [
          'Gruen bedeutet normal mitmachen.',
          'Gelb bedeutet heute reduziert und kontrolliert.',
          'Rot bedeutet kein normales Training, erst klaeren.',
        ],
      },
    ],
    pdfRefs: [pdfRefs.playerBriefing],
  },
  {
    id: 'detail-briefing-unit-1',
    category: 'Quellen',
    title: 'Einheit 1 Detail-Briefing fuer Coach',
    summary:
      'Nachschlagewerk fuer Abfragen, Position-Cluster, Schmerzskala, Ampelregeln, Uebungen und Donnerstag-Fallback.',
    sourcePath: 'templates/unit_1_coach_briefing_detailed_2026-06-16.md',
    tags: ['Detail', 'Coach', 'Positionen', 'Schmerz', 'Uebungen'],
    sections: [
      {
        title: 'Was abgefragt wird',
        body: [
          'Position, optionale Koerpermasse, Readiness 1-5, Life-Flag, Schmerz 0-10 + Ort, Returnerstatus, Ampel und sRPE.',
          'Es werden keine Diagnosen geschrieben; dokumentiert werden nur trainingsrelevante Steuerungsinformationen.',
        ],
      },
      {
        title: 'Positionen und Cluster',
        body: [
          'Collision Forwards: Front Row und Locks; short accel, carry, sled, brace, neck/shoulder/trunk.',
          'Hybrid: Back Row und Centres; decel/re-accel, Split Squat, Adduktor, Schulter/Rumpf.',
          'Speed/Space Backs: Halves und Back Three; build-ups/fly-ins nur Gruen, Hamstring/Calf/Fuss, weniger Kontakt-Dichte.',
        ],
      },
      {
        title: 'Donnerstag-Fallback',
        body: [
          'Check-in, Warm-up, 4x10 m Speed, Mini-Baseline nur wenn ruhig, Krafttechnik-Pods, Microdose und sRPE/Pain-Abschluss.',
          'Wenn Ablauf, Sicherheit oder Gruppe nicht passen, fallen Werte weg und die Einheit bleibt technisch.',
        ],
      },
    ],
    pdfRefs: [pdfRefs.detailedBriefing],
  },
  {
    id: 'variants-abcd',
    category: 'Varianten',
    title: 'Variantenkarte A+/A/B/C/D',
    summary:
      'Schnelle Progression und Regression am Platz: starke Gruene nicht bremsen, Gelbe und Returner nicht in Belastungsspitzen druecken.',
    sourcePath: 'templates/session_variants_abcd_quick_card.md',
    tags: ['Varianten', 'A+', 'A', 'B', 'C', 'D', 'Regression'],
    sections: [
      {
        title: 'Legende',
        body: [
          'A+ = kleine Progression fuer sehr stabile Gruene; nur ein Regler pro Einheit.',
          'A = normaler Plan; B = gleiche Muster bei Equipment-/Organisationsproblem.',
          'C = 30-50 Prozent weniger, RPE 5-6; D = kein normaler Plan, sichere Alternative oder rausnehmen.',
        ],
      },
      {
        title: 'A+ Stopps',
        body: [
          'Stop, wenn Technik schlechter wird, RPE zwei Punkte ueber Ziel liegt, Sprint-/Sprungqualitaet faellt oder Schmerz steigt.',
          'Keine Max-Jagd, keine 1RM-Versuche, kein Grind und keine Conditioning-Strafen.',
        ],
      },
      {
        title: 'D-Grenze',
        body: [
          'Kein Sprint, kein Bronco, kein schweres Heben und kein Contact Prep.',
          'Bei Kopf-/Nackensymptomen keine Bike-/Iso-Automatik, sondern medizinisch klaeren.',
        ],
      },
    ],
    pdfRefs: [pdfRefs.variants],
  },
  {
    id: 'exercise-mapping-offseason',
    category: 'Exercise Mapping',
    title: 'Exercise Pool Mapping: Offseason bis August',
    summary:
      'Feldtaugliche Auswahlmatrix fuer Prep, Speed, Power, Kraft, Microdoses, Contact Prep, Conditioning und Cluster Add-ons.',
    sourcePath: 'templates/exercise_pool_offseason_mapping.md',
    tags: ['Exercise Pool', 'Collision Forwards', 'Hybrid', 'Speed/Space Backs', 'Returner', 'Equipment'],
    sections: [
      {
        title: 'Schnelle Regeln',
        body: [
          'Wenn Gym voll ist: Hauptlift halbieren, DB/KB/Bodyweight nutzen und Feldstationen einbauen.',
          'Bei Gruppe ueber 15: weniger Uebungswechsel, Pod-Rotation und Conditioning eher kuerzen als Speed/Kraftqualitaet opfern.',
          'Gelbe Spieler reduzieren Volumen 30-50 Prozent, keine Zusatzkondition, Sprint/COD-Dichte runter, RPE 5-6.',
        ],
      },
      {
        title: 'Returner unklar',
        body: [
          'Kein Bronco, kein Max-Speed, keine harten Cuts und kein Contact Prep.',
          'Krafttechnik, Isometrien, Bike/Erg locker und kurze lineare Progression nur wenn schmerzfrei.',
        ],
      },
      {
        title: 'Kuerzungsreihenfolge',
        body: [
          'Zuerst Conditioning kuerzen.',
          'Dann Cluster-Add-on kuerzen.',
          'Dann Kraftsaetze reduzieren.',
          'Speed/Power-Qualitaet behalten.',
        ],
      },
    ],
    pdfRefs: [pdfRefs.exerciseMapping],
  },
  {
    id: 'consent-slim-kw25',
    category: 'Consent/Datenschutz',
    title: 'Kurze Einwilligung: S&C-Trainingsdaten',
    summary:
      'Kurzer DSGVO-/Einwilligungsrahmen fuer wenige trainingsrelevante Daten; keine Diagnosen, Arztbriefe oder privaten Details.',
    sourcePath: 'templates/unit_1_slim_consent_2026-06-16.md',
    tags: ['Consent', 'Datenschutz', 'S&C-Daten', 'KW25'],
    sections: [
      {
        title: 'Erfasst werden koennen',
        body: [
          'Name, Position, Anwesenheit, Koerpermasse falls gemessen, Readiness, Schmerz 0-10 + Region, Returnerstatus oder Trainingslimit.',
          'Einfache Trainingswerte, sRPE und Notfallkontakt, falls nicht bereits beim Verein vorhanden.',
        ],
      },
      {
        title: 'Nicht erfassen',
        body: [
          'Keine Diagnosen, keine Arztbriefe, keine privaten Gesundheitsdetails ohne Trainingsbezug.',
          'Einwilligungsblaetter werden getrennt von Trainingswerten abgelegt.',
        ],
      },
      {
        title: 'Medizinische Grenze',
        body: [
          'Der S&C Coach stellt keine medizinischen Diagnosen.',
          'Return-to-Play und Concussion-Entscheidungen bleiben medizinisch oder physiotherapeutisch.',
        ],
      },
    ],
    pdfRefs: [pdfRefs.consent],
  },
  {
    id: 'active-pdf-fallbacks',
    category: 'Quellen',
    title: 'Aktive PDF-Fallbacks',
    summary:
      'Kuratierte Fallback-Liste fuer die aktiven App-PDFs aus der Manifest-Auswahl. Archivdateien sind nicht als aktive Workflows eingebaut.',
    sourcePath: 'print_pdfs/00_manifest.txt',
    tags: ['PDF', 'Fallback', 'Manifest', 'aktiv'],
    sections: [
      {
        title: 'Nutzung',
        body: [
          'Die Hauptansicht bleibt App-UI/HTML.',
          'PDFs dienen als Backup, Ausdruck oder iPad-Nachschlagewerk.',
          'Archiv-PDFs unter _ARCHIV_nicht_drucken bleiben bewusst ausgeschlossen.',
        ],
      },
    ],
    pdfRefs: activePdfRefs,
  },
  {
    id: 'archive-boundary',
    category: 'Archiv',
    title: 'Archiv: nicht aktive Unterlagen',
    summary:
      'Archiv ist bewusst getrennt: alte Testtag-, Workbook- und Langfassungen bleiben Backup, aber nicht als aktive Vorlage am Feld.',
    sourcePath: 'print_pdfs/00_manifest.txt',
    tags: ['Archiv', 'nicht aktiv', 'Backup', '_ARCHIV_nicht_drucken'],
    sections: [
      {
        title: 'Grenze',
        body: [
          'Dateien aus _ARCHIV_nicht_drucken werden nicht als aktive Session-Unterlagen angezeigt.',
          'Bei Widerspruch gelten aktive Plaene, Playbooks, Varianten und Exercise Mapping aus der aktuellen Library.',
          'Archivmaterial nur bei bewusster Rueckfrage pruefen, nicht am Feld als Standard nutzen.',
        ],
      },
    ],
  },
]
