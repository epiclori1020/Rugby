import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SessionDefinition } from '../content/types'
import type { PlayerSessionEntry, PlayerWarning, PostSessionEntryPatch } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { ProgressEntry, NextStep } from '../domain/postSession'
import { defaultPlayerSyncOverview, type PlayerSyncOverview } from '../domain/sync'
import {
  buildEmptyEntry,
  ensureSessionLog,
  findSessionLog,
  getCheckInSyncOverview,
  listCheckInEntries,
  listLatestWarnings,
  savePostSessionEntry,
  saveSessionLogPatch,
  syncCheckIns,
  type SessionLogPatch,
} from '../lib/checkInRepository'
import {
  listProgressEntriesForSession,
  saveProgressEntry,
  type ProgressEntryPatch,
} from '../lib/postSessionRepository'

export function usePostSession(userId: string | null, sessionDefinition: SessionDefinition, players: Player[]) {
  const [entries, setEntries] = useState<PlayerSessionEntry[]>([])
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
  const [warnings, setWarnings] = useState<PlayerWarning[]>([])
  const [syncOverview, setSyncOverview] = useState<PlayerSyncOverview>(defaultPlayerSyncOverview)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionLogId, setSessionLogId] = useState<string | null>(null)
  const [sessionLog, setSessionLog] = useState<Awaited<ReturnType<typeof findSessionLog>>>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activePlayers = useMemo(() => players.filter((player) => player.active), [players])

  const refreshPostSession = useCallback(async () => {
    if (!userId) {
      setEntries([])
      setProgressEntries([])
      setWarnings([])
      setSyncOverview(defaultPlayerSyncOverview)
      setSessionLogId(null)
      setSessionLog(null)
      setErrorMessage(null)
      return
    }

    const sessionLog = await findSessionLog(userId, sessionDefinition.id)
    const [localEntries, localProgressEntries, localWarnings, overview] = await Promise.all([
      sessionLog ? listCheckInEntries(userId, sessionLog.id) : Promise.resolve([]),
      sessionLog ? listProgressEntriesForSession(userId, sessionLog.id) : Promise.resolve([]),
      listLatestWarnings(userId, sessionLog?.id ?? null, sessionDefinition.date),
      getCheckInSyncOverview(userId),
    ])

    setSessionLogId(sessionLog?.id ?? null)
    setSessionLog(sessionLog)
    setEntries(localEntries)
    setProgressEntries(localProgressEntries)
    setWarnings(localWarnings)
    setSyncOverview(overview)
  }, [sessionDefinition, userId])

  const runSync = useCallback(async () => {
    if (!userId) {
      return
    }

    setIsLoading(true)
    try {
      const overview = await syncCheckIns(userId)
      setSyncOverview(overview)
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Nachbereitungs-Sync fehlgeschlagen.' : null)
      await refreshPostSession()
      return overview
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Nachbereitungs-Sync fehlgeschlagen.'
      const overview = {
        ...(await getCheckInSyncOverview(userId)),
        status: 'error' as const,
        errorMessage: message,
      }
      setSyncOverview(overview)
      setErrorMessage(message)
      return overview
    } finally {
      setIsLoading(false)
    }
  }, [refreshPostSession, userId])

  const runBackgroundSync = useCallback(async () => {
    if (!userId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return
    }

    try {
      const overview = await syncCheckIns(userId)
      setSyncOverview(overview)
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Nachbereitungs-Sync fehlgeschlagen.' : null)
      await refreshPostSession()
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Nachbereitungs-Sync fehlgeschlagen.'
      setSyncOverview({
        ...(await getCheckInSyncOverview(userId)),
        status: 'error' as const,
        errorMessage: message,
      })
      setErrorMessage(`Lokal gespeichert, Sync offen: ${message}`)
    }
  }, [refreshPostSession, userId])

  useEffect(() => {
    Promise.resolve()
      .then(refreshPostSession)
      .catch(() => undefined)
  }, [refreshPostSession])

  async function saveSessionPatch(patch: SessionLogPatch) {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const savedSessionLog = await saveSessionLogPatch(userId, sessionDefinition, patch)
      setSessionLogId(savedSessionLog.id)
      setSessionLog(savedSessionLog)
      await refreshPostSession()
      if (typeof navigator === 'undefined' || navigator.onLine) {
        void runBackgroundSync()
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Nachbereitung konnte nicht gespeichert werden.'
      setErrorMessage(message)
    }
  }

  async function savePlayerPostSession(player: Player, patch: PostSessionEntryPatch) {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const sessionLog = sessionLogId
        ? { id: sessionLogId }
        : await ensureSessionLog(userId, sessionDefinition)
      setSessionLogId(sessionLog.id)
      await savePostSessionEntry(userId, sessionLog.id, player, patch)
      await refreshPostSession()
      if (typeof navigator === 'undefined' || navigator.onLine) {
        void runBackgroundSync()
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Spieler-Nachbereitung konnte nicht gespeichert werden.'
      setErrorMessage(message)
    }
  }

  async function savePlayerProgress(player: Player, patch: ProgressEntryPatch & { nextStep?: NextStep | null }) {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const sessionLog = sessionLogId
        ? { id: sessionLogId }
        : await ensureSessionLog(userId, sessionDefinition)
      const { nextStep, ...progressPatch } = patch
      setSessionLogId(sessionLog.id)
      await saveProgressEntry(userId, sessionLog.id, player.id, progressPatch)
      if (nextStep !== undefined) {
        await savePostSessionEntry(userId, sessionLog.id, player, { nextStep })
      }
      await refreshPostSession()
      if (typeof navigator === 'undefined' || navigator.onLine) {
        void runBackgroundSync()
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Progression konnte nicht gespeichert werden.'
      setErrorMessage(message)
    }
  }

  function getEntryForPlayer(player: Player) {
    const entry = entries.find((existingEntry) => existingEntry.playerId === player.id)

    if (entry) {
      return entry
    }

    const preview = buildEmptyEntry(userId ?? 'local-preview', sessionLogId ?? 'session-preview', player)

    return {
      ...preview,
      syncStatus: 'synced' as const,
      syncError: null,
    }
  }

  function getProgressForPlayer(player: Player) {
    return progressEntries.find((entry) => entry.playerId === player.id) ?? null
  }

  return {
    activePlayers,
    entries,
    errorMessage,
    progressEntries,
    warnings,
    syncOverview,
    isLoading,
    sessionLog,
    refreshPostSession,
    runSync,
    savePlayerPostSession,
    savePlayerProgress,
    saveSessionPatch,
    getEntryForPlayer,
    getProgressForPlayer,
    clearError: () => setErrorMessage(null),
  }
}
