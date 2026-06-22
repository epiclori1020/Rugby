import { describe, expect, it } from 'vitest'
import type { SessionDefinition } from '../content/types'
import type { SessionBlockLog } from './sessionBlocks'
import {
  getDefaultLiveSessionStep,
  getLiveSessionStep,
  getNextLiveSessionStep,
  getPreviousLiveSessionStep,
  isFinalLiveSessionStatus,
} from './liveSession'

const sessionDefinition: SessionDefinition = {
  id: 'session-1',
  date: '2026-06-18',
  kw: 'KW25',
  title: 'Test Session',
  type: 'training',
  summary: '',
  primarySource: '',
  pdfRefs: [],
  goals: [],
  timeline: [
    {
      key: 'session-1:warmup',
      order: 20,
      time: '8-18',
      title: 'Warm-up',
      work: 'RAMP.',
    },
    {
      key: 'session-1:checkin',
      order: 10,
      time: '0-8',
      title: 'Check-in',
      work: 'Ampel.',
    },
    {
      key: 'session-1:speed',
      order: 30,
      time: '18-28',
      title: 'Speed',
      work: '4x10 m.',
    },
  ],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

function blockLog(blockKey: string, status: SessionBlockLog['status']): SessionBlockLog {
  const block = sessionDefinition.timeline.find((candidate) => candidate.key === blockKey)
  if (!block) {
    throw new Error('missing test block')
  }

  return {
    id: `log-${blockKey}`,
    userId: 'user-1',
    sessionLogId: 'session-log-1',
    sessionDefinitionId: sessionDefinition.id,
    blockKey,
    blockTitle: block.title,
    blockOrder: block.order,
    plannedTime: block.time,
    plannedWork: block.work,
    status,
    reason: status === 'planned' || status === 'done' ? 'none' : 'time',
    coachNote: '',
    createdAt: '2026-06-18T18:00:00.000Z',
    updatedAt: '2026-06-18T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-18T18:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
  }
}

describe('live session step selection', () => {
  it('starts at the first ordered block when no block logs exist', () => {
    expect(getDefaultLiveSessionStep(sessionDefinition, [])).toMatchObject({
      block: { key: 'session-1:checkin', title: 'Check-in' },
      index: 0,
      total: 3,
      status: 'planned',
    })
  })

  it('continues at the first block that is not final after reload', () => {
    const step = getDefaultLiveSessionStep(sessionDefinition, [
      blockLog('session-1:checkin', 'done'),
      blockLog('session-1:warmup', 'reduced'),
    ])

    expect(step).toMatchObject({
      block: { key: 'session-1:speed', title: 'Speed' },
      index: 2,
      total: 3,
      status: 'planned',
    })
  })

  it('treats done, reduced, changed and skipped as final planned-vs-actual states', () => {
    expect(isFinalLiveSessionStatus('planned')).toBe(false)
    expect(isFinalLiveSessionStatus('done')).toBe(true)
    expect(isFinalLiveSessionStatus('reduced')).toBe(true)
    expect(isFinalLiveSessionStatus('changed')).toBe(true)
    expect(isFinalLiveSessionStatus('skipped')).toBe(true)
  })

  it('moves to next and previous steps by UI state without requiring saved logs', () => {
    expect(getNextLiveSessionStep(sessionDefinition, [], 'session-1:checkin')).toMatchObject({
      block: { key: 'session-1:warmup' },
      index: 1,
    })
    expect(getPreviousLiveSessionStep(sessionDefinition, [], 'session-1:speed')).toMatchObject({
      block: { key: 'session-1:warmup' },
      index: 1,
    })
  })

  it('returns no previous or next step for an unknown current key', () => {
    expect(getPreviousLiveSessionStep(sessionDefinition, [], 'unknown')).toBeNull()
    expect(getNextLiveSessionStep(sessionDefinition, [], 'unknown')).toBeNull()
  })

  it('falls back to the default step when an unknown current key is requested', () => {
    expect(getLiveSessionStep(sessionDefinition, [], 'unknown')).toMatchObject({
      block: { key: 'session-1:checkin' },
      index: 0,
    })
  })
})
