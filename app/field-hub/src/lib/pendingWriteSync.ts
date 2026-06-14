import type { Table } from 'dexie'
import type { SyncStatus } from '../domain/sync'
import { localDb } from './localDb'

type SyncableRecord = {
  id: string
  clientUpdatedAt: string
  syncStatus: SyncStatus
  syncError: string | null
}

export async function markSyncedIfUnchanged<T extends SyncableRecord>(
  table: Table<T, string>,
  snapshot: T,
  pendingWriteLocalId: number | undefined,
) {
  const current = await table.get(snapshot.id)

  if (!current) {
    if (pendingWriteLocalId !== undefined) {
      await localDb.pendingWrites.delete(pendingWriteLocalId)
    }
    return false
  }

  if (current.clientUpdatedAt !== snapshot.clientUpdatedAt) {
    if (pendingWriteLocalId !== undefined) {
      await localDb.pendingWrites.delete(pendingWriteLocalId)
    }
    return false
  }

  await table.put({
    ...current,
    syncStatus: 'synced',
    syncError: null,
  })

  if (pendingWriteLocalId !== undefined) {
    await localDb.pendingWrites.delete(pendingWriteLocalId)
  }

  return true
}

export async function markSyncErrorIfUnchanged<T extends SyncableRecord>(
  table: Table<T, string>,
  snapshot: T,
  errorMessage: string,
) {
  const current = await table.get(snapshot.id)

  if (!current || current.clientUpdatedAt !== snapshot.clientUpdatedAt) {
    return false
  }

  await table.put({
    ...current,
    syncStatus: 'error',
    syncError: errorMessage,
  })

  return true
}
