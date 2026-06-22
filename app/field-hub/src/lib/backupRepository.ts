import type { BaselineEntry } from '../domain/baseline'
import type { PlayerSessionEntry, SessionLog } from '../domain/checkIn'
import { isKnownExerciseKey, type ExercisePainResponse, type ExerciseResult, type ExerciseTechniqueQuality, type ExerciseVariant } from '../domain/exercises'
import { exposureTypes, type ExposureStatus, type PlayerExposureSummary } from '../domain/exposures'
import { isKnownMetricKey, type MetricBodySide, type MetricResult } from '../domain/metrics'
import type { Player } from '../domain/players'
import type { ProgressEntry } from '../domain/postSession'
import type { PublicCheckInLink, PublicCheckInLinkPlayer, PublicCheckInSubmission } from '../domain/publicCheckIn'
import type { ReturnerEntry } from '../domain/returners'
import {
  sessionBlockReasons,
  sessionBlockStatuses,
  validateSessionBlockStatusReason,
  type SessionBlockLog,
  type SessionBlockReason,
  type SessionBlockStatus,
} from '../domain/sessionBlocks'
import { getSyncMeta, localDb, setSyncMeta, type PendingWriteTable } from './localDb'

export type FieldHubBackupV1 = {
  type: 'rugby-field-hub-full-backup'
  version: 1
  exportedAt: string
  data: {
    players: Player[]
    sessionLogs: SessionLog[]
    playerSessionEntries: PlayerSessionEntry[]
    progressEntries: ProgressEntry[]
    baselineEntries: BaselineEntry[]
    returnerEntries: ReturnerEntry[]
    sessionBlockLogs: SessionBlockLog[]
    playerExposureSummaries: PlayerExposureSummary[]
    exerciseResults: ExerciseResult[]
    metricResults: MetricResult[]
    publicCheckInLinks: PublicCheckInLink[]
    publicCheckInLinkPlayers: PublicCheckInLinkPlayer[]
    publicCheckInSubmissions: PublicCheckInSubmission[]
  }
}

export type ImportPreview = {
  valid: boolean
  errors: string[]
  totals: {
    newRecords: number
    overwriteCandidates: number
    skippedOlderRecords: number
    totalRecords: number
  }
}

type ImportOptions = {
  confirmOverwrite: boolean
}

type BackupCollectionKey = keyof FieldHubBackupV1['data']

const collectionToTable = {
  players: 'players',
  sessionLogs: 'session_logs',
  playerSessionEntries: 'player_session_entries',
  progressEntries: 'progress_entries',
  baselineEntries: 'baseline_entries',
  returnerEntries: 'returner_entries',
  sessionBlockLogs: 'session_block_logs',
  playerExposureSummaries: 'player_exposure_summaries',
  exerciseResults: 'exercise_results',
  metricResults: 'metric_results',
  publicCheckInLinks: 'public_checkin_links',
  publicCheckInLinkPlayers: 'public_checkin_link_players',
  publicCheckInSubmissions: 'public_checkin_submissions',
} satisfies Record<BackupCollectionKey, PendingWriteTable>

const collectionToDexieTable = {
  players: localDb.players,
  sessionLogs: localDb.sessionLogs,
  playerSessionEntries: localDb.playerSessionEntries,
  progressEntries: localDb.progressEntries,
  baselineEntries: localDb.baselineEntries,
  returnerEntries: localDb.returnerEntries,
  sessionBlockLogs: localDb.sessionBlockLogs,
  playerExposureSummaries: localDb.playerExposureSummaries,
  exerciseResults: localDb.exerciseResults,
  metricResults: localDb.metricResults,
  publicCheckInLinks: localDb.publicCheckInLinks,
  publicCheckInLinkPlayers: localDb.publicCheckInLinkPlayers,
  publicCheckInSubmissions: localDb.publicCheckInSubmissions,
}

const publicCheckInCollections = new Set<BackupCollectionKey>([
  'publicCheckInLinks',
  'publicCheckInLinkPlayers',
  'publicCheckInSubmissions',
])

