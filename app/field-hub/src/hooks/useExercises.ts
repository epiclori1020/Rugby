import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SessionDefinition } from '../content/types'
import type { ExerciseResult, ExerciseResultPatch } from '../domain/exercises'
import type { Player } from '../domain/players'
import { defaultPlayerSyncOverview, type PlayerSyncOverview } from '../domain/sync'
import { scheduleBackgroundSync } from '../lib/backgroundSync'
import { ensureSessionLog, findSessionLog, pushPendingCheckIns, syncCheckIns } from '../lib/checkInRepository'
import { getExerciseSyncOverview, listExerciseResultsForSession, saveExerciseResult } from '../lib/exerciseRepository'

export function useExercises(userId: string | null, sessionDefinition: SessionDefinition, players: Player[]) {
  const [results, setResults] = useState<ExerciseResult[]>([])
  const [syncOverview, setSyncOverview] = useState<PlayerSyncOverview>(defaultPlayerSyncOverview)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionLogId, setSessionLogId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activePlayers = useMemo(() => players.filter((player) => player.active), [players])

  const refreshExercises = useCallback(async () => {
    if (!userId) {
      setResults([])
      setSyncOverview(defaultPlayerSyncOverview)
      setSessionLogId(null)
      setErrorMessage(null)
      return
    }

    const sessionLog = await findSessionLog(userId, sessionDefinition.id)
    const [localResults, overview] = await Promise.all([
      sessionLog ? listExerciseResultsForSession(userId, sessionLog.id) : Promise.resolve([]),
      getExerciseSyncOverview(userId),
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
      const exerciseOverview = await getExerciseSyncOverview(userId)
      setSyncOverview(exerciseOverview)
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Exercise-Sync fehlgeschlagen.' : null)
      await refreshExercises()
      return overview
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Exercise-Sync fehlgeschlagen.'
      setSyncOverview({
        ...(await getExerciseSyncOverview(userId)),
        status: 'error',
        errorMessage: message,
      })
      setErrorMessage(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [refreshExercises, sessionDefinition.id, userId])

  const runBackgroundSync = useCallback(async () => {
    if (!userId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return
    }

    try {
      const overview = await pushPendingCheckIns(userId)
      setSyncOverview(await getExerciseSyncOverview(userId))
      if (overview.status !== 'error') {
        await refreshExercises()
      }
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Exercise-Sync fehlgeschlagen.' : null)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Exercise-Sync fehlgeschlagen.'
      setSyncOverview({
        ...(await getExerciseSyncOverview(userId)),
        status: 'error',
        errorMessage: message,
      })
      setErrorMessage(`Lokal gespeichert, Sync offen: ${message}`)
    }
  }, [refreshExercises, userId])

  useEffect(() => {
    Promise.resolve()
      .then(refreshExercises)
      .catch(() => undefined)
  }, [refreshExercises])

  async function savePlayerExerciseResult(player: Player, patch: ExerciseResultPatch) {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const sessionLog = sessionLogId ? { id: sessionLogId } : await ensureSessionLog(userId, sessionDefinition)
      setSessionLogId(sessionLog.id)
      await saveExerciseResult(userId, sessionLog.id, player.id, patch)
      await refreshExercises()
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'exercises', runBackgroundSync)
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Exercise-Result konnte nicht gespeichert werden.'
      setErrorMessage(message)
    }
  }

  function getExerciseResultForPlayer(player: Player, exerciseKey: string) {
    return results.find((result) => result.playerId === player.id && result.exerciseKey === exerciseKey) ?? null
  }

  return {
    activePlayers,
    clearError: () => setErrorMessage(null),
    entries: results,
    errorMessage,
    getExerciseResultForPlayer,
    isLoading,
    refreshExercises,
    runSync,
    savePlayerExerciseResult,
    syncOverview,
  }
}
