import { useCallback, useEffect, useState } from 'react'
import { buildPlayerProfileSummary, type PlayerProfileSummary } from '../domain/playerProfile'
import type { Player } from '../domain/players'
import { localDb } from '../lib/localDb'

export function usePlayerProfiles(userId: string | null, players: Player[], todayKey?: string) {
  const [profilesByPlayerId, setProfilesByPlayerId] = useState<Record<string, PlayerProfileSummary>>({})
  const [isLoading, setIsLoading] = useState(false)

  const refreshPlayerProfiles = useCallback(async () => {
    if (!userId || players.length === 0) {
      setProfilesByPlayerId({})
      return
    }

    setIsLoading(true)
    try {
      const [
        sessionLogs,
        entries,
        baselineEntries,
        progressEntries,
        returnerEntries,
        exposureSummaries,
        metricResults,
        exerciseResults,
      ] = await Promise.all([
        localDb.sessionLogs.where('userId').equals(userId).toArray(),
        localDb.playerSessionEntries.where('userId').equals(userId).toArray(),
        localDb.baselineEntries.where('userId').equals(userId).toArray(),
        localDb.progressEntries.where('userId').equals(userId).toArray(),
        localDb.returnerEntries.where('userId').equals(userId).toArray(),
        localDb.playerExposureSummaries.where('userId').equals(userId).toArray(),
        localDb.metricResults.where('userId').equals(userId).toArray(),
        localDb.exerciseResults.where('userId').equals(userId).toArray(),
      ])

      setProfilesByPlayerId(
        Object.fromEntries(
          players.map((player) => [
            player.id,
            buildPlayerProfileSummary({
              player,
              todayKey,
              sessionLogs,
              entries,
              baselineEntries,
              progressEntries,
              returnerEntries,
              exposureSummaries,
              metricResults,
              exerciseResults,
            }),
          ]),
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }, [players, todayKey, userId])

  useEffect(() => {
    Promise.resolve()
      .then(refreshPlayerProfiles)
      .catch(() => undefined)
  }, [refreshPlayerProfiles])

  return {
    profilesByPlayerId,
    isLoading,
    refreshPlayerProfiles,
  }
}
