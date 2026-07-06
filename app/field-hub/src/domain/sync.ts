export type SyncStatus = 'synced' | 'pending' | 'error'
export type SyncDetailStatus = SyncStatus | 'conflict'

export type SyncDetailGroup = {
  id: string
  label: string
  status: SyncDetailStatus
  pendingCount: number
  errorCount: number
  conflictCount: number
  detail: string
}

export type SyncDetailSummary = {
  groups: SyncDetailGroup[]
  pendingCount: number
  errorCount: number
  conflictCount: number
}

export type PlayerSyncOverview = {
  isOnline: boolean
  status: SyncStatus
  pendingCount: number
  lastSuccessfulSyncAt: string | null
  errorMessage: string | null
}

export const defaultPlayerSyncOverview: PlayerSyncOverview = {
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  status: 'synced',
  pendingCount: 0,
  lastSuccessfulSyncAt: null,
  errorMessage: null,
}
