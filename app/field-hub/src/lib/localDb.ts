import Dexie, { type Table } from 'dexie'
import type { BaselineEntry } from '../domain/baseline'
import type { PlayerSessionEntry, SessionLog } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { ProgressEntry } from '../domain/postSession'
import type { ReturnerEntry } from '../domain/returners'

export type PendingWriteOperation = 'upsert'
export type PendingWriteTable =
  | 'players'
  | 'session_logs'
  | 'player_session_entries'
  | 'progress_entries'
  | 'baseline_entries'
  | 'returner_entries'

export type PendingWrite = {
  localId?: number
  table: PendingWriteTable
  recordId: string
  operation: PendingWriteOperation
  userId: string
  createdAt: string
}

export type SyncMeta = {
  key: string
  value: string
}

class FieldHubDatabase extends Dexie {
  players!: Table<Player, string>
  sessionLogs!: Table<SessionLog, string>
  playerSessionEntries!: Table<PlayerSessionEntry, string>
  progressEntries!: Table<ProgressEntry, string>
  baselineEntries!: Table<BaselineEntry, string>
  returnerEntries!: Table<ReturnerEntry, string>
  pendingWrites!: Table<PendingWrite, number>
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
  }
}

export const localDb = new FieldHubDatabase()

export async function getSyncMeta(key: string) {
  return (await localDb.syncMeta.get(key))?.value ?? null
}

export async function setSyncMeta(key: string, value: string) {
  await localDb.syncMeta.put({ key, value })
}
