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

export type SessionBlock = {
  key: string
  order: number
  time: string
  title: string
  work: string
  dose?: string
  note?: string
  exposureTags?: ExposureTag[]
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
