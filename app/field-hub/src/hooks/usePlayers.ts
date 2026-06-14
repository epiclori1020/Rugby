import { useCallback, useEffect, useState } from 'react'
import type { Player, PlayerFormValues } from '../domain/players'
import type { PlayerSyncOverview } from '../domain/sync'
import { defaultPlayerSyncOverview } from '../domain/sync'
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

    await savePlayer(userId, values, existing)
    await refreshLocalPlayers()
    if (typeof navigator === 'undefined' || navigator.onLine) {
      void runBackgroundSync()
    }
  }

  async function deactivate(player: Player) {
    await deactivatePlayer(player)
    await refreshLocalPlayers()
    if (typeof navigator === 'undefined' || navigator.onLine) {
      void runBackgroundSync()
    }
  }

  async function remove(player: Player) {
    await deletePlayer(player)
    await refreshLocalPlayers()
    if (typeof navigator === 'undefined' || navigator.onLine) {
      void runBackgroundSync()
    }
  }

  async function uploadPhoto(player: Player, file: File) {
    await uploadPlayerPhoto(player, file)
    await refreshLocalPlayers()
    if (typeof navigator === 'undefined' || navigator.onLine) {
      void runBackgroundSync()
    }
  }

  async function removePhoto(player: Player) {
    await removePlayerPhoto(player)
    await refreshLocalPlayers()
    if (typeof navigator === 'undefined' || navigator.onLine) {
      void runBackgroundSync()
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
