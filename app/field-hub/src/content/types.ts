export type SessionType = 'training' | 'baseline' | 'recheck' | 'transition'

export type LibraryCategory =
  | 'Coach-Skript'
  | 'Spieler-Briefing'
  | 'Detail-Briefing'
  | 'Varianten'
  | 'Exercise Mapping'
  | 'Consent/Datenschutz'
  | 'PDFs'

export type PdfRef = {
  label: string
  href: string
  sourcePath: string
}

export type SessionBlock = {
  time: string
  title: string
  work: string
  dose?: string
  note?: string
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
