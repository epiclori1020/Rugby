import type { ExerciseKey } from './exerciseDefinitions'
import type { MetricKey } from './metricDefinitions'
import type { PlayerCluster } from '../domain/players'

export type SessionType = 'training' | 'baseline' | 'recheck' | 'transition'

export type LibraryCategory =
  | 'Heute relevant'
  | 'Aktive Pläne'
  | 'Playbooks'
  | 'Varianten'
  | 'Exercise Mapping'
  | 'Consent/Datenschutz'
  | 'Quellen'
  | 'Archiv'

export type PdfRef = {
  label: string
  href: string
  sourcePath: string
}

export type ExposureTag =
  | 'speed'
  | 'acceleration'
  | 'cod_decel'
  | 'lower_strength'
  | 'upper_strength'
  | 'power'
  | 'conditioning'
  | 'contact_prep'
  | 'neck_trunk'
  | 'mobility'
  | 'reconditioning'

type SessionBlockExerciseBase = {
  key: string
  name: string
  prescription: string
  coachingCues: string[]
  setup?: string
  regression?: string
  safety?: string
}

type SessionBlockExerciseTarget =
  | {
      targeting: 'all'
      clusters?: never
      playerNames?: never
    }
  | {
      targeting: 'cluster'
      clusters: PlayerCluster[]
      playerNames?: never
    }
  | {
      targeting: 'named'
      clusters?: never
      playerNames: string[]
    }
  | {
      targeting: 'returner'
      clusters?: never
      playerNames?: never
      returnerRule?: string
    }
  | {
      targeting: 'optional'
      clusters?: never
      playerNames?: never
    }

type SessionBlockExerciseRecordingOption =
  | {
      recording: 'none' | 'observation'
      exerciseKey?: ExerciseKey
      metricKey?: never
    }
  | {
      recording: 'metric'
      exerciseKey?: never
      metricKey: MetricKey
    }
  | {
      recording: 'exercise'
      exerciseKey: ExerciseKey
      metricKey?: never
    }

export type SessionBlockExerciseTargeting = SessionBlockExerciseTarget['targeting']

export type SessionBlockExerciseRecording = SessionBlockExerciseRecordingOption['recording']

export type SessionBlockExercise = SessionBlockExerciseBase & SessionBlockExerciseTarget & SessionBlockExerciseRecordingOption

export type SessionBlock = {
  key: string
  order: number
  time: string
  title: string
  work: string
  dose?: string
  note?: string
  exposureTags?: ExposureTag[]
  exercises?: SessionBlockExercise[]
  libraryRefs?: string[]
}

export type SessionDefinition = {
  id: string
  date: string
  kw: string
  title: string
  type: SessionType
  summary: string
  primarySource: string
  pdfRefs: PdfRef[]
  goals: string[]
  timeline: SessionBlock[]
  materials: string[]
  safetyNotes: string[]
  coachNotes: string[]
  libraryRefs: string[]
}

export type LibraryItem = {
  id: string
  category: LibraryCategory
  title: string
  summary: string
  sourcePath: string
  tags: string[]
  sections: Array<{
    title: string
    body: string[]
  }>
  pdfRefs?: PdfRef[]
}
