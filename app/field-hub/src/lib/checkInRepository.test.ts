import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionDefinition } from '../content/types'
import { emptyCheckInDraft } from '../domain/checkIn'
import {
  ensureSessionLog,
  entryFromRow,
  findSessionLog,
  getCheckInSyncOverview,
  listExpectedPlayerIds,
  listLatestObservations,
  listLatestWarnings,
  rowFromEntry,
  resetCheckInEntry,
  resetCoachFields,
  saveCheckInEntry,
  saveKioskCheckInEntry,
  savePostSessionEntry,
  saveSessionLogPatch,
  type PlayerSessionEntryRow,
} from './checkInRepository'
import { localDb } from './localDb'

const userId = '00000000-0000-4000-8000-000000000001'

const sessionDefinition: SessionDefinition = {
  id: 'test-session',
  date: '2026-06-16',
  kw: 'KW25',
  title: 'Test Session',
  type: 'training',
  summary: 'Test',
  primarySource: 'test.md',
  pdfRefs: [],
  goals: [],
  timeline: [],
  materials: [],
  safetyNotes: [],
  coachNotes: [],
  libraryRefs: [],
}

const remoteEntryRow: PlayerSessionEntryRow = {
  id: 'entry-remote',
  user_id: userId,
  session_log_id: 'session-remote',
  player_id: 'player-remote',
  present: true,
  readiness: 5,
  life_flag: '',
  pain_score: 0,
  pain_location: '',
  returner_flag: 'nein',
  session_reaction: 'none',
  red_flag: 'head_neck_neuro',
  movement_concern: true,
  traffic_light: 'yellow',
  traffic_light_suggestion: 'green',
  traffic_light_was_manual: true,
  training_variant: 'C',
  limits: [],
  observation: 'manual override smoke',
  session_rpe: 7,
  duration_minutes: 75,
  session_load: 525,
  post_pain_score: 2,
  post_pain_location: 'Wade rechts',
  e2_decision: 'normal',
  next_step: 'steigern',
  created_at: '2026-06-16T18:00:00.000Z',
  updated_at: '2026-06-16T18:05:00.000Z',
  deleted_at: null,
  client_updated_at: '2026-06-16T18:05:00.000Z',
}

const postSessionDefaults = {
  sessionRpe: null,
  durationMinutes: null,
  sessionLoad: null,
  postPainScore: null,
  postPainLocation: '',
  e2Decision: null,
  nextStep: null,
}

const player = {
  id: 'player-remote',
  userId,
  name: 'Test Spieler',
  position: 'Back Row',
  cluster: 'back_row' as const,
  active: true,
  consentStatus: 'vorhanden' as const,
  photoConsentStatus: 'not_asked' as const,
  photoPath: null,
  photoUpdatedAt: null,
  returnerStatus: 'nein' as const,
  notes: '',
  createdAt: '2026-06-16T18:00:00.000Z',
  updatedAt: '2026-06-16T18:00:00.000Z',
  deletedAt: null,
  clientUpdatedAt: '2026-06-16T18:00:00.000Z',
  syncStatus: 'synced' as const,
  syncError: null,
}

