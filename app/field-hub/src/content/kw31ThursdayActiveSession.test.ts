import { describe, expect, it } from 'vitest'
import { libraryItems } from './library'
import { pdfRefs } from './pdfRefs'
import { sessionDefinitions } from './sessions'

describe('KW31 Thursday active session', () => {
  it('shows the final Thursday plan and its deep playbook', () => {
    const session = sessionDefinitions.find((item) => item.id === 'kw31-do-2026-07-30')

    expect(session?.primarySource).toBe('docs/28_kw31_thursday_deep_playbook_2026-07-30.md')
    expect(session?.pdfRefs[0]).toEqual(pdfRefs.kw31ThursdayDeepPlaybook)
    expect(session?.timeline.map((block) => block.time)).toEqual([
      '0-3',
      '3-6',
      '6-13',
      '13-19',
      '19-30',
      '30-39',
      '39-66',
      '66-73',
      '73-79',
      '79-87',
      '87-90',
    ])

    const sessionText = session?.timeline.map((block) => block.work).join(' ') ?? ''
    expect(sessionText).toContain('Scapular Wall Slide plus Reach 1x6')
    expect(sessionText).toContain('Broad Jump plus Stick 2x2')
    expect(sessionText).toContain('Half-Kneeling One-Arm DB Overhead Press')
    expect(sessionText).toContain('Pull-up oder Band-Assisted Pull-up')
    expect(sessionText).not.toContain('CMJ + Stick')
  })

  it('exposes the final Thursday plan in the active library', () => {
    const item = libraryItems.find((candidate) => candidate.id === 'kw31-thursday-active-plan')

    expect(item?.pdfRefs).toEqual([pdfRefs.kw31ThursdayDeepPlaybook])
    expect(item?.summary).toContain('drei Kraftstationen')
  })
})
