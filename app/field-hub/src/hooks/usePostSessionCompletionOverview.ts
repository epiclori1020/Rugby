import { useCallback, useEffect, useState } from 'react'
import type { SessionDefinition } from '../content/types'
import { findLatestRelevantPostSessionWork, type LatestRelevantPostSessionWork } from '../domain/postSessionCompletion'
import type { Player } from '../domain/players'
import { localDb } from '../lib/localDb'

export function usePostSessionCompletionOverview({
  activePlayers,
  lastExportAt,
  refreshKey,
  sessions,
  todayKey,
  userId,
}: {
  activePlayers: Player[]
  lastExportAt: string | null
  refreshKey: string
  sessions: SessionDefinition[]
  todayKey: string
  userId: string | null
}) {
  const [latestWork, setLatestWork] = useState<LatestRelevantPostSessionWork | null>(null)

  const refreshOverview = useCallback(async () => {
    if (!userId) {
      setLatestWork(null)
      return
    }

    const [sessionLogs, entries, progressEntries, baselineEntries] = await Promise.all([
      localDb.sessionLogs.where('userId').equals(userId).toArray(),
      localDb.playerSessionEntries.where('userId').equals(userId).toArray(),
      localDb.progressEntries.where('userId').equals(userId).toArray(),
      localDb.baselineEntries.where('userId').equals(userId).toArray(),
    ])

    setLatestWork(
      findLatestRelevantPostSessionWork({
        activePlayers,
        sessionLogs,
        entries,
        progressEntries,
        baselineEntries,
        lastExportAt,
        todayKey,
        getSessionType: (sessionDefinitionId) =>
          sessions.find((session) => session.id === sessionDefinitionId)?.type ?? 'training',
      }),
    )
  }, [activePlayers, lastExportAt, sessions, todayKey, userId])

  useEffect(() => {
    Promise.resolve()
      .then(refreshOverview)
      .catch(() => undefined)
  }, [refreshOverview, refreshKey])

  return {
    latestWork,
    refreshOverview,
  }
}