describe('checkInRepository session logs', () => {
  beforeEach(async () => {
    await localDb.delete()
    await localDb.open()
  })

  it('findSessionLog reads without creating pending writes', async () => {
    expect(await findSessionLog(userId, sessionDefinition.id)).toBeNull()
    await expect(localDb.sessionLogs.count()).resolves.toBe(0)
    await expect(localDb.pendingWrites.count()).resolves.toBe(0)

    const overview = await getCheckInSyncOverview(userId)
    expect(overview.pendingCount).toBe(0)
  })

  it('ensureSessionLog creates one pending session log only when explicitly needed', async () => {
    const sessionLog = await ensureSessionLog(userId, sessionDefinition)

    expect(sessionLog.sessionDefinitionId).toBe(sessionDefinition.id)
    await expect(localDb.sessionLogs.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })

  it('deduplicates concurrent session-log creation for the same planned session', async () => {
    const [firstSessionLog, secondSessionLog] = await Promise.all([
      ensureSessionLog(userId, sessionDefinition),
      ensureSessionLog(userId, sessionDefinition),
    ])

    expect(firstSessionLog.id).toBe(secondSessionLog.id)
    await expect(localDb.sessionLogs.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })

  it('returns present players from the latest previous session', async () => {
    await localDb.sessionLogs.bulkPut([
      {
        id: 'older-session',
        userId,
        sessionDefinitionId: 'older',
        date: '2026-06-10',
        status: 'completed',
        coach: '',
        groupSize: null,
        weatherOrHeatNote: '',
        planChanged: false,
        durationMinutes: null,
        contactIndex: '',
        speedExposureNote: '',
        coachReview: '',
        createdAt: '2026-06-10T18:00:00.000Z',
        updatedAt: '2026-06-10T18:00:00.000Z',
        deletedAt: null,
        clientUpdatedAt: '2026-06-10T18:00:00.000Z',
        syncStatus: 'synced',
        syncError: null,
      },
      {
        id: 'latest-session',
        userId,
        sessionDefinitionId: 'latest',
        date: '2026-06-13',
        status: 'completed',
        coach: '',
        groupSize: null,
        weatherOrHeatNote: '',
        planChanged: false,
        durationMinutes: null,
        contactIndex: '',
        speedExposureNote: '',
        coachReview: '',
        createdAt: '2026-06-13T18:00:00.000Z',
        updatedAt: '2026-06-13T18:00:00.000Z',
        deletedAt: null,
        clientUpdatedAt: '2026-06-13T18:00:00.000Z',
        syncStatus: 'synced',
        syncError: null,
      },
    ])

    await localDb.playerSessionEntries.bulkPut([
      {
        ...emptyCheckInDraft,
        ...postSessionDefaults,
        id: 'entry-a',
        userId,
        sessionLogId: 'older-session',
        playerId: 'player-old',
        present: true,
        createdAt: '2026-06-10T18:00:00.000Z',
        updatedAt: '2026-06-10T18:00:00.000Z',
        deletedAt: null,
        clientUpdatedAt: '2026-06-10T18:00:00.000Z',
        syncStatus: 'synced',
        syncError: null,
      },
      {
        ...emptyCheckInDraft,
        ...postSessionDefaults,
        id: 'entry-b',
        userId,
        sessionLogId: 'latest-session',
        playerId: 'player-present',
        present: true,
        createdAt: '2026-06-13T18:00:00.000Z',
        updatedAt: '2026-06-13T18:00:00.000Z',
        deletedAt: null,
        clientUpdatedAt: '2026-06-13T18:00:00.000Z',
        syncStatus: 'synced',
        syncError: null,
      },
      {
        ...emptyCheckInDraft,
        ...postSessionDefaults,
        id: 'entry-null-player',
        userId,
        sessionLogId: 'latest-session',
        playerId: null,
        present: true,
        createdAt: '2026-06-13T18:00:00.000Z',
        updatedAt: '2026-06-13T18:00:00.000Z',
        deletedAt: null,
        clientUpdatedAt: '2026-06-13T18:00:00.000Z',
        syncStatus: 'synced',
        syncError: null,
      },
      {
        ...emptyCheckInDraft,
        ...postSessionDefaults,
        id: 'entry-c',
        userId,
        sessionLogId: 'latest-session',
        playerId: 'player-absent',
        present: false,
        createdAt: '2026-06-13T18:00:00.000Z',
        updatedAt: '2026-06-13T18:00:00.000Z',
        deletedAt: null,
        clientUpdatedAt: '2026-06-13T18:00:00.000Z',
        syncStatus: 'synced',
        syncError: null,
      },
    ])

    await expect(listExpectedPlayerIds(userId, '2026-06-16')).resolves.toEqual(['player-present'])
  })

  it('returns warnings only from sessions before the selected session date', async () => {
    await localDb.sessionLogs.bulkPut([
      {
        id: 'past-session',
        userId,
        sessionDefinitionId: 'past',
        date: '2026-06-13',
        status: 'completed',
        coach: '',
        groupSize: null,
        weatherOrHeatNote: '',
        planChanged: false,
        durationMinutes: null,
        contactIndex: '',
        speedExposureNote: '',
        coachReview: '',
        createdAt: '2026-06-13T18:00:00.000Z',
        updatedAt: '2026-06-13T18:00:00.000Z',
        deletedAt: null,
        clientUpdatedAt: '2026-06-13T18:00:00.000Z',
        syncStatus: 'synced',
        syncError: null,
      },
      {
        id: 'future-session',
        userId,
        sessionDefinitionId: 'future',
        date: '2026-06-20',
        status: 'completed',
        coach: '',
        groupSize: null,
        weatherOrHeatNote: '',
        planChanged: false,
        durationMinutes: null,
        contactIndex: '',
        speedExposureNote: '',
        coachReview: '',
        createdAt: '2026-06-20T18:00:00.000Z',
        updatedAt: '2026-06-20T18:00:00.000Z',
        deletedAt: null,
        clientUpdatedAt: '2026-06-20T18:00:00.000Z',
        syncStatus: 'synced',
        syncError: null,
      },
    ])

    await localDb.playerSessionEntries.bulkPut([
      {
        ...emptyCheckInDraft,
        ...postSessionDefaults,
        id: 'past-warning',
        userId,
        sessionLogId: 'past-session',
        playerId: 'player-warning',
        present: true,
        trafficLight: 'yellow',
        createdAt: '2026-06-13T18:00:00.000Z',
        updatedAt: '2026-06-13T18:00:00.000Z',
        deletedAt: null,
        clientUpdatedAt: '2026-06-13T18:00:00.000Z',
        syncStatus: 'synced',
        syncError: null,
      },
      {
        ...emptyCheckInDraft,
        ...postSessionDefaults,
        id: 'future-warning',
        userId,
        sessionLogId: 'future-session',
        playerId: 'player-future',
        present: true,
        trafficLight: 'red',
        createdAt: '2026-06-20T18:00:00.000Z',
        updatedAt: '2026-06-20T18:00:00.000Z',
        deletedAt: null,
        clientUpdatedAt: '2026-06-20T18:00:00.000Z',
        syncStatus: 'synced',
        syncError: null,
      },
    ])

    await expect(listLatestWarnings(userId, null, '2026-06-16')).resolves.toMatchObject([
      { playerId: 'player-warning', trafficLight: 'yellow' },
    ])
  })

  it('carries pure player observations separately from safety warnings', async () => {
    await localDb.sessionLogs.put({
      id: 'observation-session',
      userId,
      sessionDefinitionId: 'observation',
      date: '2026-06-13',
      status: 'completed',
      coach: '',
      groupSize: null,
      weatherOrHeatNote: '',
      planChanged: false,
      durationMinutes: null,
      contactIndex: '',
      speedExposureNote: '',
      coachReview: '',
      createdAt: '2026-06-13T18:00:00.000Z',
      updatedAt: '2026-06-13T18:00:00.000Z',
      deletedAt: null,
      clientUpdatedAt: '2026-06-13T18:00:00.000Z',
      syncStatus: 'synced',
      syncError: null,
    })

    await localDb.playerSessionEntries.put({
      ...emptyCheckInDraft,
      ...postSessionDefaults,
      id: 'observation-only',
      userId,
      sessionLogId: 'observation-session',
      playerId: 'player-observation',
      present: true,
      returnerFlag: 'nein',
      observation: 'Hamstring links im Speed-Block beobachten',
      createdAt: '2026-06-13T18:00:00.000Z',
      updatedAt: '2026-06-13T18:00:00.000Z',
      deletedAt: null,
      clientUpdatedAt: '2026-06-13T18:00:00.000Z',
      syncStatus: 'synced',
      syncError: null,
    })

    await expect(listLatestWarnings(userId, null, '2026-06-16')).resolves.toEqual([])
    await expect(listLatestObservations(userId, null, '2026-06-16')).resolves.toMatchObject([
      {
        playerId: 'player-observation',
        observation: 'Hamstring links im Speed-Block beobachten',
      },
    ])
  })

  it('preserves remote traffic-light suggestion and manual override metadata', () => {
    const entry = entryFromRow(remoteEntryRow)

    expect(entry.trafficLightSuggestion).toBe('green')
    expect(entry.trafficLight).toBe('yellow')
    expect(entry.trafficLightWasManual).toBe(true)
    expect(entry.observation).toBe('manual override smoke')
  })

  it('maps anonymized player session rows with nullable player ids', () => {
    const entry = entryFromRow({ ...remoteEntryRow, player_id: null })

    expect(entry.playerId).toBeNull()
    expect(rowFromEntry(entry).player_id).toBeNull()
  })

  it('writes safety flags, traffic-light suggestion and manual override metadata to Supabase rows', () => {
    const entry = entryFromRow(remoteEntryRow)
    const row = rowFromEntry(entry)

    expect(entry.redFlag).toBe('head_neck_neuro')
    expect(entry.movementConcern).toBe(true)
    expect(row.red_flag).toBe('head_neck_neuro')
    expect(row.movement_concern).toBe(true)
    expect(row.traffic_light_suggestion).toBe('green')
    expect(row.traffic_light).toBe('yellow')
    expect(row.traffic_light_was_manual).toBe(true)
  })

  it('maps session reaction in player session rows', () => {
    const entry = entryFromRow({ ...remoteEntryRow, session_reaction: 'new_or_worse' })

    expect(entry.sessionReaction).toBe('new_or_worse')
    expect(rowFromEntry(entry).session_reaction).toBe('new_or_worse')
  })

  it('preserves training variant in player session row mapping', () => {
    const entry = entryFromRow(remoteEntryRow)

    expect(entry.trainingVariant).toBe('C')
    expect(rowFromEntry(entry).training_variant).toBe('C')
  })

  it('maps post-session fields and does not upsert generated session load', () => {
    const entry = entryFromRow(remoteEntryRow)
    const row = rowFromEntry(entry)

    expect(entry.sessionRpe).toBe(7)
    expect(entry.durationMinutes).toBe(75)
    expect(entry.sessionLoad).toBe(525)
    expect(entry.postPainScore).toBe(2)
    expect(entry.postPainLocation).toBe('Wade rechts')
    expect(entry.e2Decision).toBe('normal')
    expect(entry.nextStep).toBe('steigern')
    expect(row.session_rpe).toBe(7)
    expect(row.duration_minutes).toBe(75)
    expect('session_load' in row).toBe(false)
  })

  it('preserves traffic-light audit metadata when saving post-session fields', async () => {
    await localDb.playerSessionEntries.put(entryFromRow(remoteEntryRow))

    const saved = await savePostSessionEntry(userId, 'session-remote', player, {
      sessionRpe: 8,
      durationMinutes: 70,
      postPainScore: 3,
      postPainLocation: 'Wade rechts',
      e2Decision: 'C',
      nextStep: 'halten',
    })

    expect(saved.trafficLightSuggestion).toBe('green')
    expect(saved.trafficLight).toBe('yellow')
    expect(saved.trafficLightWasManual).toBe(true)
    expect(saved.sessionLoad).toBe(560)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })

  it('deduplicates concurrent check-in saves for the same player and session', async () => {
    const [firstEntry, secondEntry] = await Promise.all([
      saveCheckInEntry(userId, 'session-race', player, { present: true }),
      saveCheckInEntry(userId, 'session-race', player, { readiness: 4 }),
    ])

    expect(secondEntry.id).toBe(firstEntry.id)
    await expect(localDb.playerSessionEntries.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
    const savedEntry = await localDb.playerSessionEntries.get(firstEntry.id)
    expect(savedEntry).toMatchObject({
      present: true,
      readiness: 4,
    })
  })

  it('marks coach field edits as present check-ins', async () => {
    const saved = await saveCheckInEntry(userId, 'session-coach-present', player, {
      readiness: 4,
      lifeFlag: 'Stress',
      painScore: 1,
    })

    expect(saved.present).toBe(true)
    expect(saved.coachEditedAt).toBeTruthy()
    expect(saved.checkInSource).toBe('coach')
  })

  it('keeps explicit absence when coach fields are saved later', async () => {
    const absent = await saveCheckInEntry(userId, 'session-explicit-absent', player, { present: false })
    const saved = await saveCheckInEntry(userId, 'session-explicit-absent', player, {
      readiness: 4,
      painScore: 0,
    })

    expect(saved.id).toBe(absent.id)
    expect(saved.present).toBe(false)
    expect(saved.coachEditedAt).toBeTruthy()
  })

  it('saves kiosk check-ins as player-submitted present entries without coach edit metadata', async () => {
    const saved = await saveKioskCheckInEntry(userId, 'session-kiosk', player, {
      readiness: 3,
      lifeFlag: 'Stress',
      painScore: 2,
      painLocation: 'Wade rechts',
      returnerFlag: 'offen',
      sessionReaction: 'unsure',
      playerNote: 'komme direkt von Arbeit',
    })

    expect(saved).toMatchObject({
      present: true,
      readiness: 3,
      lifeFlag: 'Stress',
      painScore: 2,
      painLocation: 'Wade rechts',
      returnerFlag: 'offen',
      sessionReaction: 'unsure',
      checkInSource: 'player_kiosk',
      coachEditedAt: null,
      playerNote: 'komme direkt von Arbeit',
    })
    expect(saved.playerSubmittedAt).toBeTruthy()
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })

  it('preserves mixed source and coach edit metadata when kiosk check-in updates a coach-edited entry', async () => {
    const coachEntry = await saveCheckInEntry(userId, 'session-kiosk-mixed', player, { readiness: 5 })

    const saved = await saveKioskCheckInEntry(userId, 'session-kiosk-mixed', player, {
      readiness: 3,
      painScore: 1,
      sessionReaction: 'none',
    })

    expect(saved.id).toBe(coachEntry.id)
    expect(saved).toMatchObject({
      checkInSource: 'mixed',
      readiness: 3,
      painScore: 1,
    })
    expect(saved.coachEditedAt).toBe(coachEntry.coachEditedAt)
    expect(saved.playerSubmittedAt).toBeTruthy()
  })

  it('does not downgrade a stronger coach red flag when kiosk check-in updates a coach-edited entry', async () => {
    const coachEntry = await saveCheckInEntry(userId, 'session-kiosk-red-flag', player, {
      readiness: 5,
      redFlag: 'acute_instability',
    })

    const saved = await saveKioskCheckInEntry(userId, 'session-kiosk-red-flag', player, {
      readiness: 3,
      painScore: 1,
      painLocation: 'Sprunggelenk',
      redFlag: 'none',
      sessionReaction: 'none',
    })

    expect(saved.id).toBe(coachEntry.id)
    expect(saved).toMatchObject({
      checkInSource: 'mixed',
      redFlag: 'acute_instability',
      painLocation: 'Sprunggelenk',
    })
    expect(saved.coachEditedAt).toBe(coachEntry.coachEditedAt)
  })

  it('lets kiosk check-in raise red flag severity when no stronger coach flag exists', async () => {
    await saveCheckInEntry(userId, 'session-kiosk-head-neck', player, {
      readiness: 5,
      redFlag: 'none',
    })

    const saved = await saveKioskCheckInEntry(userId, 'session-kiosk-head-neck', player, {
      readiness: 3,
      painScore: 1,
      painLocation: 'Kopf/Nacken',
      redFlag: 'head_neck_neuro',
      sessionReaction: 'none',
    })

    expect(saved).toMatchObject({
      checkInSource: 'mixed',
      redFlag: 'head_neck_neuro',
      painLocation: 'Kopf/Nacken',
    })
  })

  it('resets only coach fields on player-submitted entries and preserves session reaction', () => {
    const playerSubmitted = {
      ...entryFromRow({
        ...remoteEntryRow,
        session_reaction: 'new_or_worse',
        checkin_source: 'player_kiosk',
        player_submitted_at: '2026-06-16T17:55:00.000Z',
        coach_edited_at: '2026-06-16T18:05:00.000Z',
      }),
      observation: 'Coach note',
      redFlag: 'head_neck_neuro' as const,
      movementConcern: true,
      limits: ['kein_sprint' as const],
      trafficLightWasManual: true,
      trafficLight: 'red' as const,
      trafficLightSuggestion: 'yellow' as const,
    }

    const reset = resetCoachFields(playerSubmitted)

    expect(reset).toMatchObject({
      present: true,
      readiness: 5,
      sessionReaction: 'new_or_worse',
      checkInSource: 'player_kiosk',
      playerSubmittedAt: '2026-06-16T17:55:00.000Z',
      coachEditedAt: null,
      redFlag: 'none',
      movementConcern: false,
      limits: [],
      observation: '',
      trafficLightWasManual: false,
    })
  })

  it('soft deletes coach-only check-ins during reset', async () => {
    const saved = await saveCheckInEntry(userId, 'session-reset', player, { readiness: 5 })

    const reset = await resetCheckInEntry(userId, saved.id)

    expect(reset.deletedAt).toBeTruthy()
    expect(reset.syncStatus).toBe('pending')
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })

  it('creates a pending session log only when saving training session notes', async () => {
    await expect(findSessionLog(userId, sessionDefinition.id)).resolves.toBeNull()
    await expect(localDb.pendingWrites.count()).resolves.toBe(0)

    const sessionLog = await saveSessionLogPatch(userId, sessionDefinition, {
      contactIndex: '1 - controlled prep only',
      speedExposureNote: '4x10 m smooth',
      planChanged: true,
      status: 'in_progress',
    })

    expect(sessionLog.contactIndex).toBe('1 - controlled prep only')
    expect(sessionLog.speedExposureNote).toBe('4x10 m smooth')
    expect(sessionLog.planChanged).toBe(true)
    expect(sessionLog.status).toBe('in_progress')
    await expect(localDb.sessionLogs.count()).resolves.toBe(1)
    await expect(localDb.pendingWrites.count()).resolves.toBe(1)
  })

  it('recalculates player session loads when the session duration changes after sRPE was saved', async () => {
    const sessionLog = await ensureSessionLog(userId, sessionDefinition)
    await savePostSessionEntry(userId, sessionLog.id, player, {
      sessionRpe: 7,
      durationMinutes: 60,
    })

    await saveSessionLogPatch(userId, sessionDefinition, { durationMinutes: 75 })

    const [entry] = await localDb.playerSessionEntries
      .where('userId')
      .equals(userId)
      .and((candidate) => candidate.sessionLogId === sessionLog.id)
      .toArray()
    expect(entry.durationMinutes).toBe(75)
    expect(entry.sessionLoad).toBe(525)
  })

})
