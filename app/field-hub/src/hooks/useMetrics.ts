import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SessionDefinition } from '../content/types'
import type { MetricResult, MetricResultPatch } from '../domain/metrics'
import type { Player } from '../domain/players'
import { defaultPlayerSyncOverview, type PlayerSyncOverview } from '../domain/sync'
import { scheduleBackgroundSync } from '../lib/backgroundSync'
import { ensureSessionLog, findSessionLog, pushPendingCheckIns, syncCheckIns } from '../lib/checkInRepository'
import {
  getMetricSyncOverview,
  listMetricResultsForSession,
  saveMetricResult,
} from '../lib/metricRepository'

export type SaveMetricResult = { ok: true } | { ok: false; errorMessage: string }

export function useMetrics(userId: string | null, sessionDefinition: SessionDefinition, players: Player[]) {
  const [results, setResults] = useState<MetricResult[]>([])
  const [syncOverview, setSyncOverview] = useState<PlayerSyncOverview>(defaultPlayerSyncOverview)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionLogId, setSessionLogId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activePlayers = useMemo(() => players.filter((player) => player.active), [players])

  const refreshMetrics = useCallback(async () => {
    if (!userId) {
      setResults([])
      setSyncOverview(defaultPlayerSyncOverview)
      setSessionLogId(null)
      setErrorMessage(null)
      return
    }

    const sessionLog = await findSessionLog(userId, sessionDefinition.id)
    const [localResults, overview] = await Promise.all([
      sessionLog ? listMetricResultsForSession(userId, sessionLog.id) : Promise.resolve([]),
      getMetricSyncOverview(userId),
    ])

    setResults(localResults)
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
      const metricOverview = await getMetricSyncOverview(userId)
      setSyncOverview(metricOverview)
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Metric-Sync fehlgeschlagen.' : null)
      await refreshMetrics()
      return overview
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Metric-Sync fehlgeschlagen.'
      setSyncOverview({
        ...(await getMetricSyncOverview(userId)),
        status: 'error',
        errorMessage: message,
      })
      setErrorMessage(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [refreshMetrics, sessionDefinition.id, userId])

  const runBackgroundSync = useCallback(async () => {
    if (!userId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return
    }

    try {
      const overview = await pushPendingCheckIns(userId)
      setSyncOverview(await getMetricSyncOverview(userId))
      if (overview.status !== 'error') {
        await refreshMetrics()
      }
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Metric-Sync fehlgeschlagen.' : null)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Metric-Sync fehlgeschlagen.'
      setSyncOverview({
        ...(await getMetricSyncOverview(userId)),
        status: 'error',
        errorMessage: message,
      })
      setErrorMessage(`Lokal gespeichert, Sync offen: ${message}`)
    }
  }, [refreshMetrics, userId])

  useEffect(() => {
    Promise.resolve()
      .then(refreshMetrics)
      .catch(() => undefined)
  }, [refreshMetrics])

  async function savePlayerMetric(player: Player, patch: MetricResultPatch): Promise<SaveMetricResult> {
    if (!userId) {
      const message = 'Login erforderlich.'
      setErrorMessage(message)
      return { ok: false, errorMessage: message }
    }

    const parsedValue = patch.value === null ? null : typeof patch.value === 'string' ? patch.value.trim() : patch.value
    if (parsedValue === '' || parsedValue === null) {
      const existingResult = results.find(
        (result) =>
          result.playerId === player.id &&
          result.metricKey === patch.metricKey &&
          result.attempt === (patch.attempt ?? 1) &&
          result.bodySide === (patch.bodySide ?? 'none') &&
          !result.deletedAt,
      )
      if (!existingResult) {
        return { ok: true }
      }
    }

    try {
      setErrorMessage(null)
      const sessionLog = sessionLogId ? { id: sessionLogId } : await ensureSessionLog(userId, sessionDefinition)
      setSessionLogId(sessionLog.id)
      await saveMetricResult(userId, sessionLog.id, player.id, patch)
      await refreshMetrics()
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'metrics', runBackgroundSync)
      }
      return { ok: true }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Metric-Wert konnte nicht gespeichert werden.'
      setErrorMessage(message)
      return { ok: false, errorMessage: message }
    }
  }

  function getMetricForPlayer(player: Player, metricKey: string) {
    return results.find((result) => result.playerId === player.id && result.metricKey === metricKey) ?? null
  }

  return {
    activePlayers,
    clearError: () => setErrorMessage(null),
    entries: results,
    errorMessage,
    getMetricForPlayer,
    isLoading,
    refreshMetrics,
    runSync,
    savePlayerMetric,
    syncOverview,
  }
}
