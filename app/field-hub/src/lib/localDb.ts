import Dexie, { type Table } from 'dexie'
import type { BaselineEntry } from '../domain/baseline'
import type { PlayerSessionEntry, SessionLog } from '../domain/checkIn'
import type { PlayerExposureSummary } from '../domain/exposures'
import type { ExerciseResult } from '../domain/exercises'
import type { MetricResult } from '../domain/metrics'
import type { Player } from '../domain/players'
import type { ProgressEntry } from '../domain/postSession'
import type { PublicCheckInLink, PublicCheckInLinkPlayer, PublicCheckInSubmission } from '../domain/publicCheckIn'
import type { ReturnerEntry } from '../domain/returners'
import type { SessionBlockLog } from '../domain/sessionBlocks'

export type PendingWriteOperation = 'upsert' | 'delete'
export type PendingWriteTable =
  | 'players'
  | 'session_logs'
  | 'player_session_entries'
  | 'progress_entries'
  | 'baseline_entries'
  | 'returner_entries'
  | 'session_block_logs'
  | 'player_exposure_summaries'
  | 'exercise_results'
  | 'metric_results'
  | 'public_checkin_links'
  | 'public_checkin_link_players'
  | 'public_checkin_submissions'

export type PendingWrite = {
  localId?: number
  table: PendingWriteTable
  recordId: string
  operation: PendingWriteOperation
  userId: string
  createdAt: string
  metadata?: Record<string, string | null>
}

export type SyncMeta = {
  key: string
  value: string
}

export type PhotoCacheEntry = {
  cacheKey: string
  photoPath: string
  photoUpdatedAt: string | null
  blob: Blob
  cachedAt: string
}

export type PendingPhotoUpload = {
  photoPath: string
  userId: string
  playerId: string
  blob: Blob
  contentType: string
  createdAt: string
}

class FieldHubDatabase extends Dexie {
  players!: Table<Player, string>
  sessionLogs!: Table<SessionLog, string>
  playerSessionEntries!: Table<PlayerSessionEntry, string>
  progressEntries!: Table<ProgressEntry, string>
  baselineEntries!: Table<BaselineEntry, string>
  returnerEntries!: Table<ReturnerEntry, string>
  sessionBlockLogs!: Table<SessionBlockLog, string>
  playerExposureSummaries!: Table<PlayerExposureSummary, string>
  exerciseResults!: Table<ExerciseResult, string>
  metricResults!: Table<MetricResult, string>
  publicCheckInLinks!: Table<PublicCheckInLink, string>
  publicCheckInLinkPlayers!: Table<PublicCheckInLinkPlayer, string>
  publicCheckInSubmissions!: Table<PublicCheckInSubmission, string>
  pendingWrites!: Table<PendingWrite, number>
  photoCache!: Table<PhotoCacheEntry, string>
  pendingPhotoUploads!: Table<PendingPhotoUpload, string>
  syncMeta!: Table<SyncMeta, string>

