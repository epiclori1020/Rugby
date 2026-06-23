import { useCallback, useEffect, useState } from 'react'
import type { SessionDefinition } from '../content/types'
import type { PlayerSessionEntry, SessionLog } from '../domain/checkIn'
import type { ExposureStatus, ExposureType, PlayerExposureSummary } from '../domain/exposures'
import type { ReturnerCapSummary } from '../domain/returners'
import type { SessionBlockLog } from '../domain/sessionBlocks'
import { defaultPlayerSyncOverview, type PlayerSyncOverview } from '../domain/sync'
import { scheduleBackgroundSync } from '../lib/backgroundSync'
import { findSessionLog, pushPendingCheckIns } from '../lib/checkInRepository'
import {
  getExposureSyncOverview,
  listExposureSummariesForSession,
  resetExposureSummariesForSession,
  saveManualExposureOverride,
  savePlayerExposureSummaries,
} from '../lib/exposureRepository'
import { mergeRecordIntoList } from '../lib/optimisticUpdates'

export function useExposures(userId: string | null, sessionDefinition: SessionDefinition) {
  const [summaries, setSummaries] = useState<PlayerExposureSummary[]>([])
  const [syncOverview, setSyncOverview] = useState<PlayerSyncOverview>(defaultPlayerSyncOverview)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshExposures = useCallback(
    async (sessionLogId?: string | null) => {
      if (!userId) {
        setSummaries([])
        setSyncOverview(defaultPlayerSyncOverview)
        setErrorMessage(null)
        return
      }

      const [localSummaries, overview] = await Promise.all([
        sessionLogId ? listExposureSummariesForSession(userId, sessionLogId) : Promise.resolve([]),
        getExposureSyncOverview(userId),
      ])

      setSummaries(localSummaries)
      setSyncOverview(overview)
    },
    [userId],
  )

  const runBackgroundSync = useCallback(async () => {
    if (!userId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return
    }

    try {
      const overview = await pushPendingCheckIns(userId)
      setSyncOverview(await getExposureSyncOverview(userId))
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Exposure-Sync fehlgeschlagen.' : null)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Exposure-Sync fehlgeschlagen.'
      setSyncOverview({
        ...(await getExposureSyncOverview(userId)),
        status: 'error',
        errorMessage: message,
      })
      setErrorMessage(`Lokal gespeichert, Sync offen: ${message}`)
    }
  }, [userId])

  useEffect(() => {
    Promise.resolve()
      .then(async () => {
        if (!userId) {
          await refreshExposures(null)
          return
        }

        const sessionLog = await findSessionLog(userId, sessionDefinition.id)
        await refreshExposures(sessionLog?.id ?? null)
      })
      .catch(() => undefined)
  }, [refreshExposures, sessionDefinition.id, userId])

  async function generateExposureSummaries(input: {
    sessionLog: SessionLog | null
    blockLogs: SessionBlockLog[]
    entries: PlayerSessionEntry[]
    returnerCaps: ReturnerCapSummary[]
  }) {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    if (!input.sessionLog) {
      setErrorMessage('Erst Check-in, Blockstatus oder Nachbereitung speichern, dann Exposures erzeugen.')
      return []
    }

    setIsLoading(true)
    try {
      setErrorMessage(null)
      const savedSummaries = await savePlayerExposureSummaries(userId, {
        sessionLog: input.sessionLog,
        sessionDefinition,
        blockLogs: input.blockLogs,
        entries: input.entries,
        returnerCaps: input.returnerCaps,
      })
      setSummaries(savedSummaries)
      setSyncOverview(await getExposureSyncOverview(userId))
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'exposures', runBackgroundSync)
      }
      return savedSummaries
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Exposures konnten nicht gespeichert werden.'
      setErrorMessage(message)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  async function saveManualOverride(
    summary: PlayerExposureSummary,
    type: ExposureType,
    override: { status: Exclude<ExposureStatus, 'none'>; note: string },
  ) {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    setIsLoading(true)
    try {
      setErrorMessage(null)
      const updated = await saveManualExposureOverride(userId, summary.id, type, override)
      setSummaries((currentSummaries) => mergeRecordIntoList(currentSummaries, updated))
      setSyncOverview(await getExposureSyncOverview(userId))
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'exposures', runBackgroundSync)
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Exposure-Override konnte nicht gespeichert werden.'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function resetExposureSummaries(sessionLogId: string | null | undefined) {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    if (!sessionLogId) {
      return { resetCount: 0 }
    }

    setIsLoading(true)
    try {
      setErrorMessage(null)
      const result = await resetExposureSummariesForSession(userId, sessionLogId)
      setSummaries([])
      setSyncOverview(await getExposureSyncOverview(userId))
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'exposures', runBackgroundSync)
      }
      return result
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Exposures konnten nicht zurueckgesetzt werden.'
      setErrorMessage(message)
      return { resetCount: 0 }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    clearError: () => setErrorMessage(null),
    errorMessage,
    generateExposureSummaries,
    isLoading,
    refreshExposures,
    resetExposureSummaries,
    saveManualOverride,
    summaries,
    syncOverview,
  }
}
