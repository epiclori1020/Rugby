import { describe, expect, it } from 'vitest'
import { libraryItems } from './library'
import { pdfRefs } from './pdfRefs'
import { sessionDefinitions } from './sessions'

describe('KW30 active sessions', () => {
  it('shows Session 4B as the active plan for Tuesday 21 July', () => {
    const session = sessionDefinitions.find((item) => item.id === 'kw30-di-2026-07-21')

    expect(session?.title).toBe('Dienstag 21. Juli: Session 4B')
    expect(session?.summary).toContain('zwei saubere Kraftsaetze')
    expect(session?.pdfRefs).toEqual([
      pdfRefs.kw29ThursdayDeepPlaybook,
      pdfRefs.kw29ThursdayTrainingCompact,
      pdfRefs.kw29ThursdayCheckIn,
    ])
    expect(session?.libraryRefs).toContain('kw29-thursday-active-pack')
    expect(session?.timeline.map((block) => block.title)).toEqual([
      'Check-in + RAMP',
      'Track + Speedqualitaet',
      'Power-Primer',
      'Kraft-Konsolidierung',
      'Cluster + Robustheit',
      'Optionales Tempo + Abschluss',
    ])
  })

  it('shows the detailed Thursday development session and PDF pack', () => {
    const session = sessionDefinitions.find((item) => item.id === 'kw30-do-2026-07-23')

    expect(session?.summary).toContain('Kontrollierter Off-Season-Entwicklungsreiz')
    expect(session?.pdfRefs).toEqual([
      pdfRefs.kw30ThursdayDeepPlaybook,
      pdfRefs.kw30ThursdayTrainingCompact,
      pdfRefs.kw30ThursdayCheckIn,
    ])
    expect(session?.libraryRefs).toContain('kw30-thursday-active-pack')
    expect(session?.timeline.map((block) => block.time)).toEqual([
      '0-5',
      '5-14',
      '14-22',
      '22-35',
      '35-43',
      '43-69',
      '69-79',
      '79-90',
    ])
    expect(session?.timeline.find((block) => block.title === 'Speed / COD')?.work).toContain('Build 20/Fly 10')
    expect(session?.timeline.find((block) => block.title === 'Kraft-Pods')?.work).toContain('3x4 @ RPE 7')
    expect(session?.timeline.find((block) => block.title === 'Ball-in-Play + Abschluss')?.work).toContain('2 Serien')
    expect(session?.safetyNotes.join(' ')).toContain('keine Rueckkehr am selben Tag')
  })

  it('exposes both active packs from the static library', () => {
    expect(libraryItems.find((item) => item.id === 'kw29-thursday-active-pack')?.pdfRefs).toHaveLength(3)
    expect(libraryItems.find((item) => item.id === 'kw30-thursday-active-pack')?.pdfRefs).toHaveLength(3)
  })
})
