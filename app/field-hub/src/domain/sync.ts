export type SyncStatus = 'synced' | 'pending' | 'error'

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

