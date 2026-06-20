import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { libraryItems } from './library'
import { pdfRefs } from './pdfRefs'
import { sessionDefinitions } from './sessions'

describe('KW26 Tuesday PDF references', () => {
  it('uses the 23 June active PDF pack for the Tuesday session and library', () => {
    const session = sessionDefinitions.find((item) => item.id === 'kw26-di-2026-06-23')
    const libraryItem = libraryItems.find((item) => item.id === 'kw26-tuesday-active-pack')
    const expectedRefs = [
      pdfRefs.kw26TuesdayTrainingCompact,
      pdfRefs.kw26TuesdayCheckIn,
      pdfRefs.kw26TuesdayDeepPlaybook,
    ]

    expect(session?.pdfRefs).toEqual(expect.arrayContaining(expectedRefs))
    expect(session?.pdfRefs).not.toContain(pdfRefs.kw25To27Cards)
    expect(libraryItem?.pdfRefs).toEqual(expectedRefs)

    for (const pdfRef of expectedRefs) {
      expect(existsSync(join(process.cwd(), 'public', pdfRef.href))).toBe(true)
    }
  })
})
