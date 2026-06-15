import { useCallback, useEffect, useState } from 'react'
import type { Player, PlayerFormValues } from '../domain/players'
import type { PlayerSyncOverview } from '../domain/sync'
import { defaultPlayerSyncOverview } from '../domain/sync'
import { scheduleBackgroundSync } from '../lib/backgroundSync'
import {
  deactivatePlayer,
  deletePlayer,
  getPlayerSyncOverview,
  listLocalPlayers,
  removePlayerPhoto,
  savePlayer,
  syncPlayers,
  uploadPlayerPhoto,
} from '../lib/playerRepository'

function sortPlayers(players: Player[]) {
  return [...players]
    .filter((player) => !player.deletedAt)
    .sort((a, b) => a.name.localeCompare(b.name, 'de-AT'))
}

function mergePlayer(players: Player[], player: Player) {
  const existingIndex = players.findIndex((candidate) => candidate.id === player.id)
  if (existingIndex === -1) {
    return sortPlayers([...players, player])
  }

  const nextPlayers = [...players]
  nextPlayers[existingIndex] = player
  return sortPlayers(nextPlayers)
}

export function usePlayers(userId: string | null) {
  const [players, setPlayers] = useState<Player[]>([])
  const [syncOverview, setSyncOverview] = useState<PlayerSyncOverview>(defaultPlayerSyncOverview)
  const [isLoading, setIsLoading] = useState(false)

  const refreshLocalPlayers = useCallback(async () => {
    if (!userId) {
      setPlayers([])
      setSyncOverview(defaultPlayerSyncOverview)
      return
    }

    const [localPlayers, overview] = await Promise.all([
      listLocalPlayers(userId),
      getPlayerSyncOverview(userId),
    ])
    setPlayers(localPlayers)
    setSyncOverview(overview)
  }, [userId])

  const runSync = useCallback(async () => {
    if (!userId) {
      return
    }

    setIsLoading(true)
    try {
      const overview = await syncPlayers(userId)
      setSyncOverview(overview)
      setPlayers(await listLocalPlayers(userId))
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const runBackgroundSync = useCallback(async () => {
    if (!userId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return
    }

    try {
      const overview = await syncPlayers(userId)
      setSyncOverview(overview)
      setPlayers(await listLocalPlayers(userId))
    } catch {
      setSyncOverview(await getPlayerSyncOverview(userId))
    }
  }, [userId])

  useEffect(() => {
    Promise.resolve()
      .then(refreshLocalPlayers)
      .catch(() => undefined)

    return undefined
  }, [refreshLocalPlayers])

  useEffect(() => {
    if (!userId) {
      return undefined
    }

    Promise.resolve()
      .then(runSync)
      .catch(() => undefined)

    const handleOnline = () => {
      runSync()
    }
    const handleOffline = () => {
      refreshLocalPlayers()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refreshLocalPlayers, runSync, userId])

  async function save(values: PlayerFormValues, existing?: Player) {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    const savedPlayer = await savePlayer(userId, values, existing)
    setPlayers((currentPlayers) => mergePlayer(currentPlayers, savedPlayer))
    setSyncOverview(await getPlayerSyncOverview(userId))
    if (typeof navigator === 'undefined' || navigator.onLine) {
      scheduleBackgroundSync(userId, 'players', runBackgroundSync)
    }
  }

  async function deactivate(player: Player) {
    const deactivatedPlayer = await deactivatePlayer(player)
    setPlayers((currentPlayers) => mergePlayer(currentPlayers, deactivatedPlayer))
    setSyncOverview(await getPlayerSyncOverview(player.userId))
    if (typeof navigator === 'undefined' || navigator.onLine) {
      scheduleBackgroundSync(player.userId, 'players', runBackgroundSync)
    }
  }

  async function remove(player: Player) {
    const deletedPlayer = await deletePlayer(player)
    setPlayers((currentPlayers) => currentPlayers.filter((candidate) => candidate.id !== deletedPlayer.id))
    setSyncOverview(await getPlayerSyncOverview(player.userId))
    if (typeof navigator === 'undefined' || navigator.onLine) {
      scheduleBackgroundSync(player.userId, 'players', runBackgroundSync)
    }
  }

  async function uploadPhoto(player: Player, file: File) {
    const updatedPlayer = await uploadPlayerPhoto(player, file)
    setPlayers((currentPlayers) => mergePlayer(currentPlayers, updatedPlayer))
    setSyncOverview(await getPlayerSyncOverview(player.userId))
    if (typeof navigator === 'undefined' || navigator.onLine) {
      scheduleBackgroundSync(player.userId, 'players', runBackgroundSync)
    }
  }

  async function removePhoto(player: Player) {
    const updatedPlayer = await removePlayerPhoto(player)
    setPlayers((currentPlayers) => mergePlayer(currentPlayers, updatedPlayer))
    setSyncOverview(await getPlayerSyncOverview(player.userId))
    if (typeof navigator === 'undefined' || navigator.onLine) {
      scheduleBackgroundSync(player.userId, 'players', runBackgroundSync)
    }
  }

  return {
    players,
    syncOverview,
    isLoading,
    refreshLocalPlayers,
    runSync,
    savePlayer: save,
    deactivatePlayer: deactivate,
    deletePlayer: remove,
    uploadPlayerPhoto: uploadPhoto,
    removePlayerPhoto: removePhoto,
  }
}
