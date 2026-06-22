export type MetricCategory = 'power' | 'speed' | 'strength' | 'conditioning' | 'mobility' | 'other'

export type MetricUnit = 'cm' | 'm' | 's' | 'kg' | 'reps' | 'score'

export type MetricDefinitionStatus = 'active' | 'optional_later'

export type MetricDefinition = {
  key: string
  name: string
  category: MetricCategory
  unit: MetricUnit
  higherIsBetter: boolean
  active: boolean
  status: MetricDefinitionStatus
  description: string
}

export const metricDefinitions = [
  {
    key: 'broad_jump',
    name: 'Broad Jump',
    category: 'power',
    unit: 'cm',
    higherIsBetter: true,
    active: true,
    status: 'active',
    description: 'Horizontaler Sprungwert fuer einfache Power-/Landing-Rechecks.',
  },
  {
    key: 'med_ball_chest_pass',
    name: 'Med-Ball Chest Pass',
    category: 'power',
    unit: 'm',
    higherIsBetter: true,
    active: true,
    status: 'active',
    description: 'Oberkoerper-Power-Wert mit dokumentiertem Ballgewicht im Kontext.',
  },
  {
    key: 'sprint_10m',
    name: '10 m Sprint',
    category: 'speed',
    unit: 's',
    higherIsBetter: false,
    active: true,
    status: 'active',
    description: 'Kurzer Beschleunigungswert, nur wenn Timing und Sicherheit passen.',
  },
  {
    key: 'sprint_30m',
    name: '30 m Sprint',
    category: 'speed',
    unit: 's',
    higherIsBetter: false,
    active: false,
    status: 'optional_later',
    description: 'Spaeterer optionaler Sprintwert; nicht als KW25-Pflichttest nutzen.',
  },
] as const satisfies MetricDefinition[]

export type MetricKey = (typeof metricDefinitions)[number]['key']

