import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CheckInEntryPatch, PlayerSessionEntry, PlayerWarning, TrafficLight } from '../domain/checkIn'
import type { Player } from '../domain/players'
import type { PublicCheckInSubmission } from '../domain/publicCheckIn'
import type { PlayerSyncOverview } from '../domain/sync'
import { defaultPlayerSyncOverview } from '../domain/sync'
import type { SessionDefinition } from '../content/types'
import { scheduleBackgroundSync } from '../lib/backgroundSync'
import { mergeRecordIntoList } from '../lib/optimisticUpdates'
import {
  buildEmptyEntry,
  ensureSessionLog,
  findSessionLog,
  getCheckInSyncOverview,
  listCheckInEntries,
  listExpectedPlayerIds,
  listLatestWarnings,
  pushPendingCheckIns,
  saveCheckInEntry,
  saveSessionLogPatch,
  syncCheckIns,
  type SessionLogPatch,
} from '../lib/checkInRepository'
import { hasPlayerId } from '../lib/playerId'
import {
  closePublicCheckInLink,
  createPublicCheckInLinkBundle,
  importPublicCheckInSubmissions,
  listLocalPublicCheckInLinks,
  listLocalPublicCheckInSubmissions,
  refreshRemotePublicCheckIns,
  type CreatedPublicCheckInLink,
} from '../lib/publicCheckInRepository'

type SaveEntryResult =
  | { ok: true; entry: PlayerSessionEntry }
  | { ok: false; error: string }