  constructor() {
    super('rugby-field-hub')
    this.version(1).stores({
      players: '&id, userId, active, syncStatus, clientUpdatedAt, updatedAt',
      pendingWrites: '++localId, table, recordId, userId, createdAt',
      syncMeta: '&key',
    })
    this.version(2).stores({
      players: '&id, userId, active, syncStatus, clientUpdatedAt, updatedAt',
      sessionLogs: '&id, userId, sessionDefinitionId, date, syncStatus, clientUpdatedAt',
      playerSessionEntries: '&id, userId, sessionLogId, playerId, trafficLight, syncStatus, clientUpdatedAt',
      pendingWrites: '++localId, table, recordId, userId, createdAt',
      syncMeta: '&key',
    })
    this.version(3).stores({
      players: '&id, userId, active, syncStatus, clientUpdatedAt, updatedAt',
      sessionLogs: '&id, userId, sessionDefinitionId, date, syncStatus, clientUpdatedAt',
      playerSessionEntries: '&id, userId, sessionLogId, playerId, trafficLight, syncStatus, clientUpdatedAt',
      progressEntries: '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt',
      pendingWrites: '++localId, table, recordId, userId, createdAt',
      syncMeta: '&key',
    })
    this.version(4).stores({
      players: '&id, userId, active, syncStatus, clientUpdatedAt, updatedAt',
      sessionLogs: '&id, userId, sessionDefinitionId, date, syncStatus, clientUpdatedAt',
      playerSessionEntries: '&id, userId, sessionLogId, playerId, trafficLight, syncStatus, clientUpdatedAt',
      progressEntries: '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt',
      returnerEntries: '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt',
      pendingWrites: '++localId, table, recordId, userId, createdAt',
      syncMeta: '&key',
    })
    this.version(5).stores({
      players: '&id, userId, active, syncStatus, clientUpdatedAt, updatedAt',
      sessionLogs: '&id, userId, sessionDefinitionId, date, syncStatus, clientUpdatedAt',
      playerSessionEntries: '&id, userId, sessionLogId, playerId, trafficLight, syncStatus, clientUpdatedAt',
      progressEntries: '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt',
      baselineEntries: '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt',
      returnerEntries: '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt',
      pendingWrites: '++localId, table, recordId, userId, createdAt',
      syncMeta: '&key',
    })
    this.version(6).stores({
      players:
        '&id, userId, active, syncStatus, clientUpdatedAt, updatedAt, [userId+syncStatus], [userId+clientUpdatedAt]',
      sessionLogs:
        '&id, userId, sessionDefinitionId, date, syncStatus, clientUpdatedAt, [userId+syncStatus], [userId+clientUpdatedAt]',
      playerSessionEntries:
        '&id, userId, sessionLogId, playerId, trafficLight, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      progressEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      baselineEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      returnerEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      pendingWrites: '++localId, table, recordId, userId, createdAt, [userId+table]',
      photoCache: '&cacheKey, photoPath, photoUpdatedAt, cachedAt',
      pendingPhotoUploads: '&photoPath, userId, playerId, createdAt',
      syncMeta: '&key',
    })
    this.version(7).stores({
      players:
        '&id, userId, active, syncStatus, clientUpdatedAt, updatedAt, [userId+syncStatus], [userId+clientUpdatedAt]',
      sessionLogs:
        '&id, userId, sessionDefinitionId, date, syncStatus, clientUpdatedAt, [userId+syncStatus], [userId+clientUpdatedAt]',
      playerSessionEntries:
        '&id, userId, sessionLogId, playerId, trafficLight, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      progressEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      baselineEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      returnerEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      publicCheckInLinks:
        '&id, userId, sessionDefinitionId, tokenHash, expiresAt, syncStatus, clientUpdatedAt, [userId+sessionDefinitionId]',
      publicCheckInLinkPlayers:
        '&id, userId, linkId, playerId, displayName, syncStatus, clientUpdatedAt, [userId+linkId], [linkId+playerId]',
      publicCheckInSubmissions:
        '&id, userId, linkId, linkPlayerId, playerId, status, submittedAt, syncStatus, clientUpdatedAt, [userId+status], [userId+linkId], [linkPlayerId+status]',
      pendingWrites: '++localId, table, recordId, userId, createdAt, [userId+table]',
      photoCache: '&cacheKey, photoPath, photoUpdatedAt, cachedAt',
      pendingPhotoUploads: '&photoPath, userId, playerId, createdAt',
      syncMeta: '&key',
    })
    this.version(8).stores({
      players:
        '&id, userId, active, syncStatus, clientUpdatedAt, updatedAt, [userId+syncStatus], [userId+clientUpdatedAt]',
      sessionLogs:
        '&id, userId, sessionDefinitionId, date, syncStatus, clientUpdatedAt, [userId+syncStatus], [userId+clientUpdatedAt]',
      playerSessionEntries:
        '&id, userId, sessionLogId, playerId, trafficLight, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      progressEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      baselineEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      returnerEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      sessionBlockLogs:
        '&id, userId, sessionLogId, sessionDefinitionId, blockKey, status, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+sessionLogId+blockKey], [userId+syncStatus], [userId+clientUpdatedAt]',
      publicCheckInLinks:
        '&id, userId, sessionDefinitionId, tokenHash, expiresAt, syncStatus, clientUpdatedAt, [userId+sessionDefinitionId]',
      publicCheckInLinkPlayers:
        '&id, userId, linkId, playerId, displayName, syncStatus, clientUpdatedAt, [userId+linkId], [linkId+playerId]',
      publicCheckInSubmissions:
        '&id, userId, linkId, linkPlayerId, playerId, status, submittedAt, syncStatus, clientUpdatedAt, [userId+status], [userId+linkId], [linkPlayerId+status]',
      pendingWrites: '++localId, table, recordId, userId, createdAt, [userId+table]',
      photoCache: '&cacheKey, photoPath, photoUpdatedAt, cachedAt',
      pendingPhotoUploads: '&photoPath, userId, playerId, createdAt',
      syncMeta: '&key',
    })
    this.version(9).stores({
      players:
        '&id, userId, active, syncStatus, clientUpdatedAt, updatedAt, [userId+syncStatus], [userId+clientUpdatedAt]',
      sessionLogs:
        '&id, userId, sessionDefinitionId, date, syncStatus, clientUpdatedAt, [userId+syncStatus], [userId+clientUpdatedAt]',
      playerSessionEntries:
        '&id, userId, sessionLogId, playerId, trafficLight, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      progressEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      baselineEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      returnerEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      sessionBlockLogs:
        '&id, userId, sessionLogId, sessionDefinitionId, blockKey, status, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+sessionLogId+blockKey], [userId+syncStatus], [userId+clientUpdatedAt]',
      playerExposureSummaries:
        '&id, userId, playerId, sessionLogId, sessionDate, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+playerId+sessionDate], [userId+syncStatus], [userId+clientUpdatedAt]',
      publicCheckInLinks:
        '&id, userId, sessionDefinitionId, tokenHash, expiresAt, syncStatus, clientUpdatedAt, [userId+sessionDefinitionId]',
      publicCheckInLinkPlayers:
        '&id, userId, linkId, playerId, displayName, syncStatus, clientUpdatedAt, [userId+linkId], [linkId+playerId]',
      publicCheckInSubmissions:
        '&id, userId, linkId, linkPlayerId, playerId, status, submittedAt, syncStatus, clientUpdatedAt, [userId+status], [userId+linkId], [linkPlayerId+status]',
      pendingWrites: '++localId, table, recordId, userId, createdAt, [userId+table]',
      photoCache: '&cacheKey, photoPath, photoUpdatedAt, cachedAt',
      pendingPhotoUploads: '&photoPath, userId, playerId, createdAt',
      syncMeta: '&key',
    })
    this.version(10).stores({
      players:
        '&id, userId, active, syncStatus, clientUpdatedAt, updatedAt, [userId+syncStatus], [userId+clientUpdatedAt]',
      sessionLogs:
        '&id, userId, sessionDefinitionId, date, syncStatus, clientUpdatedAt, [userId+syncStatus], [userId+clientUpdatedAt]',
      playerSessionEntries:
        '&id, userId, sessionLogId, playerId, trafficLight, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      progressEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      baselineEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      returnerEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      sessionBlockLogs:
        '&id, userId, sessionLogId, sessionDefinitionId, blockKey, status, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+sessionLogId+blockKey], [userId+syncStatus], [userId+clientUpdatedAt]',
      playerExposureSummaries:
        '&id, userId, playerId, sessionLogId, sessionDate, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+playerId+sessionDate], [userId+syncStatus], [userId+clientUpdatedAt]',
      metricResults:
        '&id, userId, playerId, sessionLogId, metricKey, attempt, bodySide, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+sessionLogId+playerId+metricKey+attempt+bodySide], [userId+playerId+metricKey+clientUpdatedAt], [userId+syncStatus], [userId+clientUpdatedAt]',
      publicCheckInLinks:
        '&id, userId, sessionDefinitionId, tokenHash, expiresAt, syncStatus, clientUpdatedAt, [userId+sessionDefinitionId]',
      publicCheckInLinkPlayers:
        '&id, userId, linkId, playerId, displayName, syncStatus, clientUpdatedAt, [userId+linkId], [linkId+playerId]',
      publicCheckInSubmissions:
        '&id, userId, linkId, linkPlayerId, playerId, status, submittedAt, syncStatus, clientUpdatedAt, [userId+status], [userId+linkId], [linkPlayerId+status]',
      pendingWrites: '++localId, table, recordId, userId, createdAt, [userId+table]',
      photoCache: '&cacheKey, photoPath, photoUpdatedAt, cachedAt',
      pendingPhotoUploads: '&photoPath, userId, playerId, createdAt',
      syncMeta: '&key',
    })
    this.version(11).stores({
      players:
        '&id, userId, active, syncStatus, clientUpdatedAt, updatedAt, [userId+syncStatus], [userId+clientUpdatedAt]',
      sessionLogs:
        '&id, userId, sessionDefinitionId, date, syncStatus, clientUpdatedAt, [userId+syncStatus], [userId+clientUpdatedAt]',
      playerSessionEntries:
        '&id, userId, sessionLogId, playerId, trafficLight, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      progressEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      baselineEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      returnerEntries:
        '&id, userId, sessionLogId, playerId, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+syncStatus], [userId+clientUpdatedAt]',
      sessionBlockLogs:
        '&id, userId, sessionLogId, sessionDefinitionId, blockKey, status, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+sessionLogId+blockKey], [userId+syncStatus], [userId+clientUpdatedAt]',
      playerExposureSummaries:
        '&id, userId, playerId, sessionLogId, sessionDate, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+playerId+sessionDate], [userId+syncStatus], [userId+clientUpdatedAt]',
      exerciseResults:
        '&id, userId, playerId, sessionLogId, exerciseKey, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+sessionLogId+playerId+exerciseKey], [userId+playerId+exerciseKey+clientUpdatedAt], [userId+syncStatus], [userId+clientUpdatedAt]',
      metricResults:
        '&id, userId, playerId, sessionLogId, metricKey, attempt, bodySide, syncStatus, clientUpdatedAt, [userId+sessionLogId], [userId+sessionLogId+playerId+metricKey+attempt+bodySide], [userId+playerId+metricKey+clientUpdatedAt], [userId+syncStatus], [userId+clientUpdatedAt]',
      publicCheckInLinks:
        '&id, userId, sessionDefinitionId, tokenHash, expiresAt, syncStatus, clientUpdatedAt, [userId+sessionDefinitionId]',
      publicCheckInLinkPlayers:
        '&id, userId, linkId, playerId, displayName, syncStatus, clientUpdatedAt, [userId+linkId], [linkId+playerId]',
      publicCheckInSubmissions:
        '&id, userId, linkId, linkPlayerId, playerId, status, submittedAt, syncStatus, clientUpdatedAt, [userId+status], [userId+linkId], [linkPlayerId+status]',
      pendingWrites: '++localId, table, recordId, userId, createdAt, [userId+table]',
      photoCache: '&cacheKey, photoPath, photoUpdatedAt, cachedAt',
      pendingPhotoUploads: '&photoPath, userId, playerId, createdAt',
      syncMeta: '&key',
    })
  }
}

export const localDb = new FieldHubDatabase()

export async function getSyncMeta(key: string) {
  return (await localDb.syncMeta.get(key))?.value ?? null
}

export async function setSyncMeta(key: string, value: string) {
  await localDb.syncMeta.put({ key, value })
}
