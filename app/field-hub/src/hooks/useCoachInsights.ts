import { useCallback, useEffect, useState } from 'react'
import type { SessionDefinition } from '../content/types'
import { buildCoachInsights, type CoachInsight } from '../domain/coachInsights'
import type { Player } from '../domain/players'
import { localDb } from '../lib/localDb'

export function useCoachInsights(
  userId: string | null,
  players: Player[],
  sessions: SessionDefinition[],
  todayKey: string,
  refreshKey: string,
) {
  const [insights, setInsights] = useState<CoachInsight[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshCoachInsights = useCallback(async () => {
    if (!userId) {
      setInsights([])
      return
    }

    setIsLoading(true)
    try {
      const [sessionLogs, entries, returnerEntries, sessionBlockLogs, exposureSummaries] = await Promise.all([
        localDb.sessionLogs.where('userId').equals(userId).toArray(),
        localDb.playerSessionEntries.where('userId').equals(userId).toArray(),
        localDb.returnerEntries.where('userId').equals(userId).toArray(),
        localDb.sessionBlockLogs.where('userId').equals(userId).toArray(),
        localDb.playerExposureSummaries.where('userId').equals(userId).toArray(),
      ])

      setInsights(
        buildCoachInsights({
          players,
          sessionDefinitions: sessions,
          sessionLogs,
          entries,
          returnerEntries,
          sessionBlockLogs,
          exposureSummaries,
          todayKey,
        }),
      )
    } finally {
      setIsLoading(false)
    }
  }, [players, sessions, todayKey, userId])

  useEffect(() => {
    Promise.resolve()
      .then(refreshCoachInsights)
      .catch(() => undefined)
  }, [refreshCoachInsights, refreshKey])

  return {
    insights,
    isLoading,
    refreshCoachInsights,
  }
}
