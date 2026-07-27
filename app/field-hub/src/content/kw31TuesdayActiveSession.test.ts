import { describe, expect, it } from 'vitest'
import { libraryItems } from './library'
import { pdfRefs } from './pdfRefs'
import { sessionDefinitions } from './sessions'

describe('KW31 Tuesday active session', () => {
  it('shows the revised 90-minute session without the removed extras', () => {
    const session = sessionDefinitions.find((item) => item.id === 'kw31-di-2026-07-28')

    expect(session?.type).toBe('training')
    expect(session?.primarySource).toBe('docs/27_kw31_tuesday_deep_playbook_2026-07-28.md')
    expect(session?.pdfRefs[0]).toEqual(pdfRefs.kw31TuesdayDeepPlaybook)
    expect(session?.timeline.map((block) => block.time)).toEqual([
      '0-5',
      '5-13',
      '13-20',
      '20-34',
      '34-42',
      '42-67',
      '67-78',
      '78-90',
    ])

    const sessionText = session?.timeline.map((block) => block.work).join(' ') ?? ''
    expect(sessionText).toContain('Walk-in 45-Grad-Plant')
    expect(sessionText).toContain('horizontaler Zug (Inverted/DB Row)')
    expect(session?.summary).toContain('drei festen Stationen')
    expect(sessionText).not.toContain('Low Dribble 1x10')
    expect(sessionText).not.toContain('DB Jump Squat')
  })

  it('exposes the revised deep playbook as the active library item', () => {
    const item = libraryItems.find((candidate) => candidate.id === 'kw31-tuesday-active-plan')

    expect(item?.pdfRefs).toEqual([pdfRefs.kw31TuesdayDeepPlaybook])
    expect(item?.summary).toContain('drei festen Kraftstationen')
  })
})