async function putImportedRecord(collectionKey: BackupCollectionKey, record: FieldHubBackupV1['data'][BackupCollectionKey][number]) {
  if (collectionKey === 'players') {
    await localDb.players.put(record as Player)
  } else if (collectionKey === 'sessionLogs') {
    await localDb.sessionLogs.put(record as SessionLog)
  } else if (collectionKey === 'playerSessionEntries') {
    await localDb.playerSessionEntries.put(record as PlayerSessionEntry)
  } else if (collectionKey === 'progressEntries') {
    await localDb.progressEntries.put(record as ProgressEntry)
  } else if (collectionKey === 'baselineEntries') {
    await localDb.baselineEntries.put(record as BaselineEntry)
  } else if (collectionKey === 'sessionBlockLogs') {
    await localDb.sessionBlockLogs.put(record as SessionBlockLog)
  } else if (collectionKey === 'playerExposureSummaries') {
    await localDb.playerExposureSummaries.put(record as PlayerExposureSummary)
  } else if (collectionKey === 'exerciseResults') {
    await localDb.exerciseResults.put(record as ExerciseResult)
  } else if (collectionKey === 'metricResults') {
    await localDb.metricResults.put(record as MetricResult)
  } else if (collectionKey === 'publicCheckInLinks') {
    await localDb.publicCheckInLinks.put(record as PublicCheckInLink)
  } else if (collectionKey === 'publicCheckInLinkPlayers') {
    await localDb.publicCheckInLinkPlayers.put(record as PublicCheckInLinkPlayer)
  } else if (collectionKey === 'publicCheckInSubmissions') {
    await localDb.publicCheckInSubmissions.put(record as PublicCheckInSubmission)
  } else {
    await localDb.returnerEntries.put(record as ReturnerEntry)
  }
}

function nowIso() {
  return new Date().toISOString()
}

function lastExportKey(userId: string) {
  return `exports:lastExportAt:${userId}`
}

function isRecordWithSync(value: unknown): value is {
  id: string
  userId: string
  clientUpdatedAt: string
  syncStatus: 'synced' | 'pending' | 'error'
  syncError: string | null
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'userId' in value &&
    'clientUpdatedAt' in value &&
    typeof value.id === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.clientUpdatedAt === 'string'
  )
}

function hasString(value: unknown, key: string) {
  return typeof value === 'object' && value !== null && key in value && typeof value[key as keyof typeof value] === 'string'
}

function getString(value: unknown, key: string) {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  return typeof record[key] === 'string' ? record[key] : null
}

function hasNullableString(value: unknown, key: string) {
  return (
    typeof value === 'object' &&
    value !== null &&
    key in value &&
    (typeof value[key as keyof typeof value] === 'string' || value[key as keyof typeof value] === null)
  )
}

function hasBoolean(value: unknown, key: string) {
  return typeof value === 'object' && value !== null && key in value && typeof value[key as keyof typeof value] === 'boolean'
}

function hasNullableNumber(value: unknown, key: string) {
  return (
    typeof value === 'object' &&
    value !== null &&
    key in value &&
    (typeof value[key as keyof typeof value] === 'number' || value[key as keyof typeof value] === null)
  )
}

function hasNumber(value: unknown, key: string) {
  return typeof value === 'object' && value !== null && key in value && typeof value[key as keyof typeof value] === 'number'
}

function hasStringArray(value: unknown, key: string) {
  return (
    typeof value === 'object' &&
    value !== null &&
    key in value &&
    Array.isArray(value[key as keyof typeof value]) &&
    (value[key as keyof typeof value] as unknown[]).every((entry) => typeof entry === 'string')
  )
}

function hasObject(value: unknown, key: string) {
  return (
    typeof value === 'object' &&
    value !== null &&
    key in value &&
    typeof value[key as keyof typeof value] === 'object' &&
    value[key as keyof typeof value] !== null &&
    !Array.isArray(value[key as keyof typeof value])
  )
}

function hasExposureStatuses(value: unknown) {
  if (typeof value !== 'object' || value === null || !('statuses' in value)) {
    return false
  }

  const statuses = (value as Record<string, unknown>).statuses
  if (typeof statuses !== 'object' || statuses === null || Array.isArray(statuses)) {
    return false
  }

  const allowedStatuses = new Set<ExposureStatus>(['none', 'completed', 'reduced', 'skipped'])
  return exposureTypes.every((type) => allowedStatuses.has((statuses as Record<string, ExposureStatus>)[type]))
}

function hasMetricBodySide(value: unknown) {
  const side = getString(value, 'bodySide') as MetricBodySide | null
  return side === 'none' || side === 'left' || side === 'right'
}

function hasExerciseVariant(value: unknown) {
  const variant = getString(value, 'variant') as ExerciseVariant | null
  return variant === 'A_plus' || variant === 'A' || variant === 'B' || variant === 'C' || variant === 'D' || variant === 'custom'
}

