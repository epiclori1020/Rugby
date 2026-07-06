import type { SportConfig } from './sports'

export const onFieldRugbyPositionGroups = [
  { value: 'offen', label: 'Offen' },
  { value: 'front_row', label: 'Front Row' },
  { value: 'locks', label: 'Locks' },
  { value: 'back_row', label: 'Back Row' },
  { value: 'halves', label: 'Halves' },
  { value: 'centres', label: 'Centres' },
  { value: 'back_three', label: 'Back Three' },
] as const

export type OnFieldRugbyPositionGroupId = (typeof onFieldRugbyPositionGroups)[number]['value']

export const onFieldRugbyConfig = {
  sportId: 'rugby',
  productLabel: 'OnField Rugby',
  athleteLabels: {
    genericName: 'Athlete',
    displayName: 'Spieler',
    pluralDisplayName: 'Spieler',
    positionLabel: 'Position',
    positionGroupLabel: 'Position Group',
  },
  positionGroups: onFieldRugbyPositionGroups,
  sessionTypeLabels: {
    training: 'Training',
    baseline: 'Baseline',
    recheck: 'Re-Check',
    transition: 'Transition',
  },
  metricLabels: {
    broad_jump: 'Broad Jump',
    med_ball_chest_pass: 'Med-Ball Chest Pass',
    sprint_10m: '10 m Sprint',
    sprint_30m: '30 m Sprint',
  },
  trafficLightLabels: {
    green: 'Gruen',
    yellow: 'Gelb',
    red: 'Rot',
  },
  reconditioningLabels: {
    boardLabel: 'Returner',
    statusLabel: 'Returner / Rückkehrstatus',
    capCategories: ['Speed', 'COD/Decel', 'Conditioning', 'Kontakt'],
  },
  libraryCategoryLabels: [
    'Heute relevant',
    'Aktive Pläne',
    'Playbooks',
    'Varianten',
    'Exercise Mapping',
    'Consent/Datenschutz',
    'Quellen',
    'Archiv',
  ],
  safetyCopy: {
    coachBoundary: 'OnField unterstützt Coaching-Entscheidungen, ersetzt aber keine medizinische Entscheidung.',
    publicCheckInPrivacy:
      'Deine Angaben gehen nur an Rugby Donau S&C für diese Trainingseinheit. Wenn du den falschen Namen wählst oder etwas Sensibles hast, sag dem Coach direkt Bescheid.',
  },
} as const satisfies SportConfig<OnFieldRugbyPositionGroupId>
