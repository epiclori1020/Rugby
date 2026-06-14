import type { ExerciseMapping, VariantCard } from '../domain/training'

export const variantCards: VariantCard[] = [
  {
    variant: 'A_plus',
    label: 'A+',
    summary: 'Gruen, erfahren, regelmaessig da, Technik stabil.',
    decision: 'Nur einen Regler steigern: Last, ein Satz, 1-2 saubere Speed-Reps oder kurzes Zusatzmodul.',
  },
  {
    variant: 'A',
    label: 'A',
    summary: 'Gruen und normal belastbar.',
    decision: 'Normaler Plan wie vorgesehen, Ziel-RPE halten und keine verpassten Einheiten nachholen.',
  },
  {
    variant: 'B',
    label: 'B',
    summary: 'Organisation, volles Gym oder fehlendes Equipment.',
    decision: 'Gleiches Bewegungsmuster einfacher: DB/KB, Feldstation oder Pod-Rotation.',
  },
  {
    variant: 'C',
    label: 'C',
    summary: 'Gelb, muede, leichter Schmerz, Stress oder unsichere Technik.',
    decision: 'Volumen 30-50 Prozent runter, RPE 5-6, keine Zusatzkondition.',
  },
  {
    variant: 'D',
    label: 'D',
    summary: 'Returner, unklarer Status, relevante Beschwerden oder rote Flags.',
    decision: 'Kein normaler Plan: kein Sprint, kein Bronco, kein schweres Heben, klaeren.',
  },
]

export const exerciseMappings: ExerciseMapping[] = [
  {
    pattern: 'Prep / RAMP',
    defaultOption: 'Shuffle, skip, backpedal, curves; A-March/A-Skip; Pogo; Snap-down.',
    alternative: 'Kurze 10-20-m-Bahnen oder marching in place.',
    yellowReturner: 'Kleinere ROM, langsamer, kein Sprintdruck.',
    coachFocus: 'Temperatur, Haltung, Fuss unter Koerper, leise Kontakte.',
  },
  {
    pattern: 'Speed / Acceleration',
    defaultOption: '2-point oder falling starts, 10-20 m Accel, smooth fast nur frisch.',
    alternative: 'Split stance, resisted march, leichte Sled March wenn sicher.',
    yellowReturner: '50-70 Prozent, weniger Reps, 10 m smooth oder auslassen.',
    coachFocus: 'Keine Sprintjagd, keine Max-Speed-Reps unter Ermuedung.',
  },
  {
    pattern: 'Power',
    defaultOption: 'Broad Jump/CMJ + Stick, Med-Ball Chest Pass oder Scoop Throw.',
    alternative: 'Low Box Jump, Punch Throw, Med-Ball statt Jump.',
    yellowReturner: 'Kleiner CMJ oder leichter Throw; bei Schmerz auslassen.',
    coachFocus: 'Explosive Absicht, kontrollierte Landung, keine schweren Loaded Jumps.',
  },
  {
    pattern: 'Lower Body Strength',
    defaultOption: 'Goblet/Box Squat, Trap Bar oder KB Deadlift, Split Squat/RFESS.',
    alternative: 'DB Goblet, KB/DB Deadlift, Reverse Lunge, Step-up.',
    yellowReturner: 'Leicht, kurzer ROM, RPE 5-6, Technik statt Last.',
    coachFocus: 'Kein Grinding, keine Nachhol-Lasten, saubere Wiederholungen.',
  },
  {
    pattern: 'Upper Body + Carry',
    defaultOption: 'DB Floor/Bench Press, Row/Pull-up, Farmer/Suitcase Carry.',
    alternative: 'Push-up, Inverted Row, Band Row, kuerzerer Carry.',
    yellowReturner: 'Incline Push-up, Band Row leicht, kurzer leichter Carry.',
    coachFocus: 'Schulter schmerzfrei, Rumpf stabil, kein Strain.',
  },
  {
    pattern: 'Microdose',
    defaultOption: 'Assisted Nordic, Copenhagen/Squeeze, Calf/Soleus, Band ER, Neck ISO.',
    alternative: 'Slider Curl, Squeeze, bilateral calf raise, Push-up Plus.',
    yellowReturner: 'Bridge ISO, kurzer Squeeze, ISO calf, self-resistance only.',
    coachFocus: 'Schmerzprovokation stoppen; Kopf/Nacken-Symptome klaeren.',
  },
  {
    pattern: 'Contact Prep / Robustheit',
    defaultOption: 'Sled March, Brace ISO, Shield Connection, Stay Square.',
    alternative: 'Wall/Sled Push ISO, Pallof, Carry, Partner Lean.',
    yellowReturner: 'Leicht oder auslassen; kein Contact Prep bei unklarem Returner.',
    coachFocus: 'Kurz, kontrolliert, kein Full Contact im S&C.',
  },
  {
    pattern: 'Conditioning',
    defaultOption: 'Extensive Tempo, Bike/Erg locker-moderat, kurze BIP-Serien nur wenn passend.',
    alternative: 'Airbike, Ergometer, Spin Bike, Tempo kuerzen.',
    yellowReturner: 'Halbes Volumen oder auslassen; kein Bronco.',
    coachFocus: 'Keine Conditioning-Strafen und keine harten Finisher.',
  },
]