function hasExerciseTechniqueQuality(value: unknown) {
  const quality = getString(value, 'techniqueQuality') as ExerciseTechniqueQuality | null
  return quality === 'good' || quality === 'ok' || quality === 'limited' || quality === 'poor' || quality === 'not_recorded'
}

function hasExercisePainResponse(value: unknown) {
  const response = getString(value, 'painResponse') as ExercisePainResponse | null
  return response === 'none' || response === 'same' || response === 'worse' || response === 'better' || response === 'unclear'
}

function hasValidRecordShape(collectionKey: BackupCollectionKey, record: unknown) {
  if (!isRecordWithSync(record)) {
    return false
  }

  if (collectionKey === 'players') {
    return (
      hasString(record, 'name') &&
      hasString(record, 'position') &&
      hasString(record, 'cluster') &&
      hasBoolean(record, 'active') &&
      hasString(record, 'consentStatus') &&
      hasString(record, 'photoConsentStatus') &&
      hasNullableString(record, 'photoPath') &&
      hasNullableString(record, 'photoUpdatedAt') &&
      hasString(record, 'returnerStatus') &&
      hasString(record, 'notes')
    )
  }

  if (collectionKey === 'sessionLogs') {
    return (
      hasString(record, 'sessionDefinitionId') &&
      hasString(record, 'date') &&
      hasString(record, 'status') &&
      hasString(record, 'coach') &&
      hasBoolean(record, 'planChanged') &&
      hasNullableNumber(record, 'durationMinutes')
    )
  }

  if (collectionKey === 'playerSessionEntries') {
    return (
      hasString(record, 'sessionLogId') &&
      hasString(record, 'playerId') &&
      hasBoolean(record, 'present') &&
      hasNullableNumber(record, 'readiness') &&
      hasNullableNumber(record, 'painScore') &&
      hasString(record, 'returnerFlag') &&
      hasStringArray(record, 'limits')
    )
  }

  if (collectionKey === 'progressEntries') {
    return (
      hasNullableString(record, 'playerId') &&
      hasString(record, 'sessionLogId') &&
      hasString(record, 'mainExercise') &&
      hasString(record, 'load') &&
      hasString(record, 'reps') &&
      hasString(record, 'rpe')
    )
  }

  if (collectionKey === 'baselineEntries') {
    return (
      hasNullableString(record, 'playerId') &&
      hasString(record, 'sessionLogId') &&
      hasNullableNumber(record, 'broadJumpCm') &&
      hasNullableNumber(record, 'medBallChestPassM') &&
      hasNullableNumber(record, 'medBallWeightKg') &&
      hasNullableNumber(record, 'sprint30m')
    )
  }

  if (collectionKey === 'sessionBlockLogs') {
    const status = getString(record, 'status')
    const reason = getString(record, 'reason')
    const hasValidStatusReason =
      status !== null &&
      reason !== null &&
      sessionBlockStatuses.includes(status as SessionBlockStatus) &&
      sessionBlockReasons.includes(reason as SessionBlockReason) &&
      validateSessionBlockStatusReason(status as SessionBlockStatus, reason as SessionBlockReason).valid

    return (
      hasString(record, 'sessionLogId') &&
      hasString(record, 'sessionDefinitionId') &&
      hasString(record, 'blockKey') &&
      hasString(record, 'blockTitle') &&
      hasNumber(record, 'blockOrder') &&
      hasString(record, 'plannedTime') &&
      hasString(record, 'plannedWork') &&
      hasValidStatusReason &&
      hasString(record, 'coachNote')
    )
  }

  if (collectionKey === 'playerExposureSummaries') {
    return (
      hasNullableString(record, 'playerId') &&
      hasNullableString(record, 'sessionLogId') &&
      hasString(record, 'sessionDefinitionId') &&
      hasString(record, 'sessionDate') &&
      hasExposureStatuses(record) &&
      hasObject(record, 'sources') &&
      hasObject(record, 'manualOverrides') &&
      hasString(record, 'coachNote')
    )
  }

  if (collectionKey === 'metricResults') {
    const metricKey = getString(record, 'metricKey')

    return (
      hasNullableString(record, 'playerId') &&
      hasNullableString(record, 'sessionLogId') &&
      metricKey !== null &&
      isKnownMetricKey(metricKey) &&
      hasNumber(record, 'value') &&
      hasNumber(record, 'attempt') &&
      hasBoolean(record, 'isValid') &&
      hasMetricBodySide(record) &&
      hasString(record, 'contextNote')
    )
  }

  if (collectionKey === 'exerciseResults') {
    const exerciseKey = getString(record, 'exerciseKey')

    return (
      hasNullableString(record, 'playerId') &&
      hasNullableString(record, 'sessionLogId') &&
      exerciseKey !== null &&
      isKnownExerciseKey(exerciseKey) &&
      hasExerciseVariant(record) &&
      hasNullableNumber(record, 'sets') &&
      hasString(record, 'reps') &&
      hasNullableNumber(record, 'loadValue') &&
      hasString(record, 'loadUnit') &&
      hasNullableNumber(record, 'rpe') &&
      hasNullableNumber(record, 'rir') &&
      hasExerciseTechniqueQuality(record) &&
      hasExercisePainResponse(record) &&
      hasString(record, 'notes')
    )
  }


  if (collectionKey === 'publicCheckInLinks') {
    return (
      hasString(record, 'sessionDefinitionId') &&
      hasString(record, 'sessionTitle') &&
      hasString(record, 'sessionDate') &&
      hasString(record, 'tokenHash') &&
      hasString(record, 'expiresAt') &&
      hasNullableString(record, 'closedAt')
    )
  }

  if (collectionKey === 'publicCheckInLinkPlayers') {
    return (
      hasString(record, 'linkId') &&
      hasNullableString(record, 'playerId') &&
      hasString(record, 'displayName') &&
      hasNullableNumber(record, 'sortOrder')
    )
  }

  if (collectionKey === 'publicCheckInSubmissions') {
    return (
      hasString(record, 'linkId') &&
      hasString(record, 'linkPlayerId') &&
      hasNullableString(record, 'playerId') &&
      hasNullableNumber(record, 'readiness') &&
      hasNullableNumber(record, 'painScore') &&
      hasString(record, 'returnerFlag') &&
      hasString(record, 'status') &&
      hasString(record, 'submittedAt')
    )
  }

  return (
    hasNullableString(record, 'playerId') &&
    hasString(record, 'sessionLogId') &&
    hasString(record, 'medicalContactNote') &&
    hasString(record, 'currentStage') &&
    hasString(record, 'speedCap') &&
    hasString(record, 'codDecelCap') &&
    hasString(record, 'conditioningCap') &&
    hasString(record, 'contactCap')
  )
}

