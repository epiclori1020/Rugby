import { useCallback, useEffect, useState } from 'react'
import type { SessionDefinition } from '../content/types'
import type { SessionBlockLog, SessionBlockLogPatch } from '../domain/sessionBlocks'
import { defaultPlayerSyncOverview, type PlayerSyncOverview } from '../domain/sync'
import { scheduleBackgroundSync } from '../lib/backgroundSync'
import { ensureSessionLog, findSessionLog, pushPendingCheckIns, syncCheckIns } from '../lib/checkInRepository'
import { mergeRecordIntoList } from '../lib/optimisticUpdates'
import {
  getSessionBlockSyncOverview,
  listSessionBlockLogsForSession,
  resetSessionBlockLogsForSession,
  saveSessionBlockLog,
} from '../lib/sessionBlockRepository'

export function useSessionBlocks(userId: string | null, sessionDefinition: SessionDefinition) {
  const [blockLogs, setBlockLogs] = useState<SessionBlockLog[]>([])
  const [syncOverview, setSyncOverview] = useState<PlayerSyncOverview>(defaultPlayerSyncOverview)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionLogId, setSessionLogId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshSessionBlocks = useCallback(async () => {
    if (!userId) {
      setBlockLogs([])
      setSyncOverview(defaultPlayerSyncOverview)
      setSessionLogId(null)
      setErrorMessage(null)
      return
    }

    const sessionLog = await findSessionLog(userId, sessionDefinition.id)
    const [localBlockLogs, overview] = await Promise.all([
      sessionLog ? listSessionBlockLogsForSession(userId, sessionLog.id) : Promise.resolve([]),
      getSessionBlockSyncOverview(userId),
    ])

    setSessionLogId(sessionLog?.id ?? null)
    setBlockLogs(localBlockLogs)
    setSyncOverview(overview)
  }, [sessionDefinition.id, userId])

  const runSync = useCallback(async () => {
    if (!userId) {
      return
    }

    setIsLoading(true)
    try {
      const overview = await syncCheckIns(userId, { sessionDefinitionId: sessionDefinition.id })
      const blockOverview = await getSessionBlockSyncOverview(userId)
      setSyncOverview(blockOverview)
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Blockstatus-Sync fehlgeschlagen.' : null)
      await refreshSessionBlocks()
      return overview
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Blockstatus-Sync fehlgeschlagen.'
      setSyncOverview({
        ...(await getSessionBlockSyncOverview(userId)),
        status: 'error',
        errorMessage: message,
      })
      setErrorMessage(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [refreshSessionBlocks, sessionDefinition.id, userId])

  const runBackgroundSync = useCallback(async () => {
    if (!userId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return
    }

    try {
      const overview = await pushPendingCheckIns(userId)
      setSyncOverview(await getSessionBlockSyncOverview(userId))
      if (overview.status !== 'error') {
        await refreshSessionBlocks()
      }
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Blockstatus-Sync fehlgeschlagen.' : null)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Blockstatus-Sync fehlgeschlagen.'
      setSyncOverview({
        ...(await getSessionBlockSyncOverview(userId)),
        status: 'error',
        errorMessage: message,
      })
      setErrorMessage(`Lokal gespeichert, Sync offen: ${message}`)
    }
  }, [refreshSessionBlocks, userId])

  useEffect(() => {
    Promise.resolve()
      .then(refreshSessionBlocks)
      .catch(() => undefined)
  }, [refreshSessionBlocks])

  async function saveBlockLog(blockKey: string, patch: SessionBlockLogPatch) {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const sessionLog = sessionLogId ? { id: sessionLogId } : await ensureSessionLog(userId, sessionDefinition)
      const savedBlockLog = await saveSessionBlockLog(userId, sessionLog.id, sessionDefinition, blockKey, patch)
      setSessionLogId(sessionLog.id)
      setBlockLogs((currentBlockLogs) =>
        mergeRecordIntoList(currentBlockLogs, savedBlockLog).sort((a, b) => a.blockOrder - b.blockOrder),
      )
      setSyncOverview(await getSessionBlockSyncOverview(userId))
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'session-blocks', runBackgroundSync)
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Blockstatus konnte nicht gespeichert werden.'
      setErrorMessage(message)
    }
  }

  async function resetSessionBlockLogs() {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    if (!sessionLogId) {
      return { resetCount: 0 }
    }

    setIsLoading(true)
    try {
      setErrorMessage(null)
      const result = await resetSessionBlockLogsForSession(userId, sessionLogId)
      setBlockLogs([])
      setSyncOverview(await getSessionBlockSyncOverview(userId))
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'session-blocks', runBackgroundSync)
      }
      return result
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Training konnte nicht zurueckgesetzt werden.'
      setErrorMessage(message)
      return { resetCount: 0 }
    } finally {
      setIsLoading(false)
    }
  }

  function getLogForBlock(blockKey: string) {
    return blockLogs.find((entry) => entry.blockKey === blockKey) ?? null
  }

  return {
    blockLogs,
    clearError: () => setErrorMessage(null),
    errorMessage,
    getLogForBlock,
    isLoading,
    refreshSessionBlocks,
    runSync,
    saveBlockLog,
    resetSessionBlockLogs,
    syncOverview,
  }
}