export function useCheckIns(
  userId: string | null,
  sessionDefinition: SessionDefinition,
  players: Player[],
  enablePublicCheckInPolling = false,
) {
  const [entries, setEntries] = useState<PlayerSessionEntry[]>([])
  const [warnings, setWarnings] = useState<PlayerWarning[]>([])
  const [syncOverview, setSyncOverview] = useState<PlayerSyncOverview>(defaultPlayerSyncOverview)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionLogId, setSessionLogId] = useState<string | null>(null)
  const [sessionLog, setSessionLog] = useState<Awaited<ReturnType<typeof findSessionLog>>>(null)
  const [expectedPlayerIds, setExpectedPlayerIds] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [publicCheckInLinks, setPublicCheckInLinks] = useState<Awaited<ReturnType<typeof listLocalPublicCheckInLinks>>>([])
  const [publicCheckInSubmissions, setPublicCheckInSubmissions] = useState<PublicCheckInSubmission[]>([])
  const [publicCheckInNotice, setPublicCheckInNotice] = useState<string | null>(null)

  const activePlayers = useMemo(() => players.filter((player) => player.active), [players])
  const activePlayerIds = useMemo(() => new Set(activePlayers.map((player) => player.id)), [activePlayers])
  const activeEntries = useMemo(
    () => entries.filter((entry) => hasPlayerId(entry) && activePlayerIds.has(entry.playerId)),
    [activePlayerIds, entries],
  )
  const activeWarnings = useMemo(
    () => warnings.filter((warning) => hasPlayerId(warning) && activePlayerIds.has(warning.playerId)),
    [activePlayerIds, warnings],
  )

  const refreshLocalCheckIns = useCallback(async () => {
    if (!userId) {
      setEntries([])
      setWarnings([])
      setSyncOverview(defaultPlayerSyncOverview)
      setSessionLogId(null)
      setSessionLog(null)
      setExpectedPlayerIds([])
      setErrorMessage(null)
      setPublicCheckInLinks([])
      setPublicCheckInSubmissions([])
      setPublicCheckInNotice(null)
      return
    }

    const sessionLog = await findSessionLog(userId, sessionDefinition.id)
    const [localEntries, localWarnings, expectedIds, overview, localPublicLinks] = await Promise.all([
      sessionLog ? listCheckInEntries(userId, sessionLog.id) : Promise.resolve([]),
      listLatestWarnings(userId, sessionLog?.id ?? null, sessionDefinition.date),
      listExpectedPlayerIds(userId, sessionDefinition.date),
      getCheckInSyncOverview(userId),
      listLocalPublicCheckInLinks(userId, sessionDefinition.id),
    ])
    setSessionLogId(sessionLog?.id ?? null)
    setSessionLog(sessionLog)
    setEntries(localEntries)
    setWarnings(localWarnings)
    setExpectedPlayerIds(expectedIds)
    setSyncOverview(overview)
    setPublicCheckInLinks(localPublicLinks.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    setPublicCheckInSubmissions(
      (
        await Promise.all(localPublicLinks.map((link) => listLocalPublicCheckInSubmissions(userId, link.id)))
      ).flat(),
    )
  }, [sessionDefinition, userId])

  const runSync = useCallback(async () => {
    if (!userId) {
      return
    }

    setIsLoading(true)
    try {
      await refreshRemotePublicCheckIns(userId).catch(() => undefined)
      const publicImportResult = await importPublicCheckInSubmissions(userId, sessionDefinition).catch(() => null)
      const overview = await syncCheckIns(userId)
      setSyncOverview(overview)
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Check-in-Sync fehlgeschlagen.' : null)
      if (publicImportResult && (publicImportResult.imported > 0 || publicImportResult.conflicts > 0)) {
        setPublicCheckInNotice(
          `${publicImportResult.imported} Spieler-Check-ins uebernommen, ${publicImportResult.conflicts} Konflikte.`,
        )
      }
      await refreshLocalCheckIns()
      return overview
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Check-in-Sync fehlgeschlagen.'
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
  }, [refreshLocalCheckIns, sessionDefinition, userId])

  const runBackgroundSync = useCallback(async () => {
    if (!userId || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return
    }

    try {
      const overview = await pushPendingCheckIns(userId)
      setSyncOverview(overview)
      if (overview.status !== 'error') {
        setSessionLog((currentSessionLog) =>
          currentSessionLog?.syncStatus === 'pending' || currentSessionLog?.syncStatus === 'error'
            ? { ...currentSessionLog, syncStatus: 'synced', syncError: null }
            : currentSessionLog,
        )
        setEntries((currentEntries) =>
          currentEntries.map((entry) =>
            entry.syncStatus === 'pending' || entry.syncStatus === 'error'
              ? { ...entry, syncStatus: 'synced', syncError: null }
              : entry,
          ),
        )
      }
      setErrorMessage(overview.status === 'error' ? overview.errorMessage ?? 'Check-in-Sync fehlgeschlagen.' : null)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Check-in-Sync fehlgeschlagen.'
      setSyncOverview({
        ...(await getCheckInSyncOverview(userId)),
        status: 'error' as const,
        errorMessage: message,
      })
      setErrorMessage(`Lokal gespeichert, Sync offen: ${message}`)
    }
  }, [userId])

  useEffect(() => {
    Promise.resolve()
      .then(refreshLocalCheckIns)
      .catch(() => undefined)
  }, [refreshLocalCheckIns])

  useEffect(() => {
    if (!userId || !enablePublicCheckInPolling) {
      return undefined
    }

    const pollPublicCheckIns = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return
      }

      void runSync()
    }
    const intervalId = window.setInterval(pollPublicCheckIns, 12_000)

    return () => window.clearInterval(intervalId)
  }, [enablePublicCheckInPolling, runSync, userId])

  useEffect(() => {
    if (!userId) {
      return undefined
    }

    const handleOnline = () => {
      runSync()
    }
    const handleOffline = () => {
      refreshLocalCheckIns()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refreshLocalCheckIns, runSync, userId])

  async function saveEntry(
    player: Player,
    patch: CheckInEntryPatch,
    manualTrafficLight?: TrafficLight | 'auto',
  ): Promise<SaveEntryResult> {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const sessionLog = sessionLogId
        ? { id: sessionLogId }
        : await ensureSessionLog(userId, sessionDefinition)

      const savedEntry = await saveCheckInEntry(userId, sessionLog.id, player, patch, manualTrafficLight)
      setSessionLogId(sessionLog.id)
      setEntries((currentEntries) => mergeRecordIntoList(currentEntries, savedEntry))
      setSyncOverview(await getCheckInSyncOverview(userId))
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'check-ins', runBackgroundSync)
      }
      return { ok: true, entry: savedEntry }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Check-in konnte nicht gespeichert werden.'
      setErrorMessage(message)
      return { ok: false, error: message }
    }
  }

  async function saveSessionPatch(patch: SessionLogPatch) {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const savedSessionLog = await saveSessionLogPatch(userId, sessionDefinition, patch)
      setSessionLogId(savedSessionLog.id)
      setSessionLog(savedSessionLog)
      setSyncOverview(await getCheckInSyncOverview(userId))
      if (typeof navigator === 'undefined' || navigator.onLine) {
        scheduleBackgroundSync(userId, 'check-ins', runBackgroundSync)
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Training-Notiz konnte nicht gespeichert werden.'
      setErrorMessage(message)
    }
  }

  async function createPublicLink(): Promise<CreatedPublicCheckInLink | null> {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      const createdLink = await createPublicCheckInLinkBundle(userId, sessionDefinition, activePlayers)
      await refreshLocalCheckIns()
      setPublicCheckInNotice('Check-in-Link erstellt.')
      return createdLink
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Check-in-Link konnte nicht erstellt werden.'
      setErrorMessage(message)
      return null
    }
  }

  async function closePublicLink(linkId: string) {
    if (!userId) {
      throw new Error('Login erforderlich.')
    }

    try {
      setErrorMessage(null)
      await closePublicCheckInLink(userId, linkId)
      await refreshLocalCheckIns()
      setPublicCheckInNotice('Check-in-Link geschlossen.')
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Check-in-Link konnte nicht geschlossen werden.'
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
      id: `preview:${sessionDefinition.id}:${player.id}`,
      clientUpdatedAt: sessionDefinition.date,
      createdAt: sessionDefinition.date,
      updatedAt: sessionDefinition.date,
      syncStatus: 'synced' as const,
      syncError: null,
    }
  }

  return {
    activePlayers,
    entries: activeEntries,
    errorMessage,
    expectedPlayerIds,
    warnings: activeWarnings,
    syncOverview,
    isLoading,
    sessionLogId,
    publicCheckInLinks,
    publicCheckInSubmissions,
    publicCheckInNotice,
    refreshLocalCheckIns,
    runSync,
    saveEntry,
    saveSessionPatch,
    createPublicLink,
    closePublicLink,
    getEntryForPlayer,
    sessionLog,
    clearError: () => setErrorMessage(null),
  }
}