function isBackupPayload(value: unknown): value is FieldHubBackupV1 {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<FieldHubBackupV1>

  const requiredCollections: BackupCollectionKey[] = [
    'players',
    'sessionLogs',
    'playerSessionEntries',
    'progressEntries',
    'baselineEntries',
    'returnerEntries',
  ]

  return (
    candidate.type === 'rugby-field-hub-full-backup' &&
    candidate.version === 1 &&
    typeof candidate.exportedAt === 'string' &&
    typeof candidate.data === 'object' &&
    candidate.data !== null &&
    requiredCollections.every((key) => Array.isArray(candidate.data?.[key]))
  )
}

async function queueImportedWrite(table: PendingWriteTable, recordId: string, userId: string) {
  await localDb.pendingWrites
    .where('userId')
    .equals(userId)
    .and((write) => write.table === table && write.recordId === recordId)
    .delete()
  await localDb.pendingWrites.add({
    table,
    operation: 'upsert',
    recordId,
    userId,
    createdAt: nowIso(),
  })
}

export async function createFieldHubBackup(userId: string): Promise<FieldHubBackupV1> {
  const [
    players,
    sessionLogs,
    playerSessionEntries,
    progressEntries,
    baselineEntries,
    returnerEntries,
    publicCheckInLinks,
    publicCheckInLinkPlayers,
    publicCheckInSubmissions,
    sessionBlockLogs,
    playerExposureSummaries,
    exerciseResults,
    metricResults,
  ] =
    await Promise.all([
      localDb.players.where('userId').equals(userId).toArray(),
      localDb.sessionLogs.where('userId').equals(userId).toArray(),
      localDb.playerSessionEntries.where('userId').equals(userId).toArray(),
      localDb.progressEntries.where('userId').equals(userId).toArray(),
      localDb.baselineEntries.where('userId').equals(userId).toArray(),
      localDb.returnerEntries.where('userId').equals(userId).toArray(),
      localDb.publicCheckInLinks.where('userId').equals(userId).toArray(),
      localDb.publicCheckInLinkPlayers.where('userId').equals(userId).toArray(),
      localDb.publicCheckInSubmissions.where('userId').equals(userId).toArray(),
      localDb.sessionBlockLogs.where('userId').equals(userId).toArray(),
      localDb.playerExposureSummaries.where('userId').equals(userId).toArray(),
      localDb.exerciseResults.where('userId').equals(userId).toArray(),
      localDb.metricResults.where('userId').equals(userId).toArray(),
    ])

  return {
    type: 'rugby-field-hub-full-backup',
    version: 1,
    exportedAt: nowIso(),
    data: {
      players,
      sessionLogs,
      playerSessionEntries,
      progressEntries,
      baselineEntries,
      returnerEntries,
      sessionBlockLogs,
      playerExposureSummaries,
      exerciseResults,
      metricResults,
      publicCheckInLinks,
      publicCheckInLinkPlayers,
      publicCheckInSubmissions,
    },
  }
}

