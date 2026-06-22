import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { libraryCategories, libraryItems } from './library'
import { activePdfRefs } from './pdfRefs'
import { sessionDefinitions } from './sessions'
import type { LibraryCategory } from './types'

const expectedCategories: LibraryCategory[] = [
  'Heute relevant',
  'Aktive Pläne',
  'Playbooks',
  'Varianten',
  'Exercise Mapping',
  'Consent/Datenschutz',
  'Quellen',
  'Archiv',
]

describe('library content integrity', () => {
  it('uses the coach-facing Sprint 23 categories in a stable order', () => {
    expect(libraryCategories).toEqual(expectedCategories)
    expect(new Set(libraryItems.map((item) => item.category))).toEqual(new Set(expectedCategories.slice(1)))
  })

  it('keeps every active PDF reference backed by a public asset and reachable from static content', () => {
    const reachablePdfHrefs = new Set([
      ...libraryItems.flatMap((item) => item.pdfRefs ?? []).map((pdf) => pdf.href),
      ...sessionDefinitions.flatMap((session) => session.pdfRefs).map((pdf) => pdf.href),
    ])

    for (const pdfRef of activePdfRefs) {
      expect(existsSync(join(process.cwd(), 'public', pdfRef.href)), `${pdfRef.href} is missing`).toBe(true)
      expect(reachablePdfHrefs.has(pdfRef.href), `${pdfRef.href} is not reachable`).toBe(true)
      expect(pdfRef.href.includes('_ARCHIV')).toBe(false)
    }
  })

  it('keeps all session and block library references pointed at known items', () => {
    const knownItemIds = new Set(libraryItems.map((item) => item.id))

    for (const session of sessionDefinitions) {
      for (const libraryRef of session.libraryRefs) {
        expect(knownItemIds.has(libraryRef), `${session.id} has unknown library ref ${libraryRef}`).toBe(true)
      }

      for (const block of session.timeline) {
        for (const libraryRef of block.libraryRefs ?? []) {
          expect(knownItemIds.has(libraryRef), `${block.key} has unknown library ref ${libraryRef}`).toBe(true)
        }
      }
    }
  })
})
