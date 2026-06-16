import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SessionDefinition } from '../content/types'
import type { BaselineEntry, BaselineEntryPatch } from '../domain/baseline'
import type { Player } from '../domain/players'
import { defaultPlayerSyncOverview, type PlayerSyncOverview } from '../domain/sync'
import { scheduleBackgroundSync } from '../lib/backgroundSync'
import { ensureSessionLog, findSessionLog, pushPendingCheckIns, syncCheckIns } from '../lib/checkInRepository'
import {
  getBaselineSyncOverview,
  listBaselineEntriesForSession,
  listLatestBaselineEntriesByPlayer,
  saveBaselineEntry,
  type LatestBaselineEntry,
} from '../lib/baselineRepository'

export function useBaselines(userId: string | null, sessionDefinition: SessionDefinition, players: Player[]) {
  const [entries, setEntries] = useState<BaselineEntry[]>([])
  const [latestEntriesByPlayerId, setLatestEntriesByPlayerId] = useState<Record<string, LatestBaselineEntry>>({})
  const [syncOverview, setSyncOverview] = useState<PlayerSyncOverview>(defaultPlayerSyncOverview)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionLogId, setSessionLogId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activePlayers = useMemo(() => players.filter((player) => player.active), [players])

  const refreshBaselines = useCallback(async () => {
    if (!userId) {
      setEntries([])
      setLatestEntriesByPlayerId({})
      setSyncOverview(defaultPlayerSyncOverview)
      setSessionLogId(null)
      setErrorMessage(null)
      return
    }

    const sessionLog = await findSessionLog(userId, sessionDefinition.id)
    const [localEntries, latestByPlayer, overview] = await Promise.all([
      sessionLog ? listBaselineEntriesForSession(userId, sessionLog.id) : Promise.resolve([]),
      listLatestBaselineEntriesByPlayer(userId),
      getBaselineSyncOverview(userId),
    ])

    setEntries(localEntries)
    setLatestEntriesByPlayerId(Object.fromEntries(latestByPlayer))
    setSyncOverview(overview)
    setSessionLogId(sessionLog?.id ?? null)
  }, [sessionDefinition.id, userId])

  const runSync = useCallback(async () => {
    if (!userId) {
      return
    }

    setIsLoading(true)
    try {
      const overview = await syncCheckIns(userId, { sessionDefinitionId: sessionDefinition.id })
      const baselineOverview = await getBaselineSyncOverview(userId)
      setSyncOverview(baselineOverview)
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Baseline-Sync fehlgeschlagen.' : null)
      await refreshBaselines()
      return overview
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Baseline-Sync fehlgeschlagen.'
      setSyncOverview({
        ...(await getBaselineSyncOverview(userId)),
        status: 'error',
        errorMessage: message,
      })
      setErrorMessage(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [refreshBaselines, sessionDefinition.id, userId])

  const runBackgroundSync = useCallback(async () => {
    if (!userId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return
    }

    try {
      const overview = await pushPendingCheckIns(userId)
      setSyncOverview(await getBaselineSyncOverview(userId))
      if (overview.status !== 'error') {
        await refreshBaselines()
      }
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Baseline-Sync fehlgeschlagen.' : null)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Baseline-Sync fehlgeschlagen.'
      setSyncOverview({
        ...(await getBaselineSyncOverview(userId)),
        status: 'error',
        errorMessage: message,
      })
      setErrorMessage(`Lokal gespeichert, Sync offen: ${message}`)
    }
  }, [refreshBaselines, userId])

  useEffect(() => {
    Promise.resolve()
      .then(refreshBaselines)
      .catch(() => undefined)
  }, [refreshBaselines])

  async function savePlayerBaseline(player: Player, patch: BaselineEntryPatch) {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const sessionLog = sessionLogId ? { id: sessionLogId } : await ensureSessionLog(userId, sessionDefinition)
      setSessionLogId(sessionLog.id)
      await saveBaselineEntry(userId, sessionLog.id, player.id, patch)
      await refreshBaselines()
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'baselines', runBackgroundSync)
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Baseline-Wert konnte nicht gespeichert werden.'
      setErrorMessage(message)
    }
  }

  function getBaselineForPlayer(player: Player) {
    return entries.find((entry) => entry.playerId === player.id) ?? null
  }

  function getLatestBaselineForPlayer(player: Player) {
    return latestEntriesByPlayerId[player.id] ?? null
  }

  return {
    activePlayers,
    entries,
    errorMessage,
    getBaselineForPlayer,
    getLatestBaselineForPlayer,
    isLoading,
    latestEntriesByPlayerId,
    refreshBaselines,
    runSync,
    savePlayerBaseline,
    syncOverview,
    clearError: () => setErrorMessage(null),
  }
}
