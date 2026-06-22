import { describe, expect, it } from 'vitest'
import type { SessionDefinition } from '../content/types'
import {
  buildSessionBlockSnapshot,
  isReasonRequiredForStatus,
  validateSessionBlockStatusReason,
} from './sessionBlocks'

const sessionDefinition: SessionDefinition = {
  id: 'kw25-do-2026-06-18',
  date: '2026-06-18',
  kw: 'KW25',
  title: 'Donnerstag',
  type: 'training',
  summary: '',
  primarySource: '',
  pdfRefs: [],
  goals: [],
  timeline: [
    {
      key: 'kw25-do-2026-06-18:speed',
      order: 30,
      time: '18-28',
      title: 'Speed',
      work: '4x10 m plus optional 2x15 m.',
      dose: '70-80 Prozent',
    },
  ],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

describe('session block status rules', () => {
  it('requires no reason for planned and done blocks', () => {
    expect(validateSessionBlockStatusReason('planned', 'none')).toEqual({ valid: true, error: null })
    expect(validateSessionBlockStatusReason('done', 'none')).toEqual({ valid: true, error: null })
    expect(validateSessionBlockStatusReason('done', 'time')).toEqual({
      valid: false,
      error: 'Grund ist nur bei reduziert, geaendert oder gestrichen erlaubt.',
    })
  })

  it('requires a concrete reason when a block is reduced, changed or skipped', () => {
    expect(isReasonRequiredForStatus('reduced')).toBe(true)
    expect(validateSessionBlockStatusReason('reduced', 'none')).toEqual({
      valid: false,
      error: 'Grund ist fuer reduziert, geaendert oder gestrichen verpflichtend.',
    })
    expect(validateSessionBlockStatusReason('changed', 'weather')).toEqual({ valid: true, error: null })
    expect(validateSessionBlockStatusReason('skipped', 'coach_decision')).toEqual({ valid: true, error: null })
  })

  it('builds a planned snapshot from a stable timeline block key', () => {
    expect(buildSessionBlockSnapshot(sessionDefinition, 'kw25-do-2026-06-18:speed')).toEqual({
      sessionDefinitionId: 'kw25-do-2026-06-18',
      blockKey: 'kw25-do-2026-06-18:speed',
      blockTitle: 'Speed',
      blockOrder: 30,
      plannedTime: '18-28',
      plannedWork: '4x10 m plus optional 2x15 m.',
    })
  })

  it('rejects unknown block keys instead of falling back to array index or title', () => {
    expect(() => buildSessionBlockSnapshot(sessionDefinition, 'Speed')).toThrow('Session-Block nicht gefunden.')
  })
})