export async function previewFieldHubBackupImport(
  userId: string,
  payload: unknown,
): Promise<ImportPreview> {
  if (!isBackupPayload(payload)) {
    return {
      valid: false,
      errors: ['Backup-Datei hat kein unterstuetztes Field-Hub-Format.'],
      totals: { newRecords: 0, overwriteCandidates: 0, skippedOlderRecords: 0, totalRecords: 0 },
    }
  }

  const errors: string[] = []
  let newRecords = 0
  let overwriteCandidates = 0
  let skippedOlderRecords = 0
  let totalRecords = 0

  for (const collectionKey of Object.keys(collectionToTable) as BackupCollectionKey[]) {
    const table = collectionToDexieTable[collectionKey]

    for (const record of payload.data[collectionKey] ?? []) {
      totalRecords += 1

      if (!hasValidRecordShape(collectionKey, record)) {
        errors.push(`Backup enthaelt ungueltige Daten in ${collectionKey}.`)
        continue
      }

      if (record.userId !== userId) {
        errors.push('Backup enthaelt Daten eines anderen Coach-Users.')
        continue
      }

      const existing = await table.get(record.id)
      if (!existing) {
        newRecords += 1
      } else if (record.clientUpdatedAt >= existing.clientUpdatedAt) {
        overwriteCandidates += 1
      } else {
        skippedOlderRecords += 1
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    totals: {
      newRecords,
      overwriteCandidates,
      skippedOlderRecords,
      totalRecords,
    },
  }
}

export async function importFieldHubBackup(
  userId: string,
  payload: unknown,
  options: ImportOptions,
) {
  const preview = await previewFieldHubBackupImport(userId, payload)
  if (!preview.valid || !isBackupPayload(payload)) {
    throw new Error(preview.errors[0] ?? 'Backup kann nicht importiert werden.')
  }

  let importedRecords = 0

  for (const collectionKey of Object.keys(collectionToTable) as BackupCollectionKey[]) {
    const table = collectionToDexieTable[collectionKey]
    const pendingTable = collectionToTable[collectionKey]

    for (const record of payload.data[collectionKey] ?? []) {
      if (!isRecordWithSync(record)) {
        continue
      }

      const existing = await table.get(record.id)
      const shouldImport = !existing || (options.confirmOverwrite && record.clientUpdatedAt >= existing.clientUpdatedAt)

      if (!shouldImport) {
        continue
      }

      const importedRecord = {
        ...record,
        syncStatus: publicCheckInCollections.has(collectionKey) ? ('synced' as const) : ('pending' as const),
        syncError: null,
      }

      await putImportedRecord(collectionKey, importedRecord)
      if (!publicCheckInCollections.has(collectionKey)) {
        await queueImportedWrite(pendingTable, record.id, userId)
      }
      importedRecords += 1
    }
  }

  return {
    importedRecords,
    preview,
  }
}

export async function getLastExportAt(userId: string) {
  return getSyncMeta(lastExportKey(userId))
}

export async function setLastExportAt(userId: string, timestamp = nowIso()) {
  await setSyncMeta(lastExportKey(userId), timestamp)
  return timestamp
}

export async function getLatestCompletedSession(userId: string) {
  const completedSessions = await localDb.sessionLogs
    .where('userId')
    .equals(userId)
    .and((sessionLog) => sessionLog.status === 'completed' && !sessionLog.deletedAt)
    .toArray()

  return completedSessions.sort((a, b) => b.clientUpdatedAt.localeCompare(a.clientUpdatedAt))[0] ?? null
}
