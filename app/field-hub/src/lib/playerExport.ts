import type { Player } from '../domain/players'

export function createPlayerExport(players: Player[]) {
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    type: 'rugby-field-hub-player-master-data',
    players: players.map((player) => ({
      id: player.id,
      name: player.name,
      position: player.position,
      cluster: player.cluster,
      active: player.active,
      consentStatus: player.consentStatus,
      photoConsentStatus: player.photoConsentStatus,
      photoPath: player.photoPath,
      photoUpdatedAt: player.photoUpdatedAt,
      returnerStatus: player.returnerStatus,
      notes: player.notes,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
      clientUpdatedAt: player.clientUpdatedAt,
    })),
  }
}

export function downloadJsonExport(players: Player[]) {
  const payload = createPlayerExport(players)
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `field-hub-spieler-${new Date().toISOString().slice(0, 10)}.json`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

