import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SessionDefinition } from '../content/types'
import type { PlayerSessionEntry } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { ReturnerCapSummary, ReturnerEntry, ReturnerEntryPatch } from '../domain/returners'
import { defaultPlayerSyncOverview, type PlayerSyncOverview } from '../domain/sync'
import { ensureSessionLog, findSessionLog, syncCheckIns } from '../lib/checkInRepository'
import {
  buildEmptyReturnerEntry,
  getReturnerSyncOverview,
  listLatestReturnerCaps,
  listReturnerEntriesForPlayer,
  listReturnerEntriesForSession,
  saveReturnerEntry,
} from '../lib/returnerRepository'

export function useReturners(
  userId: string | null,
  sessionDefinition: SessionDefinition,
  players: Player[],
  checkInEntries: PlayerSessionEntry[],
) {
  const [entries, setEntries] = useState<ReturnerEntry[]>([])
  const [historyByPlayerId, setHistoryByPlayerId] = useState<Record<string, ReturnerEntry[]>>({})
  const [returnerCaps, setReturnerCaps] = useState<ReturnerCapSummary[]>([])
  const [syncOverview, setSyncOverview] = useState<PlayerSyncOverview>(defaultPlayerSyncOverview)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionLogId, setSessionLogId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activeReturnerPlayers = useMemo(() => {
    const flaggedPlayerIds = new Set(checkInEntries.filter((entry) => entry.returnerFlag !== 'nein').map((entry) => entry.playerId))
    const capPlayerIds = new Set(returnerCaps.map((cap) => cap.playerId))

    return players
      .filter(
        (player) =>
          player.active &&
          (player.returnerStatus !== 'nein' || flaggedPlayerIds.has(player.id) || capPlayerIds.has(player.id)),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'de-AT'))
  }, [checkInEntries, players, returnerCaps])

  const refreshReturners = useCallback(async () => {
    if (!userId) {
      setEntries([])
      setHistoryByPlayerId({})
      setReturnerCaps([])
      setSyncOverview(defaultPlayerSyncOverview)
      setSessionLogId(null)
      setErrorMessage(null)
      return
    }

    const sessionLog = await findSessionLog(userId, sessionDefinition.id)
    const [localEntries, caps, overview] = await Promise.all([
      sessionLog ? listReturnerEntriesForSession(userId, sessionLog.id) : Promise.resolve([]),
      listLatestReturnerCaps(userId, sessionLog?.id ?? null, sessionDefinition.date),
      getReturnerSyncOverview(userId),
    ])
    const relevantPlayerIds = new Set([
      ...players.filter((player) => player.active && player.returnerStatus !== 'nein').map((player) => player.id),
      ...checkInEntries.filter((entry) => entry.returnerFlag !== 'nein').map((entry) => entry.playerId),
      ...caps.map((cap) => cap.playerId),
      ...localEntries.map((entry) => entry.playerId),
    ])
    const historyEntries = await Promise.all(
      [...relevantPlayerIds].map(async (playerId) => [playerId, await listReturnerEntriesForPlayer(userId, playerId)] as const),
    )

    setEntries(localEntries)
    setReturnerCaps(caps)
    setSyncOverview(overview)
    setSessionLogId(sessionLog?.id ?? null)
    setHistoryByPlayerId(Object.fromEntries(historyEntries))
  }, [checkInEntries, players, sessionDefinition, userId])

  const runSync = useCallback(async () => {
    if (!userId) {
      return
    }

    setIsLoading(true)
    try {
      const overview = await syncCheckIns(userId)
      const returnerOverview = await getReturnerSyncOverview(userId)
      setSyncOverview(returnerOverview)
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Returner-Sync fehlgeschlagen.' : null)
      await refreshReturners()
      return overview
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Returner-Sync fehlgeschlagen.'
      setSyncOverview({
        ...(await getReturnerSyncOverview(userId)),
        status: 'error',
        errorMessage: message,
      })
      setErrorMessage(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [refreshReturners, userId])

  const runBackgroundSync = useCallback(async () => {
    if (!userId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return
    }

    try {
      const overview = await syncCheckIns(userId)
      const returnerOverview = await getReturnerSyncOverview(userId)
      setSyncOverview(returnerOverview)
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Returner-Sync fehlgeschlagen.' : null)
      await refreshReturners()
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Returner-Sync fehlgeschlagen.'
      setSyncOverview({
        ...(await getReturnerSyncOverview(userId)),
        status: 'error',
        errorMessage: message,
      })
      setErrorMessage(`Lokal gespeichert, Sync offen: ${message}`)
    }
  }, [refreshReturners, userId])

  useEffect(() => {
    Promise.resolve()
      .then(refreshReturners)
      .catch(() => undefined)
  }, [refreshReturners])

  async function savePlayerReturner(player: Player, patch: ReturnerEntryPatch) {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const sessionLog = sessionLogId ? { id: sessionLogId } : await ensureSessionLog(userId, sessionDefinition)
      setSessionLogId(sessionLog.id)
      await saveReturnerEntry(userId, sessionLog.id, player.id, patch)
      await refreshReturners()
      if (typeof navigator === 'undefined' || navigator.onLine) {
        void runBackgroundSync()
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Returner-Eintrag konnte nicht gespeichert werden.'
      setErrorMessage(message)
    }
  }

  function getEntryForPlayer(player: Player) {
    const entry = entries.find((candidate) => candidate.playerId === player.id)

    if (entry) {
      return entry
    }

    return {
      ...buildEmptyReturnerEntry(userId ?? 'local-preview', sessionLogId ?? 'session-preview', player.id),
      syncStatus: 'synced' as const,
      syncError: null,
    }
  }

  function getHistoryForPlayer(player: Player) {
    return historyByPlayerId[player.id] ?? []
  }

  function getCapsForPlayer(player: Player) {
    return returnerCaps.find((cap) => cap.playerId === player.id) ?? null
  }

  return {
    activeReturnerPlayers,
    entries,
    errorMessage,
    getCapsForPlayer,
    getEntryForPlayer,
    getHistoryForPlayer,
    isLoading,
    refreshReturners,
    returnerCaps,
    runSync,
    savePlayerReturner,
    syncOverview,
    clearError: () => setErrorMessage(null),
  }
}
