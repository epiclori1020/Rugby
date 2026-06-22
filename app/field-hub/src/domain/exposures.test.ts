import { describe, expect, it } from 'vitest'
import type { SessionDefinition } from '../content/types'
import { emptyCheckInDraft, type PlayerSessionEntry, type SessionLog } from './checkIn'
import type { ReturnerCapSummary } from './returners'
import type { SessionBlockLog } from './sessionBlocks'
import {
  buildPlayerExposureSummaries,
  exposureTypes,
  mergeManualExposureOverrides,
  type PlayerExposureSummary,
} from './exposures'

const userId = 'user-1'

const sessionDefinition: SessionDefinition = {
  id: 'session-def-1',
  date: '2026-06-18',
  kw: 'KW25',
  title: 'Training',
  type: 'training',
  summary: '',
  primarySource: '',
  pdfRefs: [],
  goals: [],
  timeline: [
    {
      key: 'session-def-1:speed',
      order: 10,
      time: '10-20',
      title: 'Speed',
      work: '4x10 m',
      exposureTags: ['speed', 'acceleration'],
    },
    {
      key: 'session-def-1:cod-contact',
      order: 20,
      time: '20-30',
      title: 'COD + Kontakt Prep',
      work: 'Decel + brace',
      exposureTags: ['cod_decel', 'contact_prep'],
    },
    {
      key: 'session-def-1:finish',
      order: 30,
      time: '30-40',
      title: 'Finish',
      work: 'Tempo',
      exposureTags: ['conditioning'],
    },
  ],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

const sessionLog: SessionLog = {
  id: 'session-log-1',
  userId,
  sessionDefinitionId: sessionDefinition.id,
  date: sessionDefinition.date,
  status: 'in_progress',
  coach: '',
  groupSize: null,
  weatherOrHeatNote: '',
  planChanged: false,
  durationMinutes: null,
  contactIndex: '',
  speedExposureNote: '',
  coachReview: '',
  createdAt: '2026-06-18T18:00:00.000Z',
  updatedAt: '2026-06-18T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-18T18:00:00.000Z',
  syncStatus: 'synced',
  syncError: null,
}

function blockLog(blockKey: string, status: SessionBlockLog['status']): SessionBlockLog {
  const block = sessionDefinition.timeline.find((candidate) => candidate.key === blockKey)
  if (!block) {
    throw new Error('block missing')
  }

  return {
    id: `log-${blockKey}`,
    userId,
    sessionLogId: sessionLog.id,
    sessionDefinitionId: sessionDefinition.id,
    blockKey,
    blockTitle: block.title,
    blockOrder: block.order,
    plannedTime: block.time,
    plannedWork: block.work,
    status,
    reason: status === 'done' || status === 'planned' ? 'none' : 'coach_decision',
    coachNote: '',
    createdAt: '2026-06-18T18:00:00.000Z',
    updatedAt: '2026-06-18T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-18T18:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
  }
}

function entry(overrides: Partial<PlayerSessionEntry> = {}): PlayerSessionEntry {
  return {
    ...emptyCheckInDraft,
    id: `entry-${overrides.playerId ?? 'player-1'}`,
    userId,
    sessionLogId: sessionLog.id,
    playerId: 'player-1',
    present: true,
    sessionRpe: null,
    durationMinutes: null,
    sessionLoad: null,
    postPainScore: null,
    postPainLocation: '',
    e2Decision: null,
    nextStep: null,
    createdAt: '2026-06-18T18:00:00.000Z',
    updatedAt: '2026-06-18T18:00:00.000Z',
    deletedAt: null,
    clientUpdatedAt: '2026-06-18T18:00:00.000Z',
    syncStatus: 'synced',
    syncError: null,
    ...overrides,
  }
}

function caps(overrides: Partial<ReturnerCapSummary>): ReturnerCapSummary {
  return {
    playerId: 'player-1',
    sessionLogId: 'previous-session',
    sessionDate: '2026-06-16',
    currentStage: '',
    speedCap: '',
    codDecelCap: '',
    conditioningCap: '',
    contactCap: '',
    allowedToday: '',
    plannedCaps: '',
    completed: '',
    symptomsDuring: '',
    nextMorning: '',
    decision: null,
    ...overrides,
  }
}

describe('Exposure derivation', () => {
  it('creates default summaries from done block tags for present players only', () => {
    const summaries = buildPlayerExposureSummaries({
      userId,
      sessionLog,
      sessionDefinition,
      blockLogs: [blockLog('session-def-1:speed', 'done'), blockLog('session-def-1:finish', 'planned')],
      entries: [entry({ playerId: 'player-1' }), entry({ playerId: 'player-2', present: false })],
      returnerCaps: [],
      existingSummaries: [],
    })

    expect(summaries).toHaveLength(1)
    expect(summaries[0].playerId).toBe('player-1')
    expect(summaries[0].statuses.speed).toBe('completed')
    expect(summaries[0].statuses.acceleration).toBe('completed')
    expect(summaries[0].statuses.conditioning).toBe('none')
    expect(summaries[0].sources.speed?.[0]).toMatchObject({
      blockKey: 'session-def-1:speed',
      blockStatus: 'done',
      derivedStatus: 'completed',
      source: 'block_default',
    })
  })

  it('applies player limits and conservative stop rules after block defaults', () => {
    const [limited, stopped] = buildPlayerExposureSummaries({
      userId,
      sessionLog,
      sessionDefinition,
      blockLogs: [
        blockLog('session-def-1:speed', 'done'),
        blockLog('session-def-1:cod-contact', 'done'),
        blockLog('session-def-1:finish', 'done'),
      ],
      entries: [
        entry({ playerId: 'limited', limits: ['kein_sprint', 'kein_cond'] }),
        entry({ playerId: 'stopped', trainingVariant: 'D', limits: ['klaeren'] }),
      ],
      returnerCaps: [],
      existingSummaries: [],
    })

    expect(limited.statuses.speed).toBe('skipped')
    expect(limited.statuses.acceleration).toBe('skipped')
    expect(limited.statuses.cod_decel).toBe('skipped')
    expect(limited.statuses.conditioning).toBe('skipped')
    expect(limited.statuses.contact_prep).toBe('completed')
    expect(exposureTypes.filter((type) => stopped.statuses[type] !== 'none')).toEqual(
      expect.arrayContaining(['speed', 'acceleration', 'cod_decel', 'contact_prep', 'conditioning']),
    )
    expect(exposureTypes.every((type) => stopped.statuses[type] === 'none' || stopped.statuses[type] === 'skipped')).toBe(true)
  })

  it('combines multiple block statuses by priority and applies returner cap overrides conservatively', () => {
    const summaries = buildPlayerExposureSummaries({
      userId,
      sessionLog,
      sessionDefinition: {
        ...sessionDefinition,
        timeline: [
          ...sessionDefinition.timeline,
          {
            key: 'session-def-1:speed-2',
            order: 40,
            time: '40-45',
            title: 'Speed 2',
            work: '2x20 m',
            exposureTags: ['speed'],
          },
        ],
      },
      blockLogs: [
        blockLog('session-def-1:speed', 'reduced'),
        { ...blockLog('session-def-1:speed', 'done'), id: 'speed-2-log', blockKey: 'session-def-1:speed-2' },
        blockLog('session-def-1:cod-contact', 'done'),
        blockLog('session-def-1:finish', 'done'),
      ],
      entries: [entry()],
      returnerCaps: [
        caps({
          speedCap: 'smooth 70%',
          codDecelCap: '0',
          conditioningCap: 'full',
          contactCap: 'unklar nach Physio',
        }),
      ],
      existingSummaries: [],
    })

    const summary = summaries[0]
    expect(summary.statuses.speed).toBe('reduced')
    expect(summary.statuses.acceleration).toBe('reduced')
    expect(summary.statuses.cod_decel).toBe('skipped')
    expect(summary.statuses.conditioning).toBe('completed')
    expect(summary.statuses.contact_prep).toBe('reduced')
  })

  it('treats normal returner cap text as full exposure instead of matching no as a substring', () => {
    const summaries = buildPlayerExposureSummaries({
      userId,
      sessionLog,
      sessionDefinition,
      blockLogs: [blockLog('session-def-1:speed', 'done')],
      entries: [entry()],
      returnerCaps: [caps({ speedCap: 'normal trainieren' })],
      existingSummaries: [],
    })

    const summary = summaries[0]
    expect(summary.statuses.speed).toBe('completed')
    expect(summary.statuses.acceleration).toBe('completed')
  })

  it('treats explicit no-limit returner cap text as full exposure', () => {
    const summaries = buildPlayerExposureSummaries({
      userId,
      sessionLog,
      sessionDefinition,
      blockLogs: [blockLog('session-def-1:speed', 'done')],
      entries: [entry()],
      returnerCaps: [caps({ speedCap: 'keine Limits, volle Belastung' })],
      existingSummaries: [],
    })

    const summary = summaries[0]
    expect(summary.statuses.speed).toBe('completed')
    expect(summary.statuses.acceleration).toBe('completed')
  })

  it('keeps contradictory no-limit returner cap text conservative when stop words are present', () => {
    const summaries = buildPlayerExposureSummaries({
      userId,
      sessionLog,
      sessionDefinition,
      blockLogs: [blockLog('session-def-1:speed', 'done'), blockLog('session-def-1:cod-contact', 'done')],
      entries: [entry()],
      returnerCaps: [caps({ speedCap: 'frei, aber kein Sprint', contactCap: 'keine Limits, aber kein Kontakt' })],
      existingSummaries: [],
    })

    const summary = summaries[0]
    expect(summary.statuses.speed).toBe('skipped')
    expect(summary.statuses.acceleration).toBe('skipped')
    expect(summary.statuses.contact_prep).toBe('skipped')
  })

  it('keeps manual per-type overrides when defaults are regenerated', () => {
    const existing: PlayerExposureSummary = {
      id: 'summary-1',
      userId,
      playerId: 'player-1',
      sessionLogId: sessionLog.id,
      sessionDefinitionId: sessionDefinition.id,
      sessionDate: sessionDefinition.date,
      statuses: Object.fromEntries(exposureTypes.map((type) => [type, 'none'])) as PlayerExposureSummary['statuses'],
      sources: {},
      manualOverrides: {
        speed: { status: 'completed', note: 'Coach override', updatedAt: '2026-06-18T19:00:00.000Z' },
      },
      coachNote: '',
      createdAt: '2026-06-18T18:00:00.000Z',
      updatedAt: '2026-06-18T19:00:00.000Z',
      deletedAt: null,
      clientUpdatedAt: '2026-06-18T19:00:00.000Z',
      syncStatus: 'synced',
      syncError: null,
    }

    const summaries = buildPlayerExposureSummaries({
      userId,
      sessionLog,
      sessionDefinition,
      blockLogs: [blockLog('session-def-1:speed', 'skipped')],
      entries: [entry()],
      returnerCaps: [],
      existingSummaries: [existing],
    })

    expect(summaries[0].id).toBe('summary-1')
    expect(summaries[0].statuses.speed).toBe('completed')
    expect(summaries[0].manualOverrides.speed?.note).toBe('Coach override')
  })

  it('merges manual overrides without accepting medical clearance wording', () => {
    expect(() =>
      mergeManualExposureOverrides({}, 'speed', {
        status: 'completed',
        note: 'medizinische Freigabe liegt vor',
        updatedAt: '2026-06-18T19:00:00.000Z',
      }),
    ).toThrow('Keine medizinische Freigabe')

    expect(
      mergeManualExposureOverrides({}, 'speed', {
        status: 'completed',
        note: 'Coach gesehen',
        updatedAt: '2026-06-18T19:00:00.000Z',
      }).speed,
    ).toMatchObject({ status: 'completed', note: 'Coach gesehen' })
  })
})

describe('Returner cap text classification (hardening)', () => {
  function summaryWithCaps(capsOverride: Partial<ReturnerCapSummary>) {
    return buildPlayerExposureSummaries({
      userId,
      sessionLog,
      sessionDefinition,
      blockLogs: [blockLog('session-def-1:speed', 'done'), blockLog('session-def-1:cod-contact', 'done')],
      entries: [entry()],
      returnerCaps: [caps(capsOverride)],
      existingSummaries: [],
    })[0]
  }

  it('does not treat harmless negations as a stop', () => {
    expect(summaryWithCaps({ speedCap: 'kein Schmerz' }).statuses.speed).toBe('reduced')
    expect(summaryWithCaps({ speedCap: 'keine Probleme, 70%' }).statuses.speed).toBe('reduced')
    expect(summaryWithCaps({ speedCap: 'nicht maximal' }).statuses.speed).toBe('reduced')
  })

  it('treats rugby/compound stop phrases as skipped', () => {
    expect(summaryWithCaps({ speedCap: 'kein Sprinttraining' }).statuses.speed).toBe('skipped')
    expect(summaryWithCaps({ contactCap: 'kein Vollkontakt' }).statuses.contact_prep).toBe('skipped')
    expect(summaryWithCaps({ contactCap: 'kein Tackling' }).statuses.contact_prep).toBe('skipped')
  })

  it('does not skip when a restriction noun only appears far from the negation', () => {
    expect(summaryWithCaps({ contactCap: 'keine Probleme mit Kontakt' }).statuses.contact_prep).not.toBe('skipped')
  })

  it('keeps unambiguous stop words working anywhere in the text', () => {
    expect(summaryWithCaps({ speedCap: 'stop nach 10 min' }).statuses.speed).toBe('skipped')
  })

  it('uses exact-token matching for short nouns to avoid substring false positives', () => {
    // short nouns (run/lauf/ruck) must NOT match as substrings inside harmless words
    expect(summaryWithCaps({ speedCap: 'kein Grund' }).statuses.speed).not.toBe('skipped')
    expect(summaryWithCaps({ speedCap: 'kein Ablauf' }).statuses.speed).not.toBe('skipped')
    expect(summaryWithCaps({ contactCap: 'kein Druck' }).statuses.contact_prep).not.toBe('skipped')
    // but the exact token itself still stops
    expect(summaryWithCaps({ speedCap: 'kein Lauf' }).statuses.speed).toBe('skipped')
    expect(summaryWithCaps({ speedCap: '0' }).statuses.speed).toBe('skipped')
  })
})
