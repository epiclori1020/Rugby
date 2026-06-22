export type ExercisePattern =
  | 'squat'
  | 'hinge'
  | 'push'
  | 'pull'
  | 'carry'
  | 'lunge'
  | 'jump'
  | 'sprint'
  | 'cod'
  | 'neck_trunk'
  | 'conditioning'
  | 'other'

export type ExerciseUnit = 'kg' | 'bodyweight' | 'm' | 's' | 'reps' | 'cm'

export type ExerciseDefinition = {
  key: string
  name: string
  pattern: ExercisePattern
  defaultUnit: ExerciseUnit
  active: boolean
  referencePattern: string
  description: string
}

export const exerciseDefinitions = [
  {
    key: 'ramp_sequence',
    name: 'RAMP Sequence',
    pattern: 'other',
    defaultUnit: 'reps',
    active: true,
    referencePattern: 'Prep / RAMP',
    description: 'Kurze Prep-Sequenz aus Lauf-ABC, Pogo, Snap-down und Bewegungsqualitaet.',
  },
  {
    key: 'acceleration_10_20m',
    name: 'Acceleration 10-20 m',
    pattern: 'sprint',
    defaultUnit: 'm',
    active: true,
    referencePattern: 'Speed / Acceleration',
    description: 'Kurze lineare Beschleunigung mit sauberer Pause und ohne Rennlogik.',
  },
  {
    key: 'broad_jump',
    name: 'Broad Jump',
    pattern: 'jump',
    defaultUnit: 'cm',
    active: true,
    referencePattern: 'Power',
    description: 'Horizontaler Sprung mit kontrollierter Landung.',
  },
  {
    key: 'cmj_stick',
    name: 'CMJ + Stick',
    pattern: 'jump',
    defaultUnit: 'reps',
    active: true,
    referencePattern: 'Power',
    description: 'Vertikaler Sprung mit sichtbarer Landekontrolle.',
  },
  {
    key: 'med_ball_chest_pass',
    name: 'Med-Ball Chest Pass',
    pattern: 'push',
    defaultUnit: 'm',
    active: true,
    referencePattern: 'Power',
    description: 'Med-Ball-Wurf fuer Oberkoerper-Power.',
  },
  {
    key: 'med_ball_scoop_throw',
    name: 'Med-Ball Scoop Throw',
    pattern: 'other',
    defaultUnit: 'm',
    active: true,
    referencePattern: 'Power',
    description: 'Explosiver Med-Ball-Wurf als einfache Power-Variante.',
  },
  {
    key: 'trap_bar_deadlift',
    name: 'Trap Bar Deadlift',
    pattern: 'hinge',
    defaultUnit: 'kg',
    active: true,
    referencePattern: 'Lower Body Strength',
    description: 'Hinge-Hauptmuster fuer kontrollierte Kraftprogression.',
  },
  {
    key: 'kb_deadlift',
    name: 'KB Deadlift',
    pattern: 'hinge',
    defaultUnit: 'kg',
    active: true,
    referencePattern: 'Lower Body Strength',
    description: 'Feldtaugliche Hinge-Regression mit Kettlebell oder Dumbbell.',
  },
  {
    key: 'goblet_squat',
    name: 'Goblet Squat',
    pattern: 'squat',
    defaultUnit: 'kg',
    active: true,
    referencePattern: 'Lower Body Strength',
    description: 'Squat-Pattern fuer Technik, ROM und moderate Last.',
  },
  {
    key: 'split_squat_rfess',
    name: 'Split Squat / RFESS',
    pattern: 'lunge',
    defaultUnit: 'kg',
    active: true,
    referencePattern: 'Lower Body Strength',
    description: 'Unilaterales Kraftmuster fuer Split Squat, RFESS und nahe Varianten.',
  },
  {
    key: 'push_up',
    name: 'Push-up',
    pattern: 'push',
    defaultUnit: 'bodyweight',
    active: true,
    referencePattern: 'Upper Body + Carry',
    description: 'Oberkoerper-Push-Muster als einfache Bodyweight-Option.',
  },
  {
    key: 'db_press',
    name: 'DB Press',
    pattern: 'push',
    defaultUnit: 'kg',
    active: true,
    referencePattern: 'Upper Body + Carry',
    description: 'DB Floor Press, Bench Press oder nahe Dumbbell-Push-Variante.',
  },
  {
    key: 'row_pullup',
    name: 'Row / Pull-up',
    pattern: 'pull',
    defaultUnit: 'reps',
    active: true,
    referencePattern: 'Upper Body + Carry',
    description: 'Pull-Muster fuer Row, Inverted Row, Band Row oder Pull-up.',
  },
  {
    key: 'farmer_suitcase_carry',
    name: 'Farmer / Suitcase Carry',
    pattern: 'carry',
    defaultUnit: 'm',
    active: true,
    referencePattern: 'Upper Body + Carry',
    description: 'Carry-Muster fuer Rumpf, Griff und Schulterkontrolle.',
  },
  {
    key: 'nordic_assisted',
    name: 'Assisted Nordic',
    pattern: 'neck_trunk',
    defaultUnit: 'reps',
    active: true,
    referencePattern: 'Microdose',
    description: 'Hamstring-Microdose, nur kontrolliert und ohne Schmerzprovokation.',
  },
  {
    key: 'copenhagen_squeeze',
    name: 'Copenhagen / Squeeze',
    pattern: 'neck_trunk',
    defaultUnit: 'reps',
    active: true,
    referencePattern: 'Microdose',
    description: 'Adduktor-Microdose als Copenhagen- oder Squeeze-Variante.',
  },
  {
    key: 'calf_soleus_raise',
    name: 'Calf / Soleus Raise',
    pattern: 'neck_trunk',
    defaultUnit: 'reps',
    active: true,
    referencePattern: 'Microdose',
    description: 'Calf-/Soleus-Microdose fuer Unterschenkelrobustheit.',
  },
  {
    key: 'band_external_rotation',
    name: 'Band External Rotation',
    pattern: 'neck_trunk',
    defaultUnit: 'reps',
    active: true,
    referencePattern: 'Microdose',
    description: 'Schulter-Microdose mit Band, leicht und kontrolliert.',
  },
  {
    key: 'neck_iso',
    name: 'Neck ISO',
    pattern: 'neck_trunk',
    defaultUnit: 's',
    active: true,
    referencePattern: 'Microdose',
    description: 'Nacken-Isometrie nur symptomfrei und ohne medizinische Freigabelogik.',
  },
  {
    key: 'sled_march',
    name: 'Sled March',
    pattern: 'carry',
    defaultUnit: 'm',
    active: true,
    referencePattern: 'Contact Prep / Robustheit',
    description: 'Kontrollierte Contact-Prep-/Brace-Variante ohne Full Contact.',
  },
  {
    key: 'brace_iso',
    name: 'Brace ISO',
    pattern: 'neck_trunk',
    defaultUnit: 's',
    active: true,
    referencePattern: 'Contact Prep / Robustheit',
    description: 'Kurze isometrische Brace-Arbeit fuer kontrollierte Robustheit.',
  },
  {
    key: 'shield_connection',
    name: 'Shield Connection',
    pattern: 'other',
    defaultUnit: 'reps',
    active: true,
    referencePattern: 'Contact Prep / Robustheit',
    description: 'Technische Contact-Prep-Verbindung ohne Live-Kontakt.',
  },
  {
    key: 'easy_tempo_run',
    name: 'Easy Tempo Run',
    pattern: 'conditioning',
    defaultUnit: 'm',
    active: true,
    referencePattern: 'Conditioning',
    description: 'Lockerer Tempo-Lauf, nicht als harter Finisher.',
  },
  {
    key: 'bike_erg_tempo',
    name: 'Bike / Erg Tempo',
    pattern: 'conditioning',
    defaultUnit: 's',
    active: true,
    referencePattern: 'Conditioning',
    description: 'Bike-, Airbike- oder Ergometer-Alternative fuer lockere bis moderate Arbeit.',
  },
] as const satisfies ExerciseDefinition[]

export type ExerciseKey = (typeof exerciseDefinitions)[number]['key']

