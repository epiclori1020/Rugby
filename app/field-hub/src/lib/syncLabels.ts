import type { SyncStatus } from '../domain/sync'

export function syncStatusLabel(status: SyncStatus) {
  if (status === 'pending') {
    return 'lokal gespeichert'
  }

  if (status === 'error') {
    return 'Sync pruefen'
  }

  return 'synchronisiert'
}

export function pendingCountLabel(count: number, itemLabel = 'Aenderungen') {
  return count > 0 ? `${count} ${itemLabel} offen` : 'keine Aenderungen offen'
}
