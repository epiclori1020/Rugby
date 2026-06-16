import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SessionDefinition } from '../content/types'
import type { PlayerSessionEntry } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { ReturnerCapSummary, ReturnerEntry, ReturnerEntryPatch } from '../domain/returners'
import { defaultPlayerSyncOverview, type PlayerSyncOverview } from '../domain/sync'
import { scheduleBackgroundSync } from '../lib/backgroundSync'
import { ensureSessionLog, findSessionLog, pushPendingCheckIns, syncCheckIns } from '../lib/checkInRepository'
import { mergeRecordIntoList } from '../lib/optimisticUpdates'
import { hasPlayerId } from '../lib/playerId'
import {
  buildEmptyReturnerEntry,
  getReturnerSyncOverview,
  listLatestReturnerCaps,
  listReturnerEntriesForPlayers,
  listReturnerEntriesForSession,
  saveReturnerEntry,
} from '../lib/returnerRepository'

type SaveReturnerResult =
  | { ok: true; entry: ReturnerEntry }
  | { ok: false; error: string }

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
  const checkInEntriesRef = useRef(checkInEntries)

  useEffect(() => {
    checkInEntriesRef.current = checkInEntries
  }, [checkInEntries])

  const activeReturnerPlayers = useMemo(() => {
    const flaggedPlayerIds = new Set(
      checkInEntries.filter((entry) => hasPlayerId(entry) && entry.returnerFlag !== 'nein').map((entry) => entry.playerId),
    )
    const capPlayerIds = new Set(returnerCaps.filter(hasPlayerId).map((cap) => cap.playerId))

    return players
      .filter(
        (player) =>
          player.active &&
          (player.returnerStatus !== 'nein' || flaggedPlayerIds.has(player.id) || capPlayerIds.has(player.id)),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'de-AT'))
  }, [checkInEntries, players, returnerCaps])

  const flaggedPlayerIds = useMemo(
    () =>
      [
        ...new Set(
          checkInEntries.flatMap((entry) =>
            hasPlayerId(entry) && entry.returnerFlag !== 'nein' ? [entry.playerId] : [],
          ),
        ),
      ].sort(),
    [checkInEntries],
  )

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
    const relevantPlayerIds = new Set<string>(
      players.filter((player) => player.active && player.returnerStatus !== 'nein').map((player) => player.id),
    )
    for (const entry of checkInEntriesRef.current) {
      if (hasPlayerId(entry) && entry.returnerFlag !== 'nein') {
        relevantPlayerIds.add(entry.playerId)
      }
    }
    for (const cap of caps) {
      if (hasPlayerId(cap)) {
        relevantPlayerIds.add(cap.playerId)
      }
    }
    for (const entry of localEntries) {
      if (hasPlayerId(entry)) {
        relevantPlayerIds.add(entry.playerId)
      }
    }
    const historyEntriesByPlayerId = await listReturnerEntriesForPlayers(userId, [...relevantPlayerIds])

    setEntries(localEntries)
    setReturnerCaps(caps)
    setSyncOverview(overview)
    setSessionLogId(sessionLog?.id ?? null)
    setHistoryByPlayerId(historyEntriesByPlayerId)
  }, [players, sessionDefinition, userId])

  const runSync = useCallback(async () => {
    if (!userId) {
      return
    }

    setIsLoading(true)
    try {
      const overview = await syncCheckIns(userId, { sessionDefinitionId: sessionDefinition.id })
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
  }, [refreshReturners, sessionDefinition.id, userId])

  const runBackgroundSync = useCallback(async () => {
    if (!userId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return
    }

    try {
      const overview = await pushPendingCheckIns(userId)
      const returnerOverview = await getReturnerSyncOverview(userId)
      setSyncOverview(returnerOverview)
      if (overview.status !== 'error') {
        await refreshReturners()
      }
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Returner-Sync fehlgeschlagen.' : null)
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

  useEffect(() => {
    if (!userId || flaggedPlayerIds.length === 0) {
      return
    }

    const missingPlayerIds = flaggedPlayerIds.filter((playerId) => historyByPlayerId[playerId] === undefined)
    if (missingPlayerIds.length === 0) {
      return
    }

    Promise.resolve()
      .then(() => listReturnerEntriesForPlayers(userId, missingPlayerIds))
      .then((newHistory) =>
        setHistoryByPlayerId((currentHistory) => ({
          ...currentHistory,
          ...newHistory,
        })),
      )
      .catch(() => undefined)
  }, [flaggedPlayerIds, historyByPlayerId, userId])

  async function savePlayerReturner(player: Player, patch: ReturnerEntryPatch): Promise<SaveReturnerResult> {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const sessionLog = sessionLogId ? { id: sessionLogId } : await ensureSessionLog(userId, sessionDefinition)
      setSessionLogId(sessionLog.id)
      const savedEntry = await saveReturnerEntry(userId, sessionLog.id, player.id, patch)
      setEntries((currentEntries) => mergeRecordIntoList(currentEntries, savedEntry))
      setHistoryByPlayerId((currentHistory) => ({
        ...currentHistory,
        [player.id]: mergeRecordIntoList(currentHistory[player.id] ?? [], savedEntry).sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        ),
      }))
      setSyncOverview(await getReturnerSyncOverview(userId))
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'returners', runBackgroundSync)
      }
      return { ok: true, entry: savedEntry }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Returner-Eintrag konnte nicht gespeichert werden.'
      setErrorMessage(message)
      return { ok: false, error: message }
    }
  }

  function getEntryForPlayer(player: Player) {
    const entry = entries.find((candidate) => candidate.playerId === player.id)

    if (entry) {
      return entry
    }

    return {
      ...buildEmptyReturnerEntry(userId ?? 'local-preview', sessionLogId ?? 'session-preview', player.id),
      id: `preview:${sessionDefinition.id}:${player.id}`,
      clientUpdatedAt: sessionDefinition.date,
      createdAt: sessionDefinition.date,
      updatedAt: sessionDefinition.date,
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
