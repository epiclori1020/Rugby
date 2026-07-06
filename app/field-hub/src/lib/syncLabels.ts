import type { SyncStatus } from '../domain/sync'
import type { PlayerSyncOverview } from '../domain/sync'

export function syncStatusLabel(status: SyncStatus) {
  if (status === 'pending') {
    return 'wartet auf Sync'
  }

  if (status === 'error') {
    return 'Sync pruefen'
  }

  return 'synchronisiert'
}

export function pendingCountLabel(count: number, itemLabel = 'Aenderungen') {
  return count > 0 ? `${count} ${itemLabel} warten auf Sync` : 'keine Aenderungen warten auf Sync'
}

export function syncChangeCountLabel(count: number) {
  return count === 1 ? '1 Aenderung' : `${count} Aenderungen`
}

export function formatSyncTimestamp(timestamp: string | null) {
  return timestamp ? new Date(timestamp).toLocaleString('de-AT') : 'noch nicht synchronisiert'
}

export function syncBadgeLabel(overview: PlayerSyncOverview, isSyncing = false) {
  if (isSyncing) {
    return 'Sync laeuft'
  }

  if (!overview.isOnline) {
    return 'offline'
  }

  if (overview.status === 'error' || overview.errorMessage) {
    return 'Sync pruefen'
  }

  if (overview.status === 'pending' || overview.pendingCount > 0) {
    return 'wartet auf Sync'
  }

  return 'synchronisiert'
}

export function syncBadgeDetail(overview: PlayerSyncOverview, isSyncing = false) {
  if (isSyncing) {
    return 'Aenderungen werden synchronisiert.'
  }

  if (!overview.isOnline) {
    return overview.pendingCount > 0
      ? `${syncChangeCountLabel(overview.pendingCount)} lokal gespeichert.`
      : 'Offline. Neue Aenderungen bleiben lokal gespeichert.'
  }

  if (overview.errorMessage) {
    return overview.errorMessage
  }

  if (overview.status === 'error') {
    return 'Konflikt pruefen oder Sync erneut versuchen.'
  }

  if (overview.status === 'pending' || overview.pendingCount > 0) {
    return `${syncChangeCountLabel(overview.pendingCount)} lokal gespeichert.`
  }

  return overview.lastSuccessfulSyncAt
    ? `zuletzt synchronisiert: ${formatSyncTimestamp(overview.lastSuccessfulSyncAt)}`
    : 'keine offenen Aenderungen.'
}

export function shouldShowSyncAttention(overview: PlayerSyncOverview) {
  return !overview.isOnline || overview.status !== 'synced' || overview.pendingCount > 0 || Boolean(overview.errorMessage)
}
